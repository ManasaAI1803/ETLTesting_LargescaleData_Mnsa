export function hashRow(row: any): string {
    const normalized = Object.keys(row || {})
        .sort()
        .map(key => `${key}:${JSON.stringify(row[key])}`)
        .join('|');

    let hash = 0;
    for (let i = 0; i < normalized.length; i += 1) {
        const chr = normalized.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
    }

    return hash.toString(16);
}

export function hashTable(rows: any[]): string {
    return rows.map(hashRow).join(',');
}
