/** Quita los caracteres con significado en los filtros de PostgREST para evitar inyección. */
export function searchTerm(value: string | undefined | null, max = 80) {
  return (value ?? "")
    .replace(/[,()*%_\\"':]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}
