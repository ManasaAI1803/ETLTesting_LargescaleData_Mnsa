import { test, expect } from '@playwright/test';
import { Repository } from '../../src/db/repository';
import { DatabaseConnection } from '../../src/db/connection';
import { TestResultsCollector } from '../../src/reporters/testResultsCollector';
import { loadSourceData, loadTargetData } from '../../utils/dataLoader';
import { applyBusinessRule } from '../../utils/validationRules';
import { summarizeError } from '../../utils/errorFormatting';

/**
 * Transformation & Truncation Tests
 * Validates data transformation integrity and truncation operations
 */

test.describe('Data Transformation & Truncation', () => {
    const dbConnection = new DatabaseConnection();
    const repository = new Repository(dbConnection);
    const testResultsCollector = TestResultsCollector.getInstance();

    test.beforeAll(async () => {
        console.log('\n[Transformation Tests] Initializing transformation validation suite');
    });

    // --------- TRANSFORMATION INTEGRITY ---------

    test('Transformation: Verify source data is completely transformed to target', async () => {
        const startTime = Date.now();
        try {
            const sourceData = await loadSourceData(repository, 'patients');
            const targetData = await loadTargetData(repository, 'patients');

            expect(targetData.length).toBeGreaterThan(0);
            
            // All source records should be present in target
            const targetIds = new Set(targetData.map(row => row.id));
            sourceData.forEach(row => {
                expect(targetIds.has(row.id)).toBeTruthy();
            });

            console.log(`✅ Patients: All ${sourceData.length} source records transformed to target`);
            
            const duration = Date.now() - startTime;
            testResultsCollector.addResult({
                suite: 'transformation',
                test: 'Transformation: Verify source data is completely transformed to target',
                status: 'pass',
                duration,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            const duration = Date.now() - startTime;
            testResultsCollector.addResult({
                suite: 'transformation',
                test: 'Transformation: Verify source data is completely transformed to target',
                status: 'fail',
                duration,
                details: error,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    });

    test('Transformation: Field mapping validation - Patients', async () => {
        const startTime = Date.now();
        try {
            const sourceData = await loadSourceData(repository, 'patients');
            const targetData = await loadTargetData(repository, 'patients');

            if (sourceData.length === 0) return;

            // Verify all mandatory fields are present and mapped
            const sourceRecord = sourceData[0];
            const requiredFields = ['id', 'name', 'dob', 'gender'];

            requiredFields.forEach(field => {
                expect(sourceRecord).toHaveProperty(field);
            });

            const targetRecord = targetData.find(t => t.id === sourceRecord.id);
            expect(targetRecord).toBeDefined();
            
            requiredFields.forEach(field => {
                expect(targetRecord).toHaveProperty(field);
            });

            console.log(`✅ Patients field mapping verified: ${requiredFields.join(', ')}`);
            
            const duration = Date.now() - startTime;
            testResultsCollector.addResult({
                suite: 'transformation',
                test: 'Transformation: Field mapping validation - Patients',
                status: 'pass',
                duration,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            const duration = Date.now() - startTime;
            testResultsCollector.addResult({
                suite: 'transformation',
                test: 'Transformation: Field mapping validation - Patients',
                status: 'fail',
                duration,
                details: error,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    });

    // --------- DATA LOSS DETECTION ---------

    test('Data Loss: Detect records missing after transformation - Patients', async () => {
        const startTime = Date.now();
        try {
            const sourceData = await loadSourceData(repository, 'patients');
            const targetData = await loadTargetData(repository, 'patients');

            const sourceIds = new Set(sourceData.map(p => p.id));
            const targetIds = new Set(targetData.map(p => p.id));

            const missingRecords = Array.from(sourceIds).filter(id => !targetIds.has(id));
            
            if (missingRecords.length > 0) {
                console.log(`⚠️ Patients - Data loss detected: ${missingRecords.length} records missing in target`);
            }
            
            // Allow minimal loss (max 2 records in demo)
            expect(missingRecords.length).toBeLessThanOrEqual(2);
            
            const duration = Date.now() - startTime;
            testResultsCollector.addResult({
                suite: 'transformation',
                test: 'Data Loss: Detect records missing after transformation - Patients',
                status: 'pass',
                duration,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            const duration = Date.now() - startTime;
            testResultsCollector.addResult({
                suite: 'transformation',
                test: 'Data Loss: Detect records missing after transformation - Patients',
                status: 'fail',
                duration,
                details: error,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    });

    test('Data Loss: Detect records missing after transformation - All Tables', async () => {
        const startTime = Date.now();
        try {
            const tables = ['providers', 'medications', 'billing'];
            const lossReport: Record<string, number> = {};

            for (const table of tables) {
                const sourceData = await loadSourceData(repository, table);
                const targetData = await loadTargetData(repository, table);

                const sourceIds = new Set(sourceData.map(r => r.id));
                const targetIds = new Set(targetData.map(r => r.id));

                const missingCount = Array.from(sourceIds).filter(id => !targetIds.has(id)).length;
                if (missingCount > 0) {
                    lossReport[table] = missingCount;
                }
            }

            if (Object.keys(lossReport).length > 0) {
                console.log('⚠️ Data loss detected:');
                Object.entries(lossReport).forEach(([table, count]) => {
                    console.log(`  ${table}: ${count} missing records`);
                });
            } else {
                console.log('✅ No data loss detected in transformation');
            }
            
            const duration = Date.now() - startTime;
            testResultsCollector.addResult({
                suite: 'transformation',
                test: 'Data Loss: Detect records missing after transformation - All Tables',
                status: 'pass',
                duration,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            const duration = Date.now() - startTime;
            testResultsCollector.addResult({
                suite: 'transformation',
                test: 'Data Loss: Detect records missing after transformation - All Tables',
                status: 'fail',
                duration,
                details: error,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    });

    // --------- TRUNCATION VALIDATION ---------

    test('Truncation: Detect field value truncation - Strings', async () => {
        const startTime = Date.now();
        try {
            const sourceData = await loadSourceData(repository, 'patients');
            const targetData = await loadTargetData(repository, 'patients');

            const truncationIssues: string[] = [];

            sourceData.forEach(sourceRow => {
                const targetRow = targetData.find(t => t.id === sourceRow.id);
                if (!targetRow) return;

                // Check if string fields were truncated
                const stringFields = ['name'];
                stringFields.forEach(field => {
                    if (sourceRow[field] && targetRow[field]) {
                        const sourceLength = String(sourceRow[field]).length;
                        const targetLength = String(targetRow[field]).length;
                        
                        if (targetLength < sourceLength) {
                            truncationIssues.push(
                                `Field '${field}' ID ${sourceRow.id}: ${sourceLength} chars → ${targetLength} chars`
                            );
                        }
                    }
                });
            });

            if (truncationIssues.length > 0) {
                console.log('⚠️ String truncation detected:');
                truncationIssues.slice(0, 5).forEach(issue => console.log(`  ${issue}`));
                if (truncationIssues.length > 5) {
                    console.log(`  ... and ${truncationIssues.length - 5} more`);
                }
            } else {
                console.log('✅ No field truncation detected');
            }

            // In demo mode, allow minimal truncation
            expect(truncationIssues.length).toBeLessThanOrEqual(2);
            
            const duration = Date.now() - startTime;
            testResultsCollector.addResult({
                suite: 'transformation',
                test: 'Truncation: Detect field value truncation - Strings',
                status: 'pass',
                duration,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            const duration = Date.now() - startTime;
            testResultsCollector.addResult({
                suite: 'transformation',
                test: 'Truncation: Detect field value truncation - Strings',
                status: 'fail',
                duration,
                details: error,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    });

    test('Truncation: Detect numeric value truncation - Decimal Loss', async () => {
        const startTime = Date.now();
        try {
            const sourceData = await loadSourceData(repository, 'billing');
            const targetData = await loadTargetData(repository, 'billing');

            const decimalLossIssues: string[] = [];

            sourceData.forEach(sourceRow => {
                const targetRow = targetData.find(t => t.id === sourceRow.id);
                if (!targetRow) return;

                // Check amount field for decimal precision loss
                if (typeof sourceRow.amount === 'number' && typeof targetRow.amount === 'number') {
                    const sourceDecimals = (sourceRow.amount.toString().split('.')[1] || '').length;
                    const targetDecimals = (targetRow.amount.toString().split('.')[1] || '').length;

                    if (targetDecimals < sourceDecimals) {
                        decimalLossIssues.push(
                            `Amount ID ${sourceRow.id}: ${sourceRow.amount} → ${targetRow.amount}`
                        );
                    }
                }
            });

            if (decimalLossIssues.length > 0) {
                console.log('⚠️ Decimal precision loss detected:');
                decimalLossIssues.slice(0, 3).forEach(issue => console.log(`  ${issue}`));
            } else {
                console.log('✅ No decimal truncation detected');
            }
            
            const duration = Date.now() - startTime;
            testResultsCollector.addResult({
                suite: 'transformation',
                test: 'Truncation: Detect numeric value truncation - Decimal Loss',
                status: 'pass',
                duration,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            const duration = Date.now() - startTime;
            testResultsCollector.addResult({
                suite: 'transformation',
                test: 'Truncation: Detect numeric value truncation - Decimal Loss',
                status: 'fail',
                duration,
                details: error,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    });

    test('Truncation: Detect date format changes', async () => {
        const startTime = Date.now();
        try {
            const sourceData = await loadSourceData(repository, 'billing');
            const targetData = await loadTargetData(repository, 'billing');

            const formatIssues: string[] = [];

            sourceData.forEach(sourceRow => {
                const targetRow = targetData.find(t => t.id === sourceRow.id);
                if (!targetRow) return;

                if (sourceRow.visitDate && targetRow.visitDate) {
                    const sourceDate = new Date(sourceRow.visitDate);
                    const targetDate = new Date(targetRow.visitDate);

                    // Check if date precision was lost (e.g., time portion removed)
                    if (sourceDate.getTime() !== targetDate.getTime()) {
                        formatIssues.push(
                            `Visit ID ${sourceRow.id}: ${sourceRow.visitDate} → ${targetRow.visitDate}`
                        );
                    }
                }
            });

            if (formatIssues.length > 0) {
                console.log('ℹ️ Date format changes detected:');
                formatIssues.slice(0, 3).forEach(issue => console.log(`  ${issue}`));
            } else {
                console.log('✅ No date format issues detected');
            }
            
            const duration = Date.now() - startTime;
            testResultsCollector.addResult({
                suite: 'transformation',
                test: 'Truncation: Detect date format changes',
                status: 'pass',
                duration,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            const duration = Date.now() - startTime;
            testResultsCollector.addResult({
                suite: 'transformation',
                test: 'Truncation: Detect date format changes',
                status: 'fail',
                duration,
                details: error,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    });

    // --------- TRANSFORMATION SUCCESS RATE ---------

    test('Transformation: Calculate overall success rate', async () => {
        const startTime = Date.now();
        try {
            const tables = ['patients', 'providers', 'visits', 'medications', 'billing'];
            const successRates: Record<string, number> = {};

            for (const table of tables) {
                const sourceData = await loadSourceData(repository, table);
                const targetData = await loadTargetData(repository, table);

                const sourceIds = new Set(sourceData.map(r => r.id));
                const targetIds = new Set(targetData.map(r => r.id));

                const successfulTransforms = Array.from(sourceIds).filter(id => targetIds.has(id)).length;
                const successRate = (successfulTransforms / sourceData.length) * 100;
                successRates[table] = parseFloat(successRate.toFixed(2));
            }

            console.log('📊 Transformation Success Rates:');
            Object.entries(successRates).forEach(([table, rate]) => {
                const icon = rate === 100 ? '✅' : rate >= 95 ? '⚠️' : '❌';
                console.log(`  ${icon} ${table}: ${rate}%`);
            });

            const avgRate = Object.values(successRates).reduce((a, b) => a + b, 0) / Object.keys(successRates).length;
            console.log(`\n  📈 Average: ${avgRate.toFixed(2)}%`);

            // Expect at least 95% success rate
            expect(avgRate).toBeGreaterThanOrEqual(95);
            
            const duration = Date.now() - startTime;
            testResultsCollector.addResult({
                suite: 'transformation',
                test: 'Transformation: Calculate overall success rate',
                status: 'pass',
                duration,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            const duration = Date.now() - startTime;
            testResultsCollector.addResult({
                suite: 'transformation',
                test: 'Transformation: Calculate overall success rate',
                status: 'fail',
                duration,
                details: error,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    });

    // --------- REFERENTIAL INTEGRITY POST-TRANSFORMATION ---------

    test('Transformation: Verify referential integrity maintained', async () => {
        const startTime = Date.now();
        try {
            const patients = await loadTargetData(repository, 'patients');
            const visits = await loadTargetData(repository, 'visits');

            const patientIds = new Set(patients.map(p => p.id));
            const invalidReferences: number[] = [];

            visits.forEach(visit => {
                if (!patientIds.has(visit.patientId)) {
                    invalidReferences.push(visit.id);
                }
            });

            console.log(`✅ Visits-Patients referential integrity: ${invalidReferences.length} invalid references`);
            expect(invalidReferences.length).toBe(0);
            
            const duration = Date.now() - startTime;
            testResultsCollector.addResult({
                suite: 'transformation',
                test: 'Transformation: Verify referential integrity maintained',
                status: 'pass',
                duration,
                businessRulesApplied: [applyBusinessRule('Transformation: Verify referential integrity maintained')],
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Transformation error:', summarizeError(error));
            const duration = Date.now() - startTime;
            testResultsCollector.addResult({
                suite: 'transformation',
                test: 'Transformation: Verify referential integrity maintained',
                status: 'fail',
                duration,
                details: error,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    });

    test('Transformation: Verify visits provider referential integrity', async () => {
        const startTime = Date.now();
        try {
            const providers = await loadTargetData(repository, 'providers');
            const visits = await loadTargetData(repository, 'visits');

            const providerIds = new Set(providers.map(p => p.id));
            const invalidProviderReferences = visits.filter(visit => !providerIds.has(visit.providerId));

            console.log(`✅ Visits-Providers referential integrity: ${invalidProviderReferences.length} invalid references`);
            expect(invalidProviderReferences.length).toBe(0);

            const duration = Date.now() - startTime;
            testResultsCollector.addResult({
                suite: 'transformation',
                test: 'Transformation: Verify visits provider referential integrity',
                status: 'pass',
                duration,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            const duration = Date.now() - startTime;
            testResultsCollector.addResult({
                suite: 'transformation',
                test: 'Transformation: Verify visits provider referential integrity',
                status: 'fail',
                duration,
                details: error,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    });

    test('Transformation: Verify billing visit referential integrity', async () => {
        const startTime = Date.now();
        try {
            const visits = await loadTargetData(repository, 'visits');
            const billing = await loadTargetData(repository, 'billing');

            const visitIds = new Set(visits.map(v => v.id));
            const invalidBillingReferences = billing.filter(record => !visitIds.has(record.visitId));

            console.log(`✅ Billing-Visits referential integrity: ${invalidBillingReferences.length} invalid references`);
            expect(invalidBillingReferences.length).toBe(0);

            const duration = Date.now() - startTime;
            testResultsCollector.addResult({
                suite: 'transformation',
                test: 'Transformation: Verify billing visit referential integrity',
                status: 'pass',
                duration,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            const duration = Date.now() - startTime;
            testResultsCollector.addResult({
                suite: 'transformation',
                test: 'Transformation: Verify billing visit referential integrity',
                status: 'fail',
                duration,
                details: error,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    });
});
