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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaValidationPOM = void 0;
const geSchemaValidator_1 = __importDefault(require("../../utils/geSchemaValidator"));
/**
 * Schema Validation Page Object Model (POM)
 * Provides reusable methods for schema validation across tables
 * Encapsulates GE schema validator calls and result formatting
 */
class SchemaValidationPOM {
    /**
     * Validate schema of a single dataset
     * @param tableName - 'patients' or 'medications' (supported tables)
     * @param data - Array of data objects to validate
     * @returns Validation result with details
     */
    validateTable(tableName, data) {
        return __awaiter(this, void 0, void 0, function* () {
            this.validateTableName(tableName);
            if (!Array.isArray(data) || data.length === 0) {
                return {
                    table: tableName,
                    valid: false,
                    errors: ['No data provided to validate'],
                    warnings: [],
                    summary: {
                        column_count_match: false,
                        all_mandatory_present: false,
                        type_mismatches: 0,
                        extra_columns: [],
                        missing_columns: [],
                    },
                };
            }
            const result = geSchemaValidator_1.default.validateSchema(tableName, data);
            return result;
        });
    }
    /**
     * Compare schemas between source and target datasets
     * @param tableName - 'patients' or 'medications'
     * @param sourceData - Source dataset
     * @param targetData - Target dataset
     * @returns Comparison result with differences
     */
    compareTableSchemas(tableName, sourceData, targetData) {
        return __awaiter(this, void 0, void 0, function* () {
            this.validateTableName(tableName);
            if (!Array.isArray(sourceData) || sourceData.length === 0) {
                throw new Error('Source data must be a non-empty array');
            }
            if (!Array.isArray(targetData) || targetData.length === 0) {
                throw new Error('Target data must be a non-empty array');
            }
            try {
                const result = yield geSchemaValidator_1.default.compareSchemas(tableName, sourceData, targetData);
                // Check if result is valid
                if (!result || !result.source_schema || !result.target_schema) {
                    console.error(`Schema comparison incomplete for ${tableName}:`, result);
                    return {
                        table: tableName,
                        source_schema: (result === null || result === void 0 ? void 0 : result.source_schema) || {
                            table: tableName,
                            valid: false,
                            errors: ['Schema validation unavailable'],
                            warnings: [],
                            summary: {
                                column_count_match: false,
                                all_mandatory_present: false,
                                type_mismatches: 0,
                                extra_columns: [],
                                missing_columns: [],
                            },
                        },
                        target_schema: (result === null || result === void 0 ? void 0 : result.target_schema) || {
                            table: tableName,
                            valid: false,
                            errors: ['Schema validation unavailable'],
                            warnings: [],
                            summary: {
                                column_count_match: false,
                                all_mandatory_present: false,
                                type_mismatches: 0,
                                extra_columns: [],
                                missing_columns: [],
                            },
                        },
                        schema_compatible: (result === null || result === void 0 ? void 0 : result.schema_compatible) || false,
                        differences: (result === null || result === void 0 ? void 0 : result.differences) || ['Schema comparison incomplete'],
                        summary: (result === null || result === void 0 ? void 0 : result.summary) || {
                            schemas_match: false,
                            both_valid: false,
                        },
                    };
                }
                return result;
            }
            catch (error) {
                console.error(`Error comparing schemas for ${tableName}:`, error);
                return {
                    table: tableName,
                    source_schema: {
                        table: tableName,
                        valid: false,
                        errors: [error instanceof Error ? error.message : 'Schema validation failed'],
                        warnings: [],
                        summary: {
                            column_count_match: false,
                            all_mandatory_present: false,
                            type_mismatches: 0,
                            extra_columns: [],
                            missing_columns: [],
                        },
                    },
                    target_schema: {
                        table: tableName,
                        valid: false,
                        errors: [error instanceof Error ? error.message : 'Schema validation failed'],
                        warnings: [],
                        summary: {
                            column_count_match: false,
                            all_mandatory_present: false,
                            type_mismatches: 0,
                            extra_columns: [],
                            missing_columns: [],
                        },
                    },
                    schema_compatible: false,
                    differences: [error instanceof Error ? error.message : 'Schema comparison error'],
                    summary: {
                        schemas_match: false,
                        both_valid: false,
                    },
                };
            }
        });
    }
    /**
     * Validate that all required columns exist and have correct types
     * @param tableName - Table to validate
     * @param data - Data to check
     * @returns True if valid, false otherwise
     */
    hasValidSchema(tableName, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.validateTable(tableName, data);
            return result.valid && !result.errors.length;
        });
    }
    /**
     * Get schema validation errors as formatted string
     * @param result - Validation result
     * @returns Formatted error message
     */
    formatValidationErrors(result) {
        const errors = result.errors.map((e) => `  • ${e}`).join('\n');
        const warnings = result.warnings.map((w) => `  ⚠ ${w}`).join('\n');
        let output = `Schema Validation for ${result.table}:\n${errors}`;
        if (warnings) {
            output += `\nWarnings:\n${warnings}`;
        }
        return output;
    }
    /**
     * Validate comparison result and throw if schema not compatible
     * @param result - Comparison result
     * @param throwOnMismatch - If true, throw error on mismatch
     */
    assertSchemasMatch(result, throwOnMismatch = true) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!result.schema_compatible) {
                const message = `Schema validation failed for ${result.table}:\n${result.differences.join('\n')}`;
                if (throwOnMismatch) {
                    throw new Error(message);
                }
                else {
                    console.warn(message);
                }
            }
        });
    }
    /**
     * Validate table name against supported tables
     * @private
     */
    validateTableName(tableName) {
        const supportedTables = ['patients', 'medications'];
        if (!supportedTables.includes(tableName)) {
            throw new Error(`Unsupported table: ${tableName}. Supported tables: ${supportedTables.join(', ')}`);
        }
    }
}
exports.SchemaValidationPOM = SchemaValidationPOM;
exports.default = new SchemaValidationPOM();
