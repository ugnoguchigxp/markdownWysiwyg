import { act, render } from '@testing-library/react';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LinkContextMenu } from './LinkContextMenu';

// --- Mocks Setup ---

const { mockUseMarkdownEditor, mockMarkdownToTipTapJson, mockConsole, mockLinkContextMenu } =
  vi.hoisted(() => ({
    mockUseMarkdownEditor: vi.fn(),
    mockMarkdownToTipTapJson: vi.fn(),
    mockConsole: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
    mockLinkContextMenu: vi.fn(),
  }));

// Mock logger
vi.mock('../../src/utils/logger', () => ({
  createLogger: () => mockConsole,
}));

// Mock Converter
vi.mock('../../src/converters/MarkdownTipTapConverter', () => ({
  MarkdownTipTapConverter: {
    markdownToTipTapJson: (...args: unknown[]) => mockMarkdownToTipTapJson(...args),
  },
}));

// Mock Dependencies to isolate MarkdownEditor logic
vi.mock('../../src/hooks/useMarkdownInsertion', () => ({
  useMarkdownInsertion: () => ({ handleInsertMarkdown: vi.fn() }),
}));
vi.mock('../../src/hooks/useTableToolbar', () => ({
  useTableToolbar: () => ({ visible: false }),
}));

// IMPORTANT: We need to control useEditorContextMenus to simulate link selection state
let mockLinkContextMenuState = {
  visible: false,
  position: { x: 0, y: 0 },
  linkData: null as { href: string; text: string; from: number; to: number } | null,
};
vi.mock('../../src/hooks/useEditorContextMenus', () => ({
  useEditorContextMenus: () => ({
    linkContextMenu: mockLinkContextMenuState,
    tableContextMenu: { visible: false },
    handleLinkContextMenu: vi.fn(),
    handleCloseLinkContextMenu: vi.fn(),
    handleTableContextMenu: vi.fn(),
    handleCloseTableContextMenu: vi.fn(),
  }),
}));

// Mock Components
vi.mock('@tiptap/react', () => ({
  EditorContent: () => <div />,
}));
vi.mock('../../src/components/EditorChrome', () => ({
  // biome-ignore lint/suspicious/noExplicitAny: Mock type
  EditorChrome: ({ children }: any) => <div>{children}</div>,
}));
vi.mock('../../src/components/LinkContextMenu', () => ({
  LinkContextMenu: mockLinkContextMenu,
}));
vi.mock('../../src/components/TableContextMenu', () => ({
  TableContextMenu: () => null,
}));
vi.mock('../../src/components/TableToolbar', () => ({
  TableToolbar: () => null,
}));

// Mock Hook
vi.mock('../../src/hooks/useMarkdownEditor', () => ({
  // biome-ignore lint/suspicious/noExplicitAny: Mock type
  useMarkdownEditor: (...args: any[]) => mockUseMarkdownEditor(...args),
}));

// --- Test Implementation ---

import { MarkdownEditor } from '../../src/components/MarkdownEditor';

describe('MarkdownEditor Integration', () => {
  // biome-ignore lint/suspicious/noExplicitAny: Mock type
  let mockEditor: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLinkContextMenuState = { visible: false, position: { x: 0, y: 0 }, linkData: null };

    // Setup default Editor mock
    mockEditor = {
      isEditable: true,
      isEmpty: false,
      isFocused: false,
      commands: {
        setContent: vi.fn(),
        clearContent: vi.fn(),
        deleteRange: vi.fn(), // Used in link editing?
        setTextSelection: vi.fn(),
      },
      view: {
        state: {
          doc: {
            nodeAt: vi.fn(),
          },
          schema: {
            marks: {
              link: {
                create: vi.fn().mockReturnValue('mock-link-mark'),
              },
            },
            text: vi.fn().mockReturnValue('mock-text-node'),
          },
          tr: {
            delete: vi.fn(),
            insert: vi.fn(),
          },
        },
        dispatch: vi.fn(),
        updateState: vi.fn(),
      },
      chain: () => ({
        focus: vi.fn().mockReturnThis(),
        run: vi.fn(),
      }),
      getJSON: vi.fn(),
      setEditable: vi.fn(),
    };
    mockUseMarkdownEditor.mockReturnValue(mockEditor);
  });

  describe('Link Editing Integration', () => {
    it('uses range-based transaction for editing links to prevent duplicates issues', async () => {
      // 1. Setup Link Data with valid from/to
      mockLinkContextMenuState = {
        visible: true,
        position: { x: 0, y: 0 },
        linkData: { href: 'https://old.com', text: 'Old', from: 10, to: 15 },
      };

      // Mock LinkContextMenu to capture the onEditLink callback
      // biome-ignore lint/suspicious/noExplicitAny: Mock type
      let capturedOnEditLink: any;
      mockLinkContextMenu.mockImplementation(
        // biome-ignore lint/suspicious/noExplicitAny: Mock type
        ({ onEditLink }: any) => {
          capturedOnEditLink = onEditLink;
          return null;
        },
      );
      render(<MarkdownEditor value="content" />);

      // Verify node at 'from' exists (safety check in code)
      mockEditor.view.state.doc.nodeAt.mockReturnValue({});

      // 2. Trigger Edit Link
      await act(async () => {
        capturedOnEditLink({ href: 'https://new.com', text: 'New' });
      });

      // 3. Verify Transaction
      expect(mockEditor.view.state.tr.delete).toHaveBeenCalledWith(10, 15);
      expect(mockEditor.view.state.tr.insert).toHaveBeenCalledWith(
        10,
        expect.anything(), // new text node
      );
      expect(mockEditor.view.dispatch).toHaveBeenCalled();

      // confirm from/to were used, NOT full document scan
    });
  });

  describe('Race Condition & Async Handling', () => {
    it('aborts stale markdown conversions when value updates continuously', async () => {
      // Setup deferred promises to control timing
      // biome-ignore lint/suspicious/noExplicitAny: Mock type
      let resolve1: (val: any) => void;
      // biome-ignore lint/suspicious/noExplicitAny: Mock type
      let resolve2: (val: any) => void;

      const p1 = new Promise((r) => {
        resolve1 = r;
      });
      const p2 = new Promise((r) => {
        resolve2 = r;
      });

      // First call returns p1, Second call returns p2
      mockMarkdownToTipTapJson.mockReturnValueOnce(p1).mockReturnValueOnce(p2);

      const { rerender } = render(<MarkdownEditor value="Update 1" />);

      // "Update 1" triggered. mocked converter called.
      expect(mockMarkdownToTipTapJson).toHaveBeenCalledTimes(1);

      // Rerender with "Update 2" BEFORE p1 resolves
      rerender(<MarkdownEditor value="Update 2" />);
      expect(mockMarkdownToTipTapJson).toHaveBeenCalledTimes(2);

      // Now resolve p1 (stale)
      await act(async () => {
        resolve1?.({ type: 'doc', content: [{ text: 'Content 1' }] });
      });

      // Assert: setContent should NOT be called with Content 1 because it was aborted
      expect(mockEditor.commands.setContent).not.toHaveBeenCalledWith(
        expect.objectContaining({ content: [{ text: 'Content 1' }] }),
      );

      // Now resolve p2 (fresh)
      await act(async () => {
        resolve2?.({ type: 'doc', content: [{ text: 'Content 2' }] });
      });

      // Assert: setContent SHOULD be called with Content 2
      expect(mockEditor.commands.setContent).toHaveBeenCalledWith(
        expect.objectContaining({ content: [{ text: 'Content 2' }] }),
      );
    });

    it('skips processing if content is identical to last processed (deduplication)', async () => {
      mockMarkdownToTipTapJson.mockResolvedValue({ type: 'doc' });

      const { rerender } = render(<MarkdownEditor value="Same Content" />);

      // First render processes it
      expect(mockMarkdownToTipTapJson).toHaveBeenCalledTimes(1);

      await act(async () => {
        await Promise.resolve();
      });

      // Rerender with SAME content
      rerender(<MarkdownEditor value="Same Content" />);

      // Should NOT call converter again
      expect(mockMarkdownToTipTapJson).toHaveBeenCalledTimes(1);
    });

    it('processes again if content changes', async () => {
      mockMarkdownToTipTapJson.mockResolvedValue({ type: 'doc' });

      const { rerender } = render(<MarkdownEditor value="Content A" />);
      expect(mockMarkdownToTipTapJson).toHaveBeenCalledTimes(1);

      await act(async () => {
        await Promise.resolve();
      });

      rerender(<MarkdownEditor value="Content B" />);
      expect(mockMarkdownToTipTapJson).toHaveBeenCalledTimes(2);
    });
  });
});
