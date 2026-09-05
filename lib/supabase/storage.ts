export const DOCS_BUCKET = "practicum-docs";

export function docStoragePath(requestId: string, category: string, fileName: string): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  return `${requestId}/${category}/${Date.now()}-${safeName}`;
}
