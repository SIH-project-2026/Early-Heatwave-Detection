export function formatNumber(val: number): string {
  return new Intl.NumberFormat('en-IN').format(val);
}

export function formatTemp(val: number): string {
  return `${val.toFixed(1)}°C`;
}

export function formatPercent(val: number): string {
  return `${(val * 100).toFixed(0)}%`;
}

export function formatHvi(val: number): string {
  return val.toFixed(2);
}

export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}
