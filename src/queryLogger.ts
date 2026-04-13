import fs from 'fs';
import path from 'path';

export class QueryLogger {
    private logFile: string;

    constructor(logFile: string = 'query_log.txt') {
        this.logFile = path.resolve(__dirname, '../', logFile);
    }

    logQuery(query: string, params?: any[]) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] Query: ${query}\nParams: ${JSON.stringify(params)}\n\n`;
        fs.appendFileSync(this.logFile, logEntry);
        console.log('Query logged:', query);
    }
}