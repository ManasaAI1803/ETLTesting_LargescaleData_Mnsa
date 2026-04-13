import { readFileSync, existsSync, copyFileSync } from 'fs';
import { resolve } from 'path';
import { HtmlReportGeneratorV2 } from './reporters/htmlReportGenerator_v2';
import { ReportStateStore } from './reporters/reportStateStore';

export default async function globalTeardown() {
    console.log('\n' + '═'.repeat(80));
    console.log('📊 GLOBAL TEARDOWN: GENERATING UNIFIED TEST REPORT');
    console.log('═'.repeat(80) + '\n');

    const htmlReportGenerator = new HtmlReportGeneratorV2();
    const testResults = ReportStateStore.loadAllTestResults();
    const validationContexts = ReportStateStore.loadAllValidationContexts();

    // Print test summary to console
    const totalTests = testResults.length;
    const passedTests = testResults.filter(r => r.status === 'pass').length;
    const failedTests = testResults.filter(r => r.status === 'fail').length;
    const totalDuration = testResults.reduce((sum, r) => sum + r.duration, 0);

    if (!totalTests) {
        console.warn('⚠️ No test results were collected. The report will still be generated, but the summary will be empty.');
    }
    if (!validationContexts.length) {
        console.warn('⚠️ No validation contexts were collected. The report will still be generated, but validation sections may be empty.');
    }

    console.log(`📈 TEST SUMMARY`);
    console.log(`├─ Total Tests: ${totalTests}`);
    console.log(`├─ ✅ Passed: ${passedTests}`);
    console.log(`├─ ❌ Failed: ${failedTests}`);
    console.log(`└─ ⏱️  Total Duration: ${(totalDuration / 1000).toFixed(2)}s\n`);

    // Print failed tests details if any
    if (failedTests > 0) {
        console.log(`⚠️  FAILED TESTS DETAILS:`);
        testResults.filter(r => r.status === 'fail').forEach((result, idx) => {
            console.log(`   ${idx + 1}. ${result.test}`);
            if (result.details) {
                console.log(`      Error: ${String(result.details).substring(0, 100)}`);
            }
        });
        console.log('');
    }

    // Print test results by suite
    const suiteGroups = testResults.reduce((acc, test) => {
        if (!acc[test.suite]) acc[test.suite] = [];
        acc[test.suite].push(test);
        return acc;
    }, {} as Record<string, any[]>);

    console.log('📋 TESTS BY SUITE:');
    Object.entries(suiteGroups).forEach(([suite, tests]) => {
        const suitePassed = tests.filter(t => t.status === 'pass').length;
        const suiteFailed = tests.filter(t => t.status === 'fail').length;
        const icon = suiteFailed === 0 ? '✅' : '❌';
        console.log(`   ${icon} ${suite}: ${suitePassed}/${tests.length} passed`);
    });

    validationContexts.forEach(context => {
        htmlReportGenerator.addValidationContext(context as any);
    });

    htmlReportGenerator.setTestResults(testResults);

    try {
        const queryLogPath = resolve(__dirname, '../centralized_query_log.json');
        const queryLog = JSON.parse(readFileSync(queryLogPath, 'utf-8'));
        htmlReportGenerator.setQueryLog(queryLog);
    } catch (error) {
        console.warn('⚠️ Could not load query log for report generation:', error);
    }

    const reportPath = resolve(__dirname, '../reports', 'report.html');

    if (testResults.length === 0 && validationContexts.length === 0) {
        const schemaReportPath = resolve(__dirname, '../reports', 'schema-validation-report.html');
        if (existsSync(schemaReportPath)) {
            copyFileSync(schemaReportPath, reportPath);
            console.log('⚠️ No persisted test state found, falling back to schema-validation report.');
            console.log('\n' + '═'.repeat(80));
            console.log(`✅ Unified HTML report generated from schema-validation-report.html: reports/report.html`);
            console.log('═'.repeat(80) + '\n');
            return;
        }
    }

    htmlReportGenerator.saveReport(reportPath);
    
    console.log('\n' + '═'.repeat(80));
    console.log(`✅ Unified HTML report generated: reports/report.html`);
    console.log('═'.repeat(80) + '\n');
}
