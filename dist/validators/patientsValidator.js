"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientsValidator = void 0;
const baseValidator_1 = require("./baseValidator");
class PatientsValidator extends baseValidator_1.BaseValidator {
    constructor() {
        super();
        this.tableName = 'patients';
    }
    validateDependencies(sourceData, targetData, dependencyData) {
        // Patients table has no dependencies
        return [];
    }
}
exports.PatientsValidator = PatientsValidator;
