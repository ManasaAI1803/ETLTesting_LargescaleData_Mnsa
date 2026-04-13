import { test, expect } from '@playwright/test';
import { DatabaseConnection } from '../../src/db/connection';
import { Repository } from '../../src/db/repository';
import { AnomalyReport } from '../../src/reporters/anomalyReport';
import { HtmlReportGeneratorV2, ValidationContext } from '../../src/reporters/htmlReportGenerator_v2';
import { ReportStateStore } from '../../src/reporters/reportStateStore';
import { TestResultsCollector } from '../../src/reporters/testResultsCollector';
import { loadSourceData, loadTargetData } from '../../utils/dataLoader';
import { applyBusinessRule, formatAnomalySummary } from '../../utils/validationRules';
import { summarizeError } from '../../utils/errorFormatting';
import { PatientsValidator } from '../../src/validators/patientsValidator';
import { ProvidersValidator } from '../../src/validators/providersValidator';
import { VisitsValidator } from '../../src/validators/visitsValidator';
import { MedicationsValidator } from '../../src/validators/medicationsValidator';
import { BillingValidator } from '../../src/validators/billingValidator';
import { QueryStore } from '../../src/queryStore';

const dbConnection = new DatabaseConnection();
const repository = new Repository(dbConnection);
const anomalyReport = new AnomalyReport();
const queryStore = QueryStore.getInstance();
const htmlReportGenerator = new HtmlReportGeneratorV2();
const testResultsCollector = TestResultsCollector.getInstance();

test.beforeAll(async () => {
    console.log('[Test Suite] Initializing in DEMO MODE ONLY');
    await dbConnection.connect();
});

test.afterAll(async () => {
    await dbConnection.disconnect();
    console.log('\n========== Query Capture Report ==========');
    console.log(queryStore.generateReport());
    console.log('\n========== Validation Report ==========');
    console.log(anomalyReport.generateReport());
});

test.only('Validate Patients Data - Mandatory Fields & Consistency', async () => {
    const startTime = Date.now();
    const steps: any[] = [];
    
    try {
        // Step 1: Fetch source data
        let stepStart = Date.now();
        const sourcePatients = await loadSourceData(repository, 'patients');
        //test fails If empty → test fails immediately
expect(sourcePatients.length, 'Source patients should not be empty').toBeGreaterThan(0);

        steps.push({
            name: 'Fetch source data',
            status: 'pass',
            log: `✅ Loaded ${sourcePatients.length} source records`,
            timestamp: new Date().toISOString()
        });      
        // Step 2: Fetch target data
        const targetPatients = await loadTargetData(repository, 'patients');
        expect(targetPatients.length, 'Target patients should not be empty').toBeGreaterThan(0);
        steps.push({
            name: 'Fetch target data',
            status: 'pass',
            log: `✅ Loaded ${targetPatients.length} target records`,
            timestamp: new Date().toISOString()
        });
        
        // Step 3: Run validation
        const patientsValidator = new PatientsValidator();
        const anomalies = patientsValidator.validate(sourcePatients, targetPatients);
        expect(anomalies.length, 'Expected no anomalies in patients validation').toBe(0);   
        const anomalyLog = formatAnomalySummary(anomalies);
        steps.push({
            name: 'Run validation',
            status: anomalies.length === 0 ? 'pass' : 'fail',
            log: anomalyLog,
            timestamp: new Date().toISOString()
        });
        
        // Step 4: Capture context
        const context: ValidationContext = {
            table: 'Patients',
            sourceData: sourcePatients,
            targetData: targetPatients,
            anomalies: anomalies,
            queries: {
                source: 'SELECT * FROM patients_source',
                target: 'SELECT * FROM patients_target'
            },
            timestamp: new Date().toISOString()
        };
        htmlReportGenerator.addValidationContext(context);
        ReportStateStore.appendValidationContext(context);
        anomalyReport.addAnomalies('Patients', anomalies);
        steps.push({
            name: 'Capture results',
            status: 'pass',
            log: `✅ Context captured for report`,
            timestamp: new Date().toISOString()
        });
        
        const duration = Date.now() - startTime;
        testResultsCollector.addResult({
            suite: 'Mandatoryfields',
            test: 'Validate Patients Data - Mandatory Fields & Consistency',
            status: anomalies.length === 0 ? 'pass' : 'fail',
            duration,
            steps,


            businessRulesApplied: [applyBusinessRule('Validate Patients Data - Mandatory Fields & Consistency', anomalies)],
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        steps.push({
            name: 'Error',
            status: 'fail',
            log: `❌ ${summarizeError(error)}`,
            timestamp: new Date().toISOString()
        });
        
        const duration = Date.now() - startTime;
        testResultsCollector.addResult({
            suite: 'Mandatoryfields',
            test: 'Validate Patients Data - Mandatory Fields & Consistency',
            status: 'fail',
            duration,
            details: error,
            steps,
            timestamp: new Date().toISOString()
        });
        throw error;
    }
});

test('Validate Visits Data - Mandatory Fields & Negative Patterns', async () => {
    const startTime = Date.now();
    const steps: any[] = [];
    try {
        const sourceVisits = await loadSourceData(repository, 'visits');
        expect(sourceVisits.length).toBeGreaterThan(0);
        steps.push({ name: 'Fetch source data', status: 'pass', log: `✅ Loaded ${sourceVisits.length} source records`, timestamp: new Date().toISOString() });
        
        const targetVisits = await loadTargetData(repository, 'visits');
        expect(targetVisits.length).toBeGreaterThan(0);
        steps.push({ name: 'Fetch target data', status: 'pass', log: `✅ Loaded ${targetVisits.length} target records`, timestamp: new Date().toISOString() });
        
        const visitsValidator = new VisitsValidator();
        const anomalies = visitsValidator.validate(sourceVisits, targetVisits);
        expect(anomalies.length).toBe(0);
        const anomalyLog = formatAnomalySummary(anomalies);
        steps.push({ name: 'Run validation', status: anomalies.length === 0 ? 'pass' : 'fail', log: anomalyLog, timestamp: new Date().toISOString() });
        
        const context: ValidationContext = { table: 'Visits', sourceData: sourceVisits, targetData: targetVisits, anomalies: anomalies, timestamp: new Date().toISOString() };
        htmlReportGenerator.addValidationContext(context);
        ReportStateStore.appendValidationContext(context);
        anomalyReport.addAnomalies('Visits', anomalies);
        steps.push({ name: 'Capture results', status: 'pass', log: `✅ Context captured`, timestamp: new Date().toISOString() });
        
        const duration = Date.now() - startTime;
        testResultsCollector.addResult({ suite: 'automation', test: 'Validate Visits Data - Mandatory Fields & Negative Patterns', status: anomalies.length === 0 ? 'pass' : 'fail', duration, steps, timestamp: new Date().toISOString() });
    } catch (error) {
        steps.push({ name: 'Error', status: 'fail', log: `❌ ${summarizeError(error)}`, timestamp: new Date().toISOString() });
        const duration = Date.now() - startTime;
        testResultsCollector.addResult({ suite: 'automation', test: 'Validate Visits Data - Mandatory Fields & Negative Patterns', status: 'fail', duration, details: error, steps, timestamp: new Date().toISOString() });
        throw error;
    }
});

test('Validate Billing Data - Mandatory Fields & Amount Validation', async () => {
    const startTime = Date.now();
    const steps: any[] = [];
    try {
        const sourceBilling = await loadSourceData(repository, 'billing');
        expect(sourceBilling.length).toBeGreaterThan(0);
        steps.push({ name: 'Fetch source data', status: 'pass', log: `✅ Loaded ${sourceBilling.length} source records`, timestamp: new Date().toISOString() });
        
        const targetBilling = await loadTargetData(repository, 'billing');
        expect(targetBilling.length).toBeGreaterThan(0);
        steps.push({ name: 'Fetch target data', status: 'pass', log: `✅ Loaded ${targetBilling.length} target records`, timestamp: new Date().toISOString() });
        
        const billingValidator = new BillingValidator();
        const anomalies = billingValidator.validate(sourceBilling, targetBilling);
        expect(anomalies.length).toBe(0);
        const anomalyLog = formatAnomalySummary(anomalies);
        steps.push({ name: 'Run validation', status: anomalies.length === 0 ? 'pass' : 'fail', log: anomalyLog, timestamp: new Date().toISOString() });
        
        const context: ValidationContext = { table: 'Billing', sourceData: sourceBilling, targetData: targetBilling, anomalies: anomalies, timestamp: new Date().toISOString() };
        htmlReportGenerator.addValidationContext(context);
        ReportStateStore.appendValidationContext(context);
        anomalyReport.addAnomalies('Billing', anomalies);
        steps.push({ name: 'Capture results', status: 'pass', log: `✅ Context captured`, timestamp: new Date().toISOString() });
        
        const duration = Date.now() - startTime;
        testResultsCollector.addResult({ suite: 'automation', test: 'Validate Billing Data - Mandatory Fields & Amount Validation', status: anomalies.length === 0 ? 'pass' : 'fail', duration, steps, timestamp: new Date().toISOString() });
    } catch (error) {
        steps.push({ name: 'Error', status: 'fail', log: `❌ ${summarizeError(error)}`, timestamp: new Date().toISOString() });
        const duration = Date.now() - startTime;
        testResultsCollector.addResult({ suite: 'automation', test: 'Validate Billing Data - Mandatory Fields & Amount Validation', status: 'fail', duration, details: error, steps, timestamp: new Date().toISOString() });
        throw error;
    }
});

test('Validate Patients Data - Negative Case', async () => {
    const startTime = Date.now();
    const steps: any[] = [];
    try {
        const invalidSourcePatients = [
            { id: 1, name: '', dob: 'invalid', gender: 'X' },
            { id: 2, name: 'Patient 2', dob: '1990-01-01', gender: 'M' },
            { id: 3, name: 'Patient 3', dob: '1990-01-01', gender: 'M' },
        ];
        const invalidTargetPatients = [
            { id: 1, name: 'Patient 1', dob: '1990-01-01', gender: 'M' },
            { id: 2, name: 'Patient 2', dob: '1990-01-01', gender: 'M' },
        ];
        steps.push({ name: 'Load invalid test data', status: 'pass', log: `Loaded 3 source + 2 target (record ID 3 missing)`, timestamp: new Date().toISOString() });
        
        const patientsValidator = new PatientsValidator();
        const anomalies = patientsValidator.validate(invalidSourcePatients, invalidTargetPatients);
        
        // Stricter test: expect AT LEAST 2 anomalies marked as "critical"
        const criticalAnomalies = anomalies.filter(a => a.rule.includes('Missing') || a.rule.includes('Mismatch'));
        steps.push({ name: 'Find critical issues', status: 'pass', log: `Found ${criticalAnomalies.length} critical anomalies`, timestamp: new Date().toISOString() });
        expect(criticalAnomalies.length).toBeGreaterThanOrEqual(2);
        
        anomalyReport.addAnomalies('Patients Negative', anomalies);
        steps.push({ name: 'Record audit', status: 'pass', log: `Documented`, timestamp: new Date().toISOString() });
        
        const duration = Date.now() - startTime;
        testResultsCollector.addResult({ suite: 'automation', test: 'Validate Patients Data - Negative Case', status: 'pass', duration, steps, timestamp: new Date().toISOString() });
    } catch (error) {
        steps.push({ name: 'Validation error', status: 'fail', log: `${summarizeError(error)}`, timestamp: new Date().toISOString() });
        const duration = Date.now() - startTime;
        testResultsCollector.addResult({ suite: 'automation', test: 'Validate Patients Data - Negative Case', status: 'fail', duration, details: error, steps, timestamp: new Date().toISOString() });
        throw error;
    }
});

test('Validate Providers Data - Negative Case', async () => {
    const startTime = Date.now();
    const steps: any[] = [];
    try {
        const invalidSourceProviders = [
            { id: 1, name: '', specialty: '' },
            { id: 2, name: 'Dr. Smith', specialty: 'Cardiology' },
        ];
        const invalidTargetProviders = [
            { id: 1, name: 'Dr. Smith', specialty: 'Cardiology' },
        ];
        steps.push({ name: 'Load invalid test data', status: 'pass', log: `2 source + 1 target (record 2 missing)`, timestamp: new Date().toISOString() });
        
        const providersValidator = new ProvidersValidator();
        const anomalies = providersValidator.validate(invalidSourceProviders, invalidTargetProviders);
        
        expect(anomalies.length).toBeGreaterThanOrEqual(1);
        steps.push({ name: 'Detect issues', status: 'pass', log: `Found ${anomalies.length} anomalies`, timestamp: new Date().toISOString() });
        
        anomalyReport.addAnomalies('Providers Negative', anomalies);
        steps.push({ name: 'Record audit', status: 'pass', log: `Documented`, timestamp: new Date().toISOString() });
        
        const duration = Date.now() - startTime;
        testResultsCollector.addResult({ suite: 'automation', test: 'Validate Providers Data - Negative Case', status: 'pass', duration, steps, timestamp: new Date().toISOString() });
    } catch (error) {
        steps.push({ name: 'Validation error', status: 'fail', log: `${summarizeError(error)}`, timestamp: new Date().toISOString() });
        const duration = Date.now() - startTime;
        testResultsCollector.addResult({ suite: 'automation', test: 'Validate Providers Data - Negative Case', status: 'fail', duration, details: error, steps, timestamp: new Date().toISOString() });
        throw error;
    }
});

test('Validate Medications Data - Negative Case', async () => {
    const startTime = Date.now();
    const steps: any[] = [];
    try {
        const invalidSourceMedications = [
            { id: 1, name: '', dosage: '' },
            { id: 2, name: 'Aspirin', dosage: '100mg' },
        ];
        const invalidTargetMedications = [
            { id: 1, name: 'Aspirin', dosage: '100mg' },
        ];
        steps.push({ name: 'Load invalid test data', status: 'pass', log: `2 source + 1 target (record 2 missing)`, timestamp: new Date().toISOString() });
        
        const medicationsValidator = new MedicationsValidator();
        const anomalies = medicationsValidator.validate(invalidSourceMedications, invalidTargetMedications);
        
        expect(anomalies.length).toBeGreaterThanOrEqual(1);
        steps.push({ name: 'Detect issues', status: 'pass', log: `Found ${anomalies.length} anomalies`, timestamp: new Date().toISOString() });
        
        anomalyReport.addAnomalies('Medications Negative', anomalies);
        steps.push({ name: 'Record audit', status: 'pass', log: `Documented`, timestamp: new Date().toISOString() });
        
        const duration = Date.now() - startTime;
        testResultsCollector.addResult({ suite: 'automation', test: 'Validate Medications Data - Negative Case', status: 'pass', duration, steps, timestamp: new Date().toISOString() });
    } catch (error) {
        steps.push({ name: 'Validation error', status: 'fail', log: `${summarizeError(error)}`, timestamp: new Date().toISOString() });
        const duration = Date.now() - startTime;
        testResultsCollector.addResult({ suite: 'automation', test: 'Validate Medications Data - Negative Case', status: 'fail', duration, details: error, steps, timestamp: new Date().toISOString() });
        throw error;
    }
});
