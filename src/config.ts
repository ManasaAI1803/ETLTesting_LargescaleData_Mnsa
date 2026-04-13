import { config } from 'dotenv';

config();

export const Config = {
    isDemoMode: process.env.DEMO_MODE === 'true',
    db: {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: Number(process.env.DB_PORT),
    },
};