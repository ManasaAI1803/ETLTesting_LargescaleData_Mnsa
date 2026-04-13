function stripAnsi(input: string): string {
    return input
        .replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '')
        .replace(/\\u001b\[[0-?]*[ -/]*[@-~]/g, '')
        .replace(/\\x1B\[[0-?]*[ -/]*[@-~]/g, '');
}

export function summarizeError(error: any): string {
    if (!error) {
        return 'Unknown error';
    }

    const message = typeof error === 'string'
        ? error
        : error?.message || String(error);

    return stripAnsi(message).split(/\r?\n/)[0].slice(0, 240);
}

export function formatErrorDetails(error: any): string {
    if (!error) {
        return 'No error details available.';
    }

    if (typeof error === 'string') {
        return stripAnsi(error);
    }

    if (error instanceof Error) {
        return stripAnsi(error.stack || error.message || String(error));
    }

    try {
        return stripAnsi(JSON.stringify(error, null, 2));
    } catch {
        return stripAnsi(String(error));
    }
}
