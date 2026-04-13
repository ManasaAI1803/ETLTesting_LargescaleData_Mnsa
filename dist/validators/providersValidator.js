"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProvidersValidator = void 0;
const baseValidator_1 = require("./baseValidator");
class ProvidersValidator extends baseValidator_1.BaseValidator {
    constructor() {
        super();
        this.tableName = 'providers';
    }
    validateDependencies(sourceData, targetData, dependencyData) {
        // Providers table has no dependencies
        return [];
    }
}
exports.ProvidersValidator = ProvidersValidator;
