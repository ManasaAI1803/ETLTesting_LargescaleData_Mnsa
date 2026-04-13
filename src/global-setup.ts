import { QueryStore } from './queryStore';
import { ReportStateStore } from './reporters/reportStateStore';

export default async function globalSetup() {
    console.log('📦 Global setup: resetting shared report state and query log');
    ReportStateStore.clearState();
    const queryStore = QueryStore.getInstance();
    queryStore.clear();
}
