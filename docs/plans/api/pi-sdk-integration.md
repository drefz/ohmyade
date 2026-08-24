# Pi SDK Integration Plan

## Status

Proposed

## Reference baseline

This plan targets:

- `@earendil-works/pi-coding-agent` `0.84.2`;
- Effect `4.0.0-beta.107`; and
- `@effect/platform-node` `4.0.0-beta.107`.

It was checked against Pi's SDK guide, all SDK examples, exported declarations, session format, compaction behavior, extension lifecycle, RPC command/event inventory, settings, model configuration, and security guidance. It was also checked against the matching Effect source for `ManagedRuntime`, `Context.Service`, `Layer`, `Scope`, `Queue`, `PubSub`, `FiberMap`, `Config`, and `Schema`.

Pi and Effect beta versions must be pinned exactly. `apps/api` must declare `@earendil-works/pi-coding-agent` directly; the globally linked Pi installation used to inspect documentation is not an application dependency. Upgrade work includes rerunning the contract tests and reviewing changed declarations before changing either version.

The Effect-specific conclusions are:

- `ManagedRuntime` is appropriate for repeatedly running application Effects from Hono's Promise/callback boundary and owns release of its layer resources;
- `Context.Service`, `Layer`, `Config`, and `Schema.TaggedError` are the Effect 4 service/config/error primitives;
- `Effect.tryPromise` supplies an interruption `AbortSignal` to Promise adapters;
- `Scope` plus `Effect.acquireRelease` is the correct ownership model for Pi runtimes and subscriptions;
- `FiberMap` is the appropriate keyed, scope-owned supervisor for background runs;
- `Queue` is appropriate for serialized commands and callback ingress; and
- a sliding `PubSub` prevents slow live subscribers from backpressuring Pi.

A request-scoped dynamic layer is not sufficient for sessions because an accepted agent run must retain its resource scope after the request exits. The registry therefore retains an explicit child scope per active controller.

## Integration decision

Oh My ADE embeds Pi through the in-process SDK. It does not launch Pi's RPC mode for normal operation.

The in-process SDK is preferred because the API is Node.js, needs direct access to `AgentSessionRuntime`, must supervise multiple sessions, and needs to adapt Pi resources into Effect scopes. Pi's RPC documentation remains useful as a completeness checklist for commands, events, and extension UI behavior, but Oh My ADE owns a separate versioned application protocol.

The dependency direction is:

```text
Hono transport
    -> Effect application services
        -> Pi SDK adapter
            -> AgentSessionRuntime / AgentSession / ModelRuntime
```

Only `apps/api` imports Pi packages. `packages/protocol`, the web application, and the Electron renderer never import Pi SDK types.

## Process-global and workspace-bound state

Pi distinguishes process-global fixed inputs from cwd-bound runtime services. The API must preserve that distinction.

### Process-global state

A process-wide `PiModelRuntime` Effect service owns one Pi `ModelRuntime`. It is configured with the server's agent directory and credential/model-store paths. It provides:

- provider and model catalog access;
- credential status and mutations;
- network refresh with application-owned deadlines;
- custom provider registration used by trusted extensions; and
- the canonical model runtime passed to every cwd-bound Pi runtime.

Credential material remains in the backend. Public model values are projected into protocol-owned summaries that omit secrets, request configuration, and provider-internal values.

### Workspace-bound state

Each effective cwd gets newly created Pi services through `createAgentSessionServices({ cwd, agentDir, modelRuntime, ... })`. This recreates:

- `SettingsManager` with global/project merge and trust state;
- `DefaultResourceLoader` and discovered resources;
- cwd-bound tools and paths; and
- runtime diagnostics.

The runtime factory passed to `createAgentSessionRuntime()` closes over the process-global `ModelRuntime` and server policy, then calls `createAgentSessionServices()` and `createAgentSessionFromServices()` for each initial creation or replacement.

This factory is required because `newSession()`, `switchSession()`, `fork()`, clone flows, and `importFromJsonl()` may replace the active session or change its effective cwd.

## Effect adapter services

Use Effect 4 service keys and layers rather than class-based dependency containers:

- `PiModelRuntime` — process-global Pi model/auth adapter;
- `PiRuntimeFactory` — builds cwd-bound `AgentSessionRuntime` resources;
- `RuntimeRegistry` — owns active controllers and their scopes;
- `ApprovalBroker` — coordinates tool approval requests;
- `WorkspaceService` — canonicalization, allowlists, and trust policy; and
- `PiProjection` — converts Pi values and events into protocol-owned values.

Define service keys with `Context.Service` and live/test implementations with `Layer.effect`, `Layer.sync`, or scoped acquisition. Define public application errors with `Schema.TaggedError`.

### Promise and callback adaptation

- Wrap rejecting Pi promises with `Effect.tryPromise({ try, catch })`.
- Pass the Effect-provided `AbortSignal` to Pi methods that accept a signal, especially `ModelRuntime` refresh/auth methods.
- For Pi operations without a signal parameter, attach interruption cleanup that calls the corresponding Pi abort method.
- Acquire `AgentSessionRuntime` with `Effect.acquireRelease`; release with `runtime.dispose()`.
- Before release, unsubscribe event listeners and flush `SettingsManager` writes.
- Drain `SettingsManager` errors and publish diagnostics instead of allowing Pi persistence errors to disappear.
- Never call `Effect.runPromise()` from application services. Promise execution belongs only at Hono/Pi callback boundaries.

### Session registry and scopes

Each active controller gets a dedicated child `Scope.Closeable` retained by `RuntimeRegistry`. The scope owns the Pi runtime, event subscription, queues, event pump, and background fibers. Explicit close, idle eviction, or server shutdown closes that scope. Scope creation, insertion into the registry, removal, and closure are serialized so concurrent opens cannot leak the losing child scope or publish two controllers for one active Pi identity.

A simple map plus explicitly retained scopes is preferred over acquiring a keyed layer only for an HTTP request. A request-scoped `LayerMap` lease would release the Pi session as soon as the request completes and could interrupt an accepted agent run. `LayerMap` may be adopted later only if the registry explicitly retains leases for runs and connected clients.

Use a process-scoped `FiberMap` for registry-level work and a session-scoped `FiberMap` for keyed operations such as `agent-run`, `compaction`, and direct bash. Closing the owning scope interrupts all fibers.

## Session identity and replacement

A controller has a stable internal `controllerId` and a mutable active Pi identity:

- Pi `sessionId`;
- Pi `sessionFile` when persisted;
- canonical cwd; and
- current registry index key.

Session replacement is one serialized controller operation. Configure `AgentSessionRuntime.setRebindSession()` once so every successful replacement uses the same extension-binding and subscription path:

1. Wait for idle or explicitly abort according to the requested operation.
2. Call the appropriate `AgentSessionRuntime` replacement method and handle its `{ cancelled }` result. Cancellation leaves indexes and subscriptions unchanged and emits no replacement event.
3. During the runtime's rebind callback, remove the old session subscription, bind the server-owned extension context to the supplied new session, subscribe to it, and never reuse captured old `AgentSession`, `SessionManager`, resource-loader, extension, or cwd-bound service values.
4. After successful replacement, read `runtime.session` and `runtime.services` again.
5. Update the registry's old/new indexes and current snapshot in one critical section.
6. Emit a `session_replaced` protocol event containing old and new public identities.

`AgentSessionRuntime` tears down the old runtime before creating the replacement. Therefore “atomic” applies to registry publication, not rollback: if replacement creation throws, the old Pi runtime cannot be assumed usable. Mark the controller unavailable, remove stale indexes, emit a safe diagnostic, and require an explicit recovery/open operation (or close the controller).

Existing WebSocket connections follow the stable controller through successful replacement and update their route state from `session_replaced`. New requests resolve through the new session index.

## Prompt and background-run lifecycle

`AgentSession.prompt()` resolves only after the complete accepted run, including retries and queued continuation. HTTP/WebSocket command acknowledgement must not await that promise.

Prompt acceptance uses Pi's `preflightResult` callback:

1. Serialize the prompt command through the session command queue and check its client-generated command ID against the controller's bounded, server-incarnation-local result cache.
2. Allocate an Effect `Deferred<boolean>` for preflight acknowledgement.
3. Start `session.prompt()` under the single `agent-run` FiberMap key only when that key is absent; never let FiberMap replacement semantics interrupt an existing prompt. Steering and follow-up call Pi on the existing run and do not install a replacement fiber.
4. Complete the Deferred from `preflightResult(true | false)`.
5. Return and cache command acceptance when the Deferred completes.
6. Keep the prompt fiber running independently of the client connection.
7. Convert failures before acceptance into command errors.
8. Convert failures after acceptance into lifecycle/diagnostic events; do not send a second command response.
9. On fiber interruption, invoke `session.abort()` and wait for Pi to become idle.

This matches Pi's SDK and RPC semantics while preserving server ownership of runs.

## Event bridge

`AgentSession.subscribe()` invokes a synchronous JavaScript callback. The callback must remain fast and must not start one Effect fiber per token.

Each controller uses:

- an unbounded ingress `Queue<PiEventEnvelope>`;
- one event-pump fiber;
- a `Ref` or `SynchronizedRef` containing the current snapshot and replay ring; and
- a sliding `PubSub<ServerEvent>` for live subscribers.

The Pi callback synchronously copies a minimal immutable event envelope, uses `Queue.offerUnsafe()` to enqueue it, records a diagnostic if the offer returns `false` after shutdown, and returns immediately. It must not retain mutable Pi messages, tool arguments/results, or other SDK objects for later projection. The event pump serially:

1. projects the copied Pi event envelope into zero or more protocol events;
2. updates the authoritative snapshot;
3. allocates the next sequence number;
4. appends to the bounded replay ring; and
5. publishes to the sliding PubSub.

The ingress queue is intentionally lossless while open because text/tool deltas are not reconstructable until their final messages arrive. Define queue-depth warning thresholds and a fail-safe ceiling before enabling remote multi-user deployment; an unbounded queue without an operational ceiling can exhaust the process. The live PubSub is sliding so a slow client cannot block Pi; a detected sequence gap triggers replay or snapshot recovery.

Unsubscribing a WebSocket closes only its scoped PubSub subscription. It never closes the session controller.

## AgentSession API coverage

### Prompting and message delivery

| Pi API                   | Oh My ADE integration                                                                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `prompt(text, options)`  | `prompt` command with text, images, expansion, source, and optional streaming behavior; uses preflight acknowledgement and detached run fiber. |
| `steer(text, images)`    | `steer` command; accepted only against the current controller and reflected through `queue_update`.                                            |
| `followUp(text, images)` | `follow_up` command; reflected through `queue_update`.                                                                                         |
| `sendUserMessage(...)`   | Server/internal extension operation, not a general bypass around authenticated prompt commands.                                                |
| `sendCustomMessage(...)` | Used by trusted server extensions; projected as custom messages without exposing arbitrary Pi object shapes.                                   |
| `clearQueue()`           | `clear_queue` command returning restored steering/follow-up text for the composer.                                                             |
| queue getters            | Included in snapshots and queue events.                                                                                                        |
| `waitForIdle()`          | Used before destructive session operations and shutdown.                                                                                       |
| `abort()`                | `abort_run`; idempotent at the application boundary.                                                                                           |

Input images use a protocol-owned opaque upload/attachment reference. The authenticated HTTP upload route validates ownership, media type, size, expiration, and prompt-time availability before the backend creates Pi `ImageContent`; large base64 payloads are never embedded in WebSocket replay events. Attachment cleanup is scoped to explicit retention/expiry rules rather than a client connection.

### Model and thinking controls

| Pi API                         | Oh My ADE integration                                                                               |
| ------------------------------ | --------------------------------------------------------------------------------------------------- |
| `setModel()`                   | `set_model` command after resolving provider/model through `ModelRuntime` and checking auth.        |
| `cycleModel()`                 | Optional `cycle_model` command; the web UI normally selects explicitly.                             |
| `setThinkingLevel()`           | `set_thinking_level`; return Pi's clamped effective value.                                          |
| `cycleThinkingLevel()`         | Optional `cycle_thinking_level`.                                                                    |
| `getAvailableThinkingLevels()` | Included in model/session control resources.                                                        |
| `supportsThinking()`           | Projected as model capability.                                                                      |
| scoped-model getters/setters   | Exposed as scoped model configuration; inputs resolve through `resolveModelScopeWithDiagnostics()`. |

Never expose Pi `Model` directly. Project provider, id, name, input capabilities, reasoning levels, context window, maximum output, and cost metadata into protocol schemas.

### Tools

| Pi API                          | Oh My ADE integration                                                                       |
| ------------------------------- | ------------------------------------------------------------------------------------------- |
| `getActiveToolNames()`          | Snapshot and tool settings resource.                                                        |
| `getAllTools()`                 | Tool catalog with name, description, parameter schema, guidelines, and safe provenance.     |
| `getToolDefinition()`           | Server-only lookup; definitions are not serialized directly.                                |
| `setActiveToolsByName()`        | `set_active_tools`, constrained by workspace and server policy.                             |
| built-in tool selection options | Applied when creating/recreating a session.                                                 |
| `customTools` / `defineTool()`  | Used for server-owned tools; custom tool promises bridge to Effect with cancellation.       |
| tool operation factories        | Used when routing tools to a sandbox, container, SSH host, or policy-controlled filesystem. |

Preserve Pi's built-in result details needed by the UI, especially edit `diff` and unified `patch`, but project them into versioned tool-result schemas. Keep Pi's output truncation behavior and show full-output references only when the path is safe for that client.

Custom file-mutating tools must use Pi's `withFileMutationQueue()` across the full read-modify-write window so they serialize correctly with built-in edit/write operations.

### Queue modes, compaction, and retry

| Pi API                                  | Oh My ADE integration                                               |
| --------------------------------------- | ------------------------------------------------------------------- |
| steering/follow-up mode getters/setters | Session settings commands and snapshot fields.                      |
| `compact()`                             | Detached `compact` operation with progress events and final result. |
| `abortCompaction()`                     | `abort_compaction`.                                                 |
| `abortBranchSummary()`                  | Used when cancelling tree navigation/summarization.                 |
| auto-compaction getters/setters         | Settings resource and `set_auto_compaction`.                        |
| retry getters/setters                   | Settings resource and `set_auto_retry`.                             |
| `abortRetry()`                          | `abort_retry`.                                                      |
| compaction/retry events                 | Preserved as protocol lifecycle events with safe error text.        |

Pi, not Effect, owns model-turn retry and compaction retry policy inside `AgentSession`. Effect supplies operation deadlines, shutdown interruption, and supervision; it must not add a second retry loop around `prompt()`.

### Direct bash

| Pi API               | Oh My ADE integration                                                                  |
| -------------------- | -------------------------------------------------------------------------------------- |
| `executeBash()`      | Optional authenticated `run_user_bash` command with streamed chunks and policy checks. |
| `abortBash()`        | `abort_user_bash`.                                                                     |
| bash state getters   | Snapshot fields.                                                                       |
| `recordBashResult()` | Server/extension-only; not public.                                                     |

LLM tool-call bash and direct user bash remain distinct. Direct bash output joins conversation context on the next prompt according to Pi semantics.

### Session information and export

| Pi API                                    | Oh My ADE integration                                                                                                             |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `messages` / `state`                      | Used to build snapshots; clients receive protocol-owned message projections.                                                      |
| `sessionId`, `sessionFile`, `sessionName` | ID/name are public; file paths are redacted or represented as server resources.                                                   |
| `setSessionName()`                        | Rename resource operation.                                                                                                        |
| `getSessionStats()` / `getContextUsage()` | Session statistics endpoint and snapshot updates.                                                                                 |
| `getLastAssistantText()`                  | Copy helper endpoint or derive client-side from messages.                                                                         |
| `exportToHtml()` / `exportToJsonl()`      | Authenticated export job followed by a controlled download. Never accept arbitrary unrestricted output paths from remote clients. |
| `reload()`                                | Reload resources operation with lifecycle events and complete extension rebinding.                                                |
| `dispose()`                               | Called only by scoped finalization.                                                                                               |

### Low-level `agent` access

Read `session.agent.state` only when constructing or verifying snapshots. Do not expose the mutable `AgentState` or permit clients to assign messages/tools directly. Use `AgentSession` methods for all mutations so persistence, events, extensions, and system prompt rebuilding remain coherent.

`agent.waitForIdle()` is not needed when `session.waitForIdle()` is available. Raw model streaming on `ModelRuntime` is reserved for Pi internals or explicitly designed server features, not normal conversation execution.

## AgentSessionRuntime and SessionManager coverage

### Runtime replacement

| Pi API                              | Oh My ADE operation                                                                                        |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `newSession()`                      | Create and atomically reindex a replacement session.                                                       |
| `switchSession(path)`               | Open a selected server-listed session; clients provide an opaque session reference, not an arbitrary path. |
| `fork(entryId)`                     | Fork before a user entry.                                                                                  |
| `fork(entryId, { position: "at" })` | Clone active path through an entry.                                                                        |
| `importFromJsonl()`                 | Validated upload/import job, then replacement.                                                             |
| `diagnostics`                       | Safe diagnostics in startup/resource events.                                                               |
| `dispose()`                         | Controller scope finalizer.                                                                                |

Always re-read `runtime.session`, rebind extensions, and resubscribe after replacement. Never use captured old `AgentSession`, `SessionManager`, extension context, or resource-loader values.

### Listing and tree navigation

Use Pi `SessionManager` for conversation persistence and tree truth:

- `list()` and `listAll()` back session-list resources;
- `getEntries()` plus entry IDs back incremental durable history reads;
- `getTree()`, `getChildren()`, labels, and leaf ID back the branch navigator;
- `navigateTree()` performs in-place navigation and optional summarization;
- `getUserMessagesForForking()` supplies fork candidates;
- `getBranch()` and `buildContextEntries()` support server snapshots and diagnostics;
- `createBranchedSession()` remains behind runtime fork/clone flows rather than a direct client mutation; and
- append/branch primitives are server/extension internals, not public generic write APIs.

The protocol mirrors Pi's append-only tree using stable entry IDs but defines its own schemas. Pi's JSONL file remains authoritative; Oh My ADE does not duplicate conversation persistence in its metadata store.

## ModelRuntime and credentials coverage

### Catalog

Expose backend resources for:

- providers and their supported auth methods;
- all registered model metadata;
- currently available models with valid authentication;
- cached availability and catalog diagnostics;
- scoped-model resolution diagnostics; and
- explicit network refresh status.

Use cached catalogs for initial startup. Network refresh is opt-in, bounded by a timeout, and receives the Effect interruption signal. Respect `PI_OFFLINE` and do not retry indefinitely.

### Authentication

Expose authenticated administrative operations for:

- auth status checks;
- API-key set/remove;
- OAuth login interaction;
- logout; and
- credential listing with secret values omitted.

OAuth prompts and browser/device flows use protocol approval/interaction messages similar to extension UI. `CredentialSynchronizationError` is a distinct application error: the credential mutation may have committed even though local model synchronization failed, so the API must report reconciliation status and must not blindly repeat the mutation.

Runtime API-key overrides are memory-only. Persistent credentials remain in Pi's credential store. Model credentials never reach browser storage or Electron renderer state.

### Provider registration and raw model APIs

Trusted extensions may call provider register/unregister APIs through Pi. Native provider callbacks can implement authentication, model refresh/filtering, and custom streaming, and therefore execute as trusted server code with full process access. The web API may later expose custom provider configuration, but it should write validated Pi configuration rather than accepting executable provider callbacks remotely.

Custom provider streams remain inside Pi's `ModelRuntime`/`AgentSession` path. They must obey their Pi `AbortSignal`, emit complete terminal stream events, report usage/cost, and normalize provider-specific context-overflow errors when needed. Effect supervises the containing session operation rather than reimplementing the provider stream protocol.

`ModelRuntime.stream`, `complete`, `streamSimple`, `completeSimple`, deferred fetch, and deferred cancellation are not used directly for ordinary agent sessions. `AgentSession` owns those calls. They remain available only for a future explicitly modeled feature or trusted extension.

## ResourceLoader coverage

For every cwd-bound runtime, expose safe resource summaries and diagnostics for:

- extensions;
- skills;
- prompt templates;
- context files;
- system prompt source and appended prompt sources; and
- themes.

### Resource behavior

- Resolve project trust before loading project settings, extensions, packages, or project resources.
- Context files follow Pi semantics and may load regardless of trust; communicate this clearly in the trust UI.
- Call `reload()` through `AgentSession.reload()` so extension shutdown/start and resource discovery lifecycles remain coherent.
- Prompt commands may opt into Pi template, skill, and extension-command expansion.
- Commands endpoint combines extension commands, prompt templates, and skills using Pi's command metadata and safe provenance.
- Themes are listed for completeness but do not control the React application's theme. TUI renderers and Pi terminal themes are not reused in the browser.
- Resource diagnostics are projected and paths are redacted according to workspace/client permissions.

## SettingsManager coverage

Maintain two distinct settings domains:

1. Pi settings, owned by `SettingsManager`; and
2. Oh My ADE server/client settings, owned by the application metadata store.

Expose applicable Pi settings: model defaults, thinking, transport, queue modes, compaction, branch summary, retry, images, shell policy, tools, session directory, model scope, resources, provider timeouts, and trust defaults.

Terminal-only Pi settings may be displayed as unsupported or omitted from the web settings editor. Do not silently reinterpret them as React UI preferences.

For every mutation:

1. validate through protocol schema and server policy;
2. call the specific `SettingsManager` setter;
3. call `flush()` at user-visible durability boundaries;
4. call `drainErrors()`; and
5. return scoped persistence diagnostics.

Project setting writes require an active trusted project. Global and project scopes remain explicit in the API.

## Embedded-process environment

The CLI and RPC entry points set `AI_AGENT=pi` and `PI_CODING_AGENT=true`, but SDK embedding does not. Set these markers in the controlled environment inherited by Pi tool child processes so downstream developer tools can identify Pi without treating the entire Hono process configuration as client input.

Pass the agent and session directories explicitly to Pi services instead of relying only on global environment mutation. Continue to honor relevant Pi process configuration such as `PI_OFFLINE`, proxy settings, telemetry policy, and cache retention.

Pi's built-in bash tool injects `PI_SESSION_ID`, `PI_SESSION_FILE`, `PI_PROVIDER`, `PI_MODEL`, and `PI_REASONING_LEVEL` at command start. Preserve this behavior for local trusted execution. When routing tools to a remote or less-trusted sandbox, decide explicitly whether to set `exposeSessionEnvironment: false`, especially because `PI_SESSION_FILE` contains an absolute host path.

## Extensions, approvals, and web UI bridging

### Server approval extension

Pi intentionally has no built-in permission popup. Implement tool approval as a server-owned named inline extension loaded after discovered user/project extensions. Pi appends inline factories after file-based extensions and runs `tool_call` handlers in extension load order, so the final approval handler sees argument mutations made by earlier trusted handlers. Pin this ordering with an SDK contract test; fail startup if an SDK upgrade invalidates it.

On `tool_call`, the extension:

1. applies deterministic deny/allow policy;
2. constructs a redacted approval request for undecided calls;
3. asks `ApprovalBroker` and awaits an Effect `Deferred` through a captured runtime callback;
4. authorizes responders for the controller/workspace and accepts at most the first valid response for the `(controllerId, runId, toolCallId)` key;
5. honors the active abort signal and a bounded timeout;
6. immediately denies when no eligible client is connected, and denies pending requests when their last eligible client disconnects; and
7. returns Pi's `{ block: true, reason }` result when denied.

Approval policy must account for parallel tool preflight. Requests are correlated by controller, run, and `toolCallId`. Earlier extension handlers may block before approval or mutate arguments; the approval request must show the final arguments that Pi will execute. The approval extension should not mutate them afterward unless implementing an explicit policy rewrite that is itself displayed to the user.

Approval is not a sandbox. Remote/untrusted work still requires OS, container, VM, or micro-VM isolation.

### Extension UI

Bind extensions with a server-owned `ExtensionUIContext` and non-TUI mode. Map supported operations to protocol events:

- `select`, `confirm`, `input`, and `editor` become correlated request/response dialogs;
- `notify`, status, widget text, title, and editor-text requests become fire-and-forget UI events; and
- timeouts/cancellation resolve with Pi-compatible defaults.

Terminal component factories, custom TUI overlays, custom editors, renderers, footers, headers, terminal themes, and terminal input cannot be rendered in React. Return documented degraded/no-op behavior rather than pretending they succeeded. The web UI renders protocol messages and tool results itself.

### Extension lifecycle and APIs

Preserve Pi extension event ordering and lifecycle. In particular:

- async factories complete before session start;
- long-lived resources start on `session_start`, not factory evaluation;
- `session_shutdown` runs before replacement, reload, or close;
- project trust precedes project-local extension loading;
- replacement callbacks use only new session context;
- extension commands can execute while an agent is streaming;
- input interception happens before skill/template expansion;
- tool gates are fail-safe;
- tool result modifications are reflected in final protocol events;
- provider hooks remain server-side and sensitive payloads are not forwarded by default; and
- extension errors become diagnostics without crashing the controller unless policy requires fail-closed behavior.

Pi's custom TUI rendering registration APIs are intentionally not integrated. Custom messages, custom entries, tool content/details, labels, and extension state still flow through session persistence and generic web renderers.

## Event coverage matrix

The adapter must explicitly handle every `AgentSessionEvent` category:

| Pi event                             | Protocol treatment                                                                                         |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `agent_start`                        | Run status becomes running.                                                                                |
| `agent_end`                          | Low-level run completion with `willRetry`; do not mark settled yet.                                        |
| `agent_settled`                      | Run status becomes idle when no newer run exists.                                                          |
| `turn_start`, `turn_end`             | Turn lifecycle and authoritative completed turn data.                                                      |
| `message_start`                      | Create live message shell.                                                                                 |
| `message_update`                     | Forward text, thinking, and tool-call block deltas by `contentIndex`; accumulate client/server live state. |
| `message_end`                        | Replace partial state with authoritative final message.                                                    |
| `tool_execution_start`               | Create tool execution keyed by `toolCallId`.                                                               |
| `tool_execution_update`              | Replace accumulated partial tool result.                                                                   |
| `tool_execution_end`                 | Store authoritative result and error status.                                                               |
| `queue_update`                       | Replace steering/follow-up queue snapshot.                                                                 |
| `entry_appended`                     | Append or reconcile durable session entry.                                                                 |
| `session_info_changed`               | Update name.                                                                                               |
| `thinking_level_changed`             | Update effective level.                                                                                    |
| `compaction_start`, `compaction_end` | Compaction lifecycle and result.                                                                           |
| `auto_retry_start`, `auto_retry_end` | Retry lifecycle; preserve attempts and safe errors.                                                        |
| summarization retry events           | Compaction/branch-summary retry status.                                                                    |
| `bash_execution_update`              | Correlated direct-bash output delta.                                                                       |

Core message/tool delta variants must be exhaustively switched. Extension failures arrive through the `bindExtensions({ onError })` bridge rather than `AgentSession.subscribe()`. An unknown subscribed event or delta variant is logged as an SDK compatibility diagnostic and triggers snapshot reconciliation rather than being silently ignored.

Extension-only events such as approval requests and extension errors enter the same sequenced server event stream through their server bridges.

## Snapshots and projections

A session snapshot contains protocol-owned representations of:

- controller and Pi session identity;
- cwd/workspace reference;
- session name and persistence status;
- messages and current partial assistant message;
- active model and thinking capabilities;
- active/configured tools;
- streaming, idle, compaction, retry, and direct-bash state;
- steering/follow-up queues and modes;
- session tree leaf and latest durable entry cursor;
- token, cost, and context usage;
- resource diagnostics; and
- latest sequence number.

Treat final Pi messages and session entries as authoritative. Deltas are transient rendering accelerators. On projection failure or sequence gap, rebuild from `AgentSession`, `SessionManager`, and controller state.

## SDK exports deliberately not used

The main Pi package exports more than the embedded backend needs. Explicit exclusions prevent accidental coupling:

- `InteractiveMode` and Pi TUI components — React is the renderer.
- `runPrintMode` — server sessions are persistent and interactive.
- `runRpcMode` and `RpcClient` — no subprocess boundary in normal deployment.
- CLI argument parsing and `main()` — Hono has its own configuration and lifecycle.
- TUI themes, keybindings, clipboard, and terminal utilities — client concerns or unsupported extension UI.
- Direct mutable `AgentState` assignment — bypasses Pi session invariants.
- Low-level compaction functions — `AgentSession.compact()` and runtime navigation own normal flows.
- Raw session-file append/mutation endpoints — Pi runtime and trusted extensions own writes.
- Package installation/update APIs — deferred to a separately secured administrative feature.

Pi's run-mode and RPC definitions may be used as behavioral references, never as the public Oh My ADE protocol.

## Error translation

Map Pi failures at the adapter boundary into schema-backed application errors:

- session/model/resource not found;
- prompt rejected before acceptance;
- invalid streaming behavior;
- unavailable model authentication;
- credential synchronization failure;
- runtime creation/replacement failure;
- import file invalid or missing;
- project trust required;
- compaction/navigation cancelled or failed;
- extension failure;
- Pi operation interrupted; and
- unexpected Pi SDK failure.

Preserve unknown causes in server logs, but expose only stable codes and safe messages. A Pi event reporting a model failure after prompt acceptance is a run event, not a second command failure.

## Delivery order

### 1. Contract spike

- Pin Pi `0.84.2`, Effect `4.0.0-beta.107`, and platform packages.
- Compile a minimal `createAgentSessionRuntime()` adapter.
- Prove managed startup/disposal and event unsubscribe.
- Prove prompt preflight acknowledgement while the prompt continues in a FiberMap.
- Prove Effect interruption calls Pi abort and reaches idle.

### 2. Core session

- Implement process-global ModelRuntime and cwd runtime factory.
- Implement one scoped controller, command queue, event ingress queue, event pump, snapshot, replay, and live PubSub.
- Integrate prompt, steer, follow-up, abort, messages, state, model, thinking, tools, compaction, and retry.

### 3. Persistence and replacement

- Add session listing, create, resume, fork, clone, import, tree navigation, labels, names, entries, stats, and export.
- Implement atomic registry reindexing and complete resubscription after replacement.
- Flush settings and surface diagnostics.

### 4. Models and resources

- Add provider/model catalogs, credential interactions, refresh deadlines, scoped models, resource listing, command listing, trust, and reload.

### 5. Tools and extensions

- Add server approval extension and broker.
- Add extension UI request/response bridging.
- Preserve custom messages, entries, tools, and diagnostics.
- Add sandbox/remote operation adapters as a separate security boundary.

### 6. Reliability

- Add bounded replay, snapshot recovery, event compatibility diagnostics, queue-depth monitoring, idle controller eviction, and shutdown recovery tests.

## Test matrix

Use fake Pi adapters for most Effect service tests and a small pinned-SDK integration suite for contract behavior.

Required SDK contract tests include:

- session creation/disposal and settings flush;
- preflight true/false timing;
- accepted run outliving its initiating connection;
- text/thinking/tool-call delta assembly and authoritative message end;
- parallel tool lifecycle ordering;
- abort, retry, compaction, and settled semantics;
- steering/follow-up queue modes;
- model auth and thinking-level clamping;
- direct bash streaming and abort;
- session list/tree/label/name/stats/export;
- new/switch/fork/clone/import cancellation, replacement failure after old-runtime teardown, registry recovery, and stale-reference rejection;
- extension shutdown/start/reload ordering;
- approval allow, deny, timeout, abort, and disconnect;
- resource trust and diagnostics;
- credential synchronization partial failure; and
- unknown event compatibility fallback.

## Acceptance criteria

- Every Pi SDK capability described above is classified as integrated, server-internal, deferred, or deliberately excluded.
- Agent runs, compaction, and direct bash are supervised by session scopes and survive client disconnects.
- Pi session/runtime replacement cannot leave stale subscriptions or registry keys.
- No Pi SDK type appears in `packages/protocol` or client code.
- No credential or unrestricted host path is serialized to clients.
- Every Pi event variant is handled exhaustively or produces a visible compatibility diagnostic.
- Tool approval defaults to deny when unattended and is documented as policy, not sandboxing.
- Settings persistence is flushed and errors are surfaced at durability boundaries.
- Pinned-SDK contract tests protect the adapter before dependency upgrades.
