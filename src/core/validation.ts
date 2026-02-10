import type { RouletteConfig, SpinOptions } from "./types";

/**
 * Validates the roulette configuration.
 * Throws an error if any configuration is invalid.
 */
export const validateConfig = <T>(config: Partial<RouletteConfig<T>>): void => {
    if (config.segments !== undefined) {
        if (!Array.isArray(config.segments)) {
            throw new TypeError("Segments must be an array.");
        }
        if (config.segments.length === 0) {
            throw new Error("Roulette requires at least one segment.");
        }
    }

    if (config.durationMs !== undefined && config.durationMs < 0) {
        throw new RangeError("durationMs must be non-negative.");
    }

    if (config.minRotations !== undefined && config.minRotations < 0) {
        throw new RangeError("minRotations must be non-negative.");
    }

    if (config.maxRotations !== undefined && config.maxRotations < 0) {
        throw new RangeError("maxRotations must be non-negative.");
    }

    if (
        config.minRotations !== undefined &&
        config.maxRotations !== undefined &&
        config.minRotations > config.maxRotations
    ) {
        throw new RangeError("minRotations cannot be greater than maxRotations.");
    }

    if (config.jitterFactor !== undefined && (config.jitterFactor < 0 || config.jitterFactor > 1)) {
        throw new RangeError("jitterFactor must be between 0 and 1.");
    }
};

/**
 * Validates spin options, potentially merging with base config for cross-field validation.
 * Throws an error if any option is invalid.
 */
export const validateSpinOptions = (
    options: SpinOptions,
    baseConfig?: Partial<RouletteConfig>,
): void => {
    if (options.durationMs !== undefined && options.durationMs < 0) {
        throw new RangeError("durationMs must be non-negative.");
    }

    const minRot = options.minRotations ?? baseConfig?.minRotations;
    const maxRot = options.maxRotations ?? baseConfig?.maxRotations;

    if (options.minRotations !== undefined && options.minRotations < 0) {
        throw new RangeError("minRotations must be non-negative.");
    }
    if (options.maxRotations !== undefined && options.maxRotations < 0) {
        throw new RangeError("maxRotations must be non-negative.");
    }

    if (minRot !== undefined && maxRot !== undefined && minRot > maxRot) {
        throw new RangeError("minRotations cannot be greater than maxRotations.");
    }
};
