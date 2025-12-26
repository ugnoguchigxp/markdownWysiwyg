import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { I18nProvider, useI18n } from '../../src/i18n/I18nContext';

describe('I18nContext', () => {
  it('should provide default translator when no t function is given', () => {
    const TestComponent = () => {
      const { t } = useI18n();
      return <div>{t('test.key')}</div>;
    };

    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>,
    );

    expect(screen.getByText('test.key')).toBeDefined();
  });

  it('should use custom translator when provided', () => {
    const customTranslator = () => `translated:${'test.key'}`;

    const TestComponent = () => {
      const { t } = useI18n();
      return <div>{t('test.key')}</div>;
    };

    render(
      <I18nProvider t={customTranslator}>
        <TestComponent />
      </I18nProvider>,
    );

    expect(screen.getByText('translated:test.key')).toBeDefined();
  });

  it('should use fallback when provided', () => {
    const customTranslator = (_key: string, fallback?: string) => fallback ?? `default:${'key'}`;

    const TestComponent = () => {
      const { t } = useI18n();
      return <div>{t('test.key', 'fallback value')}</div>;
    };

    render(
      <I18nProvider t={customTranslator}>
        <TestComponent />
      </I18nProvider>,
    );

    expect(screen.getByText('fallback value')).toBeDefined();
  });

  it('should render children correctly', () => {
    render(
      <I18nProvider>
        <div>Child content</div>
      </I18nProvider>,
    );

    expect(screen.getByText('Child content')).toBeDefined();
  });

  it('should allow nested I18nProviders', () => {
    const outerTranslator = (key: string) => `outer:${key}`;
    const innerTranslator = (key: string) => `inner:${key}`;

    const InnerComponent = () => {
      const { t } = useI18n();
      return <div>{t('key')}</div>;
    };

    render(
      <I18nProvider t={outerTranslator}>
        <div>Outer: <InnerComponent /></div>
        <I18nProvider t={innerTranslator}>
          <div>Inner: <InnerComponent /></div>
        </I18nProvider>
      </I18nProvider>,
    );

    expect(screen.getByText(/Outer:/)).toBeDefined();
    expect(screen.getByText(/Inner:/)).toBeDefined();
  });
});
