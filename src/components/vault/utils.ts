export const logoSrc = `${import.meta.env.BASE_URL}CharacterVaultLogo.svg`;

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

type Translate = (key: string, values?: Record<string, string | number>) => string;

/** Relative label for vault timestamps (opened / edited). */
export function formatRelativeTime(timestamp: string | undefined, t: Translate): string {
  if (!timestamp) return t('time.never');
  const diff = Date.now() - new Date(timestamp).getTime();
  if (Number.isNaN(diff) || diff < 0) return t('time.justNow');
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return t('time.justNow');
  if (minutes < 60) return t('time.minutesAgo', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('time.hoursAgo', { count: hours });
  const days = Math.floor(hours / 24);
  if (days === 1) return t('time.yesterday');
  if (days < 30) return t('time.daysAgo', { count: days });
  const months = Math.floor(days / 30);
  if (months < 12) return t('time.monthsAgo', { count: months });
  return t('time.yearsAgo', { count: Math.floor(months / 12) });
}

export function getVaultPageSize(): number {
  return 12;
}

export function getVisiblePageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const windowPages = new Set<number>([1, 2, total - 1, total, current - 1, current, current + 1]);
  const sorted = [...windowPages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result: (number | 'ellipsis')[] = [];
  let prev = 0;
  for (const page of sorted) {
    if (prev !== 0 && page - prev > 1) {
      result.push('ellipsis');
    }
    result.push(page);
    prev = page;
  }
  return result;
}
