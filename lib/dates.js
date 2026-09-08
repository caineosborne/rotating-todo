const MILLISECONDS_PER_DAY = 86_400_000;

function localDayNumber(date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / MILLISECONDS_PER_DAY;
}

export function calendarDaysSince(value, now = new Date()) {
  if (!value) return null;
  const date = new Date(value);
  const current = new Date(now);
  if (Number.isNaN(date.getTime()) || Number.isNaN(current.getTime())) return null;
  return Math.max(0, localDayNumber(current) - localDayNumber(date));
}

export function toDateInputValue(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function dateInputToISOString(value, now = new Date()) {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match.map(Number);
  const current = new Date(now);
  const selected = new Date(year, month - 1, day, 12, 0, 0, 0);
  if (
    selected.getFullYear() !== year
    || selected.getMonth() !== month - 1
    || selected.getDate() !== day
  ) return null;

  if (toDateInputValue(selected) === toDateInputValue(current)) {
    selected.setHours(current.getHours(), current.getMinutes(), current.getSeconds(), current.getMilliseconds());
  }
  return selected.toISOString();
}
