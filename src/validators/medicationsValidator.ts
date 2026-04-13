import { BaseValidator, ValidationAnomaly } from './baseValidator';

export class MedicationsValidator extends BaseValidator {
    protected tableName = 'medications';

    constructor() {
        super();
    }

    protected validateDependencies(sourceData: any[], targetData: any[], dependencyData?: { [table: string]: any[] }): ValidationAnomaly[] {
        const anomalies: ValidationAnomaly[] = [];
        if (!dependencyData) return anomalies;

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