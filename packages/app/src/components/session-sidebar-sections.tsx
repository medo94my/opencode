import { Component, For, Show, createMemo, createSignal } from "solid-js"
import { useSync } from "@/context/sync"
import { useLanguage } from "@/context/language"
import { useProviders } from "@/hooks/use-providers"
import { getSessionContextMetrics } from "@/components/session/session-context-metrics"
import { useSessionLayout } from "@/pages/session/session-layout"
import { Icon } from "@opencode-ai/ui/icon"
import { ProgressCircle } from "@opencode-ai/ui/progress-circle"

type SectionProps = {
  title: string
  defaultOpen?: boolean
  children: any
}

const CollapsibleSection: Component<SectionProps> = (props) => {
  const [open, setOpen] = createSignal(props.defaultOpen ?? true)

  return (
    <div class="border-b border-border-base">
      <button
        class="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-text-weak hover:bg-surface-base-hover transition-colors"
        onClick={() => setOpen(!open())}
      >
        <span class="uppercase tracking-wider">{props.title}</span>
        <Icon
          name="chevron-down"
          size="small"
          class={`transition-transform duration-200 ${open() ? "rotate-0" : "-rotate-90"}`}
        />
      </button>
      <Show when={open()}>
        <div class="px-3 pb-2">{props.children}</div>
      </Show>
    </div>
  )
}

export const SessionSidebarSections: Component = () => {
  const sync = useSync()
  const language = useLanguage()
  const providers = useProviders()
  const { params } = useSessionLayout()

  const messages = createMemo(() => {
    const id = params.id
    return id ? (sync.data.message[id] ?? []) : []
  })

  const metrics = createMemo(() => getSessionContextMetrics(messages(), [...providers.all().values()]))
  const context = createMemo(() => metrics().context)
  const cost = createMemo(() => {
    const usd = new Intl.NumberFormat(language.intl(), { style: "currency", currency: "USD" })
    return usd.format(metrics().totalCost)
  })

  const mcpServers = createMemo(() =>
    Object.entries(sync.data.mcp ?? {})
      .map(([name, status]) => ({ name, status: status.status }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  )

  const connectedCount = createMemo(() => mcpServers().filter((s) => s.status === "connected").length)

  const statusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "text-green-500"
      case "failed":
        return "text-red-500"
      case "needs_auth":
        return "text-yellow-500"
      default:
        return "text-text-subtle"
    }
  }

  // Get modified files from the first session's diff
  const modifiedFiles = createMemo(() => {
    const diffs = sync.data.session_diff
    if (!diffs) return []
    const allFiles: { file: string; status: string }[] = []
    for (const [, sessionDiffs] of Object.entries(diffs)) {
      if (!sessionDiffs) continue
      for (const diff of sessionDiffs) {
        if (diff.file && diff.status) {
          allFiles.push({ file: diff.file, status: diff.status })
        }
      }
    }
    return allFiles
  })

  return (
    <div class="flex flex-col text-sm">
      {/* Context Section */}
      <CollapsibleSection title="Context" defaultOpen={true}>
        <Show when={context()}>
          {(ctx) => (
            <div class="flex flex-col gap-1.5">
              <div class="flex items-center justify-between">
                <span class="text-text-weak">Tokens</span>
                <span class="text-text-strong font-medium">{ctx().total.toLocaleString(language.intl())}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-text-weak">Usage</span>
                <div class="flex items-center gap-2">
                  <ProgressCircle size={14} strokeWidth={2} percentage={ctx().usage ?? 0} />
                  <span class="text-text-strong font-medium">{ctx().usage ?? 0}%</span>
                </div>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-text-weak">Cost</span>
                <span class="text-text-strong font-medium">{cost()}</span>
              </div>
            </div>
          )}
        </Show>
        <Show when={!context()}>
          <span class="text-text-subtle text-xs">No session active</span>
        </Show>
      </CollapsibleSection>

      {/* MCP Section */}
      <CollapsibleSection title={`MCP (${connectedCount()}/${mcpServers().length})`} defaultOpen={false}>
        <Show when={mcpServers().length > 0}>
          <div class="flex flex-col gap-1">
            <For each={mcpServers()}>
              {(server) => (
                <div class="flex items-center justify-between py-0.5">
                  <div class="flex items-center gap-2 min-w-0">
                    <div class={`w-1.5 h-1.5 rounded-full shrink-0 ${statusColor(server.status)}`} />
                    <span class="text-text-strong truncate text-xs">{server.name}</span>
                  </div>
                  <span class="text-text-subtle text-xs shrink-0">{server.status}</span>
                </div>
              )}
            </For>
          </div>
        </Show>
        <Show when={mcpServers().length === 0}>
          <span class="text-text-subtle text-xs">No MCP servers configured</span>
        </Show>
      </CollapsibleSection>

      {/* Modified Files Section */}
      <CollapsibleSection title="Modified Files" defaultOpen={false}>
        <Show when={modifiedFiles().length > 0}>
          <div class="flex flex-col gap-1">
            <For each={modifiedFiles()}>
              {(f) => (
                <div class="flex items-center gap-2 py-0.5">
                  <span
                    class={`text-xs font-mono ${
                      f.status === "added"
                        ? "text-green-500"
                        : f.status === "deleted"
                          ? "text-red-500"
                          : "text-yellow-500"
                    }`}
                  >
                    {f.status === "added" ? "A" : f.status === "deleted" ? "D" : "M"}
                  </span>
                  <span class="text-text-strong truncate text-xs">{f.file}</span>
                </div>
              )}
            </For>
          </div>
        </Show>
        <Show when={modifiedFiles().length === 0}>
          <span class="text-text-subtle text-xs">No modified files</span>
        </Show>
      </CollapsibleSection>
    </div>
  )
}
