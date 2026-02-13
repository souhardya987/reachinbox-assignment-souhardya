"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisConnection = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load .env explicitly
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
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
exports.redisConnection = process.env.REDIS_URL
    ? new ioredis_1.default(process.env.REDIS_URL, redisConfig)
    : new ioredis_1.default(redisConfig);
exports.redisConnection.on('connect', () => console.log('[Redis] Connected to Redis'));
exports.redisConnection.on('error', (err) => console.error('[Redis] Error:', err));
