#!/usr/bin/env python3
"""
Great Expectations Schema Validator for Healthcare Data
Validates schema (column count, data types, mandatory fields, new/removed columns)
Usage: python geSchemaValidator.py <table_name> <source_data_json> <target_data_json>
Example: python geSchemaValidator.py patients '{"data": [...]}' '{"data": [...]}'
"""

import json
import sys
from typing import Any, Dict, List, Optional
from pathlib import Path
import traceback


class SchemaValidator:
    """
    Validates data schema against expected schema definition.
    Checks for:
    - Column count (expected vs actual)
    - Data types (each column's type)
    - Mandatory fields (no null values)
    - New columns (extra in target)
    - Removed columns (missing in target)
    """

    def __init__(self, schema_file: str):
        """Load schema from JSON file."""
        with open(schema_file, 'r') as f:
            self.schema = json.load(f)
        self.table_name = self.schema.get('table_name', 'unknown')
        self.expected_columns = {col['name']: col for col in self.schema.get('columns', [])}

    def infer_type(self, value: Any) -> str:
        """Infer data type from Python object."""
        if value is None:
            return 'null'
        elif isinstance(value, bool):
            return 'boolean'
        elif isinstance(value, int):
            return 'number'
        elif isinstance(value, float):
            return 'number'
        elif isinstance(value, str):
            # Try to parse as date
            if self._is_date(value):
                return 'date'
            return 'string'
        elif isinstance(value, list):
            return 'array'
        elif isinstance(value, dict):
            return 'object'
        else:
            return 'unknown'

    @staticmethod
    def _is_date(value: str) -> bool:
        """Check if string looks like a date."""
        try:
            from datetime import datetime
            # Try common date formats
            for fmt in ['%Y-%m-%d', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%dT%H:%M:%S.%fZ']:
                try:
                    datetime.strptime(value, fmt)
                    return True
                except ValueError:
                    pass
            return False
        except Exception:
            return False

    def validate_schema(self, data: List[Dict]) -> Dict[str, Any]:
        """
        Validate schema of data against expected schema.
        Returns validation result with errors and warnings.
        """
        result = {
            'table': self.table_name,
            'valid': True,
            'errors': [],
            'warnings': [],
            'summary': {
                'column_count_match': False,
                'all_mandatory_present': True,
                'type_mismatches': 0,
                'extra_columns': [],
                'missing_columns': [],
            }
        }

        if not data or len(data) == 0:
            result['errors'].append('No data rows to validate')
            result['valid'] = False
            return result

        first_row = data[0]
        actual_columns = set(first_row.keys())
        expected_column_names = set(self.expected_columns.keys())

        # Check column count
        expected_count = len(expected_column_names)
        actual_count = len(actual_columns)
        if actual_count == expected_count:
            result['summary']['column_count_match'] = True
        else:
            result['errors'].append(
                f"Column count mismatch: expected {expected_count}, got {actual_count}"
            )
            result['valid'] = False

        # Check for removed columns
        missing = expected_column_names - actual_columns
        if missing:
            for col in missing:
                result['summary']['missing_columns'].append(col)
                result['errors'].append(f"Missing column: {col}")
            result['valid'] = False

        # Check for new columns
        extra = actual_columns - expected_column_names
        if extra:
            for col in extra:
                result['summary']['extra_columns'].append(col)
                result['warnings'].append(f"Extra column detected: {col}")

        # Validate data types and mandatory fields for first row (sampling)
        for col_name, col_def in self.expected_columns.items():
            if col_name not in first_row:
                continue

            value = first_row[col_name]
            expected_type = col_def.get('type', 'string')
            actual_type = self.infer_type(value)

            # Check mandatory fields
            if not col_def.get('nullable', True) and value is None:
                result['errors'].append(f"Mandatory field '{col_name}' is null")
                result['summary']['all_mandatory_present'] = False
                result['valid'] = False

            # Check type match (simplified - string can match date)
            if expected_type != 'string' and actual_type != expected_type and actual_type != 'null':
                if not (expected_type == 'date' and actual_type == 'string'):
                    result['warnings'].append(
                        f"Type mismatch for '{col_name}': expected {expected_type}, got {actual_type}"
                    )
                    result['summary']['type_mismatches'] += 1

        # Validate mandatory fields across all rows (null checks)
        mandatory_cols = self.schema.get('required_fields', [])
        null_violations = {col: 0 for col in mandatory_cols}

        for row in data:
            for col in mandatory_cols:
                if col in row and row[col] is None:
                    null_violations[col] += 1

        if any(null_violations.values()):
            result['summary']['all_mandatory_present'] = False
            for col, count in null_violations.items():
                if count > 0:
                    result['errors'].append(
                        f"Mandatory field '{col}' is null in {count} row(s)"
                    )
            result['valid'] = False

        return result

    def compare_schemas(self, source_data: List[Dict], target_data: List[Dict]) -> Dict[str, Any]:
        """
        Compare schemas between source and target datasets.
        Returns comparison result highlighting differences.
        """
        source_schema = self.validate_schema(source_data)
        target_schema = self.validate_schema(target_data)

        comparison = {
            'table': self.table_name,
            'source_schema': source_schema,
            'target_schema': target_schema,
            'schema_compatible': True,
            'differences': [],
            'summary': {
                'schemas_match': True,
                'both_valid': source_schema['valid'] and target_schema['valid'],
            }
        }

        # Check if schemas match
        if source_schema['summary']['column_count_match'] and target_schema['summary']['column_count_match']:
            if set(source_data[0].keys()) == set(target_data[0].keys()):
                comparison['summary']['schemas_match'] = True
            else:
                comparison['summary']['schemas_match'] = False
                comparison['differences'].append('Column names differ between source and target')
        else:
            comparison['summary']['schemas_match'] = False
            comparison['schema_compatible'] = False

        if not comparison['summary']['both_valid']:
            comparison['schema_compatible'] = False

        return comparison


def main():
    """CLI entry point for Great Expectations schema validator."""
    if len(sys.argv) < 4:
        print(json.dumps({
            'error': 'Usage: python geSchemaValidator.py <table_name> <source_data_json> <target_data_json>',
            'example': 'python geSchemaValidator.py patients \'{"data": [...]}\' \'{"data": [...]}\''
        }))
        sys.exit(1)

    try:
        table_name = sys.argv[1]
        source_json = json.loads(sys.argv[2])
        target_json = json.loads(sys.argv[3])

        # Find schema file
        schema_dir = Path(__file__).parent / 'schemas'
        schema_file = schema_dir / f'{table_name}.json'

        if not schema_file.exists():
            print(json.dumps({
                'error': f'Schema file not found: {schema_file}',
                'table': table_name
            }))
            sys.exit(1)

        validator = SchemaValidator(str(schema_file))

        # Extract data from JSON
        source_data = source_json.get('data', [])
        target_data = target_json.get('data', [])

        # Compare schemas
        result = validator.compare_schemas(source_data, target_data)

        print(json.dumps(result, indent=2))

    except json.JSONDecodeError as e:
        print(json.dumps({
            'error': f'Invalid JSON input: {str(e)}',
            'details': str(e)
        }))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({
            'error': f'Validation failed: {str(e)}',
            'details': traceback.format_exc()
        }))
        sys.exit(1)


if __name__ == '__main__':
    main()
