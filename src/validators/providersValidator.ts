import { BaseValidator, ValidationAnomaly } from './baseValidator';

export class ProvidersValidator extends BaseValidator {
    protected tableName = 'providers';

    constructor() {
        super();
    }

    protected validateDependencies(sourceData: any[], targetData: any[], dependencyData?: { [table: string]: any[] }): ValidationAnomaly[] {
        // Providers table has no dependencies
        return [];
    }
}