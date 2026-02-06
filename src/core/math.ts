export const FULL_ROTATION = 360;

export const clamp = (value: number, min: number, max: number): number =>
    Math.min(max, Math.max(min, value));

export const normalizeAngle = (angle: number): number => {
    let normalized = angle % FULL_ROTATION;
    if (normalized < 0) normalized += FULL_ROTATION;
    return normalized;
};

export const lerp = (start: number, end: number, t: number): number =>
    start + (end - start) * t;

export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
