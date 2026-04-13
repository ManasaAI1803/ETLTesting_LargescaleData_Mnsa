"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportStateStore = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const stateDir = path_1.default.resolve(__dirname, '../../reports/report-state');
function ensureStateDir() {
    if (!fs_1.default.existsSync(stateDir)) {
        fs_1.default.mkdirSync(stateDir, { recursive: true });
    }
}
function getProcessFile(filePrefix) {
    return path_1.default.join(stateDir, `${filePrefix}_${process.pid}.json`);
}
function readJsonFile(filePath) {
    if (!fs_1.default.existsSync(filePath)) {
        return null;
    }
    try {
        return JSON.parse(fs_1.default.readFileSync(filePath, 'utf-8'));
    }
    catch (_a) {
        return null;
    }
}
function writeJsonFile(filePath, data) {
    fs_1.default.writeFileSync(filePath, JSON.stringify(data, null, 2));
}
class ReportStateStore {
    static appendTestResult(result) {
        ensureStateDir();
        const filePath = getProcessFile('test_results');
        const existing = readJsonFile(filePath) || [];
        existing.push(result);
        writeJsonFile(filePath, existing);
    }
    static appendValidationContext(context) {
        ensureStateDir();
        const filePath = getProcessFile('validation_contexts');
        const existing = readJsonFile(filePath) || [];
        existing.push(context);
        writeJsonFile(filePath, existing);
    }
    static loadAllTestResults() {
        ensureStateDir();
        const files = fs_1.default.readdirSync(stateDir).filter(file => file.startsWith('test_results_'));
        return files.flatMap(file => readJsonFile(path_1.default.join(stateDir, file)) || []);
    }
    static loadAllValidationContexts() {
        ensureStateDir();
        const files = fs_1.default.readdirSync(stateDir).filter(file => file.startsWith('validation_contexts_'));
        return files.flatMap(file => readJsonFile(path_1.default.join(stateDir, file)) || []);
    }
    static clearState() {
        if (fs_1.default.existsSync(stateDir)) {
            fs_1.default.readdirSync(stateDir).forEach(file => {
                fs_1.default.unlinkSync(path_1.default.join(stateDir, file));
            });
        }
        ensureStateDir();
    }
}
exports.ReportStateStore = ReportStateStore;
