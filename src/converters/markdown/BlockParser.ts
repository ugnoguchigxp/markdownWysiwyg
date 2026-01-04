import type { JSONContent } from '@tiptap/core';
import { InlineParser, type MarkdownToTipTapOptions } from './InlineParser';

export class BlockParser {
  private constructor() {
    // Intentionally empty.
  }

  private static getIndentLength(line: string): number {
    let count = 0;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === ' ') {
        count += 1;
        continue;
      }
      if (ch === '\t') {
        count += 4;
        continue;
      }
      break;
    }
    return count;
  }

  private static parseListAt(
    lines: string[],
    startIndex: number,
    options?: MarkdownToTipTapOptions,
  ): { node: JSONContent; nextIndex: number } | null {
    const firstLine = lines[startIndex] || '';

    const getListType = (line: string): 'bulletList' | 'orderedList' | null => {
      if (/^\s*[-*+]\s+/.test(line)) return 'bulletList';
      if (/^\s*\d+\.\s+/.test(line)) return 'orderedList';
      return null;
    };

    const getItemText = (line: string): string | null => {
      const m1 = line.match(/^\s*[-*+]\s+(.+)$/);
      if (m1) return m1[1] || '';
      const m2 = line.match(/^\s*\d+\.\s+(.+)$/);
      if (m2) return m2[1] || '';
      return null;
    };

    const rootType = getListType(firstLine);
    if (!rootType) {
      return null;
    }

    const baseIndent = BlockParser.getIndentLength(firstLine);

    const createList = (type: 'bulletList' | 'orderedList'): JSONContent => ({
      type,
      content: [],
    });

    const createListItem = (text: string): JSONContent => ({
      type: 'listItem',
      content: [
        {
          type: 'paragraph',
          content: InlineParser.parseInline(text, options),
        },
      ],
    });

    const rootList = createList(rootType);
    const stack: Array<{ indent: number; list: JSONContent; parentItem: JSONContent | null }> = [
      { indent: 0, list: rootList, parentItem: null },
    ];

    let i = startIndex;
    while (i < lines.length) {
      const rawLine = lines[i] || '';
      const trimmed = rawLine.trim();

      if (!trimmed) {
        break;
      }

      if (trimmed.startsWith('__CODEBLOCK_') || trimmed.startsWith('__TABLE_')) {
        break;
      }

      const type = getListType(rawLine);
      const itemText = getItemText(rawLine);
      if (!type || itemText === null) {
        break;
      }

      const indent = Math.max(0, BlockParser.getIndentLength(rawLine) - baseIndent);

      while (stack.length > 1) {
        const top = stack[stack.length - 1];
        if (!top) {
          break;
        }
        if (indent >= top.indent) {
          break;
        }
        stack.pop();
      }

      const top = stack[stack.length - 1];
      if (!top) {
        break;
      }

      if (indent > top.indent) {
        const parentList = top.list;
        const parentItems = parentList.content || [];
        const lastItem = parentItems[parentItems.length - 1];
        if (!lastItem || lastItem.type !== 'listItem') {
          break;
        }

        const nestedList = createList(type);
        lastItem.content = lastItem.content || [];
        lastItem.content.push(nestedList);
        stack.push({ indent, list: nestedList, parentItem: lastItem });
      } else if (indent === top.indent && top.list.type !== type) {
        const currentFrame = top;
        if (currentFrame.parentItem) {
          const siblingList = createList(type);
          currentFrame.parentItem.content = currentFrame.parentItem.content || [];
          currentFrame.parentItem.content.push(siblingList);
          currentFrame.list = siblingList;
        } else {
          break;
        }
      }

      const currentTop = stack[stack.length - 1];
      if (!currentTop) {
        break;
      }

      const currentList = currentTop.list;
      currentList.content = currentList.content || [];
      currentList.content.push(createListItem(itemText));

      i++;
    }

    return { node: rootList, nextIndex: i };
  }

  static parseBlocks(markdown: string, options?: MarkdownToTipTapOptions): JSONContent[] {
    const lines = markdown.split('\n');
    const blocks: JSONContent[] = [];

    let i = 0;
    while (i < lines.length) {
      const line = lines[i] || '';
      const trimmed = line.trim();

      if (trimmed.startsWith('__CODEBLOCK_') || trimmed.startsWith('__TABLE_')) {
        blocks.push({
          type: 'paragraph',
          content: [{ type: 'text', text: trimmed }],
        });
        i++;
        continue;
      }

      if (!trimmed) {
        i++;
        continue;
      }

      const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1]?.length || 1;
        const headingText = headingMatch[2] || '';
        blocks.push({
          type: 'heading',
          attrs: { level },
          content: InlineParser.parseInline(headingText, options),
        });
        i++;
        continue;
      }

      if (/^(---+|___+|\*\*\*+)$/.test(trimmed)) {
        blocks.push({ type: 'horizontalRule' });
        i++;
        continue;
      }

      if (trimmed.startsWith('>')) {
        const quoteText = trimmed.substring(1).trim();
        blocks.push({
          type: 'blockquote',
          content: [
            {
              type: 'paragraph',
              content: InlineParser.parseInline(quoteText, options),
            },
          ],
        });
        i++;
        continue;
      }

      const listParsed = BlockParser.parseListAt(lines, i, options);
      if (listParsed) {
        blocks.push(listParsed.node);
        i = listParsed.nextIndex;
        continue;
      }

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
          content: InlineParser.parseInline(paragraphText, options),
        });
      }

      i = j;
    }

    return blocks;
  }
}
