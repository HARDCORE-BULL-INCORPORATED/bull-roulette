const hashStringSeed = (seed: string): number => {
    let h = 1779033703 ^ seed.length;
    for (let i = 0; i < seed.length; i += 1) {
        h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
        h = (h << 13) | (h >>> 19);
    }
    return h >>> 0;
};

const mulberry32 = (seed: number) => {
    let a = seed >>> 0;
    return () => {
        a += 0x6d2b79f5;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

export const createSeededRng = (seed: number | string): (() => number) => {
    const normalizedSeed =
        typeof seed === "number" ? seed >>> 0 : hashStringSeed(seed);
    return mulberry32(normalizedSeed);
};
