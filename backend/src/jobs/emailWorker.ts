import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { emailQueueName } from '../config/queue';
import { sendEmail } from '../services/emailService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface EmailJobData {
    scheduledEmailId: string;
    recipient: string;
    subject: string;
    body: string;
}

export const emailWorker = new Worker<EmailJobData>(
    emailQueueName,
    async (job: Job<EmailJobData>) => {
        const { scheduledEmailId, recipient, subject, body } = job.data;

        console.log(`Processing email job ${job.id} for ${recipient}`);

        // 1. Enforce Minimum Delay between emails (Global)
        const MIN_DELAY = 2000; // 2 seconds
        const LAST_SENT_KEY = 'email:last-sent-at';

        let canSend = false;
        while (!canSend) {
            const lastSent = await redisConnection.get(LAST_SENT_KEY);
            const now = Date.now();
            const diff = now - (lastSent ? parseInt(lastSent) : 0);

            if (diff >= MIN_DELAY) {
                // Simple optimistic lock for assignment
                await redisConnection.set(LAST_SENT_KEY, now.toString());
                canSend = true;
            } else {
                const waitTime = MIN_DELAY - diff;
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }

        try {
            // Send the email
            await sendEmail(recipient, subject, body);

            // Update status in DB
            await prisma.scheduledEmail.update({
                where: { idString: scheduledEmailId },
                data: {
                    status: 'SENT',
                    sentAt: new Date(),
                },
            });

            console.log(`Email sent successfully to ${recipient}`);
        } catch (error: any) {
            console.error(`Failed to send email to ${recipient}:`, error);

            await prisma.scheduledEmail.update({
                where: { idString: scheduledEmailId },
                data: {
                    error: error.message || 'Unknown error',
                },
            });

            throw error;
        }
    },
    {
        connection: redisConnection,
        concurrency: 5, // Configurable concurrency 
        limiter: {
            max: 10, // Max emails per duration (e.g., 10 per hour is the strict limit)
            duration: 1000 * 60 * 60, // 1 Hour
        },
    }
);

emailWorker.on('completed', (job) => {
    console.log(`Job ${job.id} completed!`);
});

emailWorker.on('failed', (job, err) => {
    console.log(`Job ${job?.id} failed with ${err.message}`);
});
