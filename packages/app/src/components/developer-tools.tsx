import { Component, createSignal, onCleanup, onMount, Show } from "solid-js"
import { Button } from "@opencode-ai/ui/button"
import { Icon } from "@opencode-ai/ui/icon"
import { useKV } from "@/hooks/use-kv"

export const DeveloperTools: Component = () => {
  const [visible, setVisible] = useKV("devtools-visible", false)
  const [fps, setFps] = createSignal(0)
  const [memory, setMemory] = createSignal<string>("N/A")
  const [heap, setHeap] = createSignal<string>("N/A")

  let frameCount = 0
  let lastTime = performance.now()
  let rafId: number | undefined

  const measureFPS = () => {
    frameCount++
    const now = performance.now()
    if (now - lastTime >= 1000) {
      setFps(frameCount)
      frameCount = 0
      lastTime = now

      // Memory info (Chrome only)
      const perf = performance as any
      if (perf.memory) {
        const used = (perf.memory.usedJSHeapSize / 1024 / 1024).toFixed(1)
        const total = (perf.memory.totalJSHeapSize / 1024 / 1024).toFixed(1)
        setMemory(`${used}MB / ${total}MB`)
        setHeap(`${used}MB`)
      }
    }
    rafId = requestAnimationFrame(measureFPS)
  }

  onMount(() => {
    if (visible()) {
      rafId = requestAnimationFrame(measureFPS)
    }
  })

  onCleanup(() => {
    if (rafId) cancelAnimationFrame(rafId)
  })

  const toggle = () => {
    const next = !visible()
    setVisible(next)
    if (next) {
      lastTime = performance.now()
      frameCount = 0
      rafId = requestAnimationFrame(measureFPS)
    } else if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = undefined
    }
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        class="fixed bottom-4 right-4 z-50 size-8 rounded-full bg-surface-raised-stronger shadow-lg flex items-center justify-center hover:bg-surface-raised-base-hover transition-colors"
        onClick={toggle}
        title="Developer Tools"
      >
        <Icon name="code" size="small" />
      </button>

      {/* Debug panel */}
      <Show when={visible()}>
        <div class="fixed bottom-14 right-4 z-50 w-64 p-3 rounded-lg bg-surface-raised-stronger shadow-lg border border-border-base text-xs font-mono">
          <div class="flex items-center justify-between mb-2">
            <span class="font-medium text-text-strong">Developer Tools</span>
            <Button variant="ghost" size="small" onClick={toggle}>
              <Icon name="close-small" size="small" />
            </Button>
          </div>
          <div class="flex flex-col gap-1 text-text-weak">
            <div class="flex justify-between">
              <span>FPS</span>
              <span class="text-text-strong">{fps()}</span>
            </div>
            <div class="flex justify-between">
              <span>Memory</span>
              <span class="text-text-strong">{memory()}</span>
            </div>
            <div class="flex justify-between">
              <span>Heap</span>
              <span class="text-text-strong">{heap()}</span>
            </div>
            <div class="flex justify-between">
              <span>UA</span>
              <span class="text-text-strong truncate max-w-32" title={navigator.userAgent}>
                {navigator.userAgent.slice(0, 30)}...
              </span>
            </div>
          </div>
        </div>
      </Show>
    </>
  )
}
