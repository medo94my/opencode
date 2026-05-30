import { For, Show, createMemo } from "solid-js"
import type { PermissionRequest } from "@opencode-ai/sdk/v2"
import { Button } from "@opencode-ai/ui/button"
import { DockPrompt } from "@opencode-ai/ui/dock-prompt"
import { Icon } from "@opencode-ai/ui/icon"
import { useLanguage } from "@/context/language"

// Redact secrets like API keys, tokens, passwords
function redactSecrets(text: string): string {
  return text
    .replace(/(sk-[a-zA-Z0-9]{20,})/g, (_, match) => match.slice(0, 8) + "...")
    .replace(/(ghp_[a-zA-Z0-9]{20,})/g, (_, match) => match.slice(0, 8) + "...")
    .replace(/(xoxb-[a-zA-Z0-9-]+)/g, (_, match) => match.slice(0, 10) + "...")
    .replace(/(AKIA[A-Z0-9]{16})/g, (_, match) => match.slice(0, 8) + "...")
    .replace(/(password\s*[:=]\s*["']?)([^"'\s]{8,})/gi, "$1***")
    .replace(/(token\s*[:=]\s*["']?)([^"'\s]{8,})/gi, "$1***")
    .replace(/(secret\s*[:=]\s*["']?)([^"'\s]{8,})/gi, "$1***")
}

function isFilePath(pattern: string): boolean {
  return pattern.includes("/") || pattern.includes("\\") || pattern.endsWith("/*")
}

export function SessionPermissionDock(props: {
  request: PermissionRequest
  responding: boolean
  onDecide: (response: "once" | "always" | "reject") => void
}) {
  const language = useLanguage()

  const toolDescription = () => {
    const key = `settings.permissions.tool.${props.request.permission}.description`
    const value = language.t(key as Parameters<typeof language.t>[0])
    if (value === key) return ""
    return value
  }

  const redactedPatterns = createMemo(() =>
    props.request.patterns.map((p) => redactSecrets(p)),
  )

  const hasSecrets = createMemo(() =>
    props.request.patterns.some((p) => redactSecrets(p) !== p),
  )

  return (
    <DockPrompt
      kind="permission"
      header={
        <div data-slot="permission-row" data-variant="header">
          <span data-slot="permission-icon">
            <Icon name="warning" size="normal" />
          </span>
          <div data-slot="permission-header-title">{language.t("notification.permission.title")}</div>
        </div>
      }
      footer={
        <>
          <div />
          <div data-slot="permission-footer-actions">
            <Button variant="ghost" size="normal" onClick={() => props.onDecide("reject")} disabled={props.responding}>
              {language.t("ui.permission.deny")}
            </Button>
            <Button
              variant="secondary"
              size="normal"
              onClick={() => props.onDecide("always")}
              disabled={props.responding}
            >
              {language.t("ui.permission.allowAlways")}
            </Button>
            <Button variant="primary" size="normal" onClick={() => props.onDecide("once")} disabled={props.responding}>
              {language.t("ui.permission.allowOnce")}
            </Button>
          </div>
        </>
      }
    >
      <Show when={toolDescription()}>
        <div data-slot="permission-row">
          <span data-slot="permission-spacer" aria-hidden="true" />
          <div data-slot="permission-hint">{toolDescription()}</div>
        </div>
      </Show>

      <Show when={props.request.patterns.length > 0}>
        <div data-slot="permission-row">
          <span data-slot="permission-spacer" aria-hidden="true" />
          <div data-slot="permission-patterns" class="flex flex-col gap-1">
            <For each={redactedPatterns()}>
              {(pattern) => (
                <div class="flex items-center gap-2">
                  <Icon
                    name={isFilePath(pattern) ? "open-file" : "code"}
                    size="small"
                    class="text-icon-weak shrink-0"
                  />
                  <code class="text-12-regular text-text-base break-all">{pattern}</code>
                </div>
              )}
            </For>
            <Show when={hasSecrets()}>
              <div class="flex items-center gap-1.5 mt-1">
                <Icon name="warning" size="small" class="text-yellow-500" />
                <span class="text-xs text-yellow-600">Secrets have been redacted</span>
              </div>
            </Show>
          </div>
        </div>
      </Show>

      <Show when={props.request.always.length > 0}>
        <div data-slot="permission-row">
          <span data-slot="permission-spacer" aria-hidden="true" />
          <div class="text-xs text-text-weak">
            Always allowed: {props.request.always.join(", ")}
          </div>
        </div>
      </Show>
    </DockPrompt>
  )
}
