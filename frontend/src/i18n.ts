import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import zhTW from './locales/zh-TW.json';
import zhCN from './locales/zh-CN.json';

const resources = {
    en: { translation: en },
    'zh-TW': { translation: zhTW },
    'zh-CN': { translation: zhCN },
};

// Get saved language from localStorage or default to browser language
const getSavedLanguage = (): string => {
    const saved = localStorage.getItem('language');
    if (saved && ['en', 'zh-TW', 'zh-CN'].includes(saved)) {
        return saved;
    }
    // Detect browser language
    const browserLang = navigator.language;
    if (browserLang.startsWith('zh')) {
        return browserLang.includes('TW') || browserLang.includes('HK') ? 'zh-TW' : 'zh-CN';
    }
    return 'en';
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: getSavedLanguage(),
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false, // React already escapes
        },
    });

export default i18n;
