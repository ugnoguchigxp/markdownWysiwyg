import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../../utils/logger';

const log = createLogger('BlockExtractor');

export interface TableData {
  headers: string[];
  rows: string[][];
}

export class BlockExtractor {
  private readonly _instanceMarker = 0;

  private constructor() {
    // Intentionally empty.
  }

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

  static extractTables(markdown: string): {
    text: string;
    tables: Map<string, TableData>;
  } {
    const tables = new Map<string, TableData>();
    const lines = markdown.split('\n');
    const result: string[] = [];

    const countPipes = (line: string): number => (line.match(/\|/g) || []).length;

    let i = 0;
    while (i < lines.length) {
      const line = lines[i] || '';
      const trimmed = line.trim();

      if (trimmed.includes('|') && countPipes(trimmed) >= 2) {
        const tableLines: string[] = [line];

        let j = i + 1;
        while (j < lines.length) {
          const nextLine = lines[j] || '';
          const nextTrimmed = nextLine.trim();

          if (nextTrimmed.includes('|') && countPipes(nextTrimmed) >= 2) {
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

    const splitRow = (rowLine: string): string[] => {
      const raw = rowLine.trim();
      const parts = raw.split('|');
      const inner =
        parts.length >= 2 && parts[0] === '' && parts[parts.length - 1] === ''
          ? parts.slice(1, -1)
          : parts;
      return inner.map((c) => c.trim());
    };

    const headers = splitRow(headerLine);

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
      const cells = splitRow(line);
      rows.push(cells);
    }

    return { headers, rows };
  }
}
