import type { BrowserContext } from '@playwright/test'
import __Store from 'electron-store'
import type { FeedAcSettings } from '@shared/settings'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Store = ((__Store as any).default || __Store) as typeof __Store

export const StorageKey = {
  auth: 'auth',
  settings: 'settings'
} as const

type AuthState = Awaited<ReturnType<BrowserContext['storageState']>>

type StorageSchema = Record<typeof StorageKey.auth, AuthState> &
  Record<typeof StorageKey.settings, FeedAcSettings>

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
