export function dateSortingComparator(a: string, b: string) {
  const x = new Date(a + 'Z');
  const y = new Date(b + 'Z');
  return x < y ? -1 : x > y ? 1 : 0;
}
