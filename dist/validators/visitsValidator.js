"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisitsValidator = void 0;
const baseValidator_1 = require("./baseValidator");
class VisitsValidator extends baseValidator_1.BaseValidator {
    constructor() {
        super();
        this.tableName = 'visits';
    }
    validateDependencies(sourceData, targetData, dependencyData) {
        const anomalies = [];
        if (!dependencyData)
            return anomalies;
        const patients = dependencyData.patients || [];
        const providers = dependencyData.providers || [];
        const patientIds = new Set(patients.map(p => p.patient_id));
        const providerIds = new Set(providers.map(p => p.provider_id));
        const allVisits = [...sourceData, ...targetData];
        allVisits.forEach(visit => {
            if (visit.patient_id && !patientIds.has(visit.patient_id)) {
                anomalies.push({
                    rule: `Visit patient_id ${visit.patient_id} does not exist in patients.patient_id`,
                    row: visit,
                    severity: 'error',
                    table: 'visits'
                });
            }
            if (visit.provider_id && !providerIds.has(visit.provider_id)) {
                anomalies.push({
                    rule: `Visit provider_id ${visit.provider_id} does not exist in providers.provider_id`,
                    row: visit,
                    severity: 'error',
                    table: 'visits'
                });
            }
        });
        return anomalies;
    }
}
exports.VisitsValidator = VisitsValidator;
