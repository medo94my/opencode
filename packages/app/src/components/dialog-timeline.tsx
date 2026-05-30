import { Component, createMemo } from "solid-js"
import { useSync } from "@/context/sync"
import { useSessionLayout } from "@/pages/session/session-layout"
import { Dialog } from "@opencode-ai/ui/dialog"
import { List } from "@opencode-ai/ui/list"
import { type UserMessage } from "@opencode-ai/sdk/v2"

type DialogTimelineProps = {
  onSelect: (messageID: string) => void
}

export const DialogTimeline: Component<DialogTimelineProps> = (props) => {
  const sync = useSync()
  const { params } = useSessionLayout()

  const userMessages = createMemo(() => {
    const id = params.id
    if (!id) return []
    const messages = sync.data.message[id] ?? []
    return messages.filter((m): m is UserMessage => m.role === "user")
  })

  const getPreview = (msg: UserMessage) => {
    const parts = sync.data.part[msg.id] ?? []
    const textPart = parts.find((p) => p.type === "text")
    if (!textPart || textPart.type !== "text") return "Empty message"
    return textPart.text
  }

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return ""
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <Dialog title="Session Timeline" description="Jump to any user message">
      <List
        search={{ placeholder: "Search messages...", autofocus: true }}
        emptyMessage="No messages"
        key={(x) => x?.id ?? ""}
        items={userMessages}
        filterKeys={["text"]}
        sortBy={(a, b) => (a.time?.created ?? 0) - (b.time?.created ?? 0)}
        onSelect={(x) => {
          if (!x) return
          props.onSelect(x.id)
        }}
      >
        {(msg) => {
          const preview = createMemo(() => getPreview(msg))
          const time = createMemo(() => formatTime(msg.time?.created))
          return (
            <div class="flex items-center gap-3 py-1">
              <span class="text-xs text-text-subtle shrink-0 w-12">{time()}</span>
              <span class="text-sm text-text-strong truncate">{preview()}</span>
            </div>
          )
        }}
      </List>
    </Dialog>
  )
}
