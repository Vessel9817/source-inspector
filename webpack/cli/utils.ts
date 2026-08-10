export function showError(err: unknown): void {
    if (err instanceof Error) {
        console.error(err.message);
    }
    else {
        console.error(err);
    }

    process.exitCode = 1;
}
