/**
 * Converts time string (e.g., '1h', '30d') to seconds
 * Supports: s (seconds), m (minutes), h (hours), d (days)
 */
export function timeStringToSeconds(timeString: string): number {
  const match = timeString.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(
      `Invalid time format: ${timeString}. Expected format: number + unit (s/m/h/d)`,
    );
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 24 * 60 * 60;
    default:
      throw new Error(`Unsupported time unit: ${unit}`);
  }
}

/**
 *
 * Supports: For 1 hour = 1, For 24 hours = 24, 30minutes = 0.5
 */
export function setExpireAt(hours: number): Date {
  const expirationHours = hours;
  const expiresAt = new Date();
  return new Date(expiresAt.setHours(expiresAt.getHours() + expirationHours));
}
