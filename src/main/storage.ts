import type { BrowserContext } from '@playwright/test'
import __Store from 'electron-store'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Store = ((__Store as any).default || __Store) as typeof __Store

export const StorageKey = {
  auth: 'auth',
  settings: 'settings'
} as const

type AuthState = Awaited<ReturnType<BrowserContext['storageState']>>
export interface AppSettings {
  blockKeywords: string[]
  authorBlockKeywords: string[]
}

type StorageSchema = Record<typeof StorageKey.auth, AuthState> &
  Record<typeof StorageKey.settings, AppSettings>

class Storage {
  _store = new Store<StorageSchema>()

  public get path(): string {
    return this._store.path
  }

  get<K extends keyof StorageSchema>(key: K): StorageSchema[K] {
    return this._store.get(key)
  }

  set<K extends keyof StorageSchema>(key: K, value: StorageSchema[K]): void {
    this._store.set(key, value)
  }

  delete<K extends keyof StorageSchema>(key: K): void {
    this._store.delete(key)
  }
}

export const storage = new Storage()

// helpers for settings with defaults
export function getAppSettings(): AppSettings {
  return storage.get(StorageKey.settings)
}

export function updateAppSettings(partial: Partial<AppSettings>): AppSettings {
  console.log('更新设置：', partial)
  const current = getAppSettings()
  const next: AppSettings = {
    ...current,
    ...partial,
    // normalize arrays if provided
    blockKeywords: Array.isArray(partial.blockKeywords)
      ? partial.blockKeywords
      : current.blockKeywords,
    authorBlockKeywords: Array.isArray(partial.authorBlockKeywords)
      ? partial.authorBlockKeywords
      : current.authorBlockKeywords
  }
  storage.set(StorageKey.settings, next)
  return next
}
