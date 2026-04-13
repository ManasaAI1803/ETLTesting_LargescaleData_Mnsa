"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnomalyReport = void 0;
const fs_1 = require("fs");
class AnomalyReport {
    constructor() {
        this.anomalies = [];
    }
    addAnomaly(table, rule, row) {
        this.anomalies.push({ table, rule, row });
    }
    addAnomalies(table, anomalies) {
        anomalies.forEach(anomaly => this.addAnomaly(table, anomaly.rule, anomaly.row));
    }
    generateReport() {
        let report = 'Anomaly Report\n\n';
        this.anomalies.forEach(anomaly => {
            report += `Table: ${anomaly.table}\n`;
            report += `Rule Violated: ${anomaly.rule}\n`;
            report += `Row: ${JSON.stringify(anomaly.row, null, 2)}\n\n`;
        });
        return report;
    }
    saveReport(filePath) {
        const report = this.generateReport();
        (0, fs_1.writeFileSync)(filePath, report);
    }
}
exports.AnomalyReport = AnomalyReport;
