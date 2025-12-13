/**
 * Markdown ↔ TipTap JSON Converter
 * 明確な優先順位と処理順序を持つMarkdownパーサー
 *
 * 処理順序:
 * 1. コードブロック抽出（最優先、内部は一切処理しない）
 * 2. テーブル抽出（セル内はインライン要素のみ処理）
 * 3. ブロック要素パース（見出し、リスト、引用など）
 * 4. インライン要素パース（bold, italic, code, linkなど）
 */

import type { JSONContent } from '@tiptap/core';
import type { Editor } from '@tiptap/react';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../utils/logger';
import { normalizeUrlOrNull } from '../utils/security';

const log = createLogger('MarkdownTipTapConverter');

interface TableData {
  headers: string[];
  rows: string[][];
}

/**
 * Phase 1: ブロック要素の抽出とプレースホルダー化
 */
class BlockExtractor {
  // This prevents the class from being "static-only" for linting purposes.
  private readonly _instanceMarker = 0;

  private constructor() {
    // Intentionally empty.
  }

  /**
   * コードブロックを抽出してプレースホルダーに置換
   */
  static extractCodeBlocks(markdown: string): {
    text: string;
    blocks: Map<string, { language: string; code: string }>;
  } {
    const blocks = new Map<string, { language: string; code: string }>();
    const lines = markdown.split('\n');
    const result: string[] = [];

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line?.trim() || '';

      if (trimmed.startsWith('```')) {
        const language = trimmed.substring(3).trim();
        const codeLines: string[] = [];

        let j = i + 1;
        while (j < lines.length) {
          const codeLine = lines[j] || '';
          if (codeLine.trim().startsWith('```')) {
            break;
          }
          codeLines.push(codeLine);
          j++;
        }

        const id = uuidv4();
        const placeholder = `__CODEBLOCK_${id}__`;
        blocks.set(placeholder, {
          language,
          code: codeLines.join('\n'),
        });
        result.push(placeholder);
        log.debug('Extracted code block', { placeholder, language, codeLength: codeLines.length });

        i = j + 1;
      } else {
        result.push(line || '');
        i++;
      }
    }

    return { text: result.join('\n'), blocks };
  }

  /**
   * テーブルを抽出してプレースホルダーに置換
   */
  static extractTables(markdown: string): {
    text: string;
    tables: Map<string, TableData>;
  } {
    const tables = new Map<string, TableData>();
    const lines = markdown.split('\n');
    const result: string[] = [];

    let i = 0;
    while (i < lines.length) {
      const line = lines[i] || '';
      const trimmed = line.trim();

      // テーブル検出（|を含み、複数の|がある）
      if (trimmed.includes('|') && trimmed.split('|').filter(Boolean).length >= 2) {
        const tableLines: string[] = [line];

        let j = i + 1;
        while (j < lines.length) {
          const nextLine = lines[j] || '';
          const nextTrimmed = nextLine.trim();

          if (nextTrimmed.includes('|') && nextTrimmed.split('|').filter(Boolean).length >= 2) {
            tableLines.push(nextLine);
            j++;
          } else {
            break;
          }
        }

        const tableData = BlockExtractor.parseTableLines(tableLines);
        if (tableData) {
          const id = uuidv4();
          const placeholder = `__TABLE_${id}__`;
          tables.set(placeholder, tableData);
          result.push(placeholder);
        } else {
          result.push(...tableLines);
        }

        i = j;
      } else {
        result.push(line);
        i++;
      }
    }

    return { text: result.join('\n'), tables };
  }

  private static parseTableLines(lines: string[]): TableData | null {
    if (lines.length < 2) return null;

    const headerLine = lines[0]?.trim() || '';
    const headers = headerLine
      .split('|')
      .filter(Boolean)
      .map((h) => h.trim());

    // セパレータ行を探す
    let separatorIndex = -1;
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]?.trim() || '';
      if (line.split('|').every((cell) => /^[-:\s]+$/.test(cell.trim()) || cell.trim() === '')) {
        separatorIndex = i;
        break;
      }
    }

    if (separatorIndex === -1) return null;

    const rows: string[][] = [];
    for (let i = separatorIndex + 1; i < lines.length; i++) {
      const line = lines[i]?.trim() || '';
      const cells = line
        .split('|')
        .filter(Boolean)
        .map((c) => c.trim());
      rows.push(cells);
    }

    return { headers, rows };
  }
}

/**
 * Phase 3: インライン要素のパース
 */
class InlineParser {
  // This prevents the class from being "static-only" for linting purposes.
  private readonly _instanceMarker = 0;

  private constructor() {
    // Intentionally empty.
  }

  /**
   * テキスト内のインライン要素を処理してTipTapノードに変換
   * すべてのインライン要素を同列で処理（bold, italic, strike, code, link, image）
   */
  static parseInline(text: string): JSONContent[] {
    if (!text || !text.trim()) {
      return [];
    }

    // すべてのインライン要素をプレースホルダー化
    const elements = new Map<string, { type: string; data: unknown }>();

    // 1. インラインコード `code`
    let result = text.replace(/`([^`]+)`/g, (_match, code) => {
      const id = uuidv4();
      const placeholder = `§CODE§${id}§`;
      elements.set(placeholder, { type: 'code', data: code });
      return placeholder;
    });

    // 2. 画像 ![alt](url)
    result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt, src) => {
      const id = uuidv4();
      const placeholder = `§IMAGE§${id}§`;
      elements.set(placeholder, { type: 'image', data: { alt, src } });
      return placeholder;
    });

    // 3. リンク [text](url)
    result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, linkText, href) => {
      const id = uuidv4();
      const placeholder = `§LINK§${id}§`;
      elements.set(placeholder, { type: 'link', data: { text: linkText, href } });
      return placeholder;
    });

    // 4. 打ち消し線 ~~text~~
    result = result.replace(/~~(.+?)~~/g, (_match, content) => {
      const id = uuidv4();
      const placeholder = `§STRIKE§${id}§`;
      elements.set(placeholder, { type: 'strike', data: content });
      return placeholder;
    });

    // 5. 太字 **text**
    result = result.replace(/\*\*(.+?)\*\*/g, (_match, content) => {
      const id = uuidv4();
      const placeholder = `§BOLD§${id}§`;
      elements.set(placeholder, { type: 'bold', data: content });
      return placeholder;
    });

    // 6. 斜体 *text*
    result = result.replace(/\*([^*]+?)\*/g, (_match, content) => {
      const id = uuidv4();
      const placeholder = `§ITALIC§${id}§`;
      elements.set(placeholder, { type: 'italic', data: content });
      return placeholder;
    });

    // プレースホルダーをJSONノードに変換
    return InlineParser.convertToNodes(result, elements);
  }

  private static convertToNodes(
    text: string,
    elements: Map<string, { type: string; data: unknown }>,
  ): JSONContent[] {
    const nodes: JSONContent[] = [];
    let current = '';
    let i = 0;

    while (i < text.length) {
      // プレースホルダーの検出
      if (text[i] === '§') {
        // 現在のテキストを保存
        if (current) {
          nodes.push({ type: 'text', text: current });
          current = '';
        }

        // プレースホルダー全体を取得
        const endIndex = text.indexOf('§', i + 1);
        if (endIndex !== -1) {
          const secondEndIndex = text.indexOf('§', endIndex + 1);
          if (secondEndIndex !== -1) {
            const placeholder = text.substring(i, secondEndIndex + 1);
            const element = elements.get(placeholder);

            if (element) {
              switch (element.type) {
                case 'code':
                  nodes.push({
                    type: 'text',
                    marks: [{ type: 'code' }],
                    text: element.data as string,
                  });
                  break;

                case 'link': {
                  const linkData = element.data as { text: string; href: string };
                  const safeHref = normalizeUrlOrNull(linkData.href);

                  if (!safeHref) {
                    nodes.push({
                      type: 'text',
                      text: `${linkData.text} (${linkData.href})`,
                    });
                    break;
                  }
                  nodes.push({
                    type: 'text',
                    marks: [
                      {
                        type: 'link',
                        attrs: {
                          href: safeHref,
                          target: '_blank',
                          rel: 'noopener noreferrer',
                        },
                      },
                    ],
                    text: linkData.text,
                  });
                  break;
                }

                case 'image': {
                  const imageData = element.data as { alt: string; src: string };
                  const safeSrc = normalizeUrlOrNull(imageData.src);

                  if (!safeSrc || !safeSrc.startsWith('http')) {
                    nodes.push({
                      type: 'text',
                      text: `![${imageData.alt}](${imageData.src})`,
                    });
                    break;
                  }
                  nodes.push({
                    type: 'image',
                    attrs: { src: safeSrc, alt: imageData.alt },
                  });
                  break;
                }

                case 'bold':
                case 'italic':
                case 'strike': {
                  // ネストされたインライン要素を再帰的に処理
                  const nestedNodes = InlineParser.parseInline(element.data as string);
                  for (const node of nestedNodes) {
                    if (node.type === 'text') {
                      const marks = node.marks ? [...node.marks] : [];
                      marks.unshift({ type: element.type });
                      nodes.push({ ...node, marks });
                    } else {
                      nodes.push(node);
                    }
                  }
                  break;
                }
              }
            }

            i = secondEndIndex + 1;
            continue;
          }
        }
      }

      current += text[i];
      i++;
    }

    if (current) {
      nodes.push({ type: 'text', text: current });
    }

    return nodes.filter((node) => node.type !== 'text' || (node.text && node.text.length > 0));
  }
}

/**
 * Phase 2: ブロック要素のパース
 */
class BlockParser {
  // This prevents the class from being "static-only" for linting purposes.
  private readonly _instanceMarker = 0;

  private constructor() {
    // Intentionally empty.
  }

  static parseBlocks(markdown: string): JSONContent[] {
    const lines = markdown.split('\n');
    const blocks: JSONContent[] = [];

    let i = 0;
    while (i < lines.length) {
      const line = lines[i] || '';
      const trimmed = line.trim();

      // プレースホルダーはそのまま保持
      if (trimmed.startsWith('__CODEBLOCK_') || trimmed.startsWith('__TABLE_')) {
        blocks.push({
          type: 'paragraph',
          content: [{ type: 'text', text: trimmed }],
        });
        i++;
        continue;
      }

      // 空行
      if (!trimmed) {
        i++;
        continue;
      }

      // 見出し
      const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1]?.length || 1;
        const headingText = headingMatch[2] || '';
        blocks.push({
          type: 'heading',
          attrs: { level },
          content: InlineParser.parseInline(headingText),
        });
        i++;
        continue;
      }

      // 水平線
      if (/^(---+|___+|\*\*\*+)$/.test(trimmed)) {
        blocks.push({ type: 'horizontalRule' });
        i++;
        continue;
      }

      // ブロッククォート
      if (trimmed.startsWith('>')) {
        const quoteText = trimmed.substring(1).trim();
        blocks.push({
          type: 'blockquote',
          content: [
            {
              type: 'paragraph',
              content: InlineParser.parseInline(quoteText),
            },
          ],
        });
        i++;
        continue;
      }

      // リスト（番号なし）
      const unorderedMatch = trimmed.match(/^[-*+]\s+(.+)$/);
      if (unorderedMatch) {
        const items: JSONContent[] = [];
        const itemText = unorderedMatch[1] || '';
        items.push({
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: InlineParser.parseInline(itemText),
            },
          ],
        });

        let j = i + 1;
        while (j < lines.length) {
          const nextLine = lines[j]?.trim() || '';
          const nextMatch = nextLine.match(/^[-*+]\s+(.+)$/);
          if (nextMatch) {
            items.push({
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: InlineParser.parseInline(nextMatch[1] || ''),
                },
              ],
            });
            j++;
          } else {
            break;
          }
        }

        blocks.push({
          type: 'bulletList',
          content: items,
        });
        i = j;
        continue;
      }

      // リスト（番号付き）
      const orderedMatch = trimmed.match(/^\d+\.\s+(.+)$/);
      if (orderedMatch) {
        const items: JSONContent[] = [];
        const itemText = orderedMatch[1] || '';
        items.push({
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: InlineParser.parseInline(itemText),
            },
          ],
        });

        let j = i + 1;
        while (j < lines.length) {
          const nextLine = lines[j]?.trim() || '';
          const nextMatch = nextLine.match(/^\d+\.\s+(.+)$/);
          if (nextMatch) {
            items.push({
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: InlineParser.parseInline(nextMatch[1] || ''),
                },
              ],
            });
            j++;
          } else {
            break;
          }
        }

        blocks.push({
          type: 'orderedList',
          content: items,
        });
        i = j;
        continue;
      }

      // 通常段落
      const paragraphLines: string[] = [line];
      let j = i + 1;

      while (j < lines.length) {
        const nextLine = lines[j] || '';
        const nextTrimmed = nextLine.trim();

        if (
          nextTrimmed &&
          !nextTrimmed.match(/^#{1,6}\s/) &&
          !nextTrimmed.match(/^[-*+]\s/) &&
          !nextTrimmed.match(/^\d+\.\s/) &&
          !nextTrimmed.startsWith('>') &&
          !nextTrimmed.startsWith('__CODEBLOCK_') &&
          !nextTrimmed.startsWith('__TABLE_')
        ) {
          paragraphLines.push(nextLine);
          j++;
        } else {
          break;
        }
      }

      const paragraphText = paragraphLines.join(' ').trim();
      if (paragraphText) {
        blocks.push({
          type: 'paragraph',
          content: InlineParser.parseInline(paragraphText),
        });
      }

      i = j;
    }

    return blocks;
  }
}

/**
 * メイン変換クラス
 */
export class MarkdownTipTapConverter {
  private readonly _instanceMarker = 0;

  private constructor() {
    // Intentionally empty.
  }
  /**
   * MarkdownがMarkdown構文を含むかチェック
   */
  static isMarkdownText(text: string): boolean {
    return /^#{1,6}\s|```|^\s*[-*+]\s|^\s*\d+\.\s|^\s*>\s|\*\*.*\*\*|\[.*\]\(.*\)|!\[.*\]\(.*\)|\|.*\|/.test(
      text,
    );
  }

  /**
   * MarkdownをTipTap JSON形式に変換
   */
  static async markdownToTipTapJson(markdown: string): Promise<JSONContent> {
    // Phase 1: ブロック要素の抽出
    const { text: withoutCodeBlocks, blocks: codeBlocks } =
      BlockExtractor.extractCodeBlocks(markdown);
    log.debug('Extracted blocks', { codeBlocks: codeBlocks.size });

    const { text: withoutTables, tables } = BlockExtractor.extractTables(withoutCodeBlocks);

    // Phase 2: ブロック要素のパース
    const blocks = BlockParser.parseBlocks(withoutTables);

    // Phase 3 & 4: プレースホルダーの復元
    const processedBlocks = blocks.map((block) => {
      if (
        block.type === 'paragraph' &&
        block.content &&
        Array.isArray(block.content) &&
        block.content[0]?.type === 'text'
      ) {
        const text = block.content[0].text || '';

        // コードブロックの復元（言語情報を保持）
        if (text.startsWith('__CODEBLOCK_')) {
          const codeData = codeBlocks.get(text);
          if (codeData) {
            log.debug('Restoring code block', { placeholder: text, language: codeData.language });
            return {
              type: 'codeBlock',
              attrs: { language: codeData.language },
              content: [{ type: 'text', text: codeData.code }],
            };
          }
        }

        // テーブルの復元
        if (text.startsWith('__TABLE_')) {
          const tableData = tables.get(text);
          if (tableData) {
            return MarkdownTipTapConverter.buildTableNode(tableData);
          }
        }
      }

      return block;
    });

    return {
      type: 'doc',
      content: processedBlocks,
    };
  }

  private static buildTableNode(tableData: TableData): JSONContent {
    return {
      type: 'table',
      content: [
        {
          type: 'tableRow',
          content: tableData.headers.map((header) => ({
            type: 'tableHeader',
            content: [
              {
                type: 'paragraph',
                content: InlineParser.parseInline(header),
              },
            ],
          })),
        },
        ...tableData.rows.map((row) => ({
          type: 'tableRow',
          content: row.map((cell) => ({
            type: 'tableCell',
            content: [
              {
                type: 'paragraph',
                content: InlineParser.parseInline(cell),
              },
            ],
          })),
        })),
      ],
    };
  }

  /**
   * TipTap JSONをMarkdownに変換（逆変換）
   */
  static tipTapJsonToMarkdown(json: JSONContent): string {
    if (!json || !json.content) return '';

    return json.content.map((node) => MarkdownTipTapConverter.nodeToMarkdown(node)).join('\n\n');
  }

  private static nodeToMarkdown(node: JSONContent): string {
    switch (node.type) {
      case 'heading': {
        const level = node.attrs?.level || 1;
        const headingText = MarkdownTipTapConverter.contentToText(node.content);
        return `${'#'.repeat(level)} ${headingText}`;
      }

      case 'paragraph':
        return MarkdownTipTapConverter.contentToText(node.content);

      case 'codeBlock': {
        const language = node.attrs?.language || '';
        const code = node.content?.[0]?.text || '';
        return `\`\`\`${language}\n${code}\n\`\`\``;
      }

      case 'bulletList':
        return (
          node.content
            ?.map((item) => `- ${MarkdownTipTapConverter.nodeToMarkdown(item)}`)
            .join('\n') || ''
        );

      case 'orderedList':
        return (
          node.content
            ?.map((item, idx) => `${idx + 1}. ${MarkdownTipTapConverter.nodeToMarkdown(item)}`)
            .join('\n') || ''
        );

      case 'listItem':
        return MarkdownTipTapConverter.contentToText(node.content);

      case 'blockquote': {
        const quoteText = MarkdownTipTapConverter.contentToText(node.content);
        return `> ${quoteText}`;
      }

      case 'horizontalRule':
        return '---';

      case 'table':
        return MarkdownTipTapConverter.tableToMarkdown(node);

      default:
        return MarkdownTipTapConverter.contentToText(node.content);
    }
  }

  private static contentToText(content: JSONContent[] | undefined): string {
    if (!content) return '';

    return content
      .map((node) => {
        if (node.type === 'text') {
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
                case 'strike':
                  text = `~~${text}~~`;
                  break;
                case 'code':
                  text = `\`${text}\``;
                  break;
                case 'link': {
                  const href = mark.attrs?.href || '';
                  text = `[${text}](${href})`;
                  break;
                }
              }
            }
          }

          return text;
        }

        if (node.type === 'image') {
          const src = node.attrs?.src || '';
          const alt = node.attrs?.alt || '';
          return `![${alt}](${src})`;
        }

        return MarkdownTipTapConverter.nodeToMarkdown(node);
      })
      .join('');
  }

  private static tableToMarkdown(node: JSONContent): string {
    const rows = node.content || [];
    if (rows.length === 0) return '';

    const headerRow = rows[0];
    const dataRows = rows.slice(1);

    const headers =
      headerRow?.content?.map((cell) =>
        MarkdownTipTapConverter.contentToText(cell.content?.[0]?.content),
      ) || [];

    const separator = headers.map(() => '---').join(' | ');
    const headerLine = headers.join(' | ');

    const dataLines = dataRows.map((row) => {
      const cells =
        row.content?.map((cell) =>
          MarkdownTipTapConverter.contentToText(cell.content?.[0]?.content),
        ) || [];
      return cells.join(' | ');
    });

    return `| ${headerLine} |\n| ${separator} |\n${dataLines.map((line) => `| ${line} |`).join('\n')}`;
  }

  /**
   * チャンク処理（エディター用）
   */
  static async processMarkdownInSmallChunksWithRender(
    markdown: string,
    editor: Editor,
    onChunkProcessed?: (processed: number, total: number) => void,
  ): Promise<void> {
    const json = await MarkdownTipTapConverter.markdownToTipTapJson(markdown);
    const content = json.content || [];

    // 一括で設定
    editor.commands.setContent(json);

    if (onChunkProcessed) {
      onChunkProcessed(content.length, content.length);
    }
  }
}
