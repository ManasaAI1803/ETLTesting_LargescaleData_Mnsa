import { BaseValidator, ValidationAnomaly } from './baseValidator';

export class BillingValidator extends BaseValidator {
    protected tableName = 'billing';

    constructor() {
        super();
    }

    protected validateDependencies(sourceData: any[], targetData: any[], dependencyData?: { [table: string]: any[] }): ValidationAnomaly[] {
        const anomalies: ValidationAnomaly[] = [];
        if (!dependencyData) return anomalies;

        const visits = dependencyData.visits || [];
        const visitIds = new Set(visits.map(v => v.visit_id));

        const allBilling = [...sourceData, ...targetData];
        allBilling.forEach(bill => {
            if (bill.visit_id && !visitIds.has(bill.visit_id)) {
                anomalies.push({
                    rule: `Billing visit_id ${bill.visit_id} does not exist in visits.visit_id`,
                    row: bill,
                    severity: 'error',
                    table: 'billing'
                });
            }
        });

        return anomalies;
    }
}