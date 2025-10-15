/**
 * @fileoverview Language detection middleware
 * @description Detects user's preferred language from HTTP Accept-Language header
 * @module middleware/language
 * @version 1.0.0
 * @since Sprint 1
 * @author Cinema Platform Team
 */

import { Request, Response, NextFunction } from 'express';
import { DEFAULT_LANGUAGE, isSupportedLanguage, SupportedLanguage } from '../config/i18n';

/**
 * Extended Express Request interface with language property
 */
declare global {
  namespace Express {
    interface Request {
      language: SupportedLanguage;
    }
  }
}

/**
 * Parses Accept-Language header to extract preferred language
 * @param {string | undefined} acceptLanguageHeader - Accept-Language header value
 * @returns {SupportedLanguage} Detected language or default
 *
 * @example
 * parseAcceptLanguage('es-ES,es;q=0.9,en;q=0.8') // returns 'es'
 * parseAcceptLanguage('en-US,en;q=0.9') // returns 'en'
 * parseAcceptLanguage(undefined) // returns 'en' (default)
 */
function parseAcceptLanguage(acceptLanguageHeader: string | undefined): SupportedLanguage {
  if (!acceptLanguageHeader) {
    return DEFAULT_LANGUAGE;
  }

  // Parse Accept-Language header (e.g., "es-ES,es;q=0.9,en;q=0.8")
  const languages = acceptLanguageHeader
    .split(',')
    .map(lang => {
      const [code, qValue] = lang.trim().split(';q=');
      const languageCode = code.split('-')[0].toLowerCase(); // Extract base language (es from es-ES)
      const quality = qValue ? parseFloat(qValue) : 1.0;
      return { code: languageCode, quality };
    })
    .sort((a, b) => b.quality - a.quality); // Sort by quality descending

  // Find first supported language
  for (const lang of languages) {
    if (isSupportedLanguage(lang.code)) {
      return lang.code;
    }
  }

  return DEFAULT_LANGUAGE;
}

/**
 * Language detection middleware
 * Detects user's preferred language from Accept-Language header and attaches it to req.language
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 *
 * @example
 * // In your Express app:
 * app.use(languageDetector);
 *
 * // In your controllers:
 * const userLang = req.language; // 'en' or 'es'
 */
export function languageDetector(req: Request, res: Response, next: NextFunction): void {
  const acceptLanguage = req.headers['accept-language'];
  req.language = parseAcceptLanguage(acceptLanguage);

  // Optional: Set Content-Language response header
  res.setHeader('Content-Language', req.language);

  next();
}

/**
 * Get language from request object
 * Helper function to safely get language from request
 * @param {Request} req - Express request object
 * @returns {SupportedLanguage} Language code
 */
export function getLanguage(req: Request): SupportedLanguage {
  return req.language || DEFAULT_LANGUAGE;
}
