import { config } from 'dotenv';
import { QueryStore } from '../queryStore';

config();

/**
 * DatabaseConnection - Demo Mode Only
 * This class is configured to run exclusively in demo mode.
 * It captures all query attempts through the centralized QueryStore.
 * No real database connections are established.
 *
 * Future live connection support:
 * - implement real connect/disconnect behavior
 * - replace demo executeQuery with actual database execution
 * - keep QueryStore capture enabled for auditing / replay
 */
export class DatabaseConnection {
    private queryStore: QueryStore;

    constructor() {
        this.queryStore = QueryStore.getInstance();
        console.log('[DatabaseConnection] Initialized in DEMO MODE ONLY');
    }

    async connect() {
        console.log('[DatabaseConnection] Demo mode: Skipping database connection');
        return;
    }

    async disconnect() {
        console.log('[DatabaseConnection] Demo mode: Skipping database disconnection');
        return;
    }

    async executeQuery(query: string, params?: any[], tableName?: string) {
        this.queryStore.captureQuery(query, tableName, params, 'connection');
        console.log('[DatabaseConnection] Query captured in demo mode. No execution performed.');
        return [];
    }
}