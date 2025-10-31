import { storage, StorageKey } from '../../utils/storage'
import {
  type FeedAcSettingsV2,
  FeedAcRuleGroups,
  FeedAcSettings,
  FeedAcSettingsUnion
} from '@/shared/feed-ac-setting'
import { customAlphabet } from 'nanoid'

// ============= ID 生成统一管理 =============
const nanoid = customAlphabet('1234567890abcdef', 16)

/**
 * 生成规则组唯一ID
 */
export function generateRuleGroupId(): string {
  return nanoid()
}

/**
 * 递归为规则组树生成新ID（用于复制场景）
 */
function regenerateRuleGroupIds(ruleGroup: FeedAcRuleGroups): FeedAcRuleGroups {
  const newRuleGroup: FeedAcRuleGroups = {
    ...ruleGroup,
    id: generateRuleGroupId()
  }

  // 递归处理子规则组
  if (newRuleGroup.children && newRuleGroup.children.length > 0) {
    newRuleGroup.children = newRuleGroup.children.map((child) => regenerateRuleGroupIds(child))
  }

  return newRuleGroup
}

export function getFeedAcSettings(): FeedAcSettingsV2 {
  const saved = storage.get(StorageKey.feedAcSetting)
  if (!saved) {
    return getDefaultFeedAcSettingsV2()
  }

  // 检测版本并自动迁移
  const version = detectConfigVersion(saved)
  if (version === 'v1') {
    console.log('检测到 v1 配置，正在自动迁移到 v2...')
    const migrated = getUnifiedFeedAcSettings(saved)
    // 自动保存迁移后的配置
    storage.set(StorageKey.feedAcSetting, migrated)
    return migrated
  }

  if (version === 'v2') {
    return saved as FeedAcSettingsV2
  }

  // 未知版本，返回默认配置
  return getDefaultFeedAcSettingsV2()
}

export function updateFeedAcSettings(partial: Partial<FeedAcSettingsV2>): FeedAcSettingsV2 {
  console.log('更新 v2 设置：', partial)
  const current = getFeedAcSettings()
  const next: FeedAcSettingsV2 = {
    ...current,
    ...partial,
    version: 'v2', // 确保版本标识
    // normalize arrays if provided
    blockKeywords: Array.isArray(partial.blockKeywords)
      ? partial.blockKeywords
      : current.blockKeywords,
    authorBlockKeywords: Array.isArray(partial.authorBlockKeywords)
      ? partial.authorBlockKeywords
      : current.authorBlockKeywords,
    ruleGroups: Array.isArray(partial.ruleGroups) ? partial.ruleGroups : current.ruleGroups,
    watchTimeRangeSeconds:
      Array.isArray(partial.watchTimeRangeSeconds) && partial.watchTimeRangeSeconds.length === 2
        ? (partial.watchTimeRangeSeconds as [number, number])
        : current.watchTimeRangeSeconds
  }
  storage.set(StorageKey.feedAcSetting, next)
  return next
}

export function clearFeedAcSettings(): FeedAcSettingsV2 {
  storage.delete(StorageKey.feedAcSetting)
  return getDefaultFeedAcSettingsV2()
}

// ============= 规则组树形操作工具函数 =============

/**
 * 递归查找规则组
 */
function findRuleGroupById(
  groups: FeedAcRuleGroups[],
  id: string
): { group: FeedAcRuleGroups; parent: FeedAcRuleGroups | null } | null {
  for (const group of groups) {
    if (group.id === id) {
      return { group, parent: null }
    }
    if (group.children && group.children.length > 0) {
      const found = findRuleGroupById(group.children, id)
      if (found) {
        // 如果在子节点中找到，且 parent 为 null，说明直接父节点就是当前 group
        return found.parent === null ? { group: found.group, parent: group } : found
      }
    }
  }
  return null
}

/**
 * 递归更新规则组
 */
function updateRuleGroupById(
  groups: FeedAcRuleGroups[],
  id: string,
  updates: Partial<Omit<FeedAcRuleGroups, 'id'>>
): boolean {
  for (let i = 0; i < groups.length; i++) {
    if (groups[i].id === id) {
      groups[i] = { ...groups[i], ...updates, id: groups[i].id } // 确保 id 不被覆盖
      return true
    }
    if (groups[i].children && groups[i].children!.length > 0) {
      if (updateRuleGroupById(groups[i].children!, id, updates)) {
        return true
      }
    }
  }
  return false
}

/**
 * 递归删除规则组
 */
function deleteRuleGroupById(groups: FeedAcRuleGroups[], id: string): boolean {
  for (let i = 0; i < groups.length; i++) {
    if (groups[i].id === id) {
      groups.splice(i, 1)
      return true
    }
    if (groups[i].children && groups[i].children!.length > 0) {
      if (deleteRuleGroupById(groups[i].children!, id)) {
        return true
      }
    }
  }
  return false
}

/**
 * 深拷贝规则组
 */
function deepCopyRuleGroup(ruleGroup: FeedAcRuleGroups): FeedAcRuleGroups {
  return JSON.parse(JSON.stringify(ruleGroup))
}

// ============= 规则组增删改查接口 =============

/**
 * 创建规则组
 * @param ruleGroupData 规则组数据（不含 id）
 * @param parentId 父规则组 ID（可选，不传则作为根规则组）
 */
export function createRuleGroup(
  ruleGroupData: Omit<FeedAcRuleGroups, 'id'>,
  parentId?: string
): FeedAcSettingsV2 {
  const current = getFeedAcSettings()
  const newRuleGroup: FeedAcRuleGroups = {
    ...ruleGroupData,
    id: generateRuleGroupId()
  }

  if (!parentId) {
    // 添加为根规则组
    current.ruleGroups.push(newRuleGroup)
  } else {
    // 添加为子规则组
    const found = findRuleGroupById(current.ruleGroups, parentId)
    if (found) {
      if (!found.group.children) {
        found.group.children = []
      }
      found.group.children.push(newRuleGroup)
    } else {
      throw new Error(`未找到父规则组: ${parentId}`)
    }
  }

  storage.set(StorageKey.feedAcSetting, current)
  return current
}

/**
 * 更新规则组
 * @param id 规则组 ID
 * @param updates 要更新的字段
 */
export function updateRuleGroup(
  id: string,
  updates: Partial<Omit<FeedAcRuleGroups, 'id'>>
): FeedAcSettingsV2 {
  const current = getFeedAcSettings()
  const success = updateRuleGroupById(current.ruleGroups, id, updates)

  if (!success) {
    throw new Error(`未找到规则组: ${id}`)
  }

  storage.set(StorageKey.feedAcSetting, current)
  return current
}

/**
 * 删除规则组
 * @param id 规则组 ID
 */
export function deleteRuleGroup(id: string): FeedAcSettingsV2 {
  const current = getFeedAcSettings()
  const success = deleteRuleGroupById(current.ruleGroups, id)

  if (!success) {
    throw new Error(`未找到规则组: ${id}`)
  }

  storage.set(StorageKey.feedAcSetting, current)
  return current
}

/**
 * 复制规则组
 * @param id 要复制的规则组 ID
 * @param parentId 目标父规则组 ID（可选，不传则作为根规则组）
 */
export function copyRuleGroup(id: string, parentId?: string): FeedAcSettingsV2 {
  const current = getFeedAcSettings()
  const found = findRuleGroupById(current.ruleGroups, id)

  if (!found) {
    throw new Error(`未找到规则组: ${id}`)
  }

  // 深拷贝并重新生成所有 ID
  const copiedRuleGroup = regenerateRuleGroupIds(deepCopyRuleGroup(found.group))

  if (!parentId) {
    // 添加为根规则组
    current.ruleGroups.push(copiedRuleGroup)
  } else {
    // 添加为子规则组
    const parentFound = findRuleGroupById(current.ruleGroups, parentId)
    if (parentFound) {
      if (!parentFound.group.children) {
        parentFound.group.children = []
      }
      parentFound.group.children.push(copiedRuleGroup)
    } else {
      throw new Error(`未找到父规则组: ${parentId}`)
    }
  }

  storage.set(StorageKey.feedAcSetting, current)
  return current
}

/**
 * 更新除规则组外的配置
 * @param updates 要更新的字段（不包括 ruleGroups 和 version）
 */
export function updateExceptRuleGroup(
  updates: Partial<Omit<FeedAcSettingsV2, 'ruleGroups' | 'version'>>
): FeedAcSettingsV2 {
  const current = getFeedAcSettings()
  const next: FeedAcSettingsV2 = {
    ...current,
    ...updates,
    version: 'v2', // 确保版本标识
    ruleGroups: current.ruleGroups, // 保持 ruleGroups 不变
    // normalize arrays if provided
    blockKeywords: Array.isArray(updates.blockKeywords)
      ? updates.blockKeywords
      : current.blockKeywords,
    authorBlockKeywords: Array.isArray(updates.authorBlockKeywords)
      ? updates.authorBlockKeywords
      : current.authorBlockKeywords,
    watchTimeRangeSeconds:
      Array.isArray(updates.watchTimeRangeSeconds) && updates.watchTimeRangeSeconds.length === 2
        ? (updates.watchTimeRangeSeconds as [number, number])
        : current.watchTimeRangeSeconds
  }

  storage.set(StorageKey.feedAcSetting, next)
  return next
}

/**
 * 完整导入配置（用于配置导入功能）
 * @param config 完整的配置对象
 */
export function importFullSettings(config: FeedAcSettingsV2): FeedAcSettingsV2 {
  const normalized: FeedAcSettingsV2 = {
    ...config,
    version: 'v2' // 确保版本标识
  }
  storage.set(StorageKey.feedAcSetting, normalized)
  return normalized
}

export function getDefaultFeedAcSettingsV2(): FeedAcSettingsV2 {
  return {
    version: 'v2',
    ruleGroups: [],
    blockKeywords: [],
    authorBlockKeywords: [],
    simulateWatchBeforeComment: false,
    watchTimeRangeSeconds: [5, 15],
    onlyCommentActiveVideo: false,
    maxCount: 10
  }
}

// 检测配置版本
export function detectConfigVersion(config?: FeedAcSettingsUnion): 'v1' | 'v2' | 'unknown' {
  if (config && typeof config === 'object') {
    // v1 配置的特征：有 rules 数组但没有 version 字段
    if (!('version' in config) && 'rules' in config && Array.isArray(config.rules)) {
      return 'v1'
    }
    if ('version' in config && config.version === 'v2') {
      return 'v2'
    }
  }
  return 'unknown'
}

// 将 v1 配置迁移到 v2
export function migrateV1ToV2(v1Config: FeedAcSettings): FeedAcSettingsV2 {
  // 创建默认规则组，将原有的 rules 迁移过来
  const defaultRuleGroup: FeedAcRuleGroups = {
    id: generateRuleGroupId(),
    type: 'manual',
    name: '默认规则组',
    relation: v1Config.ruleRelation,
    rules: [...v1Config.rules],
    commentTexts: [...v1Config.commentTexts],
    commentImagePath: v1Config.commentImagePath,
    commentImageType: v1Config.commentImageType
  }

  return {
    version: 'v2',
    ruleGroups: v1Config.rules.length > 0 ? [defaultRuleGroup] : [],
    blockKeywords: [...v1Config.blockKeywords],
    authorBlockKeywords: [...v1Config.authorBlockKeywords],
    simulateWatchBeforeComment: v1Config.simulateWatchBeforeComment,
    watchTimeRangeSeconds: [...v1Config.watchTimeRangeSeconds],
    onlyCommentActiveVideo: v1Config.onlyCommentActiveVideo,
    maxCount: 10 // 默认值
  }
}

// 统一的配置获取函数，自动处理版本迁移
export function getUnifiedFeedAcSettings(config?: FeedAcSettingsUnion): FeedAcSettingsV2 {
  const version = detectConfigVersion(config)

  switch (version) {
    case 'v2':
      return config as unknown as FeedAcSettingsV2
    case 'v1':
      return migrateV1ToV2(config as unknown as FeedAcSettings)
    default:
      return getDefaultFeedAcSettingsV2()
  }
}
