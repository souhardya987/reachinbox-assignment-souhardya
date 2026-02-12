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
exports.getScheduledEmails = exports.scheduleEmail = void 0;
const client_1 = require("@prisma/client");
const queue_1 = require("../config/queue");
const prisma = new client_1.PrismaClient();
const scheduleEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { recipients, subject, body, scheduledAt } = req.body;
        if (!recipients || !Array.isArray(recipients) || recipients.length === 0 || !subject || !body || !scheduledAt) {
            return res.status(400).json({ error: 'Missing required fields or invalid recipients' });
        }
        const scheduleTime = new Date(scheduledAt);
        if (isNaN(scheduleTime.getTime())) {
            return res.status(400).json({ error: 'Invalid date format' });
        }
        const delay = scheduleTime.getTime() - Date.now();
        const finalDelay = delay > 0 ? delay : 0;
        const validRecipients = recipients.filter((r) => typeof r === 'string' && r.includes('@'));
        if (validRecipients.length === 0) {
            return res.status(400).json({ error: 'No valid recipients found' });
        }
        const createdJobs = [];
        for (const recipient of validRecipients) {
            // Create DB record
            const scheduledEmail = yield prisma.scheduledEmail.create({
                data: {
                    recipient,
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
                subject,
                body,
            }, {
                delay: finalDelay,
                jobId: scheduledEmail.idString, // Idempotency
            });
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
    try {
        const emails = yield prisma.scheduledEmail.findMany({
            orderBy: { scheduledAt: 'asc' },
        });
        res.json(emails);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
exports.getScheduledEmails = getScheduledEmails;
