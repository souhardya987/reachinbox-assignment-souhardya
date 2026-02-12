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
exports.emailWorker = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("../config/redis");
const queue_1 = require("../config/queue");
const emailService_1 = require("../services/emailService");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.emailWorker = new bullmq_1.Worker(queue_1.emailQueueName, (job) => __awaiter(void 0, void 0, void 0, function* () {
    const { scheduledEmailId, recipient, subject, body } = job.data;
    console.log(`Processing email job ${job.id} for ${recipient}`);
    // 1. Enforce Minimum Delay between emails (Global)
    const MIN_DELAY = 2000; // 2 seconds
    const LAST_SENT_KEY = 'email:last-sent-at';
    let canSend = false;
    while (!canSend) {
        const lastSent = yield redis_1.redisConnection.get(LAST_SENT_KEY);
        const now = Date.now();
        const diff = now - (lastSent ? parseInt(lastSent) : 0);
        if (diff >= MIN_DELAY) {
            // Simple optimistic lock for assignment
            yield redis_1.redisConnection.set(LAST_SENT_KEY, now.toString());
            canSend = true;
        }
        else {
            const waitTime = MIN_DELAY - diff;
            yield new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }
    try {
        // Send the email
        yield (0, emailService_1.sendEmail)(recipient, subject, body);
        // Update status in DB
        yield prisma.scheduledEmail.update({
            where: { idString: scheduledEmailId },
            data: {
                status: 'SENT',
                sentAt: new Date(),
            },
        });
        console.log(`Email sent successfully to ${recipient}`);
    }
    catch (error) {
        console.error(`Failed to send email to ${recipient}:`, error);
        yield prisma.scheduledEmail.update({
            where: { idString: scheduledEmailId },
            data: {
                error: error.message || 'Unknown error',
            },
        });
        throw error;
    }
}), {
    connection: redis_1.redisConnection,
    concurrency: 5, // Configurable concurrency 
    limiter: {
        max: 10, // Max emails per duration (e.g., 10 per hour is the strict limit)
        duration: 1000 * 60 * 60, // 1 Hour
    },
});
exports.emailWorker.on('completed', (job) => {
    console.log(`Job ${job.id} completed!`);
});
exports.emailWorker.on('failed', (job, err) => {
    console.log(`Job ${job === null || job === void 0 ? void 0 : job.id} failed with ${err.message}`);
});
