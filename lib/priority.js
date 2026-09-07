export function priorityAge(item, now = Date.now()) {
  if (!item.lastActioned) return Number.POSITIVE_INFINITY;

  const daysSince = Math.max(0, now - new Date(item.lastActioned).getTime()) / 86_400_000;
  return item.favourite ? daysSince * 2 : daysSince;
}

export function sortItems(items, now = Date.now()) {
  return [...items].sort((a, b) => {
    const priorityDifference = priorityAge(b, now) - priorityAge(a, now);
    if (priorityDifference !== 0) return priorityDifference;
    return a.name.localeCompare(b.name);
  });
}
