export type TestStep = {
    name: string;
    status: 'pass' | 'fail';
    log: string;
    timestamp: string;
};

export function createStep(name: string, status: 'pass' | 'fail', log: string): TestStep {
    return {
        name,
        status,
        log,
        timestamp: new Date().toISOString()
    };
}

export function appendStep(steps: TestStep[], name: string, status: 'pass' | 'fail', log: string): void {
    steps.push(createStep(name, status, log));
}
