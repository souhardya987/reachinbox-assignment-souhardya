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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailWorker = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("../config/redis");
const queue_1 = require("../config/queue");
const emailService_1 = require("../services/emailService");
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load .env explicitly if needed, though usually index.ts handles it. 
// Adding it here for safety if worker runs standalone.
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
const prisma = new client_1.PrismaClient();
// Configuration from Env (merged from old worker.ts)
const WORKER_CONCURRENCY = Number(process.env.WORKER_CONCURRENCY) || 1;
const MAX_EMAILS_PER_HOUR = Number(process.env.MAX_EMAILS_PER_HOUR) || 50; // Default matches old worker.ts
const MIN_DELAY_BETWEEN_EMAILS = Number(process.env.MIN_DELAY_BETWEEN_EMAILS) || 1000;
// Calculate Limiter Settings
// We want to satisfy the strictest constraint:
// 1. Emails per hour (Global Rate Limit)
// 2. Min delay between emails (Throttling)
const msPerEmailRateLimit = (3600 * 1000) / MAX_EMAILS_PER_HOUR;
const finalDelayPerEmail = Math.max(msPerEmailRateLimit, MIN_DELAY_BETWEEN_EMAILS);
console.log(`Worker Config: Concurrency=${WORKER_CONCURRENCY}, Max/Hr=${MAX_EMAILS_PER_HOUR}, MinDelay=${MIN_DELAY_BETWEEN_EMAILS}ms`);
console.log(`Calculated Limiter: 1 email every ${finalDelayPerEmail}ms`);
exports.emailWorker = new bullmq_1.Worker(queue_1.emailQueueName, (job) => __awaiter(void 0, void 0, void 0, function* () {
    const { scheduledEmailId, recipient, subject, body, fromEmail } = job.data;
    console.log(`Processing email job ${job.id} for ${recipient}`);
    // 1. Enforce Minimum Delay between emails (Global)
    // This is a second layer of protection, but the BullMQ limiter below should handle the primary pacing.
    // Keeping this logic as it was in the original file, but using the env var.
    const LAST_SENT_KEY = 'email:last-sent-at';
    let canSend = false;
    while (!canSend) {
        const lastSent = yield redis_1.redisConnection.get(LAST_SENT_KEY);
        const now = Date.now();
        const diff = now - (lastSent ? parseInt(lastSent) : 0);
        // Use the calculated delay
        if (diff >= finalDelayPerEmail) {
            // Simple optimistic lock for assignment
            yield redis_1.redisConnection.set(LAST_SENT_KEY, now.toString());
            canSend = true;
        }
        else {
            const waitTime = finalDelayPerEmail - diff;
            yield new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }
    try {
        // Idempotency Check: Verify status is still PENDING if scheduledEmailId exists
        if (scheduledEmailId) {
            const emailRecord = yield prisma.scheduledEmail.findUnique({
                where: { idString: scheduledEmailId }
            });
            if (!emailRecord) {
                console.log(`Skipping job ${job.id} - Email record not found.`);
                return;
            }
            if (emailRecord.status === 'SENT') {
                console.log(`Skipping job ${job.id} - Email already SENT.`);
                return;
            }
            if (emailRecord.status === 'FAILED') {
                // For now we proceed, or define retry policy.
                console.log(`Retrying job ${job.id} - Email was FAILED.`);
            }
        }
        // Send the email
        // Use the HTML body format
        yield (0, emailService_1.sendEmail)(recipient, subject, `<p>${body}</p>`, fromEmail);
        // Update status in DB
        if (scheduledEmailId) {
            yield prisma.scheduledEmail.update({
                where: { idString: scheduledEmailId },
                data: {
                    status: 'SENT',
                    sentAt: new Date(),
                },
            });
        }
        console.log(`Email sent successfully to ${recipient}`);
    }
    catch (error) {
        console.error(`Failed to send email to ${recipient}:`, error);
        if (scheduledEmailId) {
            yield prisma.scheduledEmail.update({
                where: { idString: scheduledEmailId },
                data: {
                    error: error.message || 'Unknown error',
                    status: 'FAILED' // Ensure we mark as failed
                },
            });
        }
        throw error;
    }
}), {
    connection: redis_1.redisConnection,
    concurrency: WORKER_CONCURRENCY,
    limiter: {
        max: 1, // Process 1 job
        duration: finalDelayPerEmail, // per calculated interval
    },
});
exports.emailWorker.on('completed', (job) => {
    console.log(`Job ${job.id} completed!`);
});
exports.emailWorker.on('failed', (job, err) => {
    console.log(`Job ${job === null || job === void 0 ? void 0 : job.id} failed with ${err.message}`);
});
console.log('Email Worker started...');
