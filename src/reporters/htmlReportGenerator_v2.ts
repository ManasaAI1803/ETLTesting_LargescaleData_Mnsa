import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { businessRules } from '../rules/businessRules';
import { TestResult, TestStep } from './testResultsCollector';

export interface ValidationContext {
    table: string;
    sourceData: any[];
    targetData: any[];
    anomalies: Array<{ rule: string; row: any }>;
    timestamp: string;
    queries?: {
    source?: string;
    target?: string;
  };

}

/**
 * Simplified HTML Report Generator - 3 Tables Only
 * Table 1: Test Results Summary
 * Table 2: All Test Details (with execution steps)
 * Table 3: Validation Issues by Table
 */
export class HtmlReportGeneratorV2 {
    private contexts: ValidationContext[] = [];
    private queryLog: any = null;
    private testResults: TestResult[] = [];

    public addValidationContext(context: ValidationContext) {
        this.contexts.push(context);
    }

    public setQueryLog(queryLog: any) {
        this.queryLog = queryLog;
    }

    public setTestResults(results: TestResult[]) {
        this.testResults = results;
    }

    public generateHtmlReport(): string {
        const timestamp = new Date().toISOString();
        const reportDate = new Date(timestamp).toLocaleString();
        const dedupedResults = this.getDedupedTestResults();
        const summary = this.calculateTestSummary(dedupedResults);
        const contextSummary = this.calculateContextSummary();
        const schemaIssuesByTable = this.extractSchemaValidationIssues();
        const queryCount = this.queryLog?.queries?.length ?? 0;
        
        // Merge contexts with schema issues, and preserve tables even when no failures exist
        const allTableIssues = this.buildTableIssueRows(schemaIssuesByTable);
        const validatedTableCount = Math.max(this.contexts.length, allTableIssues.length);
        const effectiveSummary = this.contexts.length > 0
            ? contextSummary
            : this.calculateSchemaIssueSummary(allTableIssues);
        const tableLabels = JSON.stringify(allTableIssues.map(t => t.table));
        const anomalyCounts = JSON.stringify(allTableIssues.map(t => t.count));

        let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Santa Clara Family Healthcare Large‑Scale Data Comparison & Validation Automation</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f5f5f5; color: #333; padding: 20px; }
        .container { max-width: 1400px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .header p { font-size: 1em; opacity: 0.9; }
        .meta { background: #f9f9f9; border-bottom: 2px solid #e0e0e0; padding: 20px 40px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .meta-item { padding: 10px; background: white; border-left: 4px solid #667eea; border-radius: 4px; }
        .meta-item strong { color: #667eea; font-size: 0.9em; }
        .meta-item span { font-size: 1.1em; color: #333; display: block; }
        .content { padding: 40px; }
        section { margin-bottom: 40px; }
        section h2 { font-size: 1.5em; color: #333; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 3px solid #667eea; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 0.95em; }
        table thead { background: #f0f0f0; border-bottom: 2px solid #ddd; }
        table th { padding: 12px; text-align: left; font-weight: 600; color: #333; }
        table td { padding: 12px; border-bottom: 1px solid #e0e0e0; }
        table tbody tr { transition: background 0.2s; }
        table tbody tr:hover { background: #f9f9f9; }
        tr.pass { background-color: #f0fff4; }
        tr.fail { background-color: #fff5f5; }
        .status { padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 0.85em; }
        .status.pass { background: #d4edda; color: #155724; }
        .status.fail { background: #f8d7da; color: #721c24; }
        .metric-box { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .metric { background: #f9f9f9; padding: 15px; text-align: center; border-radius: 4px; border-left: 4px solid #667eea; }
        .metric strong { display: block; color: #667eea; font-size: 0.9em; margin-bottom: 8px; }
        .metric .value { font-size: 1.8em; font-weight: bold; color: #333; }
        .metric.pass .value { color: #28a745; }
        .metric.fail .value { color: #dc3545; }
        .badge { display: inline-block; padding: 4px 8px; border-radius: 3px; font-size: 0.85em; font-weight: 600; }
        .badge.pass { background: #28a745; color: white; }
        .badge.fail { background: #dc3545; color: white; }
        .anomaly-table { background: #fff5f5; border-left: 4px solid #dc3545; padding: 15px; margin-top: 10px; border-radius: 4px; font-size: 0.9em; }
        .footer { background: #f9f9f9; padding: 20px 40px; border-top: 2px solid #e0e0e0; text-align: center; color: #999; font-size: 0.9em; }
        @media (max-width: 768px) {
            .header h1 { font-size: 1.8em; }
            table { font-size: 0.85em; }
            table th, table td { padding: 8px; }
            .metric-box { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏥 Santa Clara Family Healthcare Large‑Scale Data Comparison & Validation Automation</h1>
            <p>Comprehensive Data Quality Assessment</p>
        </div>

        <div class="meta">
            <div class="meta-item">
                <strong>Report Date</strong>
                <span>${reportDate}</span>
            </div>
            <div class="meta-item">
                <strong>Test Suites</strong>
                <span>${this.getUniqueSuites(dedupedResults).join(', ') || 'None'}</span>
            </div>
            <div class="meta-item">
                <strong>Total Duration</strong>
                <span>${(summary.totalDuration / 1000).toFixed(2)}s</span>
            </div>
            <div class="meta-item">
                <strong>Pass Rate</strong>
                <span>${summary.passRate.toFixed(1)}%</span>
            </div>
        </div>

        <div class="content">
            <!-- EXECUTIVE SUMMARY -->
            <section>
                <h2>📌 Executive Summary</h2>
                <div class="metric-box">
                    <div class="metric">
                        <strong>Datasets Validated</strong>
                        <div class="value">${validatedTableCount}</div>
                    </div>
                    <div class="metric ${effectiveSummary.totalAnomalies === 0 ? 'pass' : 'fail'}">
                        <strong>Total Anomalies</strong>
                        <div class="value">${effectiveSummary.totalAnomalies}</div>
                    </div>
                    <div class="metric">
                        <strong>Quality Score</strong>
                        <div class="value">${effectiveSummary.qualityScore.toFixed(1)}%</div>
                    </div>
                    <div class="metric">
                        <strong>Captured Queries</strong>
                        <div class="value">${queryCount}</div>
                    </div>
                </div>
                <p>${effectiveSummary.summaryText}</p>
            </section>

            <!-- TABLE 1: TEST RESULTS SUMMARY -->
            <section>
                <h2>📊 Test Results Summary</h2>
                <div class="metric-box">
                    <div class="metric">
                        <strong>Total Tests</strong>
                        <div class="value">${summary.totalTests}</div>
                    </div>
                    <div class="metric pass">
                        <strong>Passed</strong>
                        <div class="value">${summary.passedTests}</div>
                    </div>
                    <div class="metric fail">
                        <strong>Failed</strong>
                        <div class="value">${summary.failedTests}</div>
                    </div>
                    <div class="metric">
                        <strong>Success Rate</strong>
                        <div class="value">${summary.passRate.toFixed(0)}%</div>
                    </div>
                </div>
                
                ${summary.failedTests > 0 ? `
                <div style="background: #fff5f5; border-left: 4px solid #dc3545; padding: 15px; margin: 15px 0; border-radius: 4px;">
                    <strong style="color: #721c24;">⚠️ ${summary.failedTests} Test(s) Failed</strong>
                    <ul style="margin-top: 10px; margin-left: 20px; color: #721c24;">
                        ${dedupedResults.filter(r => r.status === 'fail').map(r => `<li>${r.test}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
            </section>

            <!-- CHARTS -->
            <section>
                <h2>📈 Executive Charts</h2>
                <div class="metric-box" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));">
                    <div style="background: white; border-radius: 8px; padding: 20px; box-shadow: 0 1px 4px rgba(0,0,0,0.08);">
                        <strong>Test Outcome Distribution</strong>
                        <canvas id="passFailChart" style="max-height:260px; width:100%;"></canvas>
                    </div>
                    <div style="background: white; border-radius: 8px; padding: 20px; box-shadow: 0 1px 4px rgba(0,0,0,0.08);">
                        <strong>Data Issue Counts by Table</strong>
                        <canvas id="tableAnomalyChart" style="max-height:260px; width:100%;"></canvas>
                    </div>
                </div>
            </section>

            <!-- TABLE 2: DETAILED TEST RESULTS -->
            <section>
                <h2>🧪 Test Execution Details</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Test Name</th>
                            <th>Suite</th>
                            <th>Status</th>
                            <th>Duration</th>
                            <th>Business Rules</th>
                            <th>Summary</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${dedupedResults.length > 0 ? dedupedResults.map(result => {
                            const statusClass = result.status === 'pass' ? 'pass' : 'fail';
                            const statusBadge = result.status === 'pass' ? '✅ PASS' : '❌ FAIL';
                            const resultSummary = this.getResultSummary(result);
                            const businessRule = this.getBusinessRule(result);
                            const technicalDetails = this.getTechnicalDetails(result);
                            const escapedSummary = this.escapeHtml(resultSummary);
                            const detailsHtml = technicalDetails ? `
                                <details style="margin-top: 8px; font-size: 0.85em; color: #444;"><summary style="cursor: pointer;">View technical details</summary><pre style="white-space: pre-wrap; background: #f8f9fa; border: 1px solid #e0e0e0; padding: 10px; border-radius: 4px; overflow-x: auto;">${this.escapeHtml(technicalDetails)}</pre></details>
                            ` : '';
                            return `<tr class="${statusClass}">
                                <td><strong>${this.escapeHtml(result.test)}</strong></td>
                                <td>${this.escapeHtml(result.suite)}</td>
                                <td><span class="badge ${statusClass}">${statusBadge}</span></td>
                                <td>${result.duration}ms</td>
                                <td>${this.escapeHtml(businessRule)}</td>
                                <td><div style="font-size:0.95em; line-height:1.4;">${escapedSummary}</div>${detailsHtml}</td>
                            </tr>`;
                        }).join('') : `<tr><td colspan="6" style="text-align:center; padding:20px; color:#666;">No test results recorded yet.</td></tr>`}
                    </tbody>
                </table>
            </section>

            <!-- TABLE 3: VALIDATION ISSUES BY TABLE -->
            <section>
                <h2>📋 Data Quality Issues by Table</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Table</th>
                            <th>Source Count</th>
                            <th>Target Count</th>
                            <th>% Match</th>
                            <th>Anomalies Found</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${allTableIssues.length > 0 ? allTableIssues.map(issue => {
                            const context = this.contexts.find(c => c.table.toLowerCase() === issue.table.toLowerCase());
                            const hasIssues = issue.count > 0;
                            const statusClass = hasIssues ? 'fail' : 'pass';
                            const sourceCount = context?.sourceData.length ?? issue.sourceCount ?? 0;
                            const targetCount = context?.targetData.length ?? issue.targetCount ?? 0;
                            const matchPercent = context ? this.calculateMatchPercent(context) : this.calculateMatchPercentFromCounts(sourceCount, targetCount);
                            return `<tr class="${statusClass}">
                                <td><strong>${issue.table}</strong></td>
                                <td>${sourceCount || '-'}</td>
                                <td>${targetCount || '-'}</td>
                                <td>${matchPercent.toFixed(1)}%</td>
                                <td>${issue.count}</td>
                                <td><span class="badge ${statusClass}">${hasIssues ? `❌ ${issue.count} Issues` : '✅ OK'}</span></td>
                            </tr>`;
                        }).join('') : `<tr><td colspan="6" style="text-align:center; padding:20px; color:#666;">No validation contexts recorded yet.</td></tr>`}
                    </tbody>
                </table>

                ${this.contexts.some(c => c.anomalies.length > 0) || allTableIssues.some(issue => issue.count > 0) ? `
                <div style="margin-top: 20px;">
                    <h3 style="color: #dc3545; margin-bottom: 15px;">🔴 Anomaly Details</h3>
                    ${this.contexts.filter(c => c.anomalies.length > 0).map(context => `
                        <div class="anomaly-table">
                            <strong>${context.table}: ${context.anomalies.length} anomalies detected</strong>
                            <ul style="margin-top: 8px; margin-left: 20px;">
                                ${context.anomalies.slice(0, 5).map(a => `<li>${a.rule}</li>`).join('')}
                                ${context.anomalies.length > 5 ? `<li>... and ${context.anomalies.length - 5} more</li>` : ''}
                            </ul>
                        </div>
                    `).join('')}
                    ${!this.contexts.some(c => c.anomalies.length > 0) ? allTableIssues.filter(issue => issue.count > 0).map(issue => `
                        <div class="anomaly-table">
                            <strong>${issue.table}: ${issue.count} schema validation issue(s)</strong>
                            <p style="margin-top: 8px;">Schema validation tests indicated ${issue.count} issue(s) for this table.</p>
                        </div>
                    `).join('') : ''}
                </div>
                ` : ''}
            </section>
        </div>

        <div class="footer">
            <p>Generated on ${reportDate} | Healthcare Data Validation Framework v1.0</p>
        </div>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
        const passFailData = {
            labels: ['Passed', 'Failed'],
            datasets: [{
                data: [${summary.passedTests}, ${summary.failedTests}],
                backgroundColor: ['#28a745', '#dc3545']
            }]
        };

        const tableLabels = ${tableLabels};
        const anomalyCounts = ${anomalyCounts};

        const passFailChart = document.getElementById('passFailChart');
        if (passFailChart) {
            new Chart(passFailChart, {
                type: 'doughnut',
                data: passFailData,
                options: {
                    plugins: {
                        legend: { position: 'bottom' },
                        tooltip: { callbacks: { label: function(t) { return t.label + ': ' + t.parsed; } } }
                    }
                }
            });
        }

        const tableAnomalyChart = document.getElementById('tableAnomalyChart');
        if (tableAnomalyChart) {
            new Chart(tableAnomalyChart, {
                type: 'bar',
                data: {
                    labels: tableLabels,
                    datasets: [{
                        label: 'Anomaly count',
                        data: anomalyCounts,
                        backgroundColor: '#f7b924'
                    }]
                },
                options: {
                    indexAxis: 'y',
                    scales: {
                        x: { beginAtZero: true, ticks: { precision: 0 } }
                    },
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
        }
    </script>
</body>
</html>`;
        return html;
    }

    public saveReport(filePath: string): void {
        const dir = dirname(filePath);
        mkdirSync(dir, { recursive: true });
        const html = this.generateHtmlReport();
        writeFileSync(filePath, html, 'utf-8');
    }

    private getUniqueSuites(testResults: TestResult[]): string[] {
        const suites = new Set(testResults.map(r => r.suite));
        return Array.from(suites);
    }

    private getDedupedTestResults(): TestResult[] {
        const seen = new Set<string>();
        return this.testResults.filter(result => {
            const key = `${result.suite}||${result.test}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    private getBusinessRule(result: TestResult): string {
        if (result.businessRulesApplied && result.businessRulesApplied.length > 0) {
            return result.businessRulesApplied.join(', ');
        }

        const text = `${result.test} ${result.steps?.map(step => step.log).join(' ') || ''}`.toLowerCase();
        if (/schema|schema mismatch|fields?/.test(text)) return 'Schema Validation';
        if (/row count|count mismatch/.test(text)) return 'Row Count Validation';
        if (/hash|data hash|hash mismatch/.test(text)) return 'Hash Validation';
        if (/dependency|referential|visit_id|patient_id|provider_id|billing.*visit|providers/.test(text)) return 'Dependencies Validation';
        if (/amount|billing|negative|decimal|precision|truncation/.test(text)) return 'Amount Validation';
        if (/missing|extra|diff|partition|anti|left join|right join/.test(text)) return 'Diff / Row Mismatch';
        return 'General Validation';
    }

    private getResultSummary(result: TestResult): string {
        if (result.status === 'fail' && result.details) {
            return this.getShortErrorMessage(result.details);
        }

        if (result.steps && result.steps.length > 0) {
            const lastStep = result.steps[result.steps.length - 1];
            if (result.status === 'fail') {
                const stepSummary = this.stripAnsi(lastStep.log).trim();
                const errorSummary = this.getShortErrorMessage(result.details || stepSummary);
                return errorSummary || stepSummary;
            }
            return this.stripAnsi(lastStep.log).trim();
        }

        return result.status === 'fail' ? 'Validation failed. See details for more information.' : 'Validation completed successfully.';
    }

    private getTechnicalDetails(result: TestResult): string | null {
        if (!result.details) {
            return null;
        }

        if (typeof result.details === 'string') {
            return this.stripAnsi(result.details);
        }

        if (result.details instanceof Error) {
            return this.stripAnsi(result.details.stack || result.details.message);
        }

        try {
            return this.stripAnsi(JSON.stringify(result.details, null, 2));
        } catch {
            return this.stripAnsi(String(result.details));
        }
    }

    private stripAnsi(value: string): string {
        if (!value) {
            return value;
        }

        return value
            .replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '')
            .replace(/\\u001b\[[0-?]*[ -/]*[@-~]/g, '')
            .replace(/\\x1B\[[0-?]*[ -/]*[@-~]/g, '');
    }

    private escapeHtml(value: string): string {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    private getShortErrorMessage(details: any): string {
        const rawText = typeof details === 'string'
            ? details
            : details instanceof Error
                ? details.stack || details.message
                : typeof details === 'object'
                    ? details.message || details.error || JSON.stringify(details)
                    : String(details);

        const cleaned = this.stripAnsi(rawText || '').trim();
        if (!cleaned) {
            return 'Validation failed with no readable error message.';
        }

        const errorLines = cleaned.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
        const firstLine = errorLines[0] || cleaned;

        // Handle Playwright/Jest expect assertion error text
        const assertionIndex = errorLines.findIndex(line => /expect\(|toBe\(|toEqual\(|toHaveProperty\(/i.test(line));
        const assertionMessage = assertionIndex >= 0 ? errorLines.slice(assertionIndex, assertionIndex + 2).join(' | ') : null;

        if (assertionMessage) {
            return assertionMessage.replace(/\s+/g, ' ').trim();
        }

        if (/^error:/i.test(firstLine)) {
            return firstLine.replace(/^error:\s*/i, '').trim();
        }

        return firstLine.length > 140 ? `${firstLine.slice(0, 137)}...` : firstLine;
    }

    private generateRulesSection(): string {
        if (!this.contexts.length) {
            return '<p>No validation contexts available.</p>';
        }

        return this.contexts.map(context => {
            const rules: any = (businessRules as any)[context.table];
            const mandatoryFields = rules?.mandatoryFields || [];
            const acceptableValues = rules?.acceptableValues || {};
            const validationFields = rules?.validationRules ? Object.keys(rules.validationRules) : [];

            return `
                <div class="anomaly-table">
                    <strong>${context.table}</strong>
                    <p>Source rows: ${context.sourceData.length}, target rows: ${context.targetData.length}, anomalies: ${context.anomalies.length}</p>
                    <p><strong>Mandatory fields:</strong> ${mandatoryFields.length ? mandatoryFields.join(', ') : 'None configured'}</p>
                    <p><strong>Validation fields:</strong> ${validationFields.length ? validationFields.join(', ') : 'None configured'}</p>
                    ${Object.keys(acceptableValues).length > 0 ? `
                    <div style="margin-top: 10px;">
                        <strong>Acceptable values:</strong>
                        <ul style="margin-left: 18px; margin-top: 6px;">
                            ${Object.entries(acceptableValues).map(([field, values]) => `<li>${field}: ${JSON.stringify(values)}</li>`).join('')}
                        </ul>
                    </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    private calculateTestSummary(testResults: TestResult[]) {
        const totalTests = testResults.length;
        const passedTests = testResults.filter(r => r.status === 'pass').length;
        const failedTests = totalTests - passedTests;
        const totalDuration = testResults.reduce((sum, r) => sum + r.duration, 0);
        const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

        return {
            totalTests,
            passedTests,
            failedTests,
            totalDuration,
            passRate
        };
    }

    private calculateContextSummary() {
        const totalAnomalies = this.contexts.reduce((sum, context) => sum + context.anomalies.length, 0);
        const totalSourceRows = this.contexts.reduce((sum, context) => sum + context.sourceData.length, 0);
        const totalTargetRows = this.contexts.reduce((sum, context) => sum + context.targetData.length, 0);
        const tablesWithIssues = this.contexts.filter(context => context.anomalies.length > 0).length;
        const averageMatchPercent = this.contexts.length > 0
            ? this.contexts.reduce((sum, context) => sum + this.calculateMatchPercent(context), 0) / this.contexts.length
            : 100;
        const qualityScore = Math.max(0, Math.min(100, 100 - (totalAnomalies / Math.max(totalSourceRows, totalTargetRows, 1)) * 100));
        const summaryText = tablesWithIssues === 0
            ? 'All validated tables passed quality checks. No significant data issues were detected.'
            : `${tablesWithIssues} out of ${this.contexts.length} table(s) contain anomalies. Review the details below for remediation.`;

        return {
            totalAnomalies,
            totalSourceRows,
            totalTargetRows,
            tablesWithIssues,
            averageMatchPercent,
            qualityScore,
            summaryText
        };
    }

    private calculateSchemaIssueSummary(tableIssues: Array<{ table: string; count: number }>) {
        const totalAnomalies = tableIssues.reduce((sum, issue) => sum + issue.count, 0);
        const tablesWithIssues = tableIssues.filter(issue => issue.count > 0).length;
        const averageMatchPercent = tableIssues.length > 0 ? 100 : 100;
        const qualityScore = Math.max(0, Math.min(100, 100 - (totalAnomalies / Math.max(1, tableIssues.length)) * 100));
        const summaryText = tablesWithIssues === 0
            ? 'All validated tables passed schema checks. No schema issues were detected.'
            : `${tablesWithIssues} out of ${tableIssues.length} table(s) contain schema issues. Review the details below for remediation.`;

        return {
            totalAnomalies,
            totalSourceRows: 0,
            totalTargetRows: 0,
            tablesWithIssues,
            averageMatchPercent,
            qualityScore,
            summaryText
        };
    }

    private calculateMatchPercent(context: ValidationContext) {
        const sourceCount = context.sourceData.length;
        const targetCount = context.targetData.length;
        if (!sourceCount || !targetCount) {
            return 0;
        }
        return sourceCount === targetCount ? 100 : (Math.min(sourceCount, targetCount) / Math.max(sourceCount, targetCount)) * 100;
    }

    private getRulesSummary(tableName: string): string {
        const key = tableName.toLowerCase();
        const rules: any = (businessRules as any)[key];
        const mandatoryFields = rules?.mandatoryFields || [];
        const validationFields = rules?.validationRules ? Object.keys(rules.validationRules) : [];
        const acceptableValues = rules?.acceptableValues ? Object.keys(rules.acceptableValues) : [];

        const parts: string[] = [];
        if (mandatoryFields.length) {
            parts.push(`Mandatory: ${mandatoryFields.join(', ')}`);
        }
        if (validationFields.length) {
            parts.push(`Rules: ${validationFields.join(', ')}`);
        }
        if (acceptableValues.length) {
            parts.push(`Acceptable values: ${acceptableValues.join(', ')}`);
        }

        return parts.length ? parts.join(' | ') : 'Standard validation';
    }

    private extractSchemaValidationIssues(): Map<string, number> {
        const schemaIssues = new Map<string, number>();

        for (const result of this.testResults) {
            if (result.suite !== 'schema-validation' || result.status !== 'fail') {
                continue;
            }

            const tableKey = result.table || this.extractTableNameFromTest(result.test);
            if (!tableKey) {
                continue;
            }

            schemaIssues.set(tableKey, (schemaIssues.get(tableKey) || 0) + 1);
        }

        return schemaIssues;
    }

    private extractTableNameFromTest(testName: string): string | null {
        const normalized = testName.toLowerCase();
        if (normalized.includes('ge patients') || normalized.includes('ge patient')) {
            return 'GE Patients';
        }
        if (normalized.includes('ge medications') || normalized.includes('ge medication')) {
            return 'GE Medications';
        }
        if (normalized.includes('patients')) {
            return 'Patients';
        }
        if (normalized.includes('medications')) {
            return 'Medications';
        }
        if (normalized.includes('providers')) {
            return 'Providers';
        }
        if (normalized.includes('visits')) {
            return 'Visits';
        }
        if (normalized.includes('billing')) {
            return 'Billing';
        }
        return null;
    }

    private mergeTableIssues(schemaIssuesByTable: Map<string, number>): Array<{ table: string; count: number }> {
        const merged = new Map<string, { table: string; count: number }>(
            this.contexts.map(context => [context.table.toLowerCase(), { table: context.table, count: context.anomalies.length }])
        );

        for (const [table, count] of schemaIssuesByTable) {
            const key = table.toLowerCase();
            const existing = merged.get(key);
            if (existing) {
                merged.set(key, { table: existing.table, count: existing.count + count });
            } else {
                merged.set(key, { table, count });
            }
        }

        return Array.from(merged.values()).sort((a, b) => a.table.localeCompare(b.table));
    }

    private buildTableIssueRows(schemaIssuesByTable: Map<string, number>): Array<{ table: string; count: number; sourceCount: number; targetCount: number }> {
        const tableRows = new Map<string, { table: string; count: number; sourceCount: number; targetCount: number }>();

        for (const context of this.contexts) {
            const key = context.table.toLowerCase();
            tableRows.set(key, {
                table: context.table,
                count: context.anomalies.length,
                sourceCount: context.sourceData.length,
                targetCount: context.targetData.length,
            });
        }

        for (const [table, count] of schemaIssuesByTable) {
            const key = table.toLowerCase();
            const existing = tableRows.get(key) || { table, count: 0, sourceCount: 0, targetCount: 0 };
            existing.count = Math.max(existing.count, count);
            tableRows.set(key, existing);
        }

        for (const result of this.testResults.filter(r => r.suite === 'schema-validation')) {
            const tableName = result.table || this.extractTableNameFromTest(result.test) || 'Unknown';
            const key = tableName.toLowerCase();
            const existing = tableRows.get(key) || { table: tableName, count: 0, sourceCount: 0, targetCount: 0 };

            if (result.status === 'fail') {
                existing.count += 1;
            }

            const counts = this.getCountsFromTestSteps(result.steps || []);
            existing.sourceCount = Math.max(existing.sourceCount, counts.sourceCount);
            existing.targetCount = Math.max(existing.targetCount, counts.targetCount);
            tableRows.set(key, existing);
        }

        return Array.from(tableRows.values()).sort((a, b) => a.table.localeCompare(b.table));
    }

    private getCountsFromTestSteps(steps: TestStep[]): { sourceCount: number; targetCount: number } {
        let sourceCount = 0;
        let targetCount = 0;

        for (const step of steps) {
            const combinedMatch = step.log.match(/Loaded\s+(\d+)\s+source\s+and\s+(\d+)\s+target\s+records/i);
            if (combinedMatch) {
                sourceCount = Math.max(sourceCount, parseInt(combinedMatch[1], 10));
                targetCount = Math.max(targetCount, parseInt(combinedMatch[2], 10));
                continue;
            }

            const sourceMatch = step.log.match(/Loaded\s+(\d+)\s+source\s+records/i);
            if (sourceMatch) {
                sourceCount = Math.max(sourceCount, parseInt(sourceMatch[1], 10));
            }

            const targetMatch = step.log.match(/Loaded\s+(\d+)\s+target\s+records/i);
            if (targetMatch) {
                targetCount = Math.max(targetCount, parseInt(targetMatch[1], 10));
            }
        }

        return { sourceCount, targetCount };
    }

    private calculateMatchPercentFromCounts(sourceCount: number, targetCount: number) {
        if (!sourceCount || !targetCount) {
            return 0;
        }
        return sourceCount === targetCount ? 100 : (Math.min(sourceCount, targetCount) / Math.max(sourceCount, targetCount)) * 100;
    }
}