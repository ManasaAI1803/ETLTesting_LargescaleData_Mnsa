import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { MockGESchemaValidator } from './mockGeSchemaValidator';

/**
 * Node.js wrapper for Great Expectations schema validator
 * Executes Python validator script and returns parsed JSON results
 */

export interface ColumnDef {
  name: string;
  type: string;
  nullable: boolean;
  description: string;
}

export interface SchemaValidationResult {
  table: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    column_count_match: boolean;
    all_mandatory_present: boolean;
    type_mismatches: number;
    extra_columns: string[];
    missing_columns: string[];
  };
}

export interface SchemaComparisonResult {
  table: string;
  source_schema: SchemaValidationResult;
  target_schema: SchemaValidationResult;
  schema_compatible: boolean;
  differences: string[];
  summary: {
    schemas_match: boolean;
    both_valid: boolean;
  };
}

/**
 * GE Schema Validator wrapper
 * Communicates with Python geSchemaValidator.py script
 */
export class GESchemaValidator {
  private validatorPath: string;
  private pythonPath: string;

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
  validateSchema(tableName: string, data: any[]): SchemaValidationResult {
    try {
      const dataJson = JSON.stringify({ data });
      const emptyJson = JSON.stringify({ data: [] });
      return this.executeValidator(tableName, dataJson, emptyJson);
    } catch (error) {
      console.warn(`Python validator unavailable, using mock validator for ${tableName}`);
      return MockGESchemaValidator.validateSchema(tableName, data);
    }
  }

  /**
   * Compare schemas between source and target datasets
   * @param tableName - Name of the table
   * @param sourceData - Source dataset
   * @param targetData - Target dataset
   * @returns Schema comparison result
   */
  compareSchemas(
    tableName: string,
    sourceData: any[],
    targetData: any[]
  ): SchemaComparisonResult {
    try {
      const sourceJson = JSON.stringify({ data: sourceData });
      const targetJson = JSON.stringify({ data: targetData });
      return this.executeValidator(tableName, sourceJson, targetJson);
    } catch (error) {
      console.warn(`Python validator unavailable, using mock validator for ${tableName}`);
      return MockGESchemaValidator.compareSchemas(tableName, sourceData, targetData);
    }
  }

  /**
   * Execute Python validator with data
   * @private
   */
  private executeValidator(
    tableName: string,
    sourceJsonStr: string,
    targetJsonStr: string
  ): any {
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

      const output = execSync(command, { encoding: 'utf-8' });

      // Clean up temp files
      fs.unlinkSync(sourceFile);
      fs.unlinkSync(targetFile);

      const result = JSON.parse(output);
      return result;
    } catch (error: any) {
      const errorMessage = error.stderr ? error.stderr.toString() : error.message;
      console.error(`GE Schema Validator Error: ${errorMessage}`);
      throw new Error(errorMessage);
    }
  }
}

export default new GESchemaValidator();
