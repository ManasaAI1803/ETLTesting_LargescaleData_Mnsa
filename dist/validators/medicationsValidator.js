"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicationsValidator = void 0;
const baseValidator_1 = require("./baseValidator");
class MedicationsValidator extends baseValidator_1.BaseValidator {
    constructor() {
        super();
        this.tableName = 'medications';
    }
    validateDependencies(sourceData, targetData, dependencyData) {
        const anomalies = [];
        if (!dependencyData)
            return anomalies;
        const patients = dependencyData.patients || [];
        const patientIds = new Set(patients.map(p => p.patient_id));
        const allMedications = [...sourceData, ...targetData];
        allMedications.forEach(med => {
            if (med.patient_id && !patientIds.has(med.patient_id)) {
                anomalies.push({
                    rule: `Medication patient_id ${med.patient_id} does not exist in patients.patient_id`,
                    row: med,
                    severity: 'error',
                    table: 'medications'
                });
            }
        });
        return anomalies;
    }
}
exports.MedicationsValidator = MedicationsValidator;
