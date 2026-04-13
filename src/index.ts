import { DatabaseConnection } from './db/connection';
import { Repository } from './db/repository';
import { PatientsValidator } from './validators/patientsValidator';
import { ProvidersValidator } from './validators/providersValidator';
import { VisitsValidator } from './validators/visitsValidator';
import { MedicationsValidator } from './validators/medicationsValidator';
import { BillingValidator } from './validators/billingValidator';
import { AnomalyReport } from './reporters/anomalyReport';

async function main() {
    const dbConnection = new DatabaseConnection();
    await dbConnection.connect();

    const repository = new Repository(dbConnection);
    const anomalyReport = new AnomalyReport();

    try {
        // Fetch mock data for source and target
        const sourcePatients = await repository.fetchSourceData('patients');
        const targetPatients = await repository.fetchTargetData('patients');
        
        const sourceProviders = await repository.fetchSourceData('providers');
        const targetProviders = await repository.fetchTargetData('providers');
        
        const sourceVisits = await repository.fetchSourceData('visits');
        const targetVisits = await repository.fetchTargetData('visits');
        
        const sourceMedications = await repository.fetchSourceData('medications');
        const targetMedications = await repository.fetchTargetData('medications');
        
        const sourceBilling = await repository.fetchSourceData('billing');
        const targetBilling = await repository.fetchTargetData('billing');

        // Create validators
        const patientsValidator = new PatientsValidator();
        const providersValidator = new ProvidersValidator();
        const visitsValidator = new VisitsValidator();
        const medicationsValidator = new MedicationsValidator();
        const billingValidator = new BillingValidator();

        // Validate and collect anomalies
        const patientAnomalies = patientsValidator.validate(sourcePatients, targetPatients);
        const providerAnomalies = providersValidator.validate(sourceProviders, targetProviders);
        const visitAnomalies = visitsValidator.validate(sourceVisits, targetVisits);
        const medicationAnomalies = medicationsValidator.validate(sourceMedications, targetMedications);
        const billingAnomalies = billingValidator.validate(sourceBilling, targetBilling);

        // Add to report
        anomalyReport.addAnomalies('Patients', patientAnomalies);
        anomalyReport.addAnomalies('Providers', providerAnomalies);
        anomalyReport.addAnomalies('Visits', visitAnomalies);
        anomalyReport.addAnomalies('Medications', medicationAnomalies);
        anomalyReport.addAnomalies('Billing', billingAnomalies);

        // Generate and display report
        const report = anomalyReport.generateReport();
        console.log('\n========== Validation Report ==========');
        console.log(report);
    } catch (error) {
        console.error('Error during validation process:', error);
    } finally {
        await dbConnection.disconnect();
    }
}

main();