import { generateHTML } from '@tiptap/core';
import CharacterCount from '@tiptap/extension-character-count';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import Typography from '@tiptap/extension-typography';
import StarterKit from '@tiptap/starter-kit';
import { common, createLowlight } from 'lowlight';
import { ImageExtension } from '../extensions/ImageExtension';
import { MarkdownTipTapConverter } from './MarkdownTipTapConverter';

export interface SsgOptions {
  /**
   * Prefix for image paths (e.g. /images)
   */
  publicImagePathPrefix?: string;
  /**
   * Custom class names for elements
   */
  classNames?: {
    image?: string;
    table?: string;
    blockquote?: string;
  };
}

/**
 * Static HTML Generator
 * Generates static HTML from Markdown without relying on React or browser DOM.
 * Suitable for SSG (Static Site Generation).
 */
export class StaticHtmlGenerator {
  private constructor() {
    // Intentionally empty
  }

  /**
   * Generates static HTML from Markdown string
   */
  static async generateStaticHtml(markdown: string, options?: SsgOptions): Promise<string> {
    // 1. Convert Markdown to TipTap JSON
    const json = await MarkdownTipTapConverter.markdownToTipTapJson(markdown, {
      publicImagePathPrefix: options?.publicImagePathPrefix,
    });

    // 2. Configure extensions (minimal set for static rendering)
    const lowlight = createLowlight(common);

    const extensions = [
      StarterKit.configure({
        codeBlock: false, // Use CodeBlockLowlight instead
        link: false, // Configure separately
        blockquote: {
          HTMLAttributes: {
            class: options?.classNames?.blockquote || 'blockquote-custom',
          },
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: options?.classNames?.table || 'markdown-advance-table',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
      Link.configure({
        openOnClick: false,
      }),

      ImageExtension.configure({
        inline: true,
        allowBase64: false,
        HTMLAttributes: {
          class:
            options?.classNames?.image ||
            'max-w-full h-auto rounded-lg shadow-sm border border-border my-2',
        },
      }),
      CharacterCount,
      Typography,
    ];

    // 3. Generate HTML
    try {
      return generateHTML(json, extensions);
    } catch (error) {
      // If running in an environment without DOM (and no polyfill), this might fail
      console.warn(
        'generateHTML failed, possibly due to missing DOM environment. Please ensure window/document is available or polyfilled.',
        error,
      );
      throw error;
    }
  }
}
