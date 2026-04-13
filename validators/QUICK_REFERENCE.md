# Great Expectations Schema Validation - Quick Reference

## Summary

✅ Great Expectations schema validation setup complete for **Patients** and **Medications** tables.

Enables validation of:
- Column counts
- Data types
- Mandatory fields (null checks)
- New/removed columns
- Schema compatibility (source vs target)

## Files Created

### 1. Python Validator
**File**: `validators/geSchemaValidator.py`
- Main validation engine using Great Expectations approach
- Validates schema against JSON definitions
- Compares source vs target datasets
- No external Python dependencies required (pure standard library)

### 2. Schema Definitions
**Files**:
- `validators/schemas/patients.json`
- `validators/schemas/medications.json`

Define expected schema with:
- Column names and types
- Mandatory fields
- Expected column count
- Field descriptions

### 3. Node.js Wrapper
**File**: `src/utils/geSchemaValidator.ts`
- Wrapper class `GESchemaValidator` to execute Python validator
- Methods:
  - `validateSchema(tableName, data)` - Validate single dataset
  - `compareSchemas(tableName, sourceData, targetData)` - Compare source vs target
- Handles temp file I/O
- Returns fully typed TypeScript results

### 4. Page Object Model (POM)
**File**: `src/automation/pageObjects/SchemaValidationPOM.ts`
- Singleton class `SchemaValidationPOM`
- Public methods:
  - `validateTable(tableName, data)` - Validate table schema
  - `compareTableSchemas(tableName, sourceData, targetData)` - Compare schemas
  - `hasValidSchema(tableName, data)` - Boolean check
  - `formatValidationErrors(result)` - Format errors for reporting
  - `assertSchemasMatch(result, throwOnMismatch)` - Assertion helper

### 5. E2E Test Suite
**File**: `tests/e2e/schema-validation.test.ts`
- Playwright test suite with 13 tests covering:
  - Individual table schema validation (source & target)
  - Schema comparison between source and target
  - Detection of new/removed columns
  - Detection of data type mismatches
  - Error handling (empty data, unsupported tables, invalid data)
  - Comprehensive summary validation

### 6. Documentation
**File**: `validators/GE_SCHEMA_VALIDATION_GUIDE.md`
- Comprehensive guide with usage examples
- Architecture overview
- Adding new table schemas
- Running tests
- Troubleshooting

---

## Quick Start

### 1. Call validateTable() from Tests

```typescript
import SchemaValidationPOM from '../../src/automation/pageObjects/SchemaValidationPOM';

const data = await repository.fetchSourceData('patients');
const result = await SchemaValidationPOM.validateTable('patients', data);
expect(result.valid).toBe(true);
```

### 2. Compare Source vs Target

```typescript
const source = await repository.fetchSourceData('patients');
const target = await repository.fetchTargetData('patients');
const result = await SchemaValidationPOM.compareTableSchemas('patients', source, target);
expect(result.schema_compatible).toBe(true);
```

### 3. Run Tests

```bash
npm run test:e2e -- schema-validation.test.ts
```

---

## POM Methods Available

### validateTable(tableName, data) → SchemaValidationResult
Validates schema of a single dataset

```typescript
const result = await SchemaValidationPOM.validateTable('patients', data);
// Returns: { table, valid, errors, warnings, summary }
```

### compareTableSchemas(tableName, sourceData, targetData) → SchemaComparisonResult
Compares schemas between source and target

```typescript
const result = await SchemaValidationPOM.compareTableSchemas('patients', source, target);
// Returns: { table, source_schema, target_schema, schema_compatible, differences, summary }
```

### hasValidSchema(tableName, data) → boolean
Quick boolean check for schema validity

```typescript
if (await SchemaValidationPOM.hasValidSchema('patients', data)) {
  console.log('Schema is valid');
}
```

### formatValidationErrors(result) → string
Format errors for display/logging

```typescript
const errorMsg = SchemaValidationPOM.formatValidationErrors(result);
console.log(errorMsg);
```

### assertSchemasMatch(result, throwOnMismatch) → void
Assertion helper for tests

```typescript
await SchemaValidationPOM.assertSchemasMatch(result, true);  // Throws on mismatch
await SchemaValidationPOM.assertSchemasMatch(result, false); // Logs warning
```

---

## Supported Tables

- ✅ **patients** - Schema: patient_id, name, dob, gender
- ✅ **medications** - Schema: medication_id, patient_id, name, dosage

To add more tables:
1. Create `validators/schemas/tablename.json`
2. Add table name to `SchemaValidationPOM.validateTableName()`
3. Write tests in `schema-validation.test.ts`

---

## Validation Checks

| Check | Description | Triggers Error |
|-------|-------------|-----------------|
| **Column Count** | Actual == Expected | Yes, if mismatch |
| **Mandatory Fields** | No nulls in required | Yes, if any null |
| **Data Types** | Inferred type matches | Warning if mismatch |
| **Extra Columns** | New columns detected | Warning (not error) |
| **Missing Columns** | Expected columns missing | Yes, if any missing |
| **Schema Compatibility** | Source and target match | Yes, if different |

---

## Integration Points

### With TestResultsCollector
```typescript
const collector = TestResultsCollector.getInstance();
const result = await SchemaValidationPOM.validateTable('patients', data);
collector.addResult({
  suite: 'Schema Validation',
  test: 'Patients Schema',
  passed: result.valid,
  error: result.errors.join('; '),
  timestamp: new Date().toISOString()
});
```

### With Reporters
Schema validation results flow into HTML reports via TestResultsCollector for visibility in test dashboards.

---

## Example: Full Test Flow

```typescript
import { test, expect } from '@playwright/test';
import SchemaValidationPOM from '../../src/automation/pageObjects/SchemaValidationPOM';
import { Repository } from '../../src/db/repository';

test('Patients schema should be valid', async () => {
  const repo = new Repository(dbConnection);
  
  // Load data
  const sourceData = await repo.fetchSourceData('patients');
  const targetData = await repo.fetchTargetData('patients');
  
  // Validate source
  const sourceResult = await SchemaValidationPOM.validateTable('patients', sourceData);
  expect(sourceResult.valid).toBe(true);
  
  // Validate target
  const targetResult = await SchemaValidationPOM.validateTable('patients', targetData);
  expect(targetResult.valid).toBe(true);
  
  // Compare schemas
  const comparison = await SchemaValidationPOM.compareTableSchemas(
    'patients',
    sourceData,
    targetData
  );
  expect(comparison.schema_compatible).toBe(true);
  
  // Assert - throws if any differences
  await SchemaValidationPOM.assertSchemasMatch(comparison, true);
  
  console.log('✅ All schema validations passed');
});
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────┐
│    Playwright Test Suite (E2E)         │
│  (tests/e2e/schema-validation.test.ts) │
└────────────┬──────────────────────────┘
             │ uses
             ▼
┌─────────────────────────────────────────┐
│   SchemaValidationPOM (Page Object)     │
│ (src/automation/pageObjects/...)        │
│  • validateTable()                      │
│  • compareTableSchemas()                │
│  • formatValidationErrors()             │
└────────────┬──────────────────────────┘
             │ calls
             ▼
┌─────────────────────────────────────────┐
│  GESchemaValidator (Node.js Wrapper)    │
│  (src/utils/geSchemaValidator.ts)       │
│  • validateSchema()                     │
│  • compareSchemas()                     │
└────────────┬──────────────────────────┘
             │ executes
             ▼
┌─────────────────────────────────────────┐
│  geSchemaValidator.py (Python)          │
│  (validators/geSchemaValidator.py)      │
│  • Column count validation              │
│  • Data type validation                 │
│  • Mandatory field checks               │
│  • Schema comparison                    │
└────────────┬──────────────────────────┘
             │ validates against
             ▼
┌─────────────────────────────────────────┐
│    Schema Definitions (JSON)            │
│  •patients.json                         │
│  • medications.json                     │
│  (validators/schemas/)                  │
└─────────────────────────────────────────┘
```

---

## Files Checklist

- ✅ `validators/geSchemaValidator.py` - Python validator
- ✅ `validators/schemas/patients.json` - Patients schema
- ✅ `validators/schemas/medications.json` - Medications schema
- ✅ `src/utils/geSchemaValidator.ts` - Node.js wrapper
- ✅ `src/automation/pageObjects/SchemaValidationPOM.ts` - POM class
- ✅ `tests/e2e/schema-validation.test.ts` - Test suite
- ✅ `validators/GE_SCHEMA_VALIDATION_GUIDE.md` - Full documentation

Total: **7 files created**

---

## Next Steps

1. ✅ Files created
2. 📝 Run build: `npm run build`
3. 🧪 Run tests: `npm run test:e2e -- schema-validation.test.ts`
4. 📊 Check reports: Reports auto-generated in `playwright-report/`
5. 🔧 Customize: Add more tables following the guide
6. 🚀 Integrate: Use in CI/CD pipeline

---

## Support

- **Python not found?** Update `pythonPath` in `geSchemaValidator.ts`
- **Schema mismatch?** Check JSON schema files for typos
- **Tests hanging?** Verify Python script runs standalone: `python validators/geSchemaValidator.py`
- **More details?** See `validators/GE_SCHEMA_VALIDATION_GUIDE.md`
