import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis =
    url && token && url.startsWith("https://") && url !== "REPLACE_ME"
        ? new Redis({ url, token })
        : null;
