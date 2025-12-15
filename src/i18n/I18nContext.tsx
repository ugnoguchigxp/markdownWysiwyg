import React from 'react';

export type Translator = (key: string, fallback?: string) => string;

export const defaultT: Translator = (key, fallback) => fallback ?? key;

type I18nContextValue = {
  t: Translator;
};

const I18nContext = React.createContext<I18nContextValue>({ t: defaultT });

export function I18nProvider({
  t,
  children,
}: {
  t?: Translator;
  children: React.ReactNode;
}) {
  const translator = t ?? defaultT;
  const value = React.useMemo(() => ({ t: translator }), [translator]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  return React.useContext(I18nContext);
}
