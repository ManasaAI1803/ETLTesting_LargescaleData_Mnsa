# Great Expectations Schema Validation Guide

## Overview

This setup provides **Great Expectations (GE) schema validation** for healthcare data tables with a **Node.js/TypeScript wrapper** and **POM (Page Object Model)** for easy integration into Playwright tests.

### Features

✅ **Column Count Validation** - Ensure source and target have same column count  
✅ **Data Type Validation** - Verify correct data types for each column  
✅ **Mandatory Fields Check** - Ensure required fields are non-null  
✅ **Column Drift Detection** - Identify new/removed columns  
✅ **Schema Compatibility** - Compare source vs target schemas  
✅ **Detailed Error Reporting** - Clear, actionable validation results  

### Supported Tables

- **patients** - Patient demographic information
- **medications** - Patient medication records

---

## Architecture

### File Structure

```
healthcare-data-validation/
├── validators/
│   ├── geSchemaValidator.py              # Python validator script (Great Expectations)
│   ├── schemas/
│   │   ├── patients.json                 # Patients table schema definition
│   │   └── medications.json              # Medications table schema definition
├── src/
│   ├── utils/
│   │   └── geSchemaValidator.ts          # Node.js wrapper for Python validator
│   ├── automation/
│   │   └── pageObjects/
│   │       └── SchemaValidationPOM.ts    # POM class with validateTable() methods
├── tests/
│   └── e2e/
│       └── schema-validation.test.ts     # E2E tests for schema validation
```

### Component Responsibilities

1. **geSchemaValidator.py** (Python)
   - Validates schema against JSON definitions
   - Compares source vs target datasets
   - Returns JSON with errors/warnings

2. **geSchemaValidator.ts** (Node.js Wrapper)
   - Executes Python script via `child_process`
   - Handles temp file I/O for data passing
   - Returns typed validation results

3. **SchemaValidationPOM.ts** (Page Object Model)
   - Exposes `validateTable(tableName, data)` method
   - Provides `compareTableSchemas()` for source/target comparison
   - Formats errors and provides assertion helpers

4. **schema-validation.test.ts** (Test Suite)
   - Uses POM to validate schemas
   - Tests both individual tables and comparisons
   - Covers error handling scenarios

---

## Usage

### 1. Quick Validation (Direct POM Call)

```typescript
import SchemaValidationPOM from '../../src/automation/pageObjects/SchemaValidationPOM';

// Validate a single table
const data = await repository.fetchSourceData('patients');
const result = await SchemaValidationPOM.validateTable('patients', data);

console.log(result.valid);        // true/false
console.log(result.errors);       // Array of error messages
console.log(result.warnings);     // Array of warnings
```

### 2. Compare Source vs Target

```typescript
const sourceData = await repository.fetchSourceData('patients');
const targetData = await repository.fetchTargetData('patients');

const comparison = await SchemaValidationPOM.compareTableSchemas(
  'patients',
  sourceData,
  targetData
);

if (comparison.schema_compatible) {
  console.log('✅ Schemas are compatible');
} else {
  console.log('❌ Schema differences detected:', comparison.differences);
}
```

### 3. Assert Schema Validity

```typescript
const result = await SchemaValidationPOM.validateTable('medications', data);

// Throws error if invalid
await SchemaValidationPOM.assertSchemasMatch(result, true);

// Or just log warnings
await SchemaValidationPOM.assertSchemasMatch(result, false);
```

### 4. Format Errors for Reporting

```typescript
const result = await SchemaValidationPOM.validateTable('patients', data);
const errorString = SchemaValidationPOM.formatValidationErrors(result);
console.log(errorString);
// Output:
// Schema Validation for patients:
//   • Column count mismatch: expected 4, got 5
//   ⚠ Extra column detected: extra_field
```

---

## Validation Details

### Schema Validation Result Structure

```typescript
{
  table: 'patients',
  valid: true,                    // Overall validity
  errors: [],                     // List of validation failures
  warnings: [],                   // List of warnings (e.g., extra columns)
  summary: {
    column_count_match: true,     // Source column count matches expected
    all_mandatory_present: true,  // No null values in required fields
    type_mismatches: 0,           // Number of type inconsistencies
    extra_columns: [],            // New columns not in schema
    missing_columns: []           // Removed columns
  }
}
```

### Schema Comparison Result Structure

```typescript
{
  table: 'patients',
  source_schema: { ... },         // Source validation result
  target_schema: { ... },         // Target validation result
  schema_compatible: true,        // Both schemas valid and match
  differences: [],                // List of schema differences
  summary: {
    schemas_match: true,          // Schemas are identical
    both_valid: true              // Both passed validation
  }
}
```

---

## Adding New Table Schemas

### Step 1: Create Schema JSON

Create a new file in `validators/schemas/` with table definition:

```json
{
  "table_name": "visits",
  "description": "Patient visit records",
  "columns": [
    {
      "name": "visit_id",
      "type": "number",
      "nullable": false,
      "description": "Unique visit identifier"
    },
    {
      "name": "patient_id",
      "type": "number",
      "nullable": false,
      "description": "Reference to patient"
    },
    {
      "name": "visit_date",
      "type": "date",
      "nullable": false,
      "description": "Date of visit"
    }
  ],
  "required_fields": ["visit_id", "patient_id", "visit_date"],
  "expected_column_count": 3,
  "validations": {
    "mandatory_columns": true,
    "no_extra_columns": true,
    "data_type_match": true
  }
}
```

### Step 2: Update SchemaValidationPOM

Add table to `validateTableName()` method:

```typescript
private validateTableName(tableName: string): void {
  const supportedTables = ['patients', 'medications', 'visits'];  // Add 'visits'
  if (!supportedTables.includes(tableName)) {
    throw new Error(...);
  }
}
```

### Step 3: Create Tests

Add tests in `schema-validation.test.ts`:

```typescript
test('should validate visits table schema', async () => {
  const visitsData = await repository.fetchSourceData('visits');
  const result = await SchemaValidationPOM.validateTable('visits', visitsData);
  expect(result.valid).toBe(true);
});
```

---

## Running Tests

### Run All Schema Validation Tests

```bash
npm run test:e2e -- schema-validation.test.ts
```

### Run Specific Test Group

```bash
# Only patients table tests
npm run test:e2e -- schema-validation.test.ts --grep "Patients Table Schema"

# Only comparison tests
npm run test:e2e -- schema-validation.test.ts --grep "compare source and target"
```

### Debug Mode

```bash
npx playwright test tests/e2e/schema-validation.test.ts --debug
```

---

## Validation Rules

### Column Count Validation

- **Rule**: Actual column count must equal expected count from schema
- **Fails**: Extra or missing columns detected
- **Example**: Schema expects 4 columns, data has 5 → FAIL

### Data Type Validation

- **Rule**: Each column must have correct data type
- **Types**: `number`, `string`, `date`, `boolean`, `array`, `object`
- **Tolerances**: 
  - `string` columns can contain date-formatted strings
  - Type inference allows flexibility for nullable fields
- **Example**: Field typed as `date` but contains string "2025-01-01" → PASS (date string in string field)

### Mandatory Field Validation

- **Rule**: Fields marked `nullable: false` must not be null/undefined
- **Check**: All rows in dataset are scanned
- **Example**: `patient_id` is mandatory, one row has null → FAIL with row count

### Schema Comparison

- **Rule**: Source and target must have identical column names and types
- **Detail**: Column order doesn't matter, but names and types must match
- **Example**: Source has `patient_id`, target has `patientId` → FAIL (name mismatch)

---

## Error Handling

### Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Schema file not found` | JSON schema missing | Create schema file in `validators/schemas/` |
| `No data provided` | Empty array passed | Ensure data is loaded from repository |
| `Unsupported table` | Table name not in supportedTables | Add to POM or use different table |
| `Type mismatch` | Column type doesn't match schema | Update schema or fix data |
| `Mandatory field is null` | Required field has null value | Check data source, ensure field is populated |

### Try-Catch Handling

```typescript
try {
  const result = await SchemaValidationPOM.validateTable('patients', data);
  if (!result.valid) {
    console.error(SchemaValidationPOM.formatValidationErrors(result));
  }
} catch (error) {
  console.error('Validation execution failed:', error.message);
}
```

---

## Integration with Test Reports

### Capture Schema Validation Results

```typescript
import { TestResultsCollector } from '../../src/reporters/testResultsCollector';

const collector = TestResultsCollector.getInstance();
const result = await SchemaValidationPOM.validateTable('patients', data);

collector.addResult({
  suite: 'Schema Validation',
  test: `Patients Schema`,
  passed: result.valid,
  error: result.errors.join('; '),
  log: `Schema validation: ${result.summary.column_count_match ? '✓' : '✗'}`,
  timestamp: new Date().toISOString()
});
```

### Include in HTML Report

Schema validation results appear in test reports via TestResultsCollector, with:
- ✅ Pass/fail status
- 📊 Column count summary
- ⚠️ Warnings for new/removed columns
- 🔍 Error details for troubleshooting

---

## Performance Notes

- **Python Startup**: First validation call may be slow (~1-2s) due to Python initialization
- **Temp File I/O**: Data passed via temp JSON files to avoid shell escaping issues
- **Memory**: Large datasets (>10k rows) may use significant memory
- **Parallel Execution**: Each table validation runs independently; no shared state

---

## Troubleshooting

### Python Not Found

```bash
# Verify Python is installed
python --version
python3 --version

# Update Python path in geSchemaValidator.ts if needed
this.pythonPath = process.platform === 'win32' ? 'python' : 'python3';
```

### Temp Files Not Cleaned

Check `temp/` directory for leftover JSON files and manually clean:

```bash
Remove-Item -Recurse temp/
```

### Schema Validation Hangs

- Check if Python script has errors (`validators/geSchemaValidator.py`)
- Verify schema JSON valid via `python -m json.tool validators/schemas/patients.json`
- Ensure data path is correct

---

## Next Steps

1. **Run tests**: `npm run test:e2e -- schema-validation.test.ts`
2. **Add more tables**: Follow "Adding New Table Schemas" section
3. **Integrate into CI/CD**: Add to GitHub Actions workflow
4. **Extend validation**: Add custom rules to `geSchemaValidator.py`
5. **Monitor drift**: Schedule regular schema validation in production

---

## References

- **Great Expectations** (Python): https://greatexpectations.io/
- **Playwright** (E2E Testing): https://playwright.dev/
- **Page Object Model**: https://playwright.dev/docs/pom
