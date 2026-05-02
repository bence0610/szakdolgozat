import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formats a positive remaining-millisecond count as `mm:ss`. Returns
 * `00:00` when the value is non-positive or invalid.
 */
@Pipe({
  name: 'countdown',
  standalone: true,
})
export class CountdownPipe implements PipeTransform {
  transform(remainingMs: number | null | undefined): string {
    if (!remainingMs || remainingMs <= 0 || !Number.isFinite(remainingMs)) {
      return '00:00';
    }
    const totalSeconds = Math.floor(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${pad(minutes)}:${pad(seconds)}`;
  }
}

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}
