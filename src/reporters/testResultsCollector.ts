import { writeFileSync, readFileSync } from 'fs';
import { ReportStateStore, PersistedTestResult } from './reportStateStore';
import { applyBusinessRule } from '../utils/validationRules';

export interface TestResult {
    suite: string;
    test: string;
    table?: string;
    status: 'pass' | 'fail';
    duration: number;
    businessRulesApplied?: string[];
    details?: any;
    timestamp: string;
    steps?: TestStep[];
}

export interface TestStep {
    name: string;
    status: 'pass' | 'fail';
    log: string;
    timestamp: string;
}

export class TestResultsCollector {
    private static instance: TestResultsCollector;
    private results: TestResult[] = [];
    private startTime: number = Date.now();

    private constructor() {}

    public static getInstance(): TestResultsCollector {
        if (!TestResultsCollector.instance) {
            TestResultsCollector.instance = new TestResultsCollector();
        }
        return TestResultsCollector.instance;
    }

    public addResult(result: TestResult): void {
        if (!result.steps || result.steps.length === 0) {
            result.steps = [
                {
                    name: 'Execution summary',
                    status: result.status,
                    log: result.status === 'pass'
                        ? 'Test completed successfully.'
                        : `Test failed: ${String(result.details || 'No additional details available.')}`,
                    timestamp: result.timestamp
                }
            ];
        }

        if (!result.businessRulesApplied || result.businessRulesApplied.length === 0) {
            result.businessRulesApplied = [applyBusinessRule(result.test, result.steps || [])];
        }

        this.results.push(result);
        ReportStateStore.appendTestResult(result as PersistedTestResult);
    }

    public getResults(): TestResult[] {
        return this.results;
    }

    public getSummary(): {
        totalTests: number;
        passedTests: number;
        failedTests: number;
        totalDuration: number;
        passRate: number;
    } {
        const totalTests = this.results.length;
        const passedTests = this.results.filter(r => r.status === 'pass').length;
        const failedTests = totalTests - passedTests;
        const totalDuration = Date.now() - this.startTime;
        const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

        return {
            totalTests,
            passedTests,
            failedTests,
            totalDuration,
            passRate
        };
    }

    public saveResults(filePath: string): void {
        const results = {
            summary: this.getSummary(),
            results: this.results,
            timestamp: new Date().toISOString()
        };
        writeFileSync(filePath, JSON.stringify(results, null, 2));
    }

    public loadResults(filePath: string): void {
        try {
            const data = JSON.parse(readFileSync(filePath, 'utf-8'));
            this.results = data.results || [];
        } catch (error) {
            console.log('No previous test results found');
        }
    }
}

// Global test result collector
export const testResults = TestResultsCollector.getInstance();