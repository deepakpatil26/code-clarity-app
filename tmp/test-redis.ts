import IORedis from "ioredis";

const redisUrl = "rediss://default:AQ7BAAImcDFmYzc3ZmY2OTBhZDU0N2I4ODIwMjJkZWM1YzI5ZmUyN3AxMzc3Nw@diverse-cricket-3777.upstash.io:6379";

const redis = new IORedis(redisUrl);

async function test() {
  try {
    const res = await redis.ping();
    console.log("Redis Ping:", res);
    process.exit(0);
  } catch (err) {
    console.error("Redis Connection Error:", err);
    process.exit(1);
  }
}

test();
