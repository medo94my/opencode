import { createSignal, onCleanup } from "solid-js"

const STORAGE_KEY = "opencode-kv"

type KVStore = Record<string, unknown>

function loadFromStorage(): KVStore {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveToStorage(store: KVStore) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // Storage full or unavailable
  }
}

let globalStore: KVStore = loadFromStorage()
const listeners = new Map<string, Set<(value: unknown) => void>>()

function notify(key: string, value: unknown) {
  const keyListeners = listeners.get(key)
  if (keyListeners) {
    for (const fn of keyListeners) fn(value)
  }
}

export function kvGet<T = unknown>(key: string): T | undefined {
  return globalStore[key] as T | undefined
}

export function kvSet(key: string, value: unknown) {
  globalStore[key] = value
  saveToStorage(globalStore)
  notify(key, value)
}

export function kvDelete(key: string) {
  delete globalStore[key]
  saveToStorage(globalStore)
  notify(key, undefined)
}

export function kvHas(key: string): boolean {
  return key in globalStore
}

export function kvKeys(): string[] {
  return Object.keys(globalStore)
}

export function kvClear() {
  globalStore = {}
  saveToStorage(globalStore)
  for (const [, keyListeners] of listeners) {
    for (const fn of keyListeners) fn(undefined)
  }
}

/**
 * Reactive KV signal — returns [getter, setter] that persist to localStorage.
 */
export function useKV<T = unknown>(key: string, defaultValue: T): [() => T, (value: T) => void] {
  const [value, setValue] = createSignal<T>(kvGet<T>(key) ?? defaultValue as T)

  const update = (next: T) => {
    kvSet(key, next)
    setValue(() => next)
  }

  // Subscribe to external changes
  const keyListeners = listeners.get(key) ?? new Set()
  if (!listeners.has(key)) listeners.set(key, keyListeners)

  const listener = (v: unknown) => {
    setValue(() => v === undefined ? defaultValue : (v as T))
  }
  keyListeners.add(listener)

  onCleanup(() => {
    keyListeners.delete(listener)
    if (keyListeners.size === 0) listeners.delete(key)
  })

  return [value, update]
}
