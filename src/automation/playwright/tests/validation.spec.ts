import { test, expect } from '@playwright/test';
import { DatabaseConnection } from '../../../db/connection';
import { Repository } from '../../../db/repository';
import { PatientsValidator } from '../../../validators/patientsValidator';
import { ProvidersValidator } from '../../../validators/providersValidator';
import { VisitsValidator } from '../../../validators/visitsValidator';
import { MedicationsValidator } from '../../../validators/medicationsValidator';
import { BillingValidator } from '../../../validators/billingValidator';
import { AnomalyReport } from '../../../reporters/anomalyReport';
import { Config } from '../../../config';

const dbConnection = new DatabaseConnection();
const repository = new Repository(dbConnection);
const anomalyReport = new AnomalyReport();

test.beforeAll(async () => {
    if (!Config.isDemoMode) {
        await dbConnection.connect();
    }
});

test.afterAll(async () => {
    if (!Config.isDemoMode) {
        await dbConnection.disconnect();
    }
    console.log(anomalyReport.generateReport());
});

test('Validate Patients table', async () => {
    const sourcePatients = await repository.fetchSourceData('patients');
    const targetPatients = await repository.fetchTargetData('patients');
    const patientsValidator = new PatientsValidator();

    const anomalies = patientsValidator.validate(sourcePatients, targetPatients);
    expect(anomalies.length).toBe(0); // Ensure no anomalies in demo or real data
    anomalyReport.addAnomalies('Patients', anomalies);
});

test('Validate Providers table', async () => {
    const sourceProviders = await repository.fetchSourceData('providers');
    const targetProviders = await repository.fetchTargetData('providers');
    const providersValidator = new ProvidersValidator();

    const anomalies = providersValidator.validate(sourceProviders, targetProviders);
    expect(anomalies.length).toBe(0);
    anomalyReport.addAnomalies('Providers', anomalies);
});

test('Validate Visits table', async () => {
    const sourceVisits = await repository.fetchSourceData('visits');
    const targetVisits = await repository.fetchTargetData('visits');
    const visitsValidator = new VisitsValidator();

    const anomalies = visitsValidator.validate(sourceVisits, targetVisits);
    expect(anomalies.length).toBe(0);
    anomalyReport.addAnomalies('Visits', anomalies);
});

test('Validate Medications table', async () => {
    const sourceMedications = await repository.fetchSourceData('medications');
    const targetMedications = await repository.fetchTargetData('medications');
    const medicationsValidator = new MedicationsValidator();

    const anomalies = medicationsValidator.validate(sourceMedications, targetMedications);
    expect(anomalies.length).toBe(0);
    anomalyReport.addAnomalies('Medications', anomalies);
});

test('Validate Billing table', async () => {
    const sourceBilling = await repository.fetchSourceData('billing');
    const targetBilling = await repository.fetchTargetData('billing');
    const billingValidator = new BillingValidator();

    const anomalies = billingValidator.validate(sourceBilling, targetBilling);
    expect(anomalies.length).toBe(0);
    anomalyReport.addAnomalies('Billing', anomalies);
});