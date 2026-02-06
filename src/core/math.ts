/** Degrees in a full rotation. */
export const FULL_ROTATION = 360;

/** Clamp a number to the given range. */
export const clamp = (value: number, min: number, max: number): number =>
    Math.min(max, Math.max(min, value));

/** Normalize an angle to the [0, 360) range. */
export const normalizeAngle = (angle: number): number => {
    let normalized = angle % FULL_ROTATION;
    if (normalized < 0) normalized += FULL_ROTATION;
    return normalized;
};

/** Linear interpolation between start and end. */
export const lerp = (start: number, end: number, t: number): number => start + (end - start) * t;

/** Easing function used by default for spin deceleration. */
export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
