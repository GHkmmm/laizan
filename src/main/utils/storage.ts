import type { BrowserContext } from '@playwright/test'
import __Store from 'electron-store'
import type { FeedAcSettings } from '@shared/feed-ac-setting'
import type { AiSettings } from '@shared/ai-setting'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Store = ((__Store as any).default || __Store) as typeof __Store

export const StorageKey = {
  auth: 'auth',
  feedAcSetting: 'feedAcSetting',
  aiSettings: 'aiSettings',
  browserExecPath: 'browserExecPath'
} as const

type AuthState = Awaited<ReturnType<BrowserContext['storageState']>>

type StorageSchema = Record<typeof StorageKey.auth, AuthState> &
  Record<typeof StorageKey.feedAcSetting, FeedAcSettings> &
  Record<typeof StorageKey.aiSettings, AiSettings> &
  Record<typeof StorageKey.browserExecPath, string>

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

  /**
   * List all keys currently stored in electron-store.
   */
  keys(): string[] {
    // electron-store exposes the underlying store object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj = (this._store as any).store as Record<string, unknown>
    return Object.keys(obj || {})
  }

  /**
   * Delete by raw key name without type restriction.
   */
  deleteKey(key: string): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(this._store as any).delete(key)
  }
}

export const storage = new Storage()
