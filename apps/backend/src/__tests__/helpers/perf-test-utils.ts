import { describe } from 'vitest';

export const RUN_PERF = process.env.RUN_PERF === '1';

const rawPerfScale = process.env.PERF_SCALE;
const parsedPerfScale = rawPerfScale ? Number.parseFloat(rawPerfScale) : 1;

export const PERF_SCALE = Number.isFinite(parsedPerfScale) && parsedPerfScale > 0 ? parsedPerfScale : 1;

export function scaledCount(base: number, minimum: number = 1): number {
  return Math.max(minimum, Math.round(base * PERF_SCALE));
}

export function describeIfPerf(name: string, suite: () => void): void {
  const runner = RUN_PERF ? describe : describe.skip;
  runner(name, suite);
}
