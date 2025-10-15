/**
 * @fileoverview i18next internationalization configuration
 * @description Configures i18next for multilingual support (English and Spanish)
 * @module config/i18n
 * @version 1.0.0
 * @since Sprint 1
 * @author Cinema Platform Team
 */

import i18next from 'i18next';
import path from 'path';
import fs from 'fs';

/**
 * Supported languages in the application
 */
export const SUPPORTED_LANGUAGES = ['en', 'es'] as const;

/**
 * Default language if none specified
 */
export const DEFAULT_LANGUAGE = 'en';

/**
 * Type for supported language codes
 */
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

/**
 * Validates if a language code is supported
 * @param {string} lang - Language code to validate
 * @returns {boolean} True if language is supported
 */
export function isSupportedLanguage(lang: string): lang is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage);
}

/**
 * Loads translation files from the locales directory
 * @returns {Object} Object with language codes as keys and translations as values
 */
function loadTranslations(): Record<string, any> {
  const localesPath = path.join(__dirname, '../locales');
  const resources: Record<string, any> = {};

  for (const lang of SUPPORTED_LANGUAGES) {
    const filePath = path.join(localesPath, `${lang}.json`);

    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      resources[lang] = {
        translation: JSON.parse(fileContent)
      };
    } else {
      console.warn(`Warning: Translation file not found for language: ${lang}`);
    }
  }

  return resources;
}

/**
 * Initializes i18next with configuration and translation resources
 * @returns {Promise<typeof i18next>} Initialized i18next instance
 */
export async function initializeI18n(): Promise<typeof i18next> {
  const resources = loadTranslations();

  await i18next.init({
    resources,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: [...SUPPORTED_LANGUAGES],
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false, // Not needed for server-side
    },
    debug: false, // Set to true for debugging
  });

  console.log('i18n initialized successfully');
  console.log(`Supported languages: ${SUPPORTED_LANGUAGES.join(', ')}`);
  console.log(`Default language: ${DEFAULT_LANGUAGE}`);

  return i18next;
}

/**
 * Gets translated message with optional interpolation
 * @param {string} key - Translation key (e.g., 'auth.loginSuccess')
 * @param {string} lang - Language code
 * @param {Object} options - Interpolation options
 * @returns {string} Translated message
 */
export function translate(key: string, lang: string = DEFAULT_LANGUAGE, options?: any): string {
  const validLang = isSupportedLanguage(lang) ? lang : DEFAULT_LANGUAGE;
  return i18next.t(key, { ...options, lng: validLang }) as string;
}

export default i18next;
