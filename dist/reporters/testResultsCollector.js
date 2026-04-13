"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testResults = exports.TestResultsCollector = void 0;
const fs_1 = require("fs");
const reportStateStore_1 = require("./reportStateStore");
const validationRules_1 = require("../utils/validationRules");
class TestResultsCollector {
    constructor() {
        this.results = [];
        this.startTime = Date.now();
    }
    static getInstance() {
        if (!TestResultsCollector.instance) {
            TestResultsCollector.instance = new TestResultsCollector();
        }
        return TestResultsCollector.instance;
    }
    addResult(result) {
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
            result.businessRulesApplied = [(0, validationRules_1.applyBusinessRule)(result.test, result.steps || [])];
        }
        this.results.push(result);
        reportStateStore_1.ReportStateStore.appendTestResult(result);
    }
    getResults() {
        return this.results;
    }
    getSummary() {
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
    saveResults(filePath) {
        const results = {
            summary: this.getSummary(),
            results: this.results,
            timestamp: new Date().toISOString()
        };
        (0, fs_1.writeFileSync)(filePath, JSON.stringify(results, null, 2));
    }
    loadResults(filePath) {
        try {
            const data = JSON.parse((0, fs_1.readFileSync)(filePath, 'utf-8'));
            this.results = data.results || [];
        }
        catch (error) {
            console.log('No previous test results found');
        }
    }
}
exports.TestResultsCollector = TestResultsCollector;
// Global test result collector
exports.testResults = TestResultsCollector.getInstance();
