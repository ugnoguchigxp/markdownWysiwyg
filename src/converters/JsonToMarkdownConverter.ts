/**
 * JsonToMarkdownConverter - JSON構造からMarkdown形式への変換
 * TipTapエディターのJSON形式をMarkdownテキストに変換
 */

import type { JSONContent } from '@tiptap/react';
import { createLogger } from '../utils/logger';

const log = createLogger('JsonToMarkdownConverter');

export class JsonToMarkdownConverter {
  // This prevents the class from being "static-only" for linting purposes while preserving the public API.
  private readonly _instanceMarker = 0;

  private constructor() {
    // Intentionally empty.
  }

  /**
   * TipTap JSON構造をMarkdownテキストに変換
   */
  static convertToMarkdown(json: JSONContent): string {
    if (!json || !json.content) {
      return '';
    }

    return JsonToMarkdownConverter.processNodes(json.content);
  }

  /**
   * ノード配列を処理してMarkdownテキストを生成
   */
  private static processNodes(nodes: JSONContent[], depth = 0): string {
    return nodes.map((node) => JsonToMarkdownConverter.processNode(node, depth)).join('');
  }

  /**
   * 単一ノードを処理してMarkdownテキストを生成
   */
  private static processNode(node: JSONContent, depth = 0): string {
    if (!node.type) {
      return '';
    }

    switch (node.type) {
      case 'paragraph':
        return JsonToMarkdownConverter.processParagraph(node, depth);

      case 'heading':
        return JsonToMarkdownConverter.processHeading(node);

      case 'bulletList':
        return JsonToMarkdownConverter.processBulletList(node, depth);

      case 'orderedList':
        return JsonToMarkdownConverter.processOrderedList(node, depth);

      case 'listItem':
        return JsonToMarkdownConverter.processListItem(node, depth);

      case 'blockquote':
        return JsonToMarkdownConverter.processBlockquote(node);

      case 'codeBlock':
        return JsonToMarkdownConverter.processCodeBlock(node);

      case 'table':
        return JsonToMarkdownConverter.processTable(node);

      case 'tableRow':
        return JsonToMarkdownConverter.processTableRow(node);

      case 'tableHeader':
      case 'tableCell':
        return JsonToMarkdownConverter.processTableCell(node);

      case 'horizontalRule':
        return '\n---\n\n';

      case 'hardBreak':
        return '\n';

      case 'image':
        return JsonToMarkdownConverter.processImage(node);

      case 'text':
        return JsonToMarkdownConverter.processText(node);

      default:
        log.warn(`Unsupported node type: ${node.type}`);
        return node.content ? JsonToMarkdownConverter.processNodes(node.content, depth) : '';
    }
  }

  /**
   * 段落の処理
   */
  private static processParagraph(node: JSONContent, depth: number): string {
    const content = node.content ? JsonToMarkdownConverter.processNodes(node.content, depth) : '';
    return `${content}\n\n`;
  }

  /**
   * 見出しの処理
   */
  private static processHeading(node: JSONContent): string {
    const level = node.attrs?.level || 1;
    const content = node.content ? JsonToMarkdownConverter.processNodes(node.content) : '';
    const hashes = '#'.repeat(Math.min(Math.max(level, 1), 6));
    return `${hashes} ${content}\n\n`;
  }

  /**
   * 箇条書きリストの処理
   */
  private static processBulletList(node: JSONContent, depth: number): string {
    const items = node.content || [];
    const content = items
      .map((item) => JsonToMarkdownConverter.processListItemWithMarker(item, depth, '-'))
      .join('');
    return `${content}\n`;
  }

  /**
   * 番号付きリストの処理
   */
  private static processOrderedList(node: JSONContent, depth: number): string {
    const items = node.content || [];
    const content = items
      .map((item, idx) =>
        JsonToMarkdownConverter.processListItemWithMarker(item, depth, `${idx + 1}.`),
      )
      .join('');
    return `${content}\n`;
  }

  /**
   * リストアイテムの処理
   */
  private static processListItem(node: JSONContent, depth: number): string {
    // Fallback: if listItem appears without a parent list, treat as a bullet item.
    return JsonToMarkdownConverter.processListItemWithMarker(node, depth, '-');
  }

  private static processListItemWithMarker(
    node: JSONContent,
    depth: number,
    marker: string,
  ): string {
    const indent = '  '.repeat(depth);
    const children = node.content || [];

    // TipTap listItem content is typically: paragraph + (optional nested list)
    let firstLine = '';
    const rest: JSONContent[] = [];

    for (const child of children) {
      if (child.type === 'paragraph' && firstLine === '') {
        firstLine = child.content
          ? JsonToMarkdownConverter.processNodes(child.content, 0).trim()
          : '';
        continue;
      }
      rest.push(child);
    }

    let out = `${indent}${marker} ${firstLine}\n`;

    for (const child of rest) {
      if (child.type === 'bulletList' || child.type === 'orderedList') {
        // Nested lists should be indented one level deeper
        out += JsonToMarkdownConverter.processNode(child, depth + 1);
        continue;
      }

      if (child.type === 'paragraph') {
        const text = child.content
          ? JsonToMarkdownConverter.processNodes(child.content, 0).trim()
          : '';
        if (text) {
          out += `${indent}  ${text}\n`;
        }
        continue;
      }

      out += JsonToMarkdownConverter.processNode(child, depth + 1);
    }

    return out;
  }

  /**
   * 引用の処理
   */
  private static processBlockquote(node: JSONContent): string {
    const content = node.content ? JsonToMarkdownConverter.processNodes(node.content) : '';
    return `${content
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => `> ${line}`)
      .join('\n')}\n\n`;
  }

  /**
   * コードブロックの処理
   */
  private static processCodeBlock(node: JSONContent): string {
    const language = node.attrs?.language || '';
    const content = node.content ? JsonToMarkdownConverter.processNodes(node.content) : '';
    return `\`\`\`${language}\n${content.trim()}\n\`\`\`\n\n`;
  }

  /**
   * 画像の処理
   */
  private static processImage(node: JSONContent): string {
    const src = node.attrs?.src || '';
    const alt = node.attrs?.alt || '';
    return `![${alt}](${src})`;
  }

  /**
   * テーブルの処理
   */
  private static processTable(node: JSONContent): string {
    if (!node.content || node.content.length === 0) {
      return '';
    }

    const rows = node.content.map((row) => JsonToMarkdownConverter.processTableRow(row));
    let markdown = rows.join('');

    // ヘッダー行の区切り線を追加（2行目に）
    const lines = markdown.trim().split('\n');
    if (lines.length >= 2 && lines[0]) {
      // NOTE: `processTableRow` always emits a leading and trailing `|`.
      // `split('|')` therefore includes empty tokens at both ends.
      // We derive column count from token length to preserve empty cells (e.g. "|||").
      const headerParts = lines[0].split('|');
      const columnCount = Math.max(1, headerParts.length - 2);
      const headerSeparator = `|${Array.from({ length: columnCount })
        .map(() => '---')
        .join('|')}|`;
      lines.splice(1, 0, headerSeparator);
      markdown = `${lines.join('\n')}\n\n`;
    }

    return markdown;
  }

  /**
   * テーブル行の処理
   */
  private static processTableRow(node: JSONContent): string {
    if (!node.content) {
      return '';
    }

    const cells = node.content.map((cell) => {
      const content = JsonToMarkdownConverter.processTableCell(cell);
      const normalized = content.trim().replace(/\n/g, ' '); // セル内改行を除去
      // Empty cells must still include a placeholder (space) to be recognized as a table by parsers.
      return normalized.length === 0 ? ' ' : normalized;
    });

    return `|${cells.join('|')}|\n`;
  }

  /**
   * テーブルセルの処理
   */
  private static processTableCell(node: JSONContent): string {
    return node.content ? JsonToMarkdownConverter.processNodes(node.content) : '';
  }

  /**
   * テキストの処理（マークアップ適用）
   */
  private static processText(node: JSONContent): string {
    let text = node.text || '';

    if (node.marks) {
      for (const mark of node.marks) {
        switch (mark.type) {
          case 'bold':
            text = `**${text}**`;
            break;
          case 'italic':
            text = `*${text}*`;
            break;
          case 'code':
            text = `\`${text}\``;
            break;
          case 'strike':
            text = `~~${text}~~`;
            break;
          case 'link': {
            const href = mark.attrs?.href || '#';
            const title = mark.attrs?.title ? ` "${mark.attrs.title}"` : '';
            text = `[${text}](${href}${title})`;
            break;
          }
        }
      }
    }

    return text;
  }

  /**
   * Markdownファイルとしてダウンロード
   */
  static downloadAsMarkdown(json: JSONContent, filename = 'document.md'): void {
    try {
      const markdownContent = JsonToMarkdownConverter.convertToMarkdown(json);

      if (!markdownContent.trim()) {
        log.warn('Empty content, skipping download');
        return;
      }

      const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      const downloadFilename = filename.endsWith('.md') ? filename : `${filename}.md`;
      link.download = downloadFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      log.debug(`Downloaded: ${downloadFilename}`);
    } catch (error) {
      log.error('Download failed:', error);
      throw new Error('Markdownファイルのダウンロードに失敗しました');
    }
  }
}

export default JsonToMarkdownConverter;
