import { Component, createSignal, Show } from "solid-js"
import { useSync } from "@/context/sync"
import { useLanguage } from "@/context/language"
import { Dialog } from "@opencode-ai/ui/dialog"
import { Button } from "@opencode-ai/ui/button"
import { showToast } from "@opencode-ai/ui/toast"

type ExportOptionsProps = {
  sessionID: string
}

export const DialogExportOptions: Component<ExportOptionsProps> = (props) => {
  const sync = useSync()
  const language = useLanguage()

  const [includeThinking, setIncludeThinking] = createSignal(false)
  const [includeToolDetails, setIncludeToolDetails] = createSignal(false)
  const [includeTimestamps, setIncludeTimestamps] = createSignal(false)

  const sessionInfo = () => sync.session.get(props.sessionID)

  const defaultFilename = () => {
    const title = sessionInfo()?.title ?? "session"
    return `${title.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}.md`
  }

  const buildMarkdown = () => {
    const messages = sync.data.message[props.sessionID] ?? []
    let md = `# ${sessionInfo()?.title ?? "Session"}\n\n`

    for (const msg of messages) {
      const role = msg.role === "user" ? "## User" : "## Assistant"
      md += `${role}\n\n`

      const parts = sync.data.part[msg.id] ?? []
      for (const part of parts) {
        if (part.type === "text") {
          md += `${part.text}\n\n`
        }
        if (includeToolDetails() && part.type === "tool") {
          md += `> Tool: ${part.tool}\n> \n> \`\`\`json\n> ${JSON.stringify(part.state.input, null, 2)}\n> \`\`\`\n\n`
        }
        if (includeThinking() && part.type === "reasoning") {
          md += `> **Thinking:** ${part.text}\n\n`
        }
      }

      if (includeTimestamps() && msg.time?.created) {
        md += `*${new Date(msg.time.created).toLocaleString()}*\n\n`
      }
    }

    return md
  }

  const exportToFile = () => {
    const md = buildMarkdown()
    const blob = new Blob([md], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = defaultFilename()
    a.click()
    URL.revokeObjectURL(url)
    showToast({
      title: language.t("dialog.export.success"),
      variant: "success",
    })
  }

  const copyToClipboard = async () => {
    const md = buildMarkdown()
    const ok = await navigator.clipboard.writeText(md).then(
      () => true,
      () => false,
    )
    if (ok) {
      showToast({
        title: language.t("dialog.export.copied"),
        variant: "success",
      })
    }
  }

  return (
    <Dialog title={language.t("dialog.export.title")} description={language.t("dialog.export.description")}>
      <div class="flex flex-col gap-4 p-4">
        <div>
          <label class="text-sm font-medium text-text-strong">{language.t("dialog.export.filename")}</label>
          <div class="mt-1 px-3 py-2 border rounded-md bg-surface-base text-text-weak text-sm">
            {defaultFilename()}
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeThinking()}
              onChange={(e) => setIncludeThinking(e.target.checked)}
              class="accent-accent-base"
            />
            <span class="text-sm">{language.t("dialog.export.includeThinking")}</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeToolDetails()}
              onChange={(e) => setIncludeToolDetails(e.target.checked)}
              class="accent-accent-base"
            />
            <span class="text-sm">{language.t("dialog.export.includeToolDetails")}</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeTimestamps()}
              onChange={(e) => setIncludeTimestamps(e.target.checked)}
              class="accent-accent-base"
            />
            <span class="text-sm">{language.t("dialog.export.includeTimestamps")}</span>
          </label>
        </div>

        <div class="flex gap-2 justify-end">
          <Button variant="secondary" onClick={copyToClipboard}>
            {language.t("dialog.export.copyToClipboard")}
          </Button>
          <Button onClick={exportToFile}>{language.t("dialog.export.download")}</Button>
        </div>
      </div>
    </Dialog>
  )
}
