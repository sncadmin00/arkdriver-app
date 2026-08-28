import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './en.json';
import ru from './ru.json';
import uz from './uz.json';

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'uz', label: "O'zbekcha" },
];

const KEY = 'app-language';

function deviceLanguage() {
  const tag = Localization.getLocales?.()[0]?.languageCode ?? 'en';
  return LANGUAGES.some((l) => l.code === tag) ? tag : 'en';
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ru: { translation: ru },
    uz: { translation: uz },
  },
  lng: deviceLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

AsyncStorage.getItem(KEY).then((saved) => {
  if (saved && saved !== i18n.language) i18n.changeLanguage(saved);
});

export async function setLanguage(code: string) {
  await AsyncStorage.setItem(KEY, code);
  await i18n.changeLanguage(code);
}

export default i18n;
