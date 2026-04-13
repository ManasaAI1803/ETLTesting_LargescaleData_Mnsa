import { test, expect } from '@playwright/test';
import { DatabaseConnection } from '../db/connection';
import { Repository } from '../db/repository';
import { AnomalyReport } from '../reporters/anomalyReport';
import { PatientsValidator } from '../validators/patientsValidator';
import { ProvidersValidator } from '../validators/providersValidator';
import { VisitsValidator } from '../validators/visitsValidator';
import { MedicationsValidator } from '../validators/medicationsValidator';
import { BillingValidator } from '../validators/billingValidator';

const dbConnection = new DatabaseConnection();
const repository = new Repository(dbConnection);
const anomalyReport = new AnomalyReport();

const validators = {
    patients: new PatientsValidator(),
    providers: new ProvidersValidator(),
    visits: new VisitsValidator(),
    medications: new MedicationsValidator(),
    billing: new BillingValidator(),
};

test.beforeAll(async () => {
    await dbConnection.connect();
});

test.afterAll(async () => {
    await dbConnection.disconnect();
});

// Add test cases for validation here using the validators and anomalyReport as needed.