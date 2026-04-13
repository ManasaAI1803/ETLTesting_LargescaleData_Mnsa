import { DatabaseConnection } from './connection';
import fs from 'fs';
import path from 'path';
import { MockDataGenerator } from '../mockData';
import { QueryStore } from '../queryStore';

/**
 * Repository - Demo Mode Only
 * Fetches mock data and captures queries through centralized QueryStore
 */
export class Repository {
    private dbConnection: DatabaseConnection;
    private queryStore: QueryStore;

    constructor(dbConnection: DatabaseConnection) {
        this.dbConnection = dbConnection;
        this.queryStore = QueryStore.getInstance();
    }

    async fetchSourceData(tableName: string): Promise<any[]> {
        const query = this.getQueryFromFile(`../sql/source/${tableName}.sql`);
        this.queryStore.captureQuery(query, `${tableName}_source`, undefined, 'repository');
        return this.getMockData(tableName);
    }

    async fetchTargetData(tableName: string): Promise<any[]> {
        const query = this.getQueryFromFile(`../sql/target/${tableName}.sql`);
        this.queryStore.captureQuery(query, `${tableName}_target`, undefined, 'repository');
        return this.getMockTargetData(tableName);
    }

    private getMockTargetData(tableName: string): any[] {
        // Generate target data with intentional differences to demonstrate validation
        switch (tableName) {
            case 'patients':
                // Add extra column, reduce count, include invalid data
                const patients = MockDataGenerator.generatePatients(8, true);
                return patients.map(p => ({ ...p, extra_target_column: 'target_only' }));
            case 'providers':
                // Same data as source
                return MockDataGenerator.generateProviders(5, false);
            case 'visits':
                // Include invalid references
                return MockDataGenerator.generateVisits(20, true);
            case 'medications':
                // Include invalid references
                return MockDataGenerator.generateMedications(15, true);
            case 'billing':
                // Include invalid data and missing date column for schema test
                const billing = MockDataGenerator.generateBilling(18, true);
                return billing.map(b => {
                    const { date, ...rest } = b; // Remove date column to test schema mismatch
                    return rest;
                });
            default:
                return this.generateMockDataByTable(tableName);
        }
    }

    private getQueryFromFile(filePath: string): string {
        try {
            const fullPath = path.join(__dirname, '../sql-repo', filePath);
            return fs.readFileSync(fullPath, 'utf-8');
        } catch (error) {
            console.warn(`Could not read query file: ${filePath}`);
            return `-- Query file not found: ${filePath}`;
        }
    }

    private getMockData(tableName: string): any[] {
        const mockData = this.generateMockDataByTable(tableName);
        console.log(`[Repository] Generated ${mockData.length} mock records for ${tableName}`);
        return mockData;
    }

    private generateMockDataByTable(tableName: string): any[] {
        switch (tableName) {
            case 'patients':
                return MockDataGenerator.generatePatients();
            case 'providers':
                return MockDataGenerator.generateProviders();
            case 'visits':
                return MockDataGenerator.generateVisits();
            case 'medications':
                return MockDataGenerator.generateMedications();
            case 'billing':
                return MockDataGenerator.generateBilling();
            default:
                console.warn(`Unknown table: ${tableName}`);
                return [];
        }
    }
}