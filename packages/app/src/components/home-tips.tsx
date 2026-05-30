import { Component, createMemo, For, Show } from "solid-js"
import { useSync } from "@/context/sync"
import { Icon } from "@opencode-ai/ui/icon"

type Tip = {
  icon: string
  title: string
  description: string
  shortcut?: string
}

export const HomeTips: Component = () => {
  const sync = useSync()

  const hasProvider = createMemo(() => {
    const connected = sync.data.provider?.connected ?? []
    return connected.length > 0
  })

  const tips = createMemo<Tip[]>(() => {
    if (hasProvider()) {
      return [
        {
          icon: "prompt",
          title: "Attach files",
          description: "Use @ to attach files or images to your prompt",
          shortcut: "@",
        },
        {
          icon: "code",
          title: "Slash commands",
          description: "Type / to access commands like /compact, /export, /help",
          shortcut: "/",
        },
        {
          icon: "brain",
          title: "Switch agents",
          description: "Cycle through different AI agents",
          shortcut: "Cmd+.",
        },
        {
          icon: "mcp",
          title: "MCP servers",
          description: "Connect to external tools via MCP servers",
          shortcut: "Cmd+;",
        },
      ]
    }

    return [
      {
        icon: "providers",
        title: "Connect a provider",
        description: "Add an AI provider to start chatting",
      },
      {
        icon: "terminal",
        title: "Use the terminal",
        description: "Press Ctrl+` to open an integrated terminal",
        shortcut: "Ctrl+`",
      },
      {
        icon: "keyboard",
        title: "Command palette",
        description: "Access all commands with the keyboard",
        shortcut: "Cmd+K",
      },
    ]
  })

  return (
    <div class="flex flex-col gap-3 px-4 py-3">
      <div class="text-xs font-medium text-text-weak uppercase tracking-wider">Tips</div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <For each={tips()}>
          {(tip) => (
            <div class="flex items-start gap-3 p-3 rounded-lg bg-surface-base border border-border-base hover:border-border-stronger transition-colors">
              <Icon name={tip.icon as any} size="normal" class="text-icon-info-active shrink-0 mt-0.5" />
              <div class="flex flex-col gap-0.5 min-w-0">
                <div class="text-sm font-medium text-text-strong">{tip.title}</div>
                <div class="text-xs text-text-weak">{tip.description}</div>
                <Show when={tip.shortcut}>
                  <div class="text-xs text-text-subtle font-mono mt-0.5">{tip.shortcut}</div>
                </Show>
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  )
}
