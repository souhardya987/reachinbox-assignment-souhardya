import { Queue } from 'bullmq';
import { redisConnection } from './redis';

export const emailQueueName = 'email-queue';

export const emailQueue = new Queue(emailQueueName, {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
    },
});
