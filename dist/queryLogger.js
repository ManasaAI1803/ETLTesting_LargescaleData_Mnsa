"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryLogger = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class QueryLogger {
    constructor(logFile = 'query_log.txt') {
        this.logFile = path_1.default.resolve(__dirname, '../', logFile);
    }
    logQuery(query, params) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] Query: ${query}\nParams: ${JSON.stringify(params)}\n\n`;
        fs_1.default.appendFileSync(this.logFile, logEntry);
        console.log('Query logged:', query);
    }
}
exports.QueryLogger = QueryLogger;
