/**
 * Dynamically updates page Title and Meta Description tags for SEO optimization.
 */
export function updateSEO(title: string, description: string) {
  document.title = title;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.setAttribute('content', description);
  }
}
