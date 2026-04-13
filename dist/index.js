"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = require("./db/connection");
const repository_1 = require("./db/repository");
const patientsValidator_1 = require("./validators/patientsValidator");
const providersValidator_1 = require("./validators/providersValidator");
const visitsValidator_1 = require("./validators/visitsValidator");
const medicationsValidator_1 = require("./validators/medicationsValidator");
const billingValidator_1 = require("./validators/billingValidator");
const anomalyReport_1 = require("./reporters/anomalyReport");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const dbConnection = new connection_1.DatabaseConnection();
        yield dbConnection.connect();
        const repository = new repository_1.Repository(dbConnection);
        const anomalyReport = new anomalyReport_1.AnomalyReport();
        try {
            // Fetch mock data for source and target
            const sourcePatients = yield repository.fetchSourceData('patients');
            const targetPatients = yield repository.fetchTargetData('patients');
            const sourceProviders = yield repository.fetchSourceData('providers');
            const targetProviders = yield repository.fetchTargetData('providers');
            const sourceVisits = yield repository.fetchSourceData('visits');
            const targetVisits = yield repository.fetchTargetData('visits');
            const sourceMedications = yield repository.fetchSourceData('medications');
            const targetMedications = yield repository.fetchTargetData('medications');
            const sourceBilling = yield repository.fetchSourceData('billing');
            const targetBilling = yield repository.fetchTargetData('billing');
            // Create validators
            const patientsValidator = new patientsValidator_1.PatientsValidator();
            const providersValidator = new providersValidator_1.ProvidersValidator();
            const visitsValidator = new visitsValidator_1.VisitsValidator();
            const medicationsValidator = new medicationsValidator_1.MedicationsValidator();
            const billingValidator = new billingValidator_1.BillingValidator();
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
        }
        catch (error) {
            console.error('Error during validation process:', error);
        }
        finally {
            yield dbConnection.disconnect();
        }
    });
}
main();
