export const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
export const wrapIndex = (index, count) => ((index % count) + count) % count;
