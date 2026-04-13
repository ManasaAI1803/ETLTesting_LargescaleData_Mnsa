"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryStore = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class QueryStore {
    constructor() {
        this.queries = [];
        this.logFile = path_1.default.resolve(__dirname, '../centralized_query_log.json');
        this.initializeLog();
    }
    static getInstance() {
        if (!QueryStore.instance) {
            QueryStore.instance = new QueryStore();
        }
        return QueryStore.instance;
    }
    initializeLog() {
        if (!fs_1.default.existsSync(this.logFile)) {
            fs_1.default.writeFileSync(this.logFile, JSON.stringify({ queries: [], timestamp: new Date().toISOString() }, null, 2));
        }
    }
    captureQuery(query, table, params, source = 'connection') {
        const capturedQuery = {
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
    persistQuery(capturedQuery) {
        try {
            const existing = JSON.parse(fs_1.default.readFileSync(this.logFile, 'utf-8'));
            existing.queries.push(capturedQuery);
            existing.lastUpdated = new Date().toISOString();
            fs_1.default.writeFileSync(this.logFile, JSON.stringify(existing, null, 2));
        }
        catch (error) {
            console.error('Error persisting query:', error);
        }
    }
    getQueriesByTable(table) {
        return this.queries.filter(q => q.table === table);
    }
    getAllQueries() {
        return [...this.queries];
    }
    clear() {
        this.queries = [];
        this.initializeLog();
    }
    generateReport() {
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
    getTablesCount() {
        const count = {};
        this.queries.forEach(q => {
            if (q.table) {
                count[q.table] = (count[q.table] || 0) + 1;
            }
        });
        return count;
    }
}
exports.QueryStore = QueryStore;
