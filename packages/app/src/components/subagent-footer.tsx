import { Component, createMemo, Show } from "solid-js"
import { useNavigate } from "@solidjs/router"
import { useSync } from "@/context/sync"
import { useSessionLayout } from "@/pages/session/session-layout"
import { Button } from "@opencode-ai/ui/button"
import { Icon } from "@opencode-ai/ui/icon"

export const SubagentFooter: Component = () => {
  const sync = useSync()
  const navigate = useNavigate()
  const { params } = useSessionLayout()

  const sessionInfo = createMemo(() => {
    const id = params.id
    if (!id) return undefined
    return sync.session.get(id)
  })

  const parentSession = createMemo(() => {
    const parentID = sessionInfo()?.parentID
    if (!parentID) return undefined
    return sync.session.get(parentID)
  })

  // Shared: all sibling sessions (including current), sorted by creation time
  const allSiblings = createMemo(() => {
    const parentID = sessionInfo()?.parentID
    if (!parentID) return []
    const allSessions = sync.data.session ?? []
    return allSessions
      .filter((s) => s.parentID === parentID)
      .sort((a, b) => (a.time.created ?? 0) - (b.time.created ?? 0))
  })

  const currentIndex = createMemo(() => {
    const id = params.id
    if (!id) return -1
    return allSiblings().findIndex((s) => s.id === id)
  })

  const totalCount = createMemo(() => allSiblings().length)

  const isSubagent = createMemo(() => !!sessionInfo()?.parentID)

  const navigateTo = (sessionID: string) => {
    navigate(`/${params.dir}/session/${sessionID}`)
  }

  const navigateToParent = () => {
    const parentID = sessionInfo()?.parentID
    if (parentID) navigateTo(parentID)
  }

  const navigatePrev = () => {
    const idx = currentIndex()
    if (idx > 0) navigateTo(allSiblings()[idx - 1].id)
  }

  const navigateNext = () => {
    const idx = currentIndex()
    if (idx < totalCount() - 1) navigateTo(allSiblings()[idx + 1].id)
  }

  return (
    <Show when={isSubagent()}>
      <div class="flex items-center justify-between px-4 py-2 border-t border-border-base bg-surface-base text-sm">
        <div class="flex items-center gap-3">
          <Show when={parentSession()}>
            <Button variant="ghost" size="small" onClick={navigateToParent}>
              <Icon name="arrow-left" size="small" />
              <span class="ml-1">{parentSession()?.title ?? "Parent"}</span>
            </Button>
          </Show>

          <div class="flex items-center gap-1 text-text-weak">
            <span class="text-xs">
              Subagent {currentIndex() + 1}/{totalCount()}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-1">
          <Button
            variant="ghost"
            size="small"
            disabled={currentIndex() <= 0}
            onClick={navigatePrev}
            aria-label="Previous subagent"
          >
            <Icon name="arrow-left" size="small" />
          </Button>
          <Button
            variant="ghost"
            size="small"
            disabled={currentIndex() >= totalCount() - 1}
            onClick={navigateNext}
            aria-label="Next subagent"
          >
            <Icon name="arrow-right" size="small" />
          </Button>
        </div>
      </div>
    </Show>
  )
}
