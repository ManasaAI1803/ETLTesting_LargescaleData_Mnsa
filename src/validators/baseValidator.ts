import { businessRules } from '../rules/businessRules';
import { createHash } from 'crypto';

export interface ValidationAnomaly {
    rule: string;
    row: any;
    severity?: 'error' | 'warning';
    table?: string;
}

export interface ValidationStep {
    name: string;
    status: 'pass' | 'fail';
    log: string;
    timestamp: string;
}

export abstract class BaseValidator {
    protected tableName: string = '';

    constructor() {}

    public validate(sourceData: any[], targetData: any[], dependencyData?: { [table: string]: any[] }): ValidationAnomaly[] {
        return this.validateWithLogs(sourceData, targetData, dependencyData).anomalies;
    }

    public validateWithLogs(sourceData: any[], targetData: any[], dependencyData?: { [table: string]: any[] }) {
        const timestamp = new Date().toISOString();
        const rowCountAnomalies = this.validateRowCount(sourceData, targetData);
        const dataHashAnomalies = this.validateDataHash(sourceData, targetData);
        const schemaAnomalies = this.validateSchemaCompatibility(sourceData, targetData);
        const sourceMandatoryAnomalies = this.validateMandatoryFields(sourceData, 'source');
        const targetMandatoryAnomalies = this.validateMandatoryFields(targetData, 'target');
        const sourceRuleAnomalies = this.validateRules(sourceData, 'source');
        const targetRuleAnomalies = this.validateRules(targetData, 'target');
        const dataConsistencyAnomalies = this.validateDataConsistency(sourceData, targetData);
        const missingExtraRowsAnomalies = this.validateMissingExtraRows(sourceData, targetData);
        const dependencyAnomalies = dependencyData ? this.validateDependencies(sourceData, targetData, dependencyData) : [];

        const anomalies = [
            ...rowCountAnomalies,
            ...dataHashAnomalies,
            ...schemaAnomalies,
            ...sourceMandatoryAnomalies,
            ...targetMandatoryAnomalies,
            ...sourceRuleAnomalies,
            ...targetRuleAnomalies,
            ...dataConsistencyAnomalies,
            ...missingExtraRowsAnomalies,
            ...dependencyAnomalies
        ];

        const steps: ValidationStep[] = [
            {
                name: 'Row count validation',
                status: rowCountAnomalies.length === 0 ? 'pass' : 'fail',
                log: rowCountAnomalies.length === 0 ? 'Row counts match between source and target.' : `Detected ${rowCountAnomalies.length} row count issue(s).`,
                timestamp
            },
            {
                name: 'Hash and consistency validation',
                status: dataHashAnomalies.length === 0 ? 'pass' : 'fail',
                log: dataHashAnomalies.length === 0 ? 'Dataset hash is consistent.' : `Detected ${dataHashAnomalies.length} dataset hash anomaly(s).`,
                timestamp
            },
            {
                name: 'Schema compatibility validation',
                status: schemaAnomalies.length === 0 ? 'pass' : 'fail',
                log: schemaAnomalies.length === 0 ? 'Source and target schema are compatible.' : `Detected ${schemaAnomalies.length} schema issue(s).`,
                timestamp
            },
            {
                name: 'Mandatory fields validation',
                status: sourceMandatoryAnomalies.length === 0 && targetMandatoryAnomalies.length === 0 ? 'pass' : 'fail',
                log: sourceMandatoryAnomalies.length === 0 && targetMandatoryAnomalies.length === 0 ? 'All mandatory fields are present in source and target.' : `Detected ${sourceMandatoryAnomalies.length + targetMandatoryAnomalies.length} mandatory field issue(s).`,
                timestamp
            },
            {
                name: 'Field-level rule validation',
                status: sourceRuleAnomalies.length === 0 && targetRuleAnomalies.length === 0 ? 'pass' : 'fail',
                log: sourceRuleAnomalies.length === 0 && targetRuleAnomalies.length === 0 ? 'All field validation rules passed.' : `Detected ${sourceRuleAnomalies.length + targetRuleAnomalies.length} rule validation issue(s).`,
                timestamp
            },
            {
                name: 'Data consistency validation',
                status: dataConsistencyAnomalies.length === 0 ? 'pass' : 'fail',
                log: dataConsistencyAnomalies.length === 0 ? 'Source and target row consistency is valid.' : `Detected ${dataConsistencyAnomalies.length} data consistency issue(s).`,
                timestamp
            },
            {
                name: 'Missing / Extra row validation',
                status: missingExtraRowsAnomalies.length === 0 ? 'pass' : 'fail',
                log: missingExtraRowsAnomalies.length === 0 ? 'No missing or extra rows detected.' : `Detected ${missingExtraRowsAnomalies.length} missing/extra row issue(s).`,
                timestamp
            },
            {
                name: 'Dependency validation',
                status: dependencyAnomalies.length === 0 ? 'pass' : 'fail',
                log: dependencyAnomalies.length === 0 ? 'Dependency relationships are valid.' : `Detected ${dependencyAnomalies.length} dependency issue(s).`,
                timestamp
            }
        ];

        return { anomalies, steps };
    }

    protected validateRowCount(sourceData: any[], targetData: any[]): ValidationAnomaly[] {
        const anomalies: ValidationAnomaly[] = [];
        const sourceCount = sourceData.length;
        const targetCount = targetData.length;

        if (sourceCount !== targetCount) {
            anomalies.push({
                rule: `Row count mismatch: source has ${sourceCount}, target has ${targetCount}`,
                row: { sourceCount, targetCount },
                severity: 'error',
                table: this.tableName
            });
        }

        return anomalies;
    }

    protected validateDataHash(sourceData: any[], targetData: any[]): ValidationAnomaly[] {
        const anomalies: ValidationAnomaly[] = [];

        const sourceHash = this.computeDataHash(sourceData);
        const targetHash = this.computeDataHash(targetData);

        if (sourceHash !== targetHash) {
            anomalies.push({
                rule: `Data hash mismatch: source hash ${sourceHash}, target hash ${targetHash}`,
                row: { sourceHash, targetHash },
                severity: 'error',
                table: this.tableName
            });
        }

        return anomalies;
    }

    private computeDataHash(data: any[]): string {
        const sortedData = data.map(row => JSON.stringify(row, Object.keys(row).sort())).sort();
        const hash = createHash('md5');
        hash.update(sortedData.join(''));
        return hash.digest('hex');
    }

    protected validateMissingExtraRows(sourceData: any[], targetData: any[]): ValidationAnomaly[] {
        const anomalies: ValidationAnomaly[] = [];
        const sourceIds = new Set(sourceData.map(row => this.getRowId(row)));
        const targetIds = new Set(targetData.map(row => this.getRowId(row)));

        // Missing rows (in source but not in target)
        sourceIds.forEach(id => {
            if (id === undefined || id === null) return;
            if (!targetIds.has(id)) {
                anomalies.push({
                    rule: `Missing row: Record with ID ${id} exists in source but missing in target`,
                    row: sourceData.find(row => this.getRowId(row) === id),
                    severity: 'error',
                    table: this.tableName
                });
            }
        });

        // Extra rows (in target but not in source)
        targetIds.forEach(id => {
            if (id === undefined || id === null) return;
            if (!sourceIds.has(id)) {
                anomalies.push({
                    rule: `Extra row: Record with ID ${id} exists in target but missing in source`,
                    row: targetData.find(row => this.getRowId(row) === id),
                    severity: 'warning',
                    table: this.tableName
                });
            }
        });

        return anomalies;
    }

    protected abstract validateDependencies(sourceData: any[], targetData: any[], dependencyData?: { [table: string]: any[] }): ValidationAnomaly[];

    protected validateMandatoryFields(data: any[], dataset: 'source' | 'target'): ValidationAnomaly[] {
        const rules: any = (businessRules as any)[this.tableName];
        if (!rules || !rules.mandatoryFields) return [];

        const mandatoryFields = rules.mandatoryFields;
        const anomalies: ValidationAnomaly[] = [];

        data.forEach((row) => {
            mandatoryFields.forEach((field: string) => {
                const value = row[field];
                if (value === undefined || value === null || value === '') {
                    anomalies.push({
                        rule: `${dataset} mandatory field ${field} is missing or empty`,
                        row,
                    });
                }
            });
        });
        return anomalies;
    }

    protected validateRules(data: any[], dataset: 'source' | 'target'): ValidationAnomaly[] {
        const rules: any = (businessRules as any)[this.tableName];
        if (!rules || !rules.validationRules) return [];

        const validationRules: any = rules.validationRules;
        const anomalies: ValidationAnomaly[] = [];

        data.forEach((row) => {
            for (const field in validationRules) {
                if (row[field] !== undefined && !validationRules[field](row[field])) {
                    anomalies.push({
                        rule: `${dataset} validation failed for ${field}`,
                        row,
                    });
                }
            }
        });
        return anomalies;
    }

    protected validateSchemaCompatibility(sourceData: any[], targetData: any[]): ValidationAnomaly[] {
        if (!sourceData.length || !targetData.length) return [];

        const sourceColumns = Object.keys(sourceData[0]);
        const targetColumns = Object.keys(targetData[0]);
        const anomalies: ValidationAnomaly[] = [];

        // Check column count
        if (sourceColumns.length !== targetColumns.length) {
            anomalies.push({
                rule: `Schema mismatch: column count differs - source: ${sourceColumns.length}, target: ${targetColumns.length}`,
                row: { sourceColumns, targetColumns },
            });
        }

        // Check for missing columns
        sourceColumns
            .filter(column => !targetColumns.includes(column))
            .forEach(column => {
                anomalies.push({
                    rule: `Schema mismatch: source column '${column}' missing in target`,
                    row: { sourceColumns, targetColumns },
                });
            });

        targetColumns
            .filter(column => !sourceColumns.includes(column))
            .forEach(column => {
                anomalies.push({
                    rule: `Schema mismatch: target column '${column}' missing in source`,
                    row: { sourceColumns, targetColumns },
                });
            });

        // Check data types for common columns
        const commonColumns = sourceColumns.filter(col => targetColumns.includes(col));
        commonColumns.forEach(column => {
            const sourceType = typeof sourceData[0][column];
            const targetType = typeof targetData[0][column];
            if (sourceType !== targetType) {
                anomalies.push({
                    rule: `Schema mismatch: column '${column}' type differs - source: ${sourceType}, target: ${targetType}`,
                    row: { column, sourceType, targetType },
                });
            }
        });

        return anomalies;
    }

    protected getPrimaryKeyField(): string {
        switch (this.tableName) {
            case 'patients': return 'patient_id';
            case 'providers': return 'provider_id';
            case 'visits': return 'visit_id';
            case 'medications': return 'medication_id';
            case 'billing': return 'billing_id';
            default: return 'id';
        }
    }

    protected getRowId(row: any): any {
        if (!row || typeof row !== 'object') return undefined;
        const primaryKey = this.getPrimaryKeyField();
        return row[primaryKey] ?? row.id;
    }

    protected validateDataConsistency(sourceData: any[], targetData: any[]): ValidationAnomaly[] {
        const sourceIds = new Set(sourceData.map(row => this.getRowId(row)));
        const targetIds = new Set(targetData.map(row => this.getRowId(row)));
        const anomalies: ValidationAnomaly[] = [];

        sourceIds.forEach(id => {
            if (id === undefined || id === null) return;
            if (!targetIds.has(id)) {
                anomalies.push({
                    rule: `Record with ID ${id} is missing in target`,
                    row: sourceData.find(row => this.getRowId(row) === id),
                });
            }
        });

        targetIds.forEach(id => {
            if (id === undefined || id === null) return;
            if (!sourceIds.has(id)) {
                anomalies.push({
                    rule: `Record with ID ${id} exists in target but not in source`,
                    row: targetData.find(row => this.getRowId(row) === id),
                });
            }
        });

        return anomalies;
    }

    protected detectDuplicates(data: any[]): ValidationAnomaly[] {
        const anomalies: ValidationAnomaly[] = [];
        const idCounts = new Map<any, number>();

        data.forEach(row => {
            const id = this.getRowId(row);
            if (id === undefined || id === null) return;
            idCounts.set(id, (idCounts.get(id) || 0) + 1);
        });

        data.forEach(row => {
            const id = this.getRowId(row);
            if (id !== undefined && id !== null && idCounts.get(id)! > 1) {
                anomalies.push({
                    rule: `Duplicate ID found: ${id}`,
                    row,
                });
            }
        });

        return anomalies;
    }

    protected detectInvalidIds(data: any[]): ValidationAnomaly[] {
        const anomalies: ValidationAnomaly[] = [];

        data.forEach(row => {
            const id = this.getRowId(row);
            if (id !== undefined && id !== null && typeof id === 'number' && id < 1) {
                anomalies.push({
                    rule: `Invalid ID (must be positive): ${id}`,
                    row,
                });
            }
        });

        return anomalies;
    }
}
