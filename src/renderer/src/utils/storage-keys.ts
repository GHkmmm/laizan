/**
 * 渲染进程 localStorage 管理工具
 * 提供类型安全的本地存储访问接口
 */

/**
 * localStorage 存储结构定义
 * 所有渲染端使用的 localStorage key 都应在此定义，以获得 TypeScript 类型提示
 */
interface StorageSchema {
  /** 模板快速开始提示已关闭标记 */
  'laizan-template-alert-dismissed': boolean
  /** 抖音限制弹窗不再显示标记 */
  'laizan-douyin-limit-dialog-dismissed': boolean
}

/**
 * 类型安全的 localStorage 管理器
 */
export class LocalStorageManager {
  /**
   * 获取存储值
   * @param key 存储键
   * @returns 存储的值，不存在则返回 null
   */
  static get<K extends keyof StorageSchema>(key: K): StorageSchema[K] | null {
    const value = localStorage.getItem(key)
    if (value === null) return null

    try {
      return JSON.parse(value) as StorageSchema[K]
    } catch {
      // 如果解析失败，尝试返回原始值
      return value as unknown as StorageSchema[K]
    }
  }

  /**
   * 设置存储值
   * @param key 存储键
   * @param value 要存储的值
   */
  static set<K extends keyof StorageSchema>(key: K, value: StorageSchema[K]): void {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value)
    localStorage.setItem(key, serialized)
  }

  /**
   * 移除存储值
   * @param key 存储键
   */
  static remove<K extends keyof StorageSchema>(key: K): void {
    localStorage.removeItem(key)
  }

  /**
   * 检查键是否存在
   * @param key 存储键
   * @returns 是否存在
   */
  static has<K extends keyof StorageSchema>(key: K): boolean {
    return localStorage.getItem(key) !== null
  }

  /**
   * 清空所有存储
   * ⚠️ 谨慎使用，会清除所有 localStorage 数据
   */
  static clear(): void {
    localStorage.clear()
  }
}

/**
 * 导出所有存储键常量，避免魔法字符串
 * 使用方式：STORAGE_KEYS['laizan-template-alert-dismissed']
 */
export const STORAGE_KEYS: { [K in keyof StorageSchema]: K } = {
  'laizan-template-alert-dismissed': 'laizan-template-alert-dismissed',
  'laizan-douyin-limit-dialog-dismissed': 'laizan-douyin-limit-dialog-dismissed'
}
