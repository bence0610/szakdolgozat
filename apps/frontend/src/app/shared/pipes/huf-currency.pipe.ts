import { Pipe, PipeTransform } from '@angular/core';

const HUF_FORMATTER = new Intl.NumberFormat('hu-HU', {
  style: 'currency',
  currency: 'HUF',
  maximumFractionDigits: 0,
});

/**
 * Formats a forint amount using the Hungarian locale: `12 500 Ft`.
 * Returns an em-dash for null/undefined inputs so empty cells render cleanly.
 */
@Pipe({
  name: 'hufCurrency',
  standalone: true,
  pure: true,
})
export class HufCurrencyPipe implements PipeTransform {
  transform(value: number | string | undefined | null): string {
    if (value === null || value === undefined || value === '') {
      return '—';
    }
    const numeric = typeof value === 'string' ? Number(value) : value;
    if (Number.isNaN(numeric)) {
      return '—';
    }
    return HUF_FORMATTER.format(numeric);
  }
}
