export const isValidUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:', 'mailto:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

export const sanitizeText = (text: string): string => {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

export const normalizeUrlOrNull = (url: string): string | null => {
  if (typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (!isValidUrl(trimmed)) {
    return null;
  }

  try {
    return new URL(trimmed).toString();
  } catch {
    return null;
  }
};

export const sanitizeSvg = (svg: string): string => {
  if (!svg || typeof window === 'undefined') return '';

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, 'image/svg+xml');

    const forbiddenSelectors = ['script', 'foreignObject', 'iframe', 'object', 'embed', 'link'];
    for (const sel of forbiddenSelectors) {
      for (const el of doc.querySelectorAll(sel)) {
        el.remove();
      }
    }

    for (const el of doc.querySelectorAll('*')) {
      for (const attr of [...el.attributes]) {
        const name = attr.name.toLowerCase();
        const value = attr.value;

        if (name.startsWith('on')) {
          el.removeAttribute(attr.name);
          continue;
        }

        if (name === 'href' || name === 'xlink:href') {
          const v = value.trim().toLowerCase();
          if (v.startsWith('javascript:') || v.startsWith('data:text/html')) {
            el.removeAttribute(attr.name);
          }
        }
      }
    }

    const root = doc.documentElement;
    return root?.outerHTML || '';
  } catch {
    return '';
  }
};
