/**
 * Element → CSS selector, shared by the SDK (when a click is recorded) and the
 * heatmap viewer (to find the same element on the live page). Anchors on
 * data-analytics-id or a clean id; otherwise tag:nth-of-type steps up to
 * <body>. Class names are skipped on purpose — utility classes change.
 */
/** A stable-ish path to the element: data-analytics-id / clean id anchors, else tag:nth-of-type steps. */
export function selectorOf(el: Element): string {
  // The element's own document — the heatmap viewer runs this on an iframe's page.
  const doc = el.ownerDocument;
  const parts: string[] = [];
  let node: Element | null = el;
  for (let depth = 0; node && depth < 12; depth++) {
    if (node === doc.body || node === doc.documentElement) {
      parts.unshift("body");
      break;
    }
    const aid = node.getAttribute("data-analytics-id");
    if (aid && /^[\w-]{1,60}$/.test(aid)) {
      parts.unshift(`[data-analytics-id="${aid}"]`);
      break;
    }
    const id = node.id;
    if (id && /^[A-Za-z][\w-]{0,50}$/.test(id) && !/\d{3,}/.test(id)) {
      parts.unshift(`#${id}`);
      break;
    }
    const tag = node.tagName.toLowerCase();
    const parent: Element | null = node.parentElement;
    if (!parent) {
      parts.unshift(tag);
      break;
    }
    let index = 0;
    let count = 0;
    for (const sibling of Array.from(parent.children)) {
      if (sibling.tagName === node.tagName) {
        count += 1;
        if (sibling === node) index = count;
      }
    }
    parts.unshift(count > 1 ? `${tag}:nth-of-type(${index})` : tag);
    node = parent;
  }
  return parts.join(">").slice(0, 300);
}

