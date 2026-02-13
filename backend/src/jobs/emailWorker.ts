import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { emailQueueName } from '../config/queue';
import { sendEmail } from '../services/emailService';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Load .env explicitly if needed, though usually index.ts handles it. 
// Adding it here for safety if worker runs standalone.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const prisma = new PrismaClient();

interface EmailJobData {
    scheduledEmailId?: string;
    recipient: string;
    subject: string;
    body: string;
    fromEmail?: string;
}

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

export const emailWorker = new Worker<EmailJobData>(
    emailQueueName,
    async (job: Job<EmailJobData>) => {
        const { scheduledEmailId, recipient, subject, body, fromEmail } = job.data;

        console.log(`Processing email job ${job.id} for ${recipient}`);

        // 1. Enforce Minimum Delay between emails (Global)
        // This is a second layer of protection, but the BullMQ limiter below should handle the primary pacing.
        // Keeping this logic as it was in the original file, but using the env var.
        const LAST_SENT_KEY = 'email:last-sent-at';

        let canSend = false;
        while (!canSend) {
            const lastSent = await redisConnection.get(LAST_SENT_KEY);
            const now = Date.now();
            const diff = now - (lastSent ? parseInt(lastSent) : 0);

            // Use the calculated delay
            if (diff >= finalDelayPerEmail) {
                // Simple optimistic lock for assignment
                await redisConnection.set(LAST_SENT_KEY, now.toString());
                canSend = true;
            } else {
                const waitTime = finalDelayPerEmail - diff;
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }

        try {
            // Idempotency Check: Verify status is still PENDING if scheduledEmailId exists
            if (scheduledEmailId) {
                const emailRecord = await prisma.scheduledEmail.findUnique({
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
            await sendEmail(recipient, subject, `<p>${body}</p>`, fromEmail);

            // Update status in DB
            if (scheduledEmailId) {
                await prisma.scheduledEmail.update({
                    where: { idString: scheduledEmailId },
                    data: {
                        status: 'SENT',
                        sentAt: new Date(),
                    },
                });
            }

            console.log(`Email sent successfully to ${recipient}`);
        } catch (error: any) {
            console.error(`Failed to send email to ${recipient}:`, error);

            if (scheduledEmailId) {
                await prisma.scheduledEmail.update({
                    where: { idString: scheduledEmailId },
                    data: {
                        error: error.message || 'Unknown error',
                        status: 'FAILED' // Ensure we mark as failed
                    },
                });
            }

            throw error;
        }
    },
    {
        connection: redisConnection,
        concurrency: WORKER_CONCURRENCY,
        limiter: {
            max: 1, // Process 1 job
            duration: finalDelayPerEmail, // per calculated interval
        },
    }
);

emailWorker.on('completed', (job) => {
    console.log(`Job ${job.id} completed!`);
});

emailWorker.on('failed', (job, err) => {
    console.log(`Job ${job?.id} failed with ${err.message}`);
});

console.log('Email Worker started...');
