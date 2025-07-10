export function formatDate(date: Date) {
  // Want MM/DD/YYYY
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateString(date: string) {
  try {
    const dateObj = new Date(date + 'Z');
    // make sure UTC still has same date
    // if (dateObj.getHours() === 0) {
    dateObj.setHours(dateObj.getHours() + 6);
    // }
    return formatDate(dateObj);
  } catch (e) {
    return date;
  }
}
