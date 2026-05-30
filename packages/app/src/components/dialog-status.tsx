import { Component, createMemo, For, Show } from "solid-js"
import { useSync } from "@/context/sync"
import { useLanguage } from "@/context/language"
import { Dialog } from "@opencode-ai/ui/dialog"
import { Icon } from "@opencode-ai/ui/icon"

export const DialogStatus: Component = () => {
  const sync = useSync()
  const language = useLanguage()

  const mcpServers = createMemo(() =>
    Object.entries(sync.data.mcp ?? {})
      .map(([name, status]) => ({ name, status: status.status }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  )

  const connectedProviders = createMemo(() => {
    const connected = new Set(sync.data.provider?.connected ?? [])
    return [...sync.data.provider?.all?.entries() ?? []]
      .filter(([id]) => connected.has(id))
      .map(([, provider]) => provider)
  })

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

  return (
    <Dialog title="Status" description="System status overview">
      <div class="flex flex-col gap-4 p-4 max-h-96 overflow-y-auto">
        {/* Providers */}
        <div>
          <h3 class="text-sm font-medium text-text-strong mb-2">Providers</h3>
          <Show
            when={connectedProviders().length > 0}
            fallback={<div class="text-xs text-text-weak">No providers connected</div>}
          >
            <div class="flex flex-col gap-1">
              <For each={connectedProviders()}>
                {(provider) => (
                  <div class="flex items-center gap-2 py-1">
                    <Icon name="status" size="small" class="text-green-500" />
                    <span class="text-sm text-text-strong">{provider.name}</span>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>

        {/* MCP Servers */}
        <div>
          <h3 class="text-sm font-medium text-text-strong mb-2">
            MCP Servers ({mcpServers().filter((s) => s.status === "connected").length}/{mcpServers().length})
          </h3>
          <Show
            when={mcpServers().length > 0}
            fallback={<div class="text-xs text-text-weak">No MCP servers configured</div>}
          >
            <div class="flex flex-col gap-1">
              <For each={mcpServers()}>
                {(server) => (
                  <div class="flex items-center justify-between py-1">
                    <div class="flex items-center gap-2">
                      <div class={`w-2 h-2 rounded-full ${statusColor(server.status)}`} />
                      <span class="text-sm text-text-strong">{server.name}</span>
                    </div>
                    <span class="text-xs text-text-weak">{server.status}</span>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>

        {/* Version Info */}
        <div>
          <h3 class="text-sm font-medium text-text-strong mb-2">System</h3>
          <div class="flex flex-col gap-1 text-xs">
            <div class="flex justify-between">
              <span class="text-text-weak">Directory</span>
              <span class="text-text-strong font-mono truncate max-w-48">{sync.directory}</span>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  )
}
