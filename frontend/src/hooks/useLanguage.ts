import { useLanguage as useLangContext } from '../context/LanguageContext';

export const useLanguage = () => {
  const ctx = useLangContext();
  return {
    ...ctx,
    lang: ctx.language,
  };
};

export default useLanguage;