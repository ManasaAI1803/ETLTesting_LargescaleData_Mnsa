"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingValidator = void 0;
const baseValidator_1 = require("./baseValidator");
class BillingValidator extends baseValidator_1.BaseValidator {
    constructor() {
        super();
        this.tableName = 'billing';
    }
    validateDependencies(sourceData, targetData, dependencyData) {
        const anomalies = [];
        if (!dependencyData)
            return anomalies;
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
exports.BillingValidator = BillingValidator;
