import { Repository } from '../src/db/repository';

export async function loadSourceData<T = any>(repository: Repository, table: string): Promise<T[]> {
    return repository.fetchSourceData(table);
}

export async function loadTargetData<T = any>(repository: Repository, table: string): Promise<T[]> {
    return repository.fetchTargetData(table);
}

export function partitionByDate<T = any>(data: T[], dateField: string): Record<string, T[]> {
    return data.reduce((acc, row: any) => {
        const date = row?.[dateField];
        if (!date) return acc;
        const monthKey = new Date(date).toISOString().substring(0, 7);
        acc[monthKey] = acc[monthKey] || [];
        acc[monthKey].push(row);
        return acc;
    }, {} as Record<string, T[]>);
}

export function sampleData<T = any>(data: T[], sampleSize: number = 10): T[] {
    const shuffled = [...data].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(sampleSize, data.length));
}

export function getPrimaryKey(table: string): string {
    switch (table) {
        case 'patients': return 'patient_id';
        case 'providers': return 'provider_id';
        case 'visits': return 'visit_id';
        case 'medications': return 'medication_id';
        case 'billing': return 'billing_id';
        default: return 'id';
    }
}
