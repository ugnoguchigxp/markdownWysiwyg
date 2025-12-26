import { describe, expect, it } from 'vitest';
import {
  isValidUrl,
  sanitizeText,
  normalizeUrlOrNull,
  normalizeImageSrcOrNull,
  sanitizeSvg,
} from '../../src/utils/security';

describe('security', () => {
  describe('isValidUrl', () => {
    it('should return true for valid http URLs', () => {
      expect(isValidUrl('http://example.com')).toBe(true);
    });

    it('should return true for valid https URLs', () => {
      expect(isValidUrl('https://example.com/path?query=1')).toBe(true);
    });

    it('should return true for valid mailto URLs', () => {
      expect(isValidUrl('mailto:test@example.com')).toBe(true);
    });

    it('should return false for javascript: URLs', () => {
      expect(isValidUrl('javascript:alert(1)')).toBe(false);
    });

    it('should return false for data: URLs', () => {
      expect(isValidUrl('data:text/plain;base64,SGVsbG8=')).toBe(false);
    });

    it('should return false for invalid URL strings', () => {
      expect(isValidUrl('not a url')).toBe(false);
    });
  });

  describe('sanitizeText', () => {
    it('should escape HTML tags', () => {
      const input = '<script>alert(1)</script>';
      const expected = '&lt;script&gt;alert(1)&lt;/script&gt;';
      expect(sanitizeText(input)).toBe(expected);
    });

    it('should escape special characters', () => {
      const input = 'Me & You "Quotes"';
      expect(sanitizeText(input)).toBe('Me &amp; You &quot;Quotes&quot;');
    });

    it('should handle empty strings', () => {
      expect(sanitizeText('')).toBe('');
    });

    it('should return empty string for null/undefined', () => {
      expect(sanitizeText(null as unknown as string)).toBe('');
      expect(sanitizeText(undefined as unknown as string)).toBe('');
    });
  });

  describe('normalizeUrlOrNull', () => {
    it('should return normalized URL for valid URLs', () => {
      expect(normalizeUrlOrNull('https://example.com')).toBe('https://example.com/');
      expect(normalizeUrlOrNull('http://example.com/path')).toBe('http://example.com/path');
    });

    it('should return null for invalid URLs', () => {
      expect(normalizeUrlOrNull('javascript:alert(1)')).toBe(null);
      expect(normalizeUrlOrNull('not a url')).toBe(null);
    });

    it('should return null for empty string', () => {
      expect(normalizeUrlOrNull('')).toBe(null);
    });

    it('should return null for non-string input', () => {
      expect(normalizeUrlOrNull(null as unknown as string)).toBe(null);
      expect(normalizeUrlOrNull(undefined as unknown as string)).toBe(null);
    });

    it('should handle whitespace', () => {
      expect(normalizeUrlOrNull('  https://example.com  ')).toBe('https://example.com/');
    });
  });

  describe('normalizeImageSrcOrNull', () => {
    it('should return normalized URL for valid http/https images', () => {
      expect(
        normalizeImageSrcOrNull('https://example.com/image.png', {
          publicPathPrefix: 'https://example.com',
        }),
      ).toBe('https://example.com/image.png');

      expect(
        normalizeImageSrcOrNull('http://example.com/image.jpg', {
          publicPathPrefix: 'http://example.com',
        }),
      ).toBe('http://example.com/image.jpg');
    });

    it('should reject javascript: URLs', () => {
      expect(normalizeImageSrcOrNull('javascript:alert(1)', { publicPathPrefix: '' })).toBe(
        null,
      );
    });

    it('should reject data: URLs', () => {
      expect(normalizeImageSrcOrNull('data:image/png;base64,ABC123', { publicPathPrefix: '' })).toBe(
        null,
      );
    });

    it('should reject file: URLs', () => {
      expect(normalizeImageSrcOrNull('file:///etc/passwd', { publicPathPrefix: '' })).toBe(null);
    });

    it('should reject protocol-relative URLs starting with //', () => {
      expect(normalizeImageSrcOrNull('//evil.com/script.js', { publicPathPrefix: '' })).toBe(null);
    });

    it('should reject URLs with path traversal', () => {
      expect(
        normalizeImageSrcOrNull('../etc/passwd', {
          publicPathPrefix: '/public',
        }),
      ).toBe(null);

      expect(
        normalizeImageSrcOrNull('/public/../etc/passwd', {
          publicPathPrefix: '/public',
        }),
      ).toBe(null);
    });

    it('should reject URLs with backslashes', () => {
      expect(
        normalizeImageSrcOrNull('C:\\Windows\\System32\\file.exe', {
          publicPathPrefix: '/public',
        }),
      ).toBe(null);
    });

    it('should reject URLs that do not start with publicPathPrefix', () => {
      expect(
        normalizeImageSrcOrNull('https://example.com/image.png', {
          publicPathPrefix: '/public',
        }),
      ).toBe('https://example.com/image.png');
    });

    it('should accept URLs that start with publicPathPrefix', () => {
      expect(
        normalizeImageSrcOrNull('/public/images/photo.jpg', {
          publicPathPrefix: '/public',
        }),
      ).toBe('/public/images/photo.jpg');

      expect(
        normalizeImageSrcOrNull('/public/images/photo.jpg', {
          publicPathPrefix: '/public/',
        }),
      ).toBe('/public/images/photo.jpg');
    });

    it('should unwrap URL enclosed in angle brackets', () => {
      expect(
        normalizeImageSrcOrNull('</public/image.png>', {
          publicPathPrefix: '/public',
        }),
      ).toBe('/public/image.png');
    });

    it('should handle URL-encoded path traversal', () => {
      expect(
        normalizeImageSrcOrNull('/public/%2e%2e/etc/passwd', {
          publicPathPrefix: '/public',
        }),
      ).toBe(null);
    });

    it('should return null for non-string input', () => {
      expect(normalizeImageSrcOrNull(null as unknown as string)).toBe(null);
      expect(normalizeImageSrcOrNull(undefined as unknown as string)).toBe(null);
    });
  });

  describe('sanitizeSvg', () => {
    it('should remove script tags from SVG', () => {
      const svg = '<svg><script>alert(1)</script><rect width="100" height="100"/></svg>';
      const result = sanitizeSvg(svg);
      expect(result).not.toContain('<script>');
      expect(result).toContain('<rect');
    });

    it('should remove iframe tags from SVG', () => {
      const svg = '<svg><iframe src="evil.js"></iframe><rect width="100" height="100"/></svg>';
      const result = sanitizeSvg(svg);
      expect(result).not.toContain('<iframe>');
    });

    it('should remove object tags from SVG', () => {
      const svg = '<svg><object data="evil.swf"></object><rect width="100" height="100"/></svg>';
      const result = sanitizeSvg(svg);
      expect(result).not.toContain('<object>');
    });

    it('should remove embed tags from SVG', () => {
      const svg = '<svg><embed src="evil.swf"/><rect width="100" height="100"/></svg>';
      const result = sanitizeSvg(svg);
      expect(result).not.toContain('<embed>');
    });

    it('should remove link tags from SVG', () => {
      const svg = '<svg><link href="evil.css"/><rect width="100" height="100"/></svg>';
      const result = sanitizeSvg(svg);
      expect(result).not.toContain('<link>');
    });

    it('should remove event handler attributes', () => {
      const svg = '<svg><rect onclick="alert(1)" onerror="alert(2)" width="100" height="100"/></svg>';
      const result = sanitizeSvg(svg);
      expect(result).not.toContain('onclick');
      expect(result).not.toContain('onerror');
    });

    it('should remove javascript: href attributes', () => {
      const svg = '<svg><a href="javascript:alert(1)"><text>Click</text></a></svg>';
      const result = sanitizeSvg(svg);
      expect(result).not.toContain('javascript:');
    });

    it('should remove data:text/html href attributes', () => {
      const svg = '<svg><a href="data:text/html,<script>alert(1)</script>"><text>Click</text></a></svg>';
      const result = sanitizeSvg(svg);
      expect(result).not.toContain('data:text/html');
    });

    it('should allow safe href attributes', () => {
      const svg = '<svg><a href="https://example.com"><text>Click</text></a></svg>';
      const result = sanitizeSvg(svg);
      expect(result).toContain('href="https://example.com"');
    });

    it('should handle invalid SVG gracefully', () => {
      const result = sanitizeSvg('not valid svg');
      expect(result).toContain('parsererror');
    });

    it('should return empty string for null/undefined', () => {
      expect(sanitizeSvg(null as unknown as string)).toBe('');
      expect(sanitizeSvg(undefined as unknown as string)).toBe('');
    });
  });
});
