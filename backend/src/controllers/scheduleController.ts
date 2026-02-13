import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { emailQueue } from '../config/queue';

const prisma = new PrismaClient();

export const scheduleEmail = async (req: Request, res: Response) => {
    try {
        // Use type assertion to access user added by middleware
        const userId = (req as any).user?.id as string;

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

        const validRecipients = recipients.filter((r: any) => typeof r === 'string' && r.includes('@'));

        if (validRecipients.length === 0) {
            return res.status(400).json({ error: 'No valid recipients found' });
        }

        const createdJobs: any[] = [];
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
            const scheduledEmail = await prisma.scheduledEmail.create({
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
            await emailQueue.add(
                'send-email',
                {
                    scheduledEmailId: scheduledEmail.idString,
                    recipient,
                    fromEmail: fromEmail, // Pass to worker
                    subject,
                    body,
                },
                {
                    delay: accumulatedDelay,
                    jobId: scheduledEmail.idString, // Idempotency
                }
            );

            // Add delay for the next email
            accumulatedDelay += delayPerEmail;

            createdJobs.push(scheduledEmail);
        }

        res.status(201).json({
            message: `Scheduled ${createdJobs.length} emails successfully`,
            count: createdJobs.length,
        });
    } catch (error) {
        console.error('Error scheduling email:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) });
    }

};

export const getScheduledEmails = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id as string;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const emails = await prisma.scheduledEmail.findMany({
            where: {
                status: 'PENDING',
                userId: userId
            },
            orderBy: { scheduledAt: 'asc' },
        });
        res.json(emails);
    } catch (error) {
        console.error('Error fetching scheduled emails:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) });
    }

};

export const getSentEmails = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id as string;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const emails = await prisma.scheduledEmail.findMany({
            where: {
                status: { in: ['SENT', 'FAILED'] },
                userId: userId
            },
            orderBy: { sentAt: 'desc' },
        });
        res.json(emails);
    } catch (error) {
        console.error('Error fetching sent emails:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) });
    }

};

export const getEmailCounts = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id as string;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const scheduledCount = await prisma.scheduledEmail.count({
            where: {
                status: 'PENDING',
                userId: userId
            }
        });

        const sentCount = await prisma.scheduledEmail.count({
            where: {
                status: { in: ['SENT', 'FAILED'] },
                userId: userId
            }
        });

        res.json({
            scheduled: scheduledCount,
            sent: sentCount
        });
    } catch (error) {
        console.error('Error fetching email counts:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) });
    }

};

export const deleteEmail = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id as string;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const email = await prisma.scheduledEmail.findUnique({
            where: { idString: id as string }
        });

        if (!email || email.userId !== userId) {
            return res.status(404).json({ error: 'Email not found or unauthorized' });
        }

        await prisma.scheduledEmail.delete({
            where: { idString: id as string }
        });

        res.json({ message: 'Email deleted successfully' });
    } catch (error) {
        console.error('Error deleting email:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
