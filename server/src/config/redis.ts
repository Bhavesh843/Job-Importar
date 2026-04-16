import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Setup connection for BullMQ with robust retry management
export const connection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    retryStrategy: (times) => {
        console.warn(`Redis connection retry attempt: ${times}`);
        // Exponential backoff with a cap of 10 seconds
        return Math.min(times * 1000, 10000);
    },
    reconnectOnError: (err) => {
        console.error(`Redis connection error encountered: ${err.message}`);
        // Return true or 1 to force a reconnect from ioredis
        return true;
    }
});

connection.on('error', (err) => {
    console.error('Redis encountered a critical error:', err);
});
connection.on('connect', () => {
    console.log('Redis successfully connected');
});