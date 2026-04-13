import { test, expect } from '@playwright/test';
import { DatabaseConnection } from '../../src/db/connection';
import { Repository } from '../../src/db/repository';
import { TestResultsCollector } from '../../src/reporters/testResultsCollector';
import { HtmlReportGeneratorV2 } from '../../src/reporters/htmlReportGenerator_v2';
import { ReportStateStore } from '../../src/reporters/reportStateStore';
import SchemaValidationPOM from '../../src/automation/pageObjects/SchemaValidationPOM';
import { applyBusinessRule } from '../../utils/validationRules';
import { summarizeError } from '../../utils/errorFormatting';

/**
 * Great Expectations Schema Validation Tests
 * Validates schema (column count, data types, mandatory fields) for healthcare data tables
 * Supports: patients, medications
 *
 * Tests:
 * 1. Schema validation for source and target datasets
 * 2. Schema comparison between source and target
 * 3. Detection of new/removed columns
 * 4. Detection of data type mismatches
 */

const dbConnection = new DatabaseConnection();
const repository = new Repository(dbConnection);
const testResultsCollector = TestResultsCollector.getInstance();
const htmlReportGenerator = new HtmlReportGeneratorV2();
const GE_TABLE_ALIAS: Record<string, string> = {
  patients: 'GE Patients',
  medications: 'GE Medications',
};

const saveGEValidationContext = (context: {
  table: string;
  sourceData: any[];
  targetData: any[];
  anomalies: Array<{ rule: string; row: any }>;
  timestamp: string;
}) => {
  htmlReportGenerator.addValidationContext(context);
  ReportStateStore.appendValidationContext(context);
};

test.describe('Great Expectations Schema Validation', () => {
  test.beforeAll(async () => {
    console.log('[Schema Validation Tests] Initializing');
    await dbConnection.connect();
  });

  test.afterAll(async () => {
    await dbConnection.disconnect();
  });
  test.describe('Medications Table Schema', () => {
    test('should validate GE Medications source table schema', async () => {
      const startTime = Date.now();
      const steps: any[] = [];

      try {
        // Load source data
        const sourceMedications = await repository.fetchSourceData('medications');
        steps.push({
          name: 'Fetch source data',
          status: 'pass',
          log: `✅ Loaded ${sourceMedications.length} source records`,
          timestamp: new Date().toISOString()
        });

        // Validate schema
        const result = await SchemaValidationPOM.validateTable('medications', sourceMedications);
        steps.push({
          name: 'Validate schema',
          status: result.valid ? 'pass' : 'fail',
          log: result.valid 
            ? `✅ Schema valid: columns match`
            : SchemaValidationPOM.formatValidationErrors(result),
          timestamp: new Date().toISOString()
        });

        console.log('Medications Source Schema Validation:', result);

        saveGEValidationContext({
          table: GE_TABLE_ALIAS.medications,
          sourceData: sourceMedications,
          targetData: [],
          anomalies: result.errors.map((error) => ({ rule: String(error), row: null })),
          timestamp: new Date().toISOString()
        });

        // Assertions
        expect(result.table).toBe('medications');
        expect(result.summary.column_count_match).toBe(true);
        expect(result.errors.length).toBe(0);
        expect(result.summary.all_mandatory_present).toBe(true);

        const duration = Date.now() - startTime;
        testResultsCollector.addResult({
          suite: 'schema-validation',
          table: GE_TABLE_ALIAS.medications,
          test: 'Validate GE Medications source table schema',
          status: 'pass',
          duration,
          steps,
          businessRulesApplied: [applyBusinessRule('Validate GE Medications source table schema', result.errors)],
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        steps.push({
          name: 'Error',
          status: 'fail',
          log: `❌ ${summarizeError(error)}`,
          timestamp: new Date().toISOString()
        });

        const duration = Date.now() - startTime;
        testResultsCollector.addResult({
          suite: 'schema-validation',
          test: 'Validate GE Medications source table schema',
          status: 'fail',
          duration,
          details: error,
          steps,
          timestamp: new Date().toISOString()
        });
        throw error;
      }
    });

    test('should validate GE Medications target table schema', async () => {
      const startTime = Date.now();
      const steps: any[] = [];

      try {
        // Load target data
        const targetMedications = await repository.fetchTargetData('medications');
        steps.push({
          name: 'Fetch target data',
          status: 'pass',
          log: `✅ Loaded ${targetMedications.length} target records`,
          timestamp: new Date().toISOString()
        });

        // Validate schema
        const result = await SchemaValidationPOM.validateTable('medications', targetMedications);
        steps.push({
          name: 'Validate schema',
          status: result.valid ? 'pass' : 'fail',
          log: result.valid 
            ? `✅ Schema valid: columns match`
            : SchemaValidationPOM.formatValidationErrors(result),
          timestamp: new Date().toISOString()
        });

        console.log('Medications Target Schema Validation:', result);

        saveGEValidationContext({
          table: GE_TABLE_ALIAS.medications,
          sourceData: [],
          targetData: targetMedications,
          anomalies: result.errors.map((error) => ({ rule: String(error), row: null })),
          timestamp: new Date().toISOString()
        });

        // Assertions
        expect(result.table).toBe('medications');
        expect(result.summary.column_count_match).toBe(true);
        expect(result.summary.all_mandatory_present).toBe(true);

        const duration = Date.now() - startTime;
        testResultsCollector.addResult({
          suite: 'schema-validation',
          table: GE_TABLE_ALIAS.medications,
          test: 'Validate GE Medications target table schema',
          status: 'pass',
          duration,
          steps,
          businessRulesApplied: [applyBusinessRule('Validate GE Medications target table schema', result.errors)],
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        steps.push({
          name: 'Error',
          status: 'fail',
          log: `❌ ${summarizeError(error)}`,
          timestamp: new Date().toISOString()
        });

        const duration = Date.now() - startTime;
        testResultsCollector.addResult({
          suite: 'schema-validation',
          test: 'Validate GE Medications target table schema',
          status: 'fail',
          duration,
          details: error,
          steps,
          timestamp: new Date().toISOString()
        });
        throw error;
      }
    });

    test('should compare source and target GE Medications schemas', async () => {
      const startTime = Date.now();
      const steps: any[] = [];

      try {
        // Load source and target data
        const sourceMedications = await repository.fetchSourceData('medications');
        const targetMedications = await repository.fetchTargetData('medications');
        steps.push({
          name: 'Fetch data',
          status: 'pass',
          log: `✅ Loaded ${sourceMedications.length} source and ${targetMedications.length} target records`,
          timestamp: new Date().toISOString()
        });

        // Compare schemas
        const result = await SchemaValidationPOM.compareTableSchemas(
          'medications',
          sourceMedications,
          targetMedications
        );

        saveGEValidationContext({
          table: GE_TABLE_ALIAS.medications,
          sourceData: sourceMedications,
          targetData: targetMedications,
          anomalies: (result?.differences || []).map((difference: any) => ({ rule: String(difference), row: null })),
          timestamp: new Date().toISOString(),
        });
        
        // Safety checks for undefined properties
        const sourceValid = result?.source_schema?.valid || false;
        const targetValid = result?.target_schema?.valid || false;
        
        steps.push({
          name: 'Compare schemas',
          status: result?.schema_compatible ? 'pass' : 'fail',
          log: result?.schema_compatible
            ? `✅ Schemas compatible`
            : `⚠️  Differences: ${(result?.differences || []).join('; ') || 'validation failed'}`,
          timestamp: new Date().toISOString()
        });

        console.log('Medications Schema Comparison:', result);

        // Assertions - use null coalescing for safety
        expect(result.table).toBe('medications');
        expect(sourceValid && targetValid).toBe(true);

        const duration = Date.now() - startTime;
        testResultsCollector.addResult({
          suite: 'schema-validation',
          table: GE_TABLE_ALIAS.medications,
          test: 'Compare source and target GE Medications schemas',
          status: sourceValid && targetValid ? 'pass' : 'fail',
          duration,
          steps,
          businessRulesApplied: [applyBusinessRule('Compare source and target GE Medications schemas', result?.differences || [])],
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        steps.push({
          name: 'Error',
          status: 'fail',
          log: `❌ ${summarizeError(error)}`,
          timestamp: new Date().toISOString()
        });

        const duration = Date.now() - startTime;
        testResultsCollector.addResult({
          suite: 'schema-validation',
          table: GE_TABLE_ALIAS.medications,
          test: 'Compare source and target GE Medications schemas',
          status: 'fail',
          duration,
          details: error,
          steps,
          timestamp: new Date().toISOString()
        });
        throw error;
      }
    });

    test('should verify type consistency across source and target', async () => {
      const startTime = Date.now();
      const steps: any[] = [];

      try {
        // Load source and target data
        const sourceMedications = await repository.fetchSourceData('medications');
        const targetMedications = await repository.fetchTargetData('medications');
        steps.push({
          name: 'Fetch data',
          status: 'pass',
          log: `✅ Data loaded`,
          timestamp: new Date().toISOString()
        });

        // Compare schemas
        const result = await SchemaValidationPOM.compareTableSchemas(
          'medications',
          sourceMedications,
          targetMedications
        );

        // Assertions - type mismatches should be minimal with safety checks
        const sourceMismatches = result?.source_schema?.summary?.type_mismatches || 0;
        const targetMismatches = result?.target_schema?.summary?.type_mismatches || 0;
        const totalTypeMismatches = sourceMismatches + targetMismatches;
        
        steps.push({
          name: 'Check type consistency',
          status: totalTypeMismatches <= 2 ? 'pass' : 'fail',
          log: totalTypeMismatches > 0
            ? `⚠️  Found ${totalTypeMismatches} type mismatches (tolerable: ≤2)`
            : `✅ No type mismatches detected`,
          timestamp: new Date().toISOString()
        });

        expect(totalTypeMismatches).toBeLessThanOrEqual(2);

        const duration = Date.now() - startTime;
        testResultsCollector.addResult({
          suite: 'schema-validation',
          test: 'Verify type consistency in GE Medications',
          status: 'pass',
          duration,
          steps,
          businessRulesApplied: [applyBusinessRule('Verify type consistency in GE Medications', [])],
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        steps.push({
          name: 'Error',
          status: 'fail',
          log: `❌ ${summarizeError(error)}`,
          timestamp: new Date().toISOString()
        });

        const duration = Date.now() - startTime;
        testResultsCollector.addResult({
          suite: 'schema-validation',
          table: GE_TABLE_ALIAS.medications,
          test: 'Verify type consistency in GE Medications',
          status: 'fail',
          duration,
          details: error,
          steps,
          timestamp: new Date().toISOString()
        });
        throw error;
      }
    });

    test('should detect removed columns (if any)', async () => {
      const startTime = Date.now();
      const steps: any[] = [];

      try {
        // Load source and target data
        const sourceMedications = await repository.fetchSourceData('medications');
        const targetMedications = await repository.fetchTargetData('medications');
        steps.push({
          name: 'Fetch data',
          status: 'pass',
          log: `✅ Data loaded`,
          timestamp: new Date().toISOString()
        });

        // Compare schemas
        const result = await SchemaValidationPOM.compareTableSchemas(
          'medications',
          sourceMedications,
          targetMedications
        );

        saveGEValidationContext({
          table: GE_TABLE_ALIAS.medications,
          sourceData: sourceMedications,
          targetData: targetMedications,
          anomalies: (result?.differences || []).map((difference: any) => ({ rule: String(difference), row: null })),
          timestamp: new Date().toISOString(),
        });

        const missingCols = result?.target_schema?.summary?.missing_columns || [];
        steps.push({
          name: 'Detect removed columns',
          status: 'pass',
          log: missingCols.length > 0
            ? `⚠️  Found ${missingCols.length} missing columns: ${missingCols.join(', ')}`
            : `✅ No removed columns detected`,
          timestamp: new Date().toISOString()
        });

        console.log('Removed columns detection:', missingCols);

        const duration = Date.now() - startTime;
        testResultsCollector.addResult({
          suite: 'schema-validation',
          table: GE_TABLE_ALIAS.medications,
          test: 'Detect removed columns in GE Medications',
          status: 'pass',
          duration,
          steps,
          businessRulesApplied: [applyBusinessRule('Detect removed columns in GE Medications', missingCols)],
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        steps.push({
          name: 'Error',
          status: 'fail',
          log: `❌ ${summarizeError(error)}`,
          timestamp: new Date().toISOString()
        });

        const duration = Date.now() - startTime;
        testResultsCollector.addResult({
          suite: 'schema-validation',
          table: GE_TABLE_ALIAS.medications,
          test: 'Detect removed columns in GE Medications',
          status: 'fail',
          duration,
          details: error,
          steps,
          timestamp: new Date().toISOString()
        });
        throw error;
      }
    });
  });

  test.describe('Schema Validation Error Handling', () => {
    test('should handle empty data gracefully', async () => {
      const startTime = Date.now();
      const steps: any[] = [];

      try {
        const result = await SchemaValidationPOM.validateTable('patients', []);
        steps.push({
          name: 'Validate empty data',
          status: 'pass',
          log: `✅ Empty data handling: returned error as expected`,
          timestamp: new Date().toISOString()
        });

        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);

        const duration = Date.now() - startTime;
        testResultsCollector.addResult({
          suite: 'schema-validation',
          test: 'Should handle empty data gracefully',
          status: 'pass',
          duration,
          steps,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        steps.push({
          name: 'Error',
          status: 'fail',
          log: `❌ ${summarizeError(error)}`,
          timestamp: new Date().toISOString()
        });

        const duration = Date.now() - startTime;
        testResultsCollector.addResult({
          suite: 'schema-validation',
          test: 'Should handle empty data gracefully',
          status: 'fail',
          duration,
          details: error,
          steps,
          timestamp: new Date().toISOString()
        });
        throw error;
      }
    });

    test('should reject unsupported table names', async () => {
      const startTime = Date.now();
      const steps: any[] = [];

      try {
        const result = await SchemaValidationPOM.validateTable('unsupported_table', [{ id: 1 }]);
        throw new Error('Should have thrown an error');
      } catch (error: any) {
        steps.push({
          name: 'Validate table name',
          status: 'pass',
          log: `✅ Rejected unsupported table: ${error.message}`,
          timestamp: new Date().toISOString()
        });

        expect(error.message).toContain('Unsupported table');

        const duration = Date.now() - startTime;
        testResultsCollector.addResult({
          suite: 'schema-validation',
          test: 'Should reject unsupported table names',
          status: 'pass',
          duration,
          steps,
          timestamp: new Date().toISOString()
        });
      }
    });

    test('should handle invalid data types in comparison', async () => {
      const startTime = Date.now();
      const steps: any[] = [];

      try {
        const result = await SchemaValidationPOM.compareTableSchemas('patients', null as any, []);
        throw new Error('Should have thrown an error');
      } catch (error: any) {
        steps.push({
          name: 'Validate data types',
          status: 'pass',
          log: `✅ Rejected invalid data type: ${error.message}`,
          timestamp: new Date().toISOString()
        });

        expect(error.message).toContain('array');

        const duration = Date.now() - startTime;
        testResultsCollector.addResult({
          suite: 'schema-validation',
          test: 'Should handle invalid data types in comparison',
          status: 'pass',
          duration,
          steps,
          timestamp: new Date().toISOString()
        });
      }
    });
  });

  test.describe('Schema Validation Summary', () => {
    test('should provide comprehensive schema summary for all supported tables', async () => {
      const startTime = Date.now();
      const steps: any[] = [];

      try {
        const tables = ['patients', 'medications'];
        const summaries: any[] = [];

        for (const tableName of tables) {
          try {
            const sourceData = await repository.fetchSourceData(tableName);
            const targetData = await repository.fetchTargetData(tableName);
            const result = await SchemaValidationPOM.compareTableSchemas(
              tableName,
              sourceData,
              targetData
            );

            summaries.push({
              table: tableName,
              schemas_match: result?.summary?.schemas_match || false,
              both_valid: (result?.source_schema?.valid || false) && (result?.target_schema?.valid || false),
              differences: result?.differences || [],
            });
          } catch (tableError) {
            summaries.push({
              table: tableName,
              schemas_match: false,
              both_valid: false,
              differences: [summarizeError(tableError)],
            });
          }
        }

        console.log('Schema Validation Summary:');
        console.table(summaries);

        steps.push({
          name: 'Generate summary',
          status: 'pass',
          log: `✅ Validated ${summaries.length} tables`,
          timestamp: new Date().toISOString()
        });

        // All tables should be processed (even with failures)
        summaries.forEach((summary) => {
          steps.push({
            name: `Validate ${summary.table}`,
            status: summary.both_valid ? 'pass' : 'fail',
            log: summary.both_valid
              ? `✅ ${summary.table}: schemas valid and match`
              : `⚠️  ${summary.table}: ${summary.differences.join('; ') || 'validation issue'}`,
            timestamp: new Date().toISOString()
          });
        });

        const duration = Date.now() - startTime;
        testResultsCollector.addResult({
          suite: 'schema-validation',
          test: 'Provide comprehensive schema summary',
          status: 'pass',
          duration,
          steps,
          businessRulesApplied: [applyBusinessRule('Provide comprehensive schema summary', [])],
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        steps.push({
          name: 'Error',
          status: 'fail',
          log: `❌ ${summarizeError(error)}`,
          timestamp: new Date().toISOString()
        });

        const duration = Date.now() - startTime;
        testResultsCollector.addResult({
          suite: 'schema-validation',
          test: 'Provide comprehensive schema summary',
          status: 'fail',
          duration,
          details: error,
          steps,
          timestamp: new Date().toISOString()
        });
      }
    });
  });

  test.afterAll(async () => {
    // Generate HTML report with all schema validation results
    const results = testResultsCollector.getResults();
    if (results.length > 0) {
      htmlReportGenerator.setTestResults(results);
      htmlReportGenerator.saveReport('reports/schema-validation-report.html');
      console.log('\n✅ Schema Validation Report generated: reports/schema-validation-report.html');
    }
  });
});


