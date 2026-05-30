# Web App Feature Parity with TUI — Implementation Plan

**Track:** `web-feature-parity`
**Goal:** Close all feature gaps between the TUI and Web App so users don't lose functionality when switching interfaces.

---

## Overview

Based on a thorough comparison of the TUI (`packages/opencode/src/cli/cmd/tui/`) and Web App (`packages/app/src/`), there are **~40 missing features** in the web app. This plan organizes them into 5 phases, ordered by impact and dependency.

**Estimated total effort:** 3–4 sprints (6–8 weeks for 1–2 developers)

---

## Phase 1: Core Session Experience (Week 1–2)

> **Impact: HIGH** — These are the most-used daily features that make the TUI feel powerful.

### 1.1 Slash Commands in Prompt Input

The TUI supports `/compact`, `/undo`, `/redo`, `/share`, `/rename`, `/fork`, `/export`, `/copy`, `/timeline`, `/help`, `/exit`, `/themes`, `/status`, `/models`, `/agents`, `/mcps`, `/variants`, `/connect`, `/org` as text shortcuts in the prompt.

**Web implementation:**
- Extend `components/prompt-input/slash-popover.tsx` to register command aliases
- Each slash command maps to an existing session command (e.g., `/compact` → `session.compact`)
- Add slash command display in the autocomplete popover alongside existing `/` and `@` mentions
- **Files to modify:** `components/prompt-input/slash-popover.tsx`, `pages/layout.tsx` (command registry)

### 1.2 Session View Toggles

The TUI has toggle commands for timestamps, thinking blocks, tool actions, code concealment, generic tool output, scrollbar, diff wrapping, and animations.

**Web implementation:**
- Add toggle state to `SettingsProvider` or `LayoutProvider`:
  - `showTimestamps` — show message timestamps
  - `showThinking` — show/collapse reasoning blocks
  - `showActions` — show/hide tool call details
  - `concealCode` — hide code block content (collapsed by default)
  - `showGenericToolOutput` — show/hide non-file tool output
  - `showScrollbar` — session scrollbar visibility
  - `diffWrap` — word-wrap in diff views
  - `enableAnimations` — toggle text streaming animations
- Wire toggles to `MessageTimeline` rendering and `ReviewTab`
- Register as commands in `use-session-commands.tsx`
- Add toggle items to command palette
- **Files to modify:** `settings.tsx`, `pages/session/message-timeline.tsx`, `use-session-commands.tsx`

### 1.3 Session Navigation Commands

Missing: `page.up/down`, `line.up/down`, `half.page.up/down`, `first/last`, `messages_last_user`, `message.next/previous`.

**Web implementation:**
- Add keyboard shortcuts to `use-session-commands.tsx`:
  - `PageUp/PageDown` — scroll by page
  - `Home/End` — scroll to first/last message
  - `Ctrl+Alt+ArrowUp/Down` — jump to next/previous user message
  - `Ctrl+Shift+Home` — jump to last user message
- Use the existing `Virtualizer` API in `message-timeline.tsx` for scroll positioning
- **Files to modify:** `use-session-commands.tsx`, `pages/session/message-timeline.tsx`

### 1.4 Copy & Export

Missing: `messages.copy` (copy last assistant), `session.copy` (copy full transcript), `session.export` (export to markdown).

**Web implementation:**
- `messages.copy` — Add a "Copy" button on each assistant message (already exists in TUI, partially in web via message actions)
- `session.export` — Create export dialog (`dialog-export-options.tsx`) allowing:
  - Filename input
  - Include thinking blocks toggle
  - Include tool details toggle
  - Include metadata toggle
  - Download as `.md` file
- Wire to command palette as `session.export` and `messages.copy`
- **Files to create:** `components/dialog-export-options.tsx`
- **Files to modify:** `use-session-commands.tsx`, `pages/session/message-timeline.tsx`

### 1.5 Sidebar Sections (Plugin-extensible panels)

The TUI sidebar shows: Context (token usage + cost), MCP servers, LSP status, TODO items, Modified files — all as collapsible sections.

**Web implementation:**
- Add collapsible sidebar sections to `pages/session/session-side-panel.tsx` (or a new `session-sidebar.tsx`):
  - **Context section:** Token usage bar, context %, cost (data from `session-context-usage.tsx`)
  - **MCP section:** Connected MCP servers with status dots (data from `dialog-select-mcp.tsx`)
  - **TODO section:** Session TODO items (data from sync provider)
  - **Modified Files section:** Changed files with +/- line counts (data from file tree)
- Make sections collapsible/expandable
- **Files to modify/create:** `pages/session/session-side-panel.tsx`, `components/session-sidebar-sections.tsx`

---

## Phase 2: Dialog & Modal Parity (Week 2–3)

> **Impact: MEDIUM** — Fills gaps in workflow completeness.

### 2.1 Export Options Dialog

Create `components/dialog-export-options.tsx`:
- Filename input (default: `{session-title}.md`)
- Checkboxes: Include thinking, Include tool details, Include metadata, Include timestamps
- "Download" and "Copy to clipboard" buttons
- Wire to `session.export` command

### 2.2 Message Detail/Edit Popup

Create `components/dialog-message-detail.tsx`:
- Click on a user message to view full content
- "Edit and resend" option (edit the message, then re-submit)
- "Copy" button
- "Set as prompt" button (loads into composer)
- "Fork from here" button

### 2.3 Skill Management Dialog

Create `components/dialog-skills.tsx`:
- List installed skills with status (enabled/disabled)
- Enable/disable toggle per skill
- View skill details/description
- Install new skill (if applicable)
- Wire to `skill.list` command

### 2.4 Tag Management Dialog

Create `components/dialog-tags.tsx`:
- List all tags across sessions
- Create/rename/delete tags
- Filter sessions by tag
- Wire to `tag.list` command

### 2.5 Prompt Stash Dialog

Create `components/dialog-stash.tsx`:
- List stashed prompts
- Load a stashed prompt into composer
- Delete stashed prompts
- "Stash current prompt" action
- Wire to `stash.list` command

### 2.6 Workspace Management Dialogs

Create:
- `components/dialog-workspace-list.tsx` — List workspaces for current project
- `components/dialog-workspace-create.tsx` — Create new git worktree workspace
- `components/dialog-workspace-file-changes.tsx` — Show file changes in workspace
- Wire to `workspace.list`, `workspace.new` commands

### 2.7 Console Org Switcher

Create `components/dialog-console-org.tsx`:
- List available console organizations
- Switch active org
- Wire to `console.org.switch` command

### 2.8 Retry Action & Error Dialogs

Create:
- `components/dialog-retry-action.tsx` — Rate limit / free tier upsell
- `components/dialog-session-delete-failed.tsx` — Session deletion failure notice

---

## Phase 3: Advanced Session Features (Week 3–4)

> **Impact: MEDIUM** — Power-user features for complex workflows.

### 3.1 Subagent Navigation Footer

Create `pages/session/subagent-footer.tsx`:
- Show subagent label, index/total count
- Context usage and cost for subagent
- Navigation buttons: Parent, Previous Sibling, Next Sibling
- Display when inside a child (subagent) session
- Wire to `session.child.first/next/previous`, `session.parent` commands

### 3.2 Session Quick-Switch (Pinned Sessions)

- Add "Pin session" action to session context menu
- Add pinned sessions section at top of sidebar
- Implement `session.quick_switch.1-9` keyboard shortcuts
- Store pin state in `LocalProvider`

### 3.3 Session Directory Filter

- Add `app.toggle.session_directory_filter` command
- Filter session list to only show sessions from current project directory
- Toggle button in sidebar or command palette

### 3.4 Session Timeline (Jump-to-Message)

Create `components/dialog-timeline.tsx`:
- Show all user messages in a scrollable list
- Click to jump to that message in the timeline
- Search/filter messages
- Wire to `session.timeline` command

### 3.5 Session Fork from Timeline

Create `components/dialog-fork-timeline.tsx`:
- Combine timeline + fork workflow
- Select a message point, then fork session from there
- Wire to `session.fork` command (enhance existing `dialog-fork.tsx`)

---

## Phase 4: System Features (Week 4–6)

> **Impact: LOW-MEDIUM** — Architectural features that enable extensibility.

### 4.1 Plugin System (Web)

This is the largest architectural gap. The TUI has a full plugin system with:
- npm plugin loading
- Slot-based UI extension points
- Plugin API (`api.keymap`, `api.route`, `api.ui`, `api.state`, `api.theme`, `api.kv`)
- Plugin manager UI

**Web implementation strategy:**
- Create `packages/app/src/plugin/` module
- Define web-compatible plugin API (subset of TUI API):
  - `api.route.register()` — register custom routes/pages
  - `api.keymap` — register keyboard shortcuts
  - `api.ui.Slot` — slot-based UI extension points (home_logo, sidebar_content, session_prompt_right, etc.)
  - `api.state` — read-only access to session/provider/agent state
  - `api.toast` — notification API
- Create plugin loader that discovers and loads plugins from config
- Create plugin manager dialog (`dialog-plugins.tsx`)
- Define slot components in the web layout
- **Files to create:** `plugin/runtime.ts`, `plugin/api.ts`, `plugin/slots.tsx`, `components/dialog-plugins.tsx`
- **Files to modify:** `pages/layout.tsx` (add slot components), `pages/home.tsx`

### 4.2 KV Store (Persistent Reactive Key-Value)

- Create `hooks/use-kv.ts` — persistent KV store backed by localStorage or server sync
- Mirror TUI's `context/kv.tsx` API: `kv.get(key)`, `kv.set(key, value)`, `kv.signal(key)`
- Used by plugins and future features

### 4.3 Which-Key Popup

- Create `components/which-key.tsx` — shows available keybindings when a prefix key is pressed
- Trigger on configurable leader key (default: space after delay)
- Show grouped keybinding hints with categories
- Auto-dismiss after selection or timeout

### 4.4 Sound Pack System

- Extend existing sound settings in `settings-sounds.tsx`
- Allow loading custom sound packs from config
- Register sound events: `agent.complete`, `permission.ask`, `error`, `question.ask`
- Play sounds on corresponding events

### 4.5 Developer Tools

- `app.debug` — toggle debug panel (extend existing floating debug bar)
- `app.console` — in-app developer console for logs
- `app.heap_snapshot` — trigger V8 heap snapshot (desktop only)

---

## Phase 5: Polish & UX Parity (Week 6–7)

> **Impact: LOW** — Refinements for full feature parity.

### 5.1 Toggle Commands

Implement remaining toggles:
- `app.toggle.animations` — disable text streaming shimmer effects
- `app.toggle.file_context` — toggle file context display in messages
- `app.toggle.diffwrap` — word-wrap in diff views (Phase 1.2 covers this)
- `app.toggle.paste_summary` — toggle paste summary display

### 5.2 Home Tips

- Create `components/home-tips.tsx` — contextual tips shown when no sessions exist or no provider connected
- Show tips below prompt input on home page
- Tips: "Connect a provider to get started", "Try attaching a file with @", etc.

### 5.3 Permission Diff Viewer Enhancement

- Enhance `session-permission-dock.tsx` with split/unified toggle
- Add secret redaction (mask API keys, tokens in diffs)
- Add "Always allow" toggle per permission type
- Show file path and line numbers in diff

### 5.4 Question Prompt Enhancement

- Enhance `session-question-dock.tsx` with:
  - Tab navigation for multi-questionnaires
  - Radio button / checkbox answer types
  - Custom text input answers
  - Visual indicator of answered/unanswered questions

### 5.5 Additional UI Refinements

- `session.quick_switch.1-9` — show pinned session numbers in sidebar
- `session.toggle.scrollbar` — toggle session scrollbar
- `terminal.title.toggle` — toggle terminal title updates
- Workspace copy path button in workspace header

---

## Dependency Graph

```
Phase 1 (Core)
  ├── 1.1 Slash Commands ─────────────────┐
  ├── 1.2 Session Toggles ────────────────┤
  ├── 1.3 Navigation Commands ────────────┤
  ├── 1.4 Copy & Export ──────────────────┤
  └── 1.5 Sidebar Sections ───────────────┘
                                           │
Phase 2 (Dialogs) ────────────────────────┤
  ├── 2.1 Export Options Dialog ──────────┤  depends on 1.4
  ├── 2.2 Message Detail ────────────────┤
  ├── 2.3 Skills Dialog ─────────────────┤
  ├── 2.4 Tags Dialog ───────────────────┤
  ├── 2.5 Stash Dialog ──────────────────┤
  ├── 2.6 Workspace Dialogs ─────────────┤
  ├── 2.7 Console Org ───────────────────┤
  └── 2.8 Error Dialogs ─────────────────┘
                                           │
Phase 3 (Advanced) ────────────────────────┤
  ├── 3.1 Subagent Footer ───────────────┤
  ├── 3.2 Quick Switch ──────────────────┤
  ├── 3.3 Directory Filter ──────────────┤
  ├── 3.4 Timeline Dialog ───────────────┤
  └── 3.5 Fork from Timeline ────────────┘
                                           │
Phase 4 (System) ──────────────────────────┤
  ├── 4.1 Plugin System ─────────────────┤  depends on Phases 1-3
  ├── 4.2 KV Store ──────────────────────┤
  ├── 4.3 Which-Key ─────────────────────┤
  ├── 4.4 Sound Packs ───────────────────┤
  └── 4.5 Developer Tools ───────────────┘
                                           │
Phase 5 (Polish) ──────────────────────────┘
  ├── 5.1 Toggles
  ├── 5.2 Home Tips
  ├── 5.3 Permission Enhancement
  ├── 5.4 Question Enhancement
  └── 5.5 UI Refinements
```

---

## Recommended Priority Order

If you need to ship incrementally, this is the recommended order:

1. **Phase 1** (Core) — Biggest daily-use impact
2. **Phase 3.1** (Subagent Footer) — Critical for multi-agent workflows
3. **Phase 2.1** (Export) + **2.2** (Message Detail) — High user demand
4. **Phase 1.2** (Toggles) + **1.3** (Navigation) — Quick wins
5. **Phase 3.4** (Timeline) + **3.5** (Fork) — Session management
6. **Phase 2.3–2.8** (Remaining dialogs) — Completeness
7. **Phase 5** (Polish) — Final refinements
8. **Phase 4** (Plugin System) — Largest effort, can be deferred

---

## Technical Notes

- All new commands should be registered in `use-session-commands.tsx` and `pages/layout.tsx`
- New dialogs should follow existing patterns in `components/dialog-*.tsx`
- Toggle settings should be added to `settings.tsx` and wired through `SettingsProvider`
- Subagent navigation requires SDK changes to expose parent/child session relationships
- Plugin system requires a new `packages/app/src/plugin/` module
- All new features should be added to the command palette for discoverability

---

## Success Criteria

- [ ] Every TUI command has a web equivalent
- [ ] Every TUI dialog has a web equivalent
- [ ] Slash commands work in the web prompt input
- [ ] Sidebar shows context/MCP/TODO/files sections
- [ ] Subagent navigation works in web
- [ ] Export to markdown works
- [ ] Plugin system loads and runs web-compatible plugins
- [ ] No feature regression when switching from TUI to web
