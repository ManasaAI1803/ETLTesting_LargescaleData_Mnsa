import { writeFileSync } from 'fs';

export class AnomalyReport {
    private anomalies: Array<{ table: string; rule: string; row: any }> = [];

    constructor() {}

    public addAnomaly(table: string, rule: string, row: any) {
        this.anomalies.push({ table, rule, row });
    }

    public addAnomalies(table: string, anomalies: Array<{ rule: string; row: any }>) {
        anomalies.forEach(anomaly => this.addAnomaly(table, anomaly.rule, anomaly.row));
    }

    public generateReport(): string {
        let report = 'Anomaly Report\n\n';
        this.anomalies.forEach(anomaly => {
            report += `Table: ${anomaly.table}\n`;
            report += `Rule Violated: ${anomaly.rule}\n`;
            report += `Row: ${JSON.stringify(anomaly.row, null, 2)}\n\n`;
        });
        return report;
    }

    public saveReport(filePath: string) {
        const report = this.generateReport();
        writeFileSync(filePath, report);
    }
}