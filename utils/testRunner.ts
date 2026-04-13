import { TestResultsCollector } from '../src/reporters/testResultsCollector';
import { createStep, appendStep, TestStep } from './logging';
import { applyBusinessRule } from './validationRules';
import { summarizeError, formatErrorDetails } from './errorFormatting';

export type ValidationTestExecutor = (steps: TestStep[]) => Promise<void>;

export async function runValidationTest(options: {
    suite: string;
    testName: string;
    collector: TestResultsCollector;
    executor: ValidationTestExecutor;
    anomalyContext?: any[];
}): Promise<void> {
    const startTime = Date.now();
    const steps: TestStep[] = [createStep('Test execution started', 'pass', `Started ${options.testName}`)];

    try {
        await options.executor(steps);
        appendStep(steps, 'Test execution completed', 'pass', `Completed ${options.testName} successfully`);
        const duration = Date.now() - startTime;

        options.collector.addResult({
            suite: options.suite,
            test: options.testName,
            status: 'pass',
            duration,
            steps,
            timestamp: new Date().toISOString(),
            businessRulesApplied: [applyBusinessRule(options.testName, options.anomalyContext || [])]
        });
    } catch (error) {
        appendStep(steps, 'Test execution failed', 'fail', `Failed ${options.testName}: ${summarizeError(error)}`);
        const duration = Date.now() - startTime;

        options.collector.addResult({
            suite: options.suite,
            test: options.testName,
            status: 'fail',
            duration,
            details: formatErrorDetails(error),
            steps,
            timestamp: new Date().toISOString(),
            businessRulesApplied: [applyBusinessRule(options.testName, options.anomalyContext || [])]
        });
        throw error;
    }
}
