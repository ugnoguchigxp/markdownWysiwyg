import { describe, expect, it } from 'vitest';
import { I18N_KEYS } from './index';

describe('I18N_KEYS', () => {
  it('contains expected top-level keys', () => {
    expect(I18N_KEYS.placeholder).toBe('markdown_editor.placeholder');
    expect(I18N_KEYS.download).toBe('markdown_editor.download');
    expect(I18N_KEYS.syntaxStatus.help).toBe('markdown_editor.syntax_status.help');
  });

  it('contains nested link keys', () => {
    expect(I18N_KEYS.link.open).toBe('markdown_editor.link.open');
    expect(I18N_KEYS.link.enterLinkText).toBe('markdown_editor.link.enter_text');
  });
});
