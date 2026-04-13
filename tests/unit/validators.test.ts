import { test, expect } from '@playwright/test';
import { PatientsValidator } from '../../src/validators/patientsValidator';
import { ProvidersValidator } from '../../src/validators/providersValidator';
import { VisitsValidator } from '../../src/validators/visitsValidator';
import { MedicationsValidator } from '../../src/validators/medicationsValidator';
import { BillingValidator } from '../../src/validators/billingValidator';

test.describe('Healthcare Data Validation Framework', () => {
    let patientsValidator: PatientsValidator;
    let providersValidator: ProvidersValidator;
    let visitsValidator: VisitsValidator;
    let medicationsValidator: MedicationsValidator;
    let billingValidator: BillingValidator;

    test.beforeEach(() => {
        patientsValidator = new PatientsValidator();
        providersValidator = new ProvidersValidator();
        visitsValidator = new VisitsValidator();
        medicationsValidator = new MedicationsValidator();
        billingValidator = new BillingValidator();
    });

    test('PatientsValidator should validate clean patient data successfully', () => {
        const sourcePatients = [
            { id: 1, name: 'Alice', dob: '1990-01-01', gender: 'F' },
            { id: 2, name: 'Bob', dob: '1985-05-12', gender: 'M' }
        ];

        const targetPatients = [
            { id: 1, name: 'Alice', dob: '1990-01-01', gender: 'F' },
            { id: 2, name: 'Bob', dob: '1985-05-12', gender: 'M' }
        ];

        const anomalies = patientsValidator.validate(sourcePatients, targetPatients);
        expect(anomalies.length).toBe(0);
    });

    test('PatientsValidator should detect missing mandatory fields and schema differences', () => {
        const sourcePatients = [
            { id: 1, name: 'Alice', dob: '1990-01-01', gender: 'F', externalId: 'EXT-100' }
        ];
        const targetPatients = [
            { id: 1, name: '', dob: '1990-01-01', gender: 'F' }
        ];

        const anomalies = patientsValidator.validate(sourcePatients, targetPatients);
        expect(anomalies.some(a => a.rule.includes('source mandatory field'))).toBe(false);
        expect(anomalies.some(a => a.rule.includes('target mandatory field'))).toBe(true);
        expect(anomalies.some(a => a.rule.includes('missing in target'))).toBe(true);
        expect(anomalies.some(a => a.rule.includes('Validation failed for name'))).toBe(true);
    });

    test('VisitsValidator should detect invalid date and referential integrity issues', () => {
        const sourceVisits = [
            { id: 1, patientId: 1, providerId: 101, visitDate: 'not-a-date' }
        ];
        const targetVisits = [
            { id: 1, patientId: null, providerId: 101, visitDate: '2024-01-15' }
        ];

        const anomalies = visitsValidator.validate(sourceVisits, targetVisits);
        expect(anomalies.some(a => a.rule.includes('source validation failed for visitDate'))).toBe(true);
        expect(anomalies.some(a => a.rule.includes('target mandatory field patientId'))).toBe(true);
    });

    test('BillingValidator should detect invalid billing values and target schema changes', () => {
        const sourceBilling = [
            { id: 1, visitId: 101, amount: -5.0 }
        ];
        const targetBilling = [
            { id: 1, visitId: 101 }
        ];

        const anomalies = billingValidator.validate(sourceBilling, targetBilling);
        expect(anomalies.some(a => a.rule.includes('source validation failed for amount'))).toBe(true);
        expect(anomalies.some(a => a.rule.includes('target mandatory field amount'))).toBe(true);
        expect(anomalies.some(a => a.rule.includes('missing in target'))).toBe(true);
    });

    test('ProvidersValidator should validate provider data correctly', () => {
        const sourceProviders = [
            { id: 1, name: 'Dr. Smith', specialty: 'Cardiology' },
            { id: 2, name: 'Dr. Jones', specialty: 'Neurology' }
        ];
        const targetProviders = [
            { id: 1, name: 'Dr. Smith', specialty: 'Cardiology' },
            { id: 2, name: 'Dr. Jones', specialty: 'Neurology' }
        ];

        const anomalies = providersValidator.validate(sourceProviders, targetProviders);
        expect(anomalies.length).toBe(0);
    });

});
