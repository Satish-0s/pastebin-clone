import { Redis } from '@upstash/redis';
import fs from 'fs';
import path from 'path';

// MOCK IMPLEMENTATION FOR LOCAL DEVELOPMENT WITHOUT CREDENTIALS
class LocalJSONRedis {
    private dbPath: string;

    constructor() {
        this.dbPath = path.join(process.cwd(), 'local-db.json');
        console.warn(`\n⚠️  USING LOCAL FILE DATABASE (${this.dbPath}) because Upstash credentials are missing.\n    This is for development only. It will NOT work on Vercel.\n`);
    }

    private readDB(): Record<string, any> {
        if (!fs.existsSync(this.dbPath)) {
            return {};
        }
        try {
            return JSON.parse(fs.readFileSync(this.dbPath, 'utf-8'));
        } catch {
            return {};
        }
    }

    private writeDB(data: Record<string, any>) {
        fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2));
    }

    async get<T>(key: string): Promise<T | null> {
        const db = this.readDB();
        const item = db[key];
        if (!item) return null;

        // Check local expiry logic if we simulated it
        if (item._expiresAt && Date.now() > item._expiresAt) {
            delete db[key];
            this.writeDB(db);
            return null;
        }

        // Unwrap if we wrapped it
        const val = item.value;
        if (typeof val === 'string') {
            try {
                return JSON.parse(val) as T;
            } catch {
                return val as T;
            }
        }
        return val as T;
    }

    async set(key: string, value: any, options?: { ex?: number; keepTtl?: boolean }): Promise<string> {
        const db = this.readDB();

        // Handle stringify if passed as string but we can store raw if we want. 
        // Upstash client usually handles serialization, but here we just store whatever is passed.
        // If the caller passes a JSON string (which our code does), we store it.

        let expiresAt = undefined;
        if (options?.ex) {
            expiresAt = Date.now() + (options.ex * 1000);
        } else if (options?.keepTtl) {
            // Try to preserve existing TTL
            const existing = db[key];
            if (existing && existing._expiresAt) {
                expiresAt = existing._expiresAt;
            }
        }

        db[key] = {
            value,
            _expiresAt: expiresAt
        };

        this.writeDB(db);
        return 'OK';
    }

    async del(key: string): Promise<number> {
        const db = this.readDB();
        if (key in db) {
            delete db[key];
            this.writeDB(db);
            return 1;
        }
        return 0;
    }

    async ping(): Promise<string> {
        return 'PONG';
    }
}

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

const isConfigured = url && token && url !== 'your-upstash-url' && token !== 'your-upstash-token';

// Use Upstash if configured, otherwise fallback to local file DB
// @ts-ignore - LocalJSONRedis doesn't implement full Redis interface but enough for us
export const redis = isConfigured
    ? new Redis({ url, token })
    : new LocalJSONRedis() as unknown as Redis;
