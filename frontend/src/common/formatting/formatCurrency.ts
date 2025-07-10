export function formatCurrency(value: number) {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
}

export function formatCurrencyFriendly(value: number) {
  // I want 1786838522 to be 1.79 billion
  // and similar for millions, thousands, etc.
  if (value >= 1000000000000) {
    return '$' + (value / 1000000000000).toFixed(2) + ' trillion';
  } else if (value >= 1000000000) {
    return '$' + (value / 1000000000).toFixed(2) + ' billion';
  } else if (value >= 1000000) {
    return '$' + (value / 1000000).toFixed(2) + ' million';
  } else if (value >= 1000) {
    return '$' + (value / 1000).toFixed(2) + ' thousand';
  }
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
}
