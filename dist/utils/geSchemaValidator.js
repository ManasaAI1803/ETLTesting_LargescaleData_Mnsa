"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GESchemaValidator = void 0;
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const mockGeSchemaValidator_1 = require("./mockGeSchemaValidator");
/**
 * GE Schema Validator wrapper
 * Communicates with Python geSchemaValidator.py script
 */
class GESchemaValidator {
    constructor() {
        // Path to Python validator script
        this.validatorPath = path.resolve(__dirname, '../../validators/geSchemaValidator.py');
        // Use 'python' on Windows, 'python3' on Unix (or detect)
        this.pythonPath = process.platform === 'win32' ? 'python' : 'python3';
    }
    /**
     * Validate schema of a single dataset
     * @param tableName - Name of the table
     * @param data - Array of data objects
     * @returns Validation result
     */
    validateSchema(tableName, data) {
        try {
            const dataJson = JSON.stringify({ data });
            const emptyJson = JSON.stringify({ data: [] });
            return this.executeValidator(tableName, dataJson, emptyJson);
        }
        catch (error) {
            console.warn(`Python validator unavailable, using mock validator for ${tableName}`);
            return mockGeSchemaValidator_1.MockGESchemaValidator.validateSchema(tableName, data);
        }
    }
    /**
     * Compare schemas between source and target datasets
     * @param tableName - Name of the table
     * @param sourceData - Source dataset
     * @param targetData - Target dataset
     * @returns Schema comparison result
     */
    compareSchemas(tableName, sourceData, targetData) {
        try {
            const sourceJson = JSON.stringify({ data: sourceData });
            const targetJson = JSON.stringify({ data: targetData });
            return this.executeValidator(tableName, sourceJson, targetJson);
        }
        catch (error) {
            console.warn(`Python validator unavailable, using mock validator for ${tableName}`);
            return mockGeSchemaValidator_1.MockGESchemaValidator.compareSchemas(tableName, sourceData, targetData);
        }
    }
    /**
     * Execute Python validator with data
     * @private
     */
    executeValidator(tableName, sourceJsonStr, targetJsonStr) {
        try {
            // Escape quotes for command line
            const sourceArg = sourceJsonStr.replace(/"/g, '\\"').replace(/'/g, "\\'");
            const targetArg = targetJsonStr.replace(/"/g, '\\"').replace(/'/g, "\\'");
            // Build command - use JSON files to avoid shell escaping issues
            const tempDir = path.join(process.cwd(), 'temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            const sourceFile = path.join(tempDir, `${tableName}_source.json`);
            const targetFile = path.join(tempDir, `${tableName}_target.json`);
            fs.writeFileSync(sourceFile, sourceJsonStr);
            fs.writeFileSync(targetFile, targetJsonStr);
            const command = `${this.pythonPath} "${this.validatorPath}" "${tableName}" "${sourceFile}" "${targetFile}"`;
            const output = (0, child_process_1.execSync)(command, { encoding: 'utf-8' });
            // Clean up temp files
            fs.unlinkSync(sourceFile);
            fs.unlinkSync(targetFile);
            const result = JSON.parse(output);
            return result;
        }
        catch (error) {
            const errorMessage = error.stderr ? error.stderr.toString() : error.message;
            console.error(`GE Schema Validator Error: ${errorMessage}`);
            throw new Error(errorMessage);
        }
    }
}
exports.GESchemaValidator = GESchemaValidator;
exports.default = new GESchemaValidator();
