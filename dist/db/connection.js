"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseConnection = void 0;
const dotenv_1 = require("dotenv");
const queryStore_1 = require("../queryStore");
(0, dotenv_1.config)();
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
class DatabaseConnection {
    constructor() {
        this.queryStore = queryStore_1.QueryStore.getInstance();
        console.log('[DatabaseConnection] Initialized in DEMO MODE ONLY');
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('[DatabaseConnection] Demo mode: Skipping database connection');
            return;
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('[DatabaseConnection] Demo mode: Skipping database disconnection');
            return;
        });
    }
    executeQuery(query, params, tableName) {
        return __awaiter(this, void 0, void 0, function* () {
            this.queryStore.captureQuery(query, tableName, params, 'connection');
            console.log('[DatabaseConnection] Query captured in demo mode. No execution performed.');
            return [];
        });
    }
}
exports.DatabaseConnection = DatabaseConnection;
