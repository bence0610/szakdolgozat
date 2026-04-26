import { Pipe, PipeTransform } from '@angular/core';

export interface TimeUntilParts {
  readonly days: number;
  readonly hours: number;
  readonly minutes: number;
  readonly seconds: number;
  readonly isPast: boolean;
  readonly totalSeconds: number;
}

/**
 * Stateless formatter that converts a future ISO timestamp (or `Date`)
 * into a `TimeUntilParts` struct. Pure pipe — recomputes on every
 * `now` change, so the calling component is responsible for ticking
 * (rxjs `timer(0, 1000)`).
 */
@Pipe({
  name: 'timeUntil',
  standalone: true,
  pure: true,
})
export class TimeUntilPipe implements PipeTransform {
  transform(target: string | Date | undefined | null, now: number = Date.now()): TimeUntilParts {
    if (!target) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true, totalSeconds: 0 };
    }
    const targetMs = target instanceof Date ? target.getTime() : new Date(target).getTime();
    const diffMs = targetMs - now;
    const isPast = diffMs <= 0;
    const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { days, hours, minutes, seconds, isPast, totalSeconds };
  }
}

/**
 * Two-digit zero-padded formatter for countdown segments.
 */
@Pipe({
  name: 'pad2',
  standalone: true,
  pure: true,
})
export class Pad2Pipe implements PipeTransform {
  transform(value: number | undefined | null): string {
    const n = Math.max(0, Math.floor(value ?? 0));
    return n.toString().padStart(2, '0');
  }
}
