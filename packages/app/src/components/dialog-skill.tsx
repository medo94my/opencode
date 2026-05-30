import { Component, createResource, For, Show } from "solid-js"
import { useSDK } from "@/context/sdk"
import { useLanguage } from "@/context/language"
import { Dialog } from "@opencode-ai/ui/dialog"
import { List } from "@opencode-ai/ui/list"
import { showToast } from "@opencode-ai/ui/toast"

type Skill = {
  name: string
  description?: string
}

export const DialogSkill: Component = () => {
  const sdk = useSDK()
  const language = useLanguage()

  const [skills] = createResource(async () => {
    try {
      const result = await sdk.client.app.skills()
      return (result.data ?? []) as Skill[]
    } catch {
      return [] as Skill[]
    }
  })

  return (
    <Dialog title="Skills" description="Available skills for this project">
      <List
        search={{ placeholder: language.t("common.search.placeholder"), autofocus: true }}
        emptyMessage="No skills available"
        key={(x) => x?.name ?? ""}
        items={() => skills() ?? []}
        filterKeys={["name", "description"]}
        sortBy={(a, b) => a.name.localeCompare(b.name)}
        onSelect={(x) => {
          if (!x) return
          showToast({ title: `Skill: ${x.name}`, description: x.description ?? "", variant: "success" })
        }}
      >
        {(i) => (
          <div class="flex flex-col gap-0.5">
            <div class="text-sm font-medium text-text-strong">{i.name}</div>
            <Show when={i.description}>
              <div class="text-xs text-text-weak line-clamp-2">{i.description}</div>
            </Show>
          </div>
        )}
      </List>
    </Dialog>
  )
}
