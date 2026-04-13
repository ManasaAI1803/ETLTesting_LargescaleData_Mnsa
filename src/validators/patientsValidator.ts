import { BaseValidator, ValidationAnomaly } from './baseValidator';

export class PatientsValidator extends BaseValidator {
    protected tableName = 'patients';

    constructor() {
        super();
    }

    protected validateDependencies(sourceData: any[], targetData: any[], dependencyData?: { [table: string]: any[] }): ValidationAnomaly[] {
        // Patients table has no dependencies
        return [];
    }
}