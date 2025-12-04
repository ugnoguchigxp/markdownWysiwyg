/**
 * JsonToMarkdownConverter - JSON構造からMarkdown形式への変換
 * TipTapエディターのJSON形式をMarkdownテキストに変換
 */

import { JSONContent } from '@tiptap/react';
import { createLogger } from '../utils/logger';

const log = createLogger('JsonToMarkdownConverter');

export class JsonToMarkdownConverter {
  /**
   * TipTap JSON構造をMarkdownテキストに変換
   */
  static convertToMarkdown(json: JSONContent): string {
    if (!json || !json.content) {
      return '';
    }

    return this.processNodes(json.content);
  }

  /**
   * ノード配列を処理してMarkdownテキストを生成
   */
  private static processNodes(nodes: JSONContent[], depth: number = 0): string {
    return nodes.map(node => this.processNode(node, depth)).join('');
  }

  /**
   * 単一ノードを処理してMarkdownテキストを生成
   */
  private static processNode(node: JSONContent, depth: number = 0): string {
    if (!node.type) {
      return '';
    }

    switch (node.type) {
      case 'paragraph':
        return this.processParagraph(node, depth);

      case 'heading':
        return this.processHeading(node);

      case 'bulletList':
        return this.processBulletList(node, depth);

      case 'orderedList':
        return this.processOrderedList(node, depth);

      case 'listItem':
        return this.processListItem(node, depth);

      case 'blockquote':
        return this.processBlockquote(node);

      case 'codeBlock':
        return this.processCodeBlock(node);

      case 'table':
        return this.processTable(node);

      case 'tableRow':
        return this.processTableRow(node);

      case 'tableHeader':
      case 'tableCell':
        return this.processTableCell(node);

      case 'horizontalRule':
        return '\n---\n\n';

      case 'hardBreak':
        return '\n';

      case 'image':
        return this.processImage(node);

      case 'text':
        return this.processText(node);

      default:
        log.warn(`Unsupported node type: ${node.type}`);
        return node.content ? this.processNodes(node.content, depth) : '';
    }
  }

  /**
   * 段落の処理
   */
  private static processParagraph(node: JSONContent, depth: number): string {
    const content = node.content ? this.processNodes(node.content, depth) : '';
    return content + '\n\n';
  }

  /**
   * 見出しの処理
   */
  private static processHeading(node: JSONContent): string {
    const level = node.attrs?.level || 1;
    const content = node.content ? this.processNodes(node.content) : '';
    const hashes = '#'.repeat(Math.min(Math.max(level, 1), 6));
    return `${hashes} ${content}\n\n`;
  }

  /**
   * 箇条書きリストの処理
   */
  private static processBulletList(node: JSONContent, depth: number): string {
    const content = node.content ? this.processNodes(node.content, depth) : '';
    return content + '\n';
  }

  /**
   * 番号付きリストの処理
   */
  private static processOrderedList(node: JSONContent, depth: number): string {
    const content = node.content ? this.processNodes(node.content, depth) : '';
    return content + '\n';
  }

  /**
   * リストアイテムの処理
   */
  private static processListItem(node: JSONContent, depth: number): string {
    const content = node.content ? this.processNodes(node.content, depth + 1) : '';
    const indent = '  '.repeat(depth);
    // コンテンツが改行で終わっている場合、その改行を維持しつつインデントを適用するのは難しい
    // ここでは単純に先頭にインデントとマーカーを付与
    // ネストされたリストがある場合、その部分は processBulletList/OrderedList で処理されるが
    // インデントの扱いは複雑。
    // 簡易的な実装として、コンテンツ全体をトリムして配置
    return `${indent}- ${content.trim()}\n`;
  }

  /**
   * 引用の処理
   */
  private static processBlockquote(node: JSONContent): string {
    const content = node.content ? this.processNodes(node.content) : '';
    return content
      .split('\n')
      .filter(line => line.trim())
      .map(line => `> ${line}`)
      .join('\n') + '\n\n';
  }

  /**
   * コードブロックの処理
   */
  private static processCodeBlock(node: JSONContent): string {
    const language = node.attrs?.language || '';
    const content = node.content ? this.processNodes(node.content) : '';
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

    const rows = node.content.map(row => this.processTableRow(row));
    let markdown = rows.join('');

    // ヘッダー行の区切り線を追加（2行目に）
    const lines = markdown.trim().split('\n');
    if (lines.length >= 2 && lines[0]) {
      const headerSeparator = lines[0]
        .split('|')
        .map(() => '---')
        .join('|');
      lines.splice(1, 0, headerSeparator);
      markdown = lines.join('\n') + '\n\n';
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

    const cells = node.content.map(cell => {
      const content = this.processTableCell(cell);
      return content.trim().replace(/\n/g, ' '); // セル内改行を除去
    });

    return `|${cells.join('|')}|\n`;
  }

  /**
   * テーブルセルの処理
   */
  private static processTableCell(node: JSONContent): string {
    return node.content ? this.processNodes(node.content) : '';
  }

  /**
   * テキストの処理（マークアップ適用）
   */
  private static processText(node: JSONContent): string {
    let text = node.text || '';

    if (node.marks) {
      node.marks.forEach(mark => {
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
      });
    }

    return text;
  }

  /**
   * Markdownファイルとしてダウンロード
   */
  static downloadAsMarkdown(json: JSONContent, filename: string = 'document.md'): void {
    try {
      const markdownContent = this.convertToMarkdown(json);

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
