const durationRegex = /^(\d+)(s|m|h|d)$/;

const durationUnitToMs: Record<"s" | "m" | "h" | "d", number> = {
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

export function parseDurationToMs(duration: string): number {
  const match = durationRegex.exec(duration.trim());

  if (match === null) {
    throw new Error(`Invalid duration format: ${duration}`);
  }

  const value = Number(match[1]);
  const unit = match[2] as keyof typeof durationUnitToMs;

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Invalid duration value: ${duration}`);
  }

  return value * durationUnitToMs[unit];
}
