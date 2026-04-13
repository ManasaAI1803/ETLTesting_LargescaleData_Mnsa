import fs from 'fs';
import path from 'path';

export interface TestStep {
    name: string;
    status: 'pass' | 'fail';
    log: string;
    timestamp: string;
}

export interface PersistedTestResult {
    suite: string;
    test: string;
    status: 'pass' | 'fail';
    duration: number;
    businessRulesApplied?: string[];
    details?: any;
    timestamp: string;
    steps?: TestStep[];
}

export interface PersistedValidationContext {
    table: string;
    sourceData: any[];
    targetData: any[];
    anomalies: Array<{ rule: string; row: any }>;
    timestamp: string;
}

const stateDir = path.resolve(__dirname, '../../reports/report-state');

function ensureStateDir() {
    if (!fs.existsSync(stateDir)) {
        fs.mkdirSync(stateDir, { recursive: true });
    }
}

function getProcessFile(filePrefix: string): string {
    return path.join(stateDir, `${filePrefix}_${process.pid}.json`);
}

function readJsonFile<T>(filePath: string): T | null {
    if (!fs.existsSync(filePath)) {
        return null;
    }
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
    } catch {
        return null;
    }
}

function writeJsonFile(filePath: string, data: any) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export class ReportStateStore {
    public static appendTestResult(result: PersistedTestResult) {
        ensureStateDir();
        const filePath = getProcessFile('test_results');
        const existing = readJsonFile<PersistedTestResult[]>(filePath) || [];
        existing.push(result);
        writeJsonFile(filePath, existing);
    }

    public static appendValidationContext(context: PersistedValidationContext) {
        ensureStateDir();
        const filePath = getProcessFile('validation_contexts');
        const existing = readJsonFile<PersistedValidationContext[]>(filePath) || [];
        existing.push(context);
        writeJsonFile(filePath, existing);
    }

    public static loadAllTestResults(): PersistedTestResult[] {
        ensureStateDir();
        const files = fs.readdirSync(stateDir).filter(file => file.startsWith('test_results_'));
        return files.flatMap(file => readJsonFile<PersistedTestResult[]>(path.join(stateDir, file)) || []);
    }

    public static loadAllValidationContexts(): PersistedValidationContext[] {
        ensureStateDir();
        const files = fs.readdirSync(stateDir).filter(file => file.startsWith('validation_contexts_'));
        return files.flatMap(file => readJsonFile<PersistedValidationContext[]>(path.join(stateDir, file)) || []);
    }

    public static clearState() {
        if (fs.existsSync(stateDir)) {
            fs.readdirSync(stateDir).forEach(file => {
                fs.unlinkSync(path.join(stateDir, file));
            });
        }
        ensureStateDir();
    }
}
