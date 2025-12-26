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
import { createLogger } from '../utils/logger';
import { BlockExtractor, type TableData } from './markdown/BlockExtractor';
import { BlockParser } from './markdown/BlockParser';
import { InlineParser, type MarkdownToTipTapOptions } from './markdown/InlineParser';

const log = createLogger('MarkdownTipTapConverter');

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
  static async markdownToTipTapJson(
    markdown: string,
    options?: MarkdownToTipTapOptions,
  ): Promise<JSONContent> {
    // Phase 1: ブロック要素の抽出
    const { text: withoutCodeBlocks, blocks: codeBlocks } =
      BlockExtractor.extractCodeBlocks(markdown);
    log.debug('Extracted blocks', { codeBlocks: codeBlocks.size });

    const { text: withoutTables, tables } = BlockExtractor.extractTables(withoutCodeBlocks);

    // Phase 2: ブロック要素のパース
    const blocks = BlockParser.parseBlocks(withoutTables, options);

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
            return MarkdownTipTapConverter.buildTableNode(tableData, options);
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

  private static buildTableNode(
    tableData: TableData,
    options?: MarkdownToTipTapOptions,
  ): JSONContent {
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
                content: InlineParser.parseInline(header, options),
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
                content: InlineParser.parseInline(cell, options),
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
    options?: MarkdownToTipTapOptions,
  ): Promise<void> {
    const json = await MarkdownTipTapConverter.markdownToTipTapJson(markdown, options);
    const content = json.content || [];

    // 一括で設定
    editor.commands.setContent(json);

    if (onChunkProcessed) {
      onChunkProcessed(content.length, content.length);
    }
  }
}
