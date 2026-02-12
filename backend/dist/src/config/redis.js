const Redis = require("ioredis");

const redisConnection = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
});

redisConnection.on("connect", () =>
    console.log("[Redis] Connected to Redis")
);

redisConnection.on("error", (err) =>
    console.error("[Redis] Error:", err)
);

module.exports = { redisConnection };
