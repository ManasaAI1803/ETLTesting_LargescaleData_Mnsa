import fs from 'fs';
import path from 'path';

export interface CapturedQuery {
    timestamp: string;
    source: 'repository' | 'connection';
    query: string;
    table?: string;
    params?: any[];
}

export class QueryStore {
    private static instance: QueryStore;
    private queries: CapturedQuery[] = [];
    private logFile: string;

    private constructor() {
        this.logFile = path.resolve(__dirname, '../centralized_query_log.json');
        this.initializeLog();
    }

    static getInstance(): QueryStore {
        if (!QueryStore.instance) {
            QueryStore.instance = new QueryStore();
        }
        return QueryStore.instance;
    }

    private initializeLog() {
        if (!fs.existsSync(this.logFile)) {
            fs.writeFileSync(this.logFile, JSON.stringify({ queries: [], timestamp: new Date().toISOString() }, null, 2));
        }
    }

    captureQuery(query: string, table?: string, params?: any[], source: 'repository' | 'connection' = 'connection'): CapturedQuery {
        const capturedQuery: CapturedQuery = {
            timestamp: new Date().toISOString(),
            source,
            query,
            table,
            params,
        };
        this.queries.push(capturedQuery);
        this.persistQuery(capturedQuery);
        console.log(`[QueryStore] Captured ${source} query for ${table || 'unknown'}`);
        return capturedQuery;
    }

    private persistQuery(capturedQuery: CapturedQuery) {
        try {
            const existing = JSON.parse(fs.readFileSync(this.logFile, 'utf-8'));
            existing.queries.push(capturedQuery);
            existing.lastUpdated = new Date().toISOString();
            fs.writeFileSync(this.logFile, JSON.stringify(existing, null, 2));
        } catch (error) {
            console.error('Error persisting query:', error);
        }
    }

    getQueriesByTable(table: string): CapturedQuery[] {
        return this.queries.filter(q => q.table === table);
    }

    getAllQueries(): CapturedQuery[] {
        return [...this.queries];
    }

    clear() {
        this.queries = [];
        this.initializeLog();
    }

    generateReport(): string {
        const report = {
            totalQueries: this.queries.length,
            queriesBySource: {
                repository: this.queries.filter(q => q.source === 'repository').length,
                connection: this.queries.filter(q => q.source === 'connection').length,
            },
            queriesByTable: this.getTablesCount(),
            timestamp: new Date().toISOString(),
        };
        return JSON.stringify(report, null, 2);
    }

    private getTablesCount(): Record<string, number> {
        const count: Record<string, number> = {};
        this.queries.forEach(q => {
            if (q.table) {
                count[q.table] = (count[q.table] || 0) + 1;
            }
        });
        return count;
    }
}