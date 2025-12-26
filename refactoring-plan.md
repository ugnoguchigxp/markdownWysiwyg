Refactoring Plan

Goals
- [x] Split oversized files into focused modules
- [x] Reduce bug risk around update locks and parsing edge cases
- [x] Improve testability by isolating logic

Scope
- [x] src/components/MarkdownEditor.tsx
- [x] src/components/MarkdownToolbar.tsx
- [x] src/converters/MarkdownTipTapConverter.ts
- [x] src/extensions/CodeBlockNodeView.tsx

Phase 0: Safety Fixes (before larger refactors)
- [x] Fix update-lock leak in handleInsertMarkdown when URL validation fails
  - [x] Ensure setIsUpdating(false) and __preventUpdate are always released via try/finally
  - [x] Add test for invalid link markdown insertion
- [x] Fix InlineParser placeholder fallback when "§" appears in user text
  - [x] Restore literal text if placeholder token is not recognized
  - [x] Add unit test covering literal "§" usage

Phase 1: MarkdownEditor Split
- [x] Extract context menu state/handlers into a hook
  - [x] New: src/hooks/useEditorContextMenus.ts
  - [x] Move: link/table menu state, handlers, and global click close effect
- [x] Extract markdown insertion logic
  - [x] New: src/hooks/useMarkdownInsertion.ts
  - [x] Move: handleInsertMarkdown, insertPlainText, format checks, URL validation
- [x] Extract editor chrome rendering (toolbar, status, paste debug)
  - [x] New: src/components/EditorChrome.tsx
  - [x] Inputs: editor, selectionInfo, flags, handlers, pasteEvents
- [x] Update src/components/MarkdownEditor.tsx to wire hooks and layout only

Phase 2: MarkdownToolbar Split
- [x] Extract HeadingMenu
  - [x] New: src/components/toolbar/HeadingMenu.tsx
  - [x] Inputs: onInsertMarkdown, disabled, t
- [x] Extract DownloadMenu
  - [x] New: src/components/toolbar/DownloadMenu.tsx
  - [x] Inputs: onDownloadAsMarkdown, disabled, t
- [x] Extract LinkModal
  - [x] New: src/components/toolbar/LinkModal.tsx
  - [x] Inputs: selectedText, onInsertMarkdown, onClose, t
- [x] Extract ToolbarButton / ToolbarIconButton
  - [x] New: src/components/toolbar/ToolbarButton.tsx
  - [x] Use for consistent hover and tooltip behaviors
- [x] Keep MarkdownToolbar as orchestrator

Phase 3: Converter Split
- [x] Split parser/extractor classes into files
  - [x] New: src/converters/markdown/BlockExtractor.ts
  - [x] New: src/converters/markdown/InlineParser.ts
  - [x] New: src/converters/markdown/BlockParser.ts
  - [x] Keep MarkdownTipTapConverter as entry point
- [ ] Add focused unit tests per parser module

Phase 4: CodeBlockNodeView Split
- [x] Move views to dedicated files
  - [x] New: src/extensions/CodeBlockNodeView/RegularCodeBlockView.tsx
  - [x] New: src/extensions/CodeBlockNodeView/MermaidCodeBlockView.tsx
  - [x] New: src/extensions/CodeBlockNodeView/IconButton.tsx
  - [x] New: src/extensions/CodeBlockNodeView/constants.ts
- [x] Keep src/extensions/CodeBlockNodeView.tsx as thin switch

Testing Plan
- [ ] Add/extend tests:
  - [x] Markdown insertion: update-lock release on invalid link
  - [x] InlineParser: literal "§" handling
  - [ ] Regression tests for markdown -> JSON -> markdown roundtrip on tables and links

Non-Goals
- [x] No UI redesign
- [x] No behavior changes beyond bug fixes noted above

Risks
- [ ] Any change to insertion logic can affect cursor position; verify selection offsets
- [ ] Parser split may introduce import cycles if not structured carefully

Success Criteria
- [ ] Largest files reduced to <= 300 lines where feasible
- [ ] New tests pass and cover key regressions
