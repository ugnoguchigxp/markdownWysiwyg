# Testing Strategy

This document outlines the testing strategy for the `markdown-wysiwyg-editor` package. We use **Vitest** for unit and component testing, combined with **React Testing Library** for UI verification.

## Core Philosophy
- **WYSIWYG Fidelity**: Ensure that the editor's visual state aligns with the underlying Markdown model.
- **Component isolation**: Test components in isolation where possible, but also verify the integration between the TipTap editor and custom nodes.
- **Accessibility**: Verify that UI elements have proper ARIA attributes and are keyboard-accessible.

## Tools
- **Test Runner**: [Vitest](https://vitest.dev/)
- **UI Testing**: [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- **DOM Environment**: [JSDOM](https://github.com/jsdom/jsdom)
- **Coverage**: [v8](https://vitest.dev/guide/coverage.html) (Targeting > 80% coverage for core logic)
- **Mocks**: Use `vitest.vi` for mocking browser APIs (e.g., `mermaid`, `navigator.clipboard`).

## Test Structure
Tests should be located alongside the source files they test, with the `.test.ts` or `.test.tsx` extension.

### 1. Logic & Utils
Test pure functions and utility logic.
- **Example**: `src/lib/utils.ts` -> `src/lib/utils.test.ts`

### 2. UI Components
Test React components using `@testing-library/react`. Focus on user interactions and accessibility.
- **Example**: `src/components/Toolbar.tsx` -> `src/components/Toolbar.test.tsx`

### 3. TipTap Extensions & Custom Nodes
Test the editor behavior when specific extensions are loaded.
- Verify Markdown parsing (input -> editor state).
- Verify Markdown serialization (editor state -> output).
- Test custom node views (e.g., Mermaid diagrams, Tables).

## Best Practices
- **Use screen.getBy...**: Prefer `screen.getByRole` or `screen.getByText` over test IDs for better accessibility.
- **Mock Heavy Dependencies**: Mock `mermaid` and heavy external libraries to keep tests fast and deterministic.
- **Snapshot Testing**: Use sparingly for complex rendered structures (like serialized Markdown) to catch regressions in formatting.
- **Setup Mocks**: Add global mocks in `src/setupTests.ts` if they are needed across multiple test suites.

## Commands
- `bun run test`: Run all tests once.
- `bun run test:watch`: Run tests in watch mode.
- `bun run test:coverage`: Run tests and generate a coverage report.

## CI/CD Integration
Tests are automatically run on every Pull Request via GitHub Actions. Merging requires all tests to pass and no significant coverage drops.
