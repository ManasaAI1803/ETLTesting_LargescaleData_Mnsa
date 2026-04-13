/**
 * Mock GE Schema Validator
 * Provides fallback validation when Python is unavailable
 */

import { SchemaValidationResult, SchemaComparisonResult } from './geSchemaValidator';

export class MockGESchemaValidator {
  /**
   * Mock schema validation - analyzes data structure without Python
   */
  static validateSchema(tableName: string, data: any[]): SchemaValidationResult {
    if (!Array.isArray(data) || data.length === 0) {
      return {
        table: tableName,
        valid: false,
        errors: ['No data provided for validation'],
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

    // Analyze first record to determine schema
    const firstRecord = data[0];
    const columns = Object.keys(firstRecord);
    const mandatoryFields = this.getMandatoryFields(tableName);
    const missingMandatory = mandatoryFields.filter(f => !columns.includes(f));

    return {
      table: tableName,
      valid: missingMandatory.length === 0,
      errors: missingMandatory.length > 0 
        ? [`Missing mandatory fields: ${missingMandatory.join(', ')}`]
        : [],
      warnings: [],
      summary: {
        column_count_match: true,
        all_mandatory_present: missingMandatory.length === 0,
        type_mismatches: 0,
        extra_columns: [],
        missing_columns: missingMandatory,
      },
    };
  }

  /**
   * Mock schema comparison - compares source and target schemas
   */
  static compareSchemas(
    tableName: string,
    sourceData: any[],
    targetData: any[]
  ): SchemaComparisonResult {
    const sourceSchema = this.validateSchema(tableName, sourceData);
    const targetSchema = this.validateSchema(tableName, targetData);

    const sourceCols = sourceData.length > 0 ? Object.keys(sourceData[0]) : [];
    const targetCols = targetData.length > 0 ? Object.keys(targetData[0]) : [];

    const extraCols = targetCols.filter(col => !sourceCols.includes(col));
    const missingCols = sourceCols.filter(col => !targetCols.includes(col));

    if (extraCols.length > 0) {
      targetSchema.summary.extra_columns = extraCols;
    }
    if (missingCols.length > 0) {
      targetSchema.summary.missing_columns = missingCols;
    }

    const differences: string[] = [];
    if (extraCols.length > 0) {
      differences.push(`Extra columns in target: ${extraCols.join(', ')}`);
    }
    if (missingCols.length > 0) {
      differences.push(`Missing columns in target: ${missingCols.join(', ')}`);
    }

    const schemasMatch = sourceCols.length === targetCols.length &&
      sourceCols.every(col => targetCols.includes(col));

    return {
      table: tableName,
      source_schema: sourceSchema,
      target_schema: targetSchema,
      schema_compatible: schemasMatch,
      differences,
      summary: {
        schemas_match: schemasMatch,
        both_valid: sourceSchema.valid && targetSchema.valid,
      },
    };
  }

  private static getMandatoryFields(tableName: string): string[] {
    const mandatoryFieldsMap: Record<string, string[]> = {
      patients: ['patient_id', 'name'],
      medications: ['medication_id', 'patient_id'],
      visits: ['visit_id', 'patient_id', 'date'],
      providers: ['provider_id', 'name'],
      billing: ['billing_id', 'visit_id'],
    };

    return mandatoryFieldsMap[tableName.toLowerCase()] || [];
  }
}
