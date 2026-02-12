"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEmail = exports.getEmailCounts = exports.getSentEmails = exports.getScheduledEmails = exports.scheduleEmail = void 0;
const client_1 = require("@prisma/client");
const queue_1 = require("../config/queue");
const prisma = new client_1.PrismaClient();
const scheduleEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Use type assertion to access user added by middleware
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { recipients, subject, body, scheduledAt, rateLimit, delay: delayBetweenEmails, fromEmail } = req.body;
        if (!recipients || !Array.isArray(recipients) || recipients.length === 0 || !subject || !body || !scheduledAt) {
            return res.status(400).json({ error: 'Missing required fields or invalid recipients' });
        }
        const scheduleTime = new Date(scheduledAt);
        if (isNaN(scheduleTime.getTime())) {
            return res.status(400).json({ error: 'Invalid date format' });
        }
        const startTimeDelay = scheduleTime.getTime() - Date.now();
        const initialDelay = startTimeDelay > 0 ? startTimeDelay : 0;
        const validRecipients = recipients.filter((r) => typeof r === 'string' && r.includes('@'));
        if (validRecipients.length === 0) {
            return res.status(400).json({ error: 'No valid recipients found' });
        }
        const createdJobs = [];
        let accumulatedDelay = initialDelay;
        // Calculate delay required by Rate Limit (emails per hour)
        // e.g. 60 emails/hr = 1 email per 60 seconds = 60000ms
        let rateLimitDelay = 0;
        if (rateLimit && Number(rateLimit) > 0) {
            rateLimitDelay = (3600 / Number(rateLimit)) * 1000;
        }
        // Delay is the generic throttle (user input)
        const userDelay = (Number(delayBetweenEmails) || 0) * 1000;
        // We take the max to ensure we satisfy BOTH constraints
        const delayPerEmail = Math.max(rateLimitDelay, userDelay);
        for (const recipient of validRecipients) {
            // Create DB record
            const scheduledEmail = yield prisma.scheduledEmail.create({
                data: {
                    recipient,
                    userId, // Save the logged-in user ID
                    fromEmail: fromEmail || 'user@example.com',
                    subject,
                    body,
                    scheduledAt: scheduleTime,
                    status: 'PENDING',
                },
            });
            // Add to Queue
            yield queue_1.emailQueue.add('send-email', {
                scheduledEmailId: scheduledEmail.idString,
                recipient,
                fromEmail: fromEmail, // Pass to worker
                subject,
                body,
            }, {
                delay: accumulatedDelay,
                jobId: scheduledEmail.idString, // Idempotency
            });
            // Add delay for the next email
            accumulatedDelay += delayPerEmail;
            createdJobs.push(scheduledEmail);
        }
        res.status(201).json({
            message: `Scheduled ${createdJobs.length} emails successfully`,
            count: createdJobs.length,
        });
    }
    catch (error) {
        console.error('Error scheduling email:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
exports.scheduleEmail = scheduleEmail;
const getScheduledEmails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const emails = yield prisma.scheduledEmail.findMany({
            where: {
                status: 'PENDING',
                userId: userId
            },
            orderBy: { scheduledAt: 'asc' },
        });
        res.json(emails);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
exports.getScheduledEmails = getScheduledEmails;
const getSentEmails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const emails = yield prisma.scheduledEmail.findMany({
            where: {
                status: { in: ['SENT', 'FAILED'] },
                userId: userId
            },
            orderBy: { sentAt: 'desc' },
        });
        res.json(emails);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
exports.getSentEmails = getSentEmails;
const getEmailCounts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const scheduledCount = yield prisma.scheduledEmail.count({
            where: {
                status: 'PENDING',
                userId: userId
            }
        });
        const sentCount = yield prisma.scheduledEmail.count({
            where: {
                status: { in: ['SENT', 'FAILED'] },
                userId: userId
            }
        });
        res.json({
            scheduled: scheduledCount,
            sent: sentCount
        });
    }
    catch (error) {
        console.error('Error fetching email counts:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
exports.getEmailCounts = getEmailCounts;
const deleteEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { id } = req.params;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const email = yield prisma.scheduledEmail.findUnique({
            where: { idString: id }
        });
        if (!email || email.userId !== userId) {
            return res.status(404).json({ error: 'Email not found or unauthorized' });
        }
        yield prisma.scheduledEmail.delete({
            where: { idString: id }
        });
        res.json({ message: 'Email deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting email:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
exports.deleteEmail = deleteEmail;
