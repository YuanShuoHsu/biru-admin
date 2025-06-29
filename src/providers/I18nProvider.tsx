import I18nContext, { I18nDict } from "@/context/i18n";

interface I18nProviderProps {
  children: React.ReactNode;
  dict: I18nDict;
}

const I18nProvider = ({ children, dict }: I18nProviderProps) => (
  <I18nContext.Provider value={dict}>{children}</I18nContext.Provider>
);

export default I18nProvider;
