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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Repository = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const mockData_1 = require("../mockData");
const queryStore_1 = require("../queryStore");
/**
 * Repository - Demo Mode Only
 * Fetches mock data and captures queries through centralized QueryStore
 */
class Repository {
    constructor(dbConnection) {
        this.dbConnection = dbConnection;
        this.queryStore = queryStore_1.QueryStore.getInstance();
    }
    fetchSourceData(tableName) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = this.getQueryFromFile(`../sql/source/${tableName}.sql`);
            this.queryStore.captureQuery(query, `${tableName}_source`, undefined, 'repository');
            return this.getMockData(tableName);
        });
    }
    fetchTargetData(tableName) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = this.getQueryFromFile(`../sql/target/${tableName}.sql`);
            this.queryStore.captureQuery(query, `${tableName}_target`, undefined, 'repository');
            return this.getMockTargetData(tableName);
        });
    }
    getMockTargetData(tableName) {
        // Generate target data with intentional differences to demonstrate validation
        switch (tableName) {
            case 'patients':
                // Add extra column, reduce count, include invalid data
                const patients = mockData_1.MockDataGenerator.generatePatients(8, true);
                return patients.map(p => (Object.assign(Object.assign({}, p), { extra_target_column: 'target_only' })));
            case 'providers':
                // Same data as source
                return mockData_1.MockDataGenerator.generateProviders(5, false);
            case 'visits':
                // Include invalid references
                return mockData_1.MockDataGenerator.generateVisits(20, true);
            case 'medications':
                // Include invalid references
                return mockData_1.MockDataGenerator.generateMedications(15, true);
            case 'billing':
                // Include invalid data and missing date column for schema test
                const billing = mockData_1.MockDataGenerator.generateBilling(18, true);
                return billing.map(b => {
                    const { date } = b, rest = __rest(b, ["date"]); // Remove date column to test schema mismatch
                    return rest;
                });
            default:
                return this.generateMockDataByTable(tableName);
        }
    }
    getQueryFromFile(filePath) {
        try {
            const fullPath = path_1.default.join(__dirname, '../sql-repo', filePath);
            return fs_1.default.readFileSync(fullPath, 'utf-8');
        }
        catch (error) {
            console.warn(`Could not read query file: ${filePath}`);
            return `-- Query file not found: ${filePath}`;
        }
    }
    getMockData(tableName) {
        const mockData = this.generateMockDataByTable(tableName);
        console.log(`[Repository] Generated ${mockData.length} mock records for ${tableName}`);
        return mockData;
    }
    generateMockDataByTable(tableName) {
        switch (tableName) {
            case 'patients':
                return mockData_1.MockDataGenerator.generatePatients();
            case 'providers':
                return mockData_1.MockDataGenerator.generateProviders();
            case 'visits':
                return mockData_1.MockDataGenerator.generateVisits();
            case 'medications':
                return mockData_1.MockDataGenerator.generateMedications();
            case 'billing':
                return mockData_1.MockDataGenerator.generateBilling();
            default:
                console.warn(`Unknown table: ${tableName}`);
                return [];
        }
    }
}
exports.Repository = Repository;
