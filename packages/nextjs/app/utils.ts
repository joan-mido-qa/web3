export const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

export const emptyMnemonic = (): Map<number, string> => new Map(Array.from({ length: 12 }).map((_, i) => [i, ""]));
