// =============================================================================
// GENIO CORE — Moteur i18n léger (sans dépendance externe)
// Utilisation : const t = await getTranslations('fr'); t('common.save')
// =============================================================================

import type { Locale } from './config'
import { DEFAULT_LOCALE } from './config'

type MessageValue = string | Record<string, unknown>
type Messages = Record<string, MessageValue>

const cache = new Map<Locale, Messages>()

async function loadMessages(locale: Locale): Promise<Messages> {
  if (cache.has(locale)) return cache.get(locale)!

  try {
    const messages = (await import(`./messages/${locale}.json`)) as Messages
    cache.set(locale, messages)
    return messages
  } catch {
    if (locale !== DEFAULT_LOCALE) {
      return loadMessages(DEFAULT_LOCALE)
    }
    return {}
  }
}

function resolve(messages: Messages, key: string): string {
  const parts = key.split('.')
  let current: unknown = messages

  for (const part of parts) {
    if (typeof current !== 'object' || current === null) return key
    current = (current as Record<string, unknown>)[part]
  }

  return typeof current === 'string' ? current : key
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? `{{${k}}}`))
}

export async function getTranslations(locale: Locale = DEFAULT_LOCALE) {
  const messages = await loadMessages(locale)

  return function t(
    key: string,
    vars?: Record<string, string | number>
  ): string {
    const raw = resolve(messages, key)
    return interpolate(raw, vars)
  }
}

export { type Locale, DEFAULT_LOCALE, SUPPORTED_LOCALES } from './config'
export * from './config'
