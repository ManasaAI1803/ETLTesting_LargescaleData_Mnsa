"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatAnomalySummary = exports.applyBusinessRule = void 0;
function applyBusinessRule(testName, anomalies = []) {
    const normalized = testName.toLowerCase();
    if (/schema/.test(normalized))
        return 'Schema Validation';
    if (/amount|billing|negative|precision|truncation|decimal/.test(normalized))
        return 'Amount Validation';
    if (/dependency|referential|visit|patient|provider/.test(normalized))
        return 'Dependencies Validation';
    if (/missing|extra|diff|lost|data loss|record missing|incomplete/.test(normalized))
        return 'Diff / Row Mismatch';
    if (/transform|mapping|field mapping|translation/.test(normalized))
        return 'Transformation Validation';
    const anomalyText = anomalies
        .map(a => String((a === null || a === void 0 ? void 0 : a.rule) || (a === null || a === void 0 ? void 0 : a.message) || ''))
        .join(' ')
        .toLowerCase();
    if (/schema/.test(anomalyText))
        return 'Schema Validation';
    if (/missing|extra|not found|cannot find/.test(anomalyText))
        return 'Row Count / Missing Records';
    if (/amount|negative|precision|truncated/.test(anomalyText))
        return 'Amount Validation';
    return 'General Validation';
}
exports.applyBusinessRule = applyBusinessRule;
function formatAnomalySummary(anomalies) {
    if (!anomalies || anomalies.length === 0) {
        return '✅ No anomalies detected';
    }
    const rules = anomalies.map(a => String((a === null || a === void 0 ? void 0 : a.rule) || (a === null || a === void 0 ? void 0 : a.message) || 'issue')).slice(0, 5);
    const suffix = anomalies.length > 5 ? `...and ${anomalies.length - 5} more` : '';
    return `⚠️ Found ${anomalies.length} validation issues: ${rules.join(', ')}${suffix ? ` ${suffix}` : ''}`;
}
exports.formatAnomalySummary = formatAnomalySummary;
