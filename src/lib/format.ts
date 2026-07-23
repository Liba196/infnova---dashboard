export function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(
      new Date(iso)
    );
  } catch {
    return iso;
  }
}
