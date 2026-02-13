import Redis from 'ioredis';
import dotenv from 'dotenv';
import path from 'path';

// Load .env explicitly
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

console.log(`[Redis Config] Host: ${process.env.REDIS_HOST}, Port: ${process.env.REDIS_PORT}`);

const redisConfig = process.env.REDIS_URL
    ? {
        connectionName: 'reachinbox-redis',
        family: 0,
        maxRetriesPerRequest: null
    }
    : {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        maxRetriesPerRequest: null,
    };

export const redisConnection = process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL, redisConfig)
    : new Redis(redisConfig);

redisConnection.on('connect', () => console.log('[Redis] Connected to Redis'));
redisConnection.on('error', (err) => {
    console.error('[Redis] Connection Error:', err);
});
