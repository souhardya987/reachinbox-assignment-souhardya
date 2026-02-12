const Redis = require("ioredis");

console.log("REDIS_URL is:", process.env.REDIS_URL);

const redisConnection = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
});

module.exports = { redisConnection };
