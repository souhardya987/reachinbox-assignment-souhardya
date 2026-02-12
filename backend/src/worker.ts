import { Worker } from 'bullmq';
import { redisConnection } from './config/redis';
import { PrismaClient } from '@prisma/client';
import { sendEmail } from './services/emailService';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const emailQueueName = 'email-queue';

// Configuration from Env
const WORKER_CONCURRENCY = Number(process.env.WORKER_CONCURRENCY) || 1;
const MAX_EMAILS_PER_HOUR = Number(process.env.MAX_EMAILS_PER_HOUR) || 50;
const MIN_DELAY_BETWEEN_EMAILS = Number(process.env.MIN_DELAY_BETWEEN_EMAILS) || 1000;

// Calculate Limiter Settings
// We want to satisfy the strictest constraint:
// 1. Emails per hour (Global Rate Limit)
// 2. Min delay between emails (Throttling)

const msPerEmailRateLimit = (3600 * 1000) / MAX_EMAILS_PER_HOUR;
const finalDelayPerEmail = Math.max(msPerEmailRateLimit, MIN_DELAY_BETWEEN_EMAILS);

console.log(`Worker Config: Concurrency=${WORKER_CONCURRENCY}, Max/Hr=${MAX_EMAILS_PER_HOUR}, MinDelay=${MIN_DELAY_BETWEEN_EMAILS}ms`);
console.log(`Calculated Limiter: 1 email every ${finalDelayPerEmail}ms`);

const worker = new Worker(emailQueueName, async (job) => {
    console.log(`Processing job ${job.id}: ${job.data.recipient}`);
    try {
        const { scheduledEmailId, recipient, subject, body, fromEmail } = job.data;

        // Idempotency Check: Verify status is still PENDING
        if (scheduledEmailId) {
            const emailRecord = await prisma.scheduledEmail.findUnique({
                where: { idString: scheduledEmailId }
            });

            if (!emailRecord) {
                console.log(`Skipping job ${job.id} - Email record found not found.`);
                return;
            }

            if (emailRecord.status === 'SENT') {
                console.log(`Skipping job ${job.id} - Email already SENT.`);
                return;
            }
            if (emailRecord.status === 'FAILED') {
                console.log(`Skipping job ${job.id} - Email previously FAILED (retry policy might apply, but duplicate check).`);
                // Depending on retry policy, we might want to proceed. 
                // But for strict idempotency of "sent once", we might check status.
                // Let's assume passed validation.
            }
        }

        // Send Email using shared service
        await sendEmail(recipient, subject, `<p>${body}</p>`, fromEmail);

        // Update DB Status
        if (scheduledEmailId) {
            await prisma.scheduledEmail.update({
                where: { idString: scheduledEmailId },
                data: {
                    status: 'SENT',
                    sentAt: new Date(),
                },
            });
        }

    } catch (error) {
        console.error(`Failed to send email to ${job.data.recipient}`, error);

        // Update DB Status to FAILED
        if (job.data.scheduledEmailId) {
            await prisma.scheduledEmail.update({
                where: { idString: job.data.scheduledEmailId },
                data: { status: 'FAILED' },
            });
        }
        throw error;
    }
}, {
    connection: redisConnection,
    concurrency: WORKER_CONCURRENCY,
    limiter: {
        max: 1, // Process 1 job
        duration: finalDelayPerEmail, // per calculated interval
    }
});

console.log('Worker started...');
