import { test, expect } from '@playwright/test';
import { Repository } from '../../src/db/repository';
import { DatabaseConnection } from '../../src/db/connection';
import { TestResultsCollector } from '../../src/reporters/testResultsCollector';
import { PatientsValidator } from '../../src/validators/patientsValidator';
import { ProvidersValidator } from '../../src/validators/providersValidator';
import { VisitsValidator } from '../../src/validators/visitsValidator';
import { MedicationsValidator } from '../../src/validators/medicationsValidator';
import { BillingValidator } from '../../src/validators/billingValidator';
import { HtmlReportGeneratorV2, ValidationContext } from '../../src/reporters/htmlReportGenerator_v2';
import { ReportStateStore } from '../../src/reporters/reportStateStore';
import { AnomalyReport } from '../../src/reporters/anomalyReport';
import { loadSourceData, loadTargetData, partitionByDate, sampleData, getPrimaryKey } from '../../utils/dataLoader';
import { applyBusinessRule, formatAnomalySummary } from '../../utils/validationRules';
import { summarizeError } from '../../utils/errorFormatting';
import { hashRow, hashTable } from '../../utils/hashing';
import { runValidationTest } from '../../utils/testRunner';

/**
 * Enhanced Healthcare Data Validation Framework
 * Comprehensive validation with positive/negative test cases
 * Includes schema validation, dependency checks, partitioned comparison, and automated diff detection
 */

test.describe('Enhanced Healthcare Data Validation Framework', () => {
    const dbConnection = new DatabaseConnection();
    const repository = new Repository(dbConnection);
    const testResultsCollector = TestResultsCollector.getInstance();
    const htmlReportGenerator = new HtmlReportGeneratorV2();
    const anomalyReport = new AnomalyReport();

    test.beforeAll(async () => {
        await dbConnection.connect();
    });

    test.afterAll(async () => {
        await dbConnection.disconnect();
    });

    test('Validate Patients: Schema, Mandatory Fields & Domain Rules', async () => {
        await runValidationTest({
            suite: 'baseline-comparison',
            testName: 'Validate Patients: Schema, Mandatory Fields & Domain Rules',
            collector: testResultsCollector,
            executor: async (steps) => {
                const sourcePatients = await loadSourceData(repository, 'patients');
                const targetPatients = await loadTargetData(repository, 'patients');

                const validator = new PatientsValidator();
                const anomalies = validator.validate(sourcePatients, targetPatients);

                const context: ValidationContext = {
                    table: 'Patients',
                    sourceData: sourcePatients,
                    targetData: targetPatients,
                    anomalies,
                    timestamp: new Date().toISOString()
                };
                htmlReportGenerator.addValidationContext(context);
                ReportStateStore.appendValidationContext(context);
                anomalyReport.addAnomalies('Patients', anomalies);

                steps.push({
                    name: 'Validation summary',
                    status: anomalies.length === 0 ? 'pass' : 'fail',
                    log: formatAnomalySummary(anomalies),
                    timestamp: new Date().toISOString()
                });

                expect(anomalies.length).toBeGreaterThan(0);
                expect(anomalies.some(a => a.rule.includes('schema mismatch'))).toBe(true);
                expect(anomalies.some(a => a.rule.includes('row count mismatch'))).toBe(true);
                expect(anomalies.some(a => a.rule.includes('validation failed'))).toBe(true);
            }
        });
    });

    test('Validate Providers: Schema & Data Consistency', async () => {
        await runValidationTest({
            suite: 'baseline-comparison',
            testName: 'Validate Providers: Schema & Data Consistency',
            collector: testResultsCollector,
            executor: async (steps) => {
                const sourceProviders = await loadSourceData(repository, 'providers');
                const targetProviders = await loadTargetData(repository, 'providers');

                const validator = new ProvidersValidator();
                const anomalies = validator.validate(sourceProviders, targetProviders);

                const context: ValidationContext = {
                    table: 'Providers',
                    sourceData: sourceProviders,
                    targetData: targetProviders,
                    anomalies,
                    timestamp: new Date().toISOString()
                };
                htmlReportGenerator.addValidationContext(context);
                ReportStateStore.appendValidationContext(context);
                anomalyReport.addAnomalies('Providers', anomalies);

                steps.push({
                    name: 'Validation summary',
                    status: anomalies.length === 0 ? 'pass' : 'fail',
                    log: formatAnomalySummary(anomalies),
                    timestamp: new Date().toISOString()
                });

                expect(anomalies.filter(a => a.severity === 'error').length).toBeLessThan(2);
            }
        });
    });

    test('Validate Visits: Dependencies & Referential Integrity', async () => {
        await runValidationTest({
            suite: 'baseline-comparison',
            testName: 'Validate Visits: Dependencies & Referential Integrity',
            collector: testResultsCollector,
            executor: async (steps) => {
                const sourceVisits = await loadSourceData(repository, 'visits');
                const targetVisits = await loadTargetData(repository, 'visits');
                const patients = await loadSourceData(repository, 'patients');
                const providers = await loadSourceData(repository, 'providers');

                const validator = new VisitsValidator();
                const dependencyData = { patients, providers };
                const anomalies = validator.validate(sourceVisits, targetVisits, dependencyData);

                const context: ValidationContext = {
                    table: 'Visits',
                    sourceData: sourceVisits,
                    targetData: targetVisits,
                    anomalies,
                    timestamp: new Date().toISOString()
                };
                htmlReportGenerator.addValidationContext(context);
                ReportStateStore.appendValidationContext(context);
                anomalyReport.addAnomalies('Visits', anomalies);

                steps.push({
                    name: 'Validation summary',
                    status: anomalies.length === 0 ? 'pass' : 'fail',
                    log: formatAnomalySummary(anomalies),
                    timestamp: new Date().toISOString()
                });

                expect(anomalies.some(a => a.rule.includes('does not exist in patients'))).toBe(true);
                expect(anomalies.some(a => a.rule.includes('does not exist in providers'))).toBe(true);
            }
        });
    });

    test('Validate Medications: Dependencies & Data Quality', async () => {
        await runValidationTest({
            suite: 'baseline-comparison',
            testName: 'Validate Medications: Dependencies & Data Quality',
            collector: testResultsCollector,
            executor: async (steps) => {
                const sourceMedications = await loadSourceData(repository, 'medications');
                const targetMedications = await loadTargetData(repository, 'medications');
                const patients = await loadSourceData(repository, 'patients');

                const validator = new MedicationsValidator();
                const dependencyData = { patients };
                const anomalies = validator.validate(sourceMedications, targetMedications, dependencyData);

                const context: ValidationContext = {
                    table: 'Medications',
                    sourceData: sourceMedications,
                    targetData: targetMedications,
                    anomalies,
                    timestamp: new Date().toISOString()
                };
                htmlReportGenerator.addValidationContext(context);
                ReportStateStore.appendValidationContext(context);
                anomalyReport.addAnomalies('Medications', anomalies);

                steps.push({
                    name: 'Validation summary',
                    status: anomalies.length === 0 ? 'pass' : 'fail',
                    log: formatAnomalySummary(anomalies),
                    timestamp: new Date().toISOString()
                });

                expect(anomalies.some(a => a.rule.includes('does not exist in patients'))).toBe(true);
            }
        });
    });

    test('Validate Billing: Dependencies, Amount Validation & Schema', async () => {
        await runValidationTest({
            suite: 'baseline-comparison',
            testName: 'Validate Billing: Dependencies, Amount Validation & Schema',
            collector: testResultsCollector,
            executor: async (steps) => {
                const sourceBilling = await loadSourceData(repository, 'billing');
                const targetBilling = await loadTargetData(repository, 'billing');
                const visits = await loadSourceData(repository, 'visits');

                const validator = new BillingValidator();
                const dependencyData = { visits };
                const anomalies = validator.validate(sourceBilling, targetBilling, dependencyData);

                const context: ValidationContext = {
                    table: 'Billing',
                    sourceData: sourceBilling,
                    targetData: targetBilling,
                    anomalies,
                    timestamp: new Date().toISOString()
                };
                htmlReportGenerator.addValidationContext(context);
                ReportStateStore.appendValidationContext(context);
                anomalyReport.addAnomalies('Billing', anomalies);

                steps.push({
                    name: 'Validation summary',
                    status: anomalies.length === 0 ? 'pass' : 'fail',
                    log: formatAnomalySummary(anomalies),
                    timestamp: new Date().toISOString()
                });

                expect(anomalies.some(a => a.rule.includes('schema mismatch'))).toBe(true);
                expect(anomalies.some(a => a.rule.includes('does not exist in visits'))).toBe(true);
                expect(anomalies.some(a => a.rule.includes('validation failed for amount'))).toBe(true);
            }
        });
    });

    test('Partitioned Comparison: Validate Data by Date Ranges', async () => {
        const sourceVisits = await loadSourceData(repository, 'visits');
        const targetVisits = await loadTargetData(repository, 'visits');

        // Partition by visit_date
        const sourcePartitions = partitionByDate(sourceVisits, 'visit_date');
        const targetPartitions = partitionByDate(targetVisits, 'visit_date');

        let totalAnomalies = 0;
        for (const month of Object.keys(sourcePartitions)) {
            const sourcePartition = sourcePartitions[month] || [];
            const targetPartition = targetPartitions[month] || [];

            if (sourcePartition.length !== targetPartition.length) {
                totalAnomalies++;
                console.log(`Partition ${month}: Count mismatch - Source: ${sourcePartition.length}, Target: ${targetPartition.length}`);
            }
        }

        expect(totalAnomalies).toBeGreaterThan(0); // Should detect partitioning differences
    });

    test('Sampling Strategy: Critical Fields Validation', async () => {
        const sourceBilling = await loadSourceData(repository, 'billing');
        const targetBilling = await loadTargetData(repository, 'billing');

        // Sample 20% of records for detailed validation
        const sampleSize = Math.ceil(sourceBilling.length * 0.2);
        const sourceSample = sampleData(sourceBilling, sampleSize);
        const targetSample = sampleData(targetBilling, sampleSize);

        const validator = new BillingValidator();
        const anomalies = validator.validate(sourceSample, targetSample);

        // Should still detect issues even with sampling
        expect(anomalies.length).toBeGreaterThan(0);
    });

    test('Automated Diff Detection: Missing & Extra Records', async () => {
        const sourcePatients = await loadSourceData(repository, 'patients');
        const targetPatients = await loadTargetData(repository, 'patients');

        const validator = new PatientsValidator();
        const anomalies = validator.validate(sourcePatients, targetPatients);

        // Should detect missing and extra records
        const missingRecords = anomalies.filter(a => a.rule.includes('missing in target'));
        const extraRecords = anomalies.filter(a => a.rule.includes('missing in source'));

        expect(missingRecords.length).toBeGreaterThan(0);
        expect(extraRecords.length).toBeGreaterThan(0);
    });

    test('Performance: Validate large visits dataset', async () => {
        await runValidationTest({
            suite: 'baseline-comparison',
            testName: 'Performance: Validate large visits dataset',
            collector: testResultsCollector,
            executor: async (steps) => {
                const startTime = Date.now();
                const visits = await loadSourceData(repository, 'visits');
                const targetVisits = await loadTargetData(repository, 'visits');

                const validator = new VisitsValidator();
                const anomalies = validator.validate(visits, targetVisits);
                const duration = Date.now() - startTime;

                console.log(`✅ Visits: Validated ${visits.length} records in ${duration}ms`);
                console.log(`   - Anomalies: ${anomalies.length}`);

                steps.push({
                    name: 'Performance summary',
                    status: 'pass',
                    log: `Validated ${visits.length} records in ${duration}ms with ${anomalies.length} anomalies`,
                    timestamp: new Date().toISOString()
                });

                expect(duration).toBeLessThan(5000);
                expect(visits.length).toBeGreaterThan(0);
            }
        });
    });

   

    // ------- MISSED/INCOMPLETE DATA DETECTION -------

    test('Data Completeness: Detect missed patient records', async () => {
        await runValidationTest({
            suite: 'baseline-comparison',
            testName: 'Data Completeness: Detect missed patient records',
            collector: testResultsCollector,
            executor: async (steps) => {
                const sourcePatients = await loadSourceData(repository, 'patients');
                const targetPatients = await loadTargetData(repository, 'patients');

                const sourceIds = new Set(sourcePatients.map(p => p.patient_id));
                const targetIds = new Set(targetPatients.map(p => p.patient_id));
                const missedIds = Array.from(sourceIds).filter(id => !targetIds.has(id));

                if (missedIds.length > 0) {
                    console.log(`⚠️ Patients: ${missedIds.length} records missed in target`);
                    console.log(`   Missed IDs: ${missedIds.join(', ')}`);
                }

                steps.push({
                    name: 'Completeness summary',
                    status: missedIds.length === 0 ? 'pass' : 'fail',
                    log: missedIds.length === 0 ? 'No missed patient records detected' : `Detected ${missedIds.length} missed patient records`,
                    timestamp: new Date().toISOString()
                });

                expect(missedIds.length).toBe(0);
            }
        });
    });

    test('Data Completeness: Detect incomplete field values', async () => {
        await runValidationTest({
            suite: 'baseline-comparison',
            testName: 'Data Completeness: Detect incomplete field values',
            collector: testResultsCollector,
            executor: async (steps) => {
                const patients = await loadSourceData(repository, 'patients');
                const incompleteRecords = patients.filter(p =>
                    !p.patient_id || !p.name || !p.dob || !p.gender ||
                    p.name === '' || p.dob === '' || p.gender === ''
                );

                if (incompleteRecords.length > 0) {
                    console.log(`⚠️ Patients: ${incompleteRecords.length} records with incomplete/empty fields`);
                    incompleteRecords.slice(0, 3).forEach(r => {
                        console.log(`   ID ${r.patient_id}: name="${r.name}", dob="${r.dob}", gender="${r.gender}"`);
                    });
                }

                steps.push({
                    name: 'Incomplete field summary',
                    status: incompleteRecords.length === 0 ? 'pass' : 'fail',
                    log: incompleteRecords.length === 0 ? 'No incomplete field values detected' : `Detected ${incompleteRecords.length} incomplete records`,
                    timestamp: new Date().toISOString()
                });

                expect(incompleteRecords.length).toBe(0);
            }
        });
    });

    test('Summary Statistics: Data volume across tables', async () => {
        await runValidationTest({
            suite: 'baseline-comparison',
            testName: 'Summary Statistics: Data volume across tables',
            collector: testResultsCollector,
            executor: async (steps) => {
                const tables = ['patients', 'providers', 'visits', 'medications', 'billing'];
                const stats: Record<string, { source: number; target: number; match: number }> = {};

                for (const table of tables) {
                    const sourceData = await loadSourceData(repository, table);
                    const targetData = await loadTargetData(repository, table);

                    const sourceIds = new Set(sourceData.map(r => r[getPrimaryKey(table)]));
                    const targetIds = new Set(targetData.map(r => r[getPrimaryKey(table)]));
                    const matchCount = Array.from(sourceIds).filter(id => targetIds.has(id)).length;

                    stats[table] = {
                        source: sourceData.length,
                        target: targetData.length,
                        match: matchCount
                    };
                }

                console.log('\n📊 Data Volume Summary:');
                Object.entries(stats).forEach(([table, data]) => {
                    const matchRate = ((data.match / data.source) * 100).toFixed(1);
                    console.log(`   ${table}: source=${data.source}, target=${data.target}, match=${data.match} (${matchRate}%)`);
                });

                Object.values(stats).forEach(data => {
                    expect(data.match).toBe(data.source);
                });

                steps.push({
                    name: 'Volume summary',
                    status: 'pass',
                    log: 'All source records matched in target across tables',
                    timestamp: new Date().toISOString()
                });
            }
        });
    });

    test('Schema Consistency: Source and target fields should align', async () => {
        await runValidationTest({
            suite: 'baseline-comparison',
            testName: 'Schema Consistency: Source and target fields should align',
            collector: testResultsCollector,
            executor: async (steps) => {
                const tables = ['patients', 'providers', 'visits', 'medications', 'billing'];
                const mismatches: string[] = [];

                for (const table of tables) {
                    const sourceData = await loadSourceData(repository, table);
                    const targetData = await loadTargetData(repository, table);

                    const sourceFields = sourceData.length ? Object.keys(sourceData[0]).sort() : [];
                    const targetFields = targetData.length ? Object.keys(targetData[0]).sort() : [];

                    if (JSON.stringify(sourceFields) !== JSON.stringify(targetFields)) {
                        mismatches.push(`${table}: source=[${sourceFields.join(', ')}], target=[${targetFields.join(', ')}]`);
                    }
                }

                if (mismatches.length > 0) {
                    console.warn('Schema mismatches detected:');
                    mismatches.forEach(message => console.warn(`  ${message}`));
                }

                steps.push({
                    name: 'Schema summary',
                    status: mismatches.length === 0 ? 'pass' : 'fail',
                    log: mismatches.length === 0 ? 'All table schemas aligned' : `Detected schema mismatches in ${mismatches.length} table(s)`,
                    timestamp: new Date().toISOString()
                });

                expect(mismatches.length).toBe(0);
            }
        });
    });
});



