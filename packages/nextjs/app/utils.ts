export const emptyMnemonic = (): Map<number, string> => new Map(Array.from({ length: 12 }).map((_, i) => [i, ""]));
