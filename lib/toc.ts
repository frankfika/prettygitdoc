/**
 * Table of Contents utilities for extracting headings from markdown content
 */

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

/**
 * Extract headings from markdown content
 * Returns an array of TOC items
 */
export function extractTocFromMarkdown(content: string): TocItem[] {
  const lines = content.split("\n");
  const items: TocItem[] = [];
  const usedIds = new Set<string>();

  for (const line of lines) {
    // Match heading syntax: ## Heading or ## Heading {#custom-id}
    const match = line.match(/^(#{2,4})\s+(.+?)(?:\s+\{#([\w-]+)\})?\s*$/);
    if (!match) continue;

    const level = match[1].length;
    const text = match[2].trim();
    let id = match[3];

    // Generate ID if not provided
    if (!id) {
      id = generateHeadingId(text, usedIds);
    }

    usedIds.add(id);
    items.push({ id, text, level });
  }

  return items;
}

/**
 * Generate a unique ID from heading text
 */
function generateHeadingId(text: string, usedIds: Set<string>): string {
  // Convert to lowercase, remove special chars, replace spaces with hyphens
  let baseId = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

  // Handle empty or invalid IDs
  if (!baseId || baseId === "-") {
    baseId = "heading";
  }

  // Ensure uniqueness
  let id = baseId;
  let counter = 1;
  while (usedIds.has(id)) {
    id = `${baseId}-${counter}`;
    counter++;
  }

  return id;
}

/**
 * Add IDs to headings in HTML content
 * This is used for content that's already rendered as HTML
 */
export function addIdsToHeadings(html: string): string {
  const usedIds = new Set<string>();

  return html.replace(
    /<h([2-4])>(.+?)<\/h\1>/g,
    (match, level, content) => {
      // Extract text content (remove HTML tags)
      const text = content.replace(/<[^>]+>/g, "");
      const id = generateHeadingId(text, usedIds);
      usedIds.add(id);
      return `<h${level} id="${id}">${content}</h${level}>`;
    }
  );
}

/**
 * Smooth scroll to a heading by ID
 */
export function scrollToHeading(id: string, offset: number = 80): void {
  const element = document.getElementById(id);
  if (!element) return;

  const top = element.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: "smooth" });
}

/**
 * Get the currently visible heading based on scroll position
 */
export function getVisibleHeading(
  headingIds: string[],
  offset: number = 100
): string | null {
  for (let i = headingIds.length - 1; i >= 0; i--) {
    const element = document.getElementById(headingIds[i]);
    if (element) {
      const rect = element.getBoundingClientRect();
      if (rect.top <= offset) {
        return headingIds[i];
      }
    }
  }
  return headingIds[0] || null;
}
