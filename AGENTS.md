# AGENT.md

Binding rules for AI coding agents and human contributors in this repository. Rules use RFC 2119 keywords: MUST, MUST NOT, SHOULD, MAY. When this file conflicts with a habit, default, or generic best practice, this file wins. A nested `AGENT.md` inside a subdirectory MAY refine these rules for that subtree; the closest file takes precedence.

---

## 0. Baseline Style Guides

Language-level details not covered here MUST follow the official or industry-standard guide for that language. This file only overrides them where it is stricter.

| Language          | Baseline guide                                         | Enforced by                     |
|-------------------|--------------------------------------------------------|---------------------------------|
| TypeScript / JS   | Google TypeScript Style Guide                          | ESLint + Prettier               |
| Python            | PEP 8 + Google Python Style Guide                      | Ruff (lint + format), mypy      |
| Go                | Effective Go + Uber Go Style Guide                     | gofmt, goimports, golangci-lint |
| Java              | Google Java Style Guide                                | Checkstyle, google-java-format  |
| Kotlin            | Kotlin Coding Conventions                              | ktlint / detekt                 |
| C#                | Microsoft .NET Framework Design Guidelines             | .editorconfig + Roslyn analyzers|
| Dart / Flutter    | Effective Dart                                         | dart analyze, dart format       |
| SQL               | snake_case, uppercase keywords                         | sqlfluff                        |

Formatting (indentation, line length, quotes, trailing commas) is never debated in review: the formatter output is the standard. Agents MUST NOT hand-format against the formatter.

---

## 1. Commands

The project MUST expose these canonical scripts through its manifest (`package.json`, `Makefile`, `pyproject.toml`, `Taskfile`, etc.). Agents MUST use them instead of inventing ad-hoc commands.

| Script       | Purpose                                        |
|--------------|------------------------------------------------|
| `install`    | Install dependencies from the lockfile         |
| `dev`        | Run the app locally                            |
| `lint`       | Static analysis, zero warnings allowed         |
| `format`     | Apply the formatter                            |
| `typecheck`  | Type checking (where applicable)               |
| `test`       | Unit and integration tests                     |
| `test:e2e`   | End-to-end tests                               |
| `build`      | Production build                               |

Before declaring a task done, agents MUST run `format`, `lint`, `typecheck`, and `test`, and they MUST pass.

---

## 2. Language

- All identifiers (variables, functions, classes, files, folders, tables, columns, API fields, env vars, branch names) MUST be in English.
- All comments, docstrings, logs, error messages, and commit messages MUST be in English.
- User-facing text MUST live in i18n resource files (`locales/en.json`, `locales/vi.json`), never hard-coded in logic.
- Transliterated or mixed-language names are forbidden.
- Use domain-standard English terms, not literal translations.

| Forbidden          | Required                     |
|--------------------|------------------------------|
| `soLuong`          | `quantity`                   |
| `danhSachSanPham`  | `products`                   |
| `layThongTinUser`  | `getUserProfile`             |
| `kiemTraHopLe()`   | `validate()` / `isValid()`   |
| `tongTien`         | `totalAmount`                |
| `hoaDon`           | `invoice`                    |

---

## 3. Naming

### 3.1 Principles

- Descriptiveness is proportional to scope: a loop index MAY be `i`; a module-level export MUST be fully descriptive.
- Names express intent, not type or implementation: `activeUsers`, not `userArray` or `filteredList2`.
- No abbreviations or contractions: `onButtonClick`, not `onBtnClick`; `customerAddress`, not `custAddr`.
  Allowed exceptions: `id`, `url`, `uri`, `api`, `db`, `io`, `ui`, `ctx`, `config`, `auth`, `env`, `dto`, `req`, `res`, `err`.
- Acronyms are treated as words: `userId`, `httpClient`, `parseJson`, `HtmlParser` (Go keeps initialisms uppercase: `userID`, `HTTPClient`).
- No names that differ only by case.
- No meaningless names: `data`, `info`, `item`, `obj`, `temp`, `value`, `result`, `manager`, `handler`, `helper`, `util` as standalone names.
- No language keywords or built-ins as names (`type`, `list`, `string`, `error`, `id` shadowing built-ins in Python).
- One concept, one verb across the project. Pick one and use it everywhere:

| Concept        | Use       | Do not mix with                 |
|----------------|-----------|---------------------------------|
| Read one       | `get`     | `fetch`, `retrieve`, `load`     |
| Read many      | `list`    | `getAll`, `fetchMany`, `query`  |
| Create         | `create`  | `add`, `insert`, `new`          |
| Update         | `update`  | `edit`, `modify`, `save`        |
| Delete         | `delete`  | `remove`, `destroy`, `erase`    |
| Convert        | `to` / `from` | `convert`, `transform`, `make` |

### 3.2 Casing

| Element                    | TS / JS / Java / Kotlin / Dart | Python               | Go                    | C#                  |
|----------------------------|--------------------------------|----------------------|-----------------------|---------------------|
| Local variable, parameter  | `camelCase`                    | `snake_case`         | `camelCase`           | `camelCase`         |
| Function, method           | `camelCase`                    | `snake_case`         | `MixedCaps` / `mixedCaps` | `PascalCase`    |
| Class, interface, type     | `PascalCase`                   | `PascalCase`         | `PascalCase`          | `PascalCase`        |
| Enum type / member         | `PascalCase` / `UPPER_SNAKE_CASE` | `PascalCase` / `UPPER_SNAKE_CASE` | `PascalCase` consts | `PascalCase` |
| Constant                   | `UPPER_SNAKE_CASE`             | `UPPER_SNAKE_CASE`   | `MixedCaps`           | `PascalCase`        |
| Private member             | `#field` / `private`           | `_field`             | lowercase first letter| `_camelCase`        |
| Type parameter             | `T`, `TKey`, `TValue`          | `T`, `KeyT`          | `T`, `K`, `V`         | `T`, `TKey`         |
| Interface prefix `I`       | Forbidden                      | N/A                  | Forbidden             | Required (`IOrderRepository`) |

Cross-cutting:

| Element               | Convention                       | Example                        |
|-----------------------|----------------------------------|--------------------------------|
| Environment variable  | `UPPER_SNAKE_CASE`, app prefix   | `APP_DATABASE_URL`             |
| Database table        | `snake_case`, plural             | `order_items`                  |
| Database column       | `snake_case`                     | `created_at`, `customer_id`    |
| Foreign key column    | `<singular_table>_id`            | `order_id`                     |
| Index                 | `idx_<table>_<columns>`          | `idx_orders_customer_id`       |
| Unique constraint     | `uq_<table>_<columns>`           | `uq_users_email`               |
| Migration file        | `<timestamp>_<verb>_<object>`    | `20261118093000_create_orders_table` |
| REST path             | `kebab-case`, plural nouns       | `/api/v1/order-items/{orderItemId}` |
| Query parameter       | `camelCase`                      | `?pageSize=20&sortBy=createdAt`|
| JSON field            | `camelCase`                      | `"createdAt"`                  |
| Event / message name  | `<domain>.<entity>.<past-verb>`  | `billing.invoice.paid`         |
| Feature flag          | `kebab-case`                     | `enable-new-checkout`          |
| CSS class             | `kebab-case`                     | `order-summary__total`         |
| Docker image / k8s resource | `kebab-case`               | `order-service`                |

### 3.3 Grammar

| Kind                | Pattern                                     | Example                              |
|---------------------|---------------------------------------------|--------------------------------------|
| Boolean             | `is` / `has` / `can` / `should` + predicate | `isActive`, `hasAccess`, `canRefund` |
| Function            | verb + object                               | `createInvoice()`, `sendEmail()`     |
| Predicate function  | `is` / `has` / `can`                        | `isExpired()`                        |
| Factory             | `create` + noun / `from` + source           | `createLogger()`, `Money.fromCents()`|
| Converter           | `to` + target                               | `toDto()`, `toJson()`                |
| Event handler       | `handle` + event (impl), `on` + event (prop)| `handleSubmit`, `onSubmit`           |
| Collection          | plural noun                                 | `orders`, `userIds`                  |
| Map / dictionary    | `<value>By<Key>`                            | `ordersByCustomerId`                 |
| Count               | `<noun>Count`                               | `retryCount`, not `numRetries`       |
| Units               | suffix the unit                             | `timeoutMs`, `sizeBytes`, `priceCents` |
| Class               | singular noun                               | `Invoice`, `PaymentGateway`          |
| Exception / error   | noun + `Error` / `Exception`                | `InsufficientFundsError`             |
| Test                | `<unit>_<scenario>_<expected>` or `should <expected> when <scenario>` | `should reject refund when order is unpaid` |

### 3.4 Role Suffixes

A class name MUST state its single responsibility. If a class needs two suffixes, split it.

| Suffix        | Layer          | Responsibility                                      |
|---------------|----------------|-----------------------------------------------------|
| `Controller` / `Handler` / `Resolver` | Presentation | Parse input, call a service, shape output |
| `Service` / `UseCase` | Application | Orchestrate business operations               |
| `Policy` / `Rule`     | Domain      | Pure business rules                           |
| `Entity` / `Model`    | Domain      | Domain object with identity                   |
| `Repository`          | Domain port / Infra adapter | Persistence abstraction and implementation |
| `Client` / `Gateway`  | Infrastructure | Wrapper over an external API or SDK        |
| `Dto` / `Request` / `Response` | Boundary | Wire-level data shape                   |
| `Mapper`              | Boundary    | Converts between entities and DTOs            |
| `Validator` / `Schema`| Boundary    | Input validation                              |
| `Config`              | Infrastructure | Typed configuration                        |
| `Job` / `Worker` / `Consumer` | Infrastructure | Background or message processing    |

### 3.5 Files and Folders

- Folders: lowercase `kebab-case` (`order-management/`); Python and Go packages: lowercase, no separators where possible (`orders`, `payments`), `snake_case` only if needed for readability.
- One primary export per file; the file is named after it, following the language convention:

| Language           | Class file              | Module / utility file     | Test file                     |
|--------------------|-------------------------|---------------------------|-------------------------------|
| TS / JS            | `order.service.ts`      | `date-format.ts`          | `order.service.test.ts`       |
| React component    | `OrderSummary.tsx`      | `use-order-summary.ts`    | `OrderSummary.test.tsx`       |
| Python             | `order_service.py`      | `date_format.py`          | `test_order_service.py`       |
| Go                 | `order_service.go`      | `date_format.go`          | `order_service_test.go`       |
| Java / Kotlin / C# | `OrderService.java`     | `DateFormat.java`         | `OrderServiceTest.java`       |
| Dart               | `order_service.dart`    | `date_format.dart`        | `order_service_test.dart`     |

- Java / Kotlin / C# packages and namespaces: reverse domain, lowercase for Java/Kotlin (`com.company.product.orders`), PascalCase for C# (`Company.Product.Orders`).
- No spaces, accented characters, or version suffixes (`_v2`, `-new`, `-final`, `-copy`) in any file or folder name.

---

## 4. Comments and Documentation

### 4.1 File Header: Exactly One Line

Every source file MUST start with one single-line comment stating the file's responsibility. Nothing else: no author, date, license, changelog, or ASCII banner.

```ts
// Handles creation, update, and cancellation of customer orders.
```

```python
# Validates and normalizes incoming payment webhook payloads.
```

```go
// Package orders implements order lifecycle management.
```

- One sentence, ends with a period, starts with a verb or "Package <name>" (Go).
- Placed after mandatory directives (shebang, `"use client"`, `package`, encoding line) and before imports.
- Go: the package doc comment in `doc.go` (or the main file) satisfies this rule; other files in the package use a one-line header too.
- Generated files keep only the generator's standard "do not edit" marker.

### 4.2 Inline Comments

- Default: no comment. Clear names replace comments.
- A comment MUST explain **why**, never **what**: a non-obvious constraint, a workaround with its cause, a performance or security reason, a deliberate deviation.
- An empty `catch` block MUST carry a one-line comment explaining why the error is ignored.

```ts
// Wrong: restates the code.
// Loop through users and send email
for (const user of users) await sendWelcomeEmail(user);

// Correct: explains a non-obvious constraint.
// Provider retries webhooks for 72h; dedupe by event id to stay idempotent.
if (await processedEvents.has(event.id)) return;
```

### 4.3 Docstrings

- Required only on public API: exported functions, public classes and methods, module entry points.
- One-line summary in imperative mood. Add `Args` / `Returns` / `Raises` / `@param` / `@throws` only when names and types do not already make the contract clear.

```python
def convert_currency(amount: Decimal, rate: Decimal) -> Decimal:
    """Convert an amount using the exchange rate, rounded half-up to 2 decimals."""
```

### 4.4 Forbidden

- Agent narration: "Here we...", "Now let's...", "This function will...", "As requested", "Updated by AI", "New implementation", "Step 1:", "Fixed".
- Multi-paragraph explanations, tutorials, or change summaries inside source files.
- Commented-out code. Delete it; version control keeps history.
- Placeholders: `TODO`, `FIXME`, `XXX`, `// ...rest of code`, `pass  # implement later`, `throw new Error("Not implemented")`.
- Ticket IDs, issue numbers, URLs to tracking systems, author tags.
- Emojis and decorative separators (`// ======`, `/***** SECTION *****/`, `#region` noise).
- Comments in any language other than English.

---

## 5. Project Structure

### 5.1 Principles

1. **Feature first, layer second.** Top-level grouping is by business domain; layers live inside each feature.
2. **Unidirectional dependencies.** `shared -> features -> app`. Lower levels never import higher levels.
3. **Features are isolated.** A feature MUST NOT import another feature's internals; it imports only that feature's public entry (`index.ts`, `__init__.py`, exported Go package API, `api` package in Java).
4. **Promote, do not predict.** Code moves to `shared/` only when two or more features actually use it.
5. **Shallow trees.** Maximum 4 levels of nesting under `src/`.
6. **Config outside code.** Everything that varies between deploys comes from environment variables.

### 5.2 Single Application (Backend)

```
project-root/
  AGENT.md
  README.md
  LICENSE
  CHANGELOG.md
  .editorconfig
  .env.example
  .gitignore
  <manifest + lockfile>
  docs/
    architecture.md
    adr/                         # architecture decision records: 0001-use-postgres.md
  scripts/                       # dev, CI, and ops scripts
  deploy/                        # Dockerfile, compose, k8s, IaC
  src/
    main.<ext>                   # entry point: wiring only, no logic
    app/                         # bootstrap, DI container, router, middleware registration
    config/                      # typed config loaded from env, validated at startup
    features/
      orders/
        api/                     # controllers, routes, request/response DTOs, validators
        application/             # services / use cases
        domain/                  # entities, value objects, policies, repository interfaces
        infrastructure/          # repository implementations, external clients
        index.<ext>              # public API of the feature
      billing/
      users/
    shared/
      domain/                    # cross-feature value objects (Money, Email)
      errors/                    # base error types, error codes
      logging/
      utils/                     # pure, stateless functions only
    infrastructure/
      database/                  # connection, migrations, seeds
      cache/
      messaging/
      http/                      # shared HTTP client setup
  tests/
    unit/                        # mirrors src/
    integration/
    e2e/
    fixtures/
```

For small features, the four layer folders MAY collapse into flat files (`orders.controller.ts`, `orders.service.ts`, `orders.repository.ts`, `orders.dto.ts`) as long as the dependency rules hold.

### 5.3 Single Application (Frontend)

```
src/
  app/                           # routes/pages, providers, global layout, global styles
  features/
    checkout/
      api/                       # request functions and query hooks for this feature
      components/
      hooks/
      stores/
      types/
      utils/
      index.ts                   # public API
  components/                    # shared UI primitives (Button, Modal)
  hooks/                         # shared hooks
  lib/                           # preconfigured third-party wrappers (http client, query client)
  stores/                        # global state only
  types/                         # global types
  utils/                         # shared pure functions
  config/                        # env-driven configuration
  assets/
```

Import direction: `components | hooks | lib | types | utils -> features -> app`.

### 5.4 Monorepo

```
apps/
  web/
  admin/
  api/
  worker/
packages/
  ui/                            # shared design system
  config-eslint/
  config-typescript/
  domain/                        # shared domain types and contracts
  api-client/                    # generated client from the API schema
tools/
docs/
```

- `apps/*` MAY depend on `packages/*`. `packages/*` MUST NOT depend on `apps/*`.
- Each app and package owns its manifest, tests, and optional nested `AGENT.md`.

### 5.5 Forbidden

- Catch-all files or folders: `helpers`, `misc`, `common`, `stuff`, `general`, `others`, `temp`, `new`, `old`, `backup`, `shared2`.
- Business logic in `utils/`, controllers, UI components, or database models.
- Hard-coded secrets, credentials, hostnames, or keys anywhere in the repository.
- Duplicated or versioned files (`order.service.v2.ts`, `utils-final.py`).

---

## 6. Dependencies and Imports

### 6.1 Layer Rules

```
api (controller) -> application (service) -> domain <- infrastructure
```

- `domain` depends on nothing outside itself and `shared/domain`. No framework, ORM, or HTTP imports.
- `infrastructure` implements interfaces declared in `domain` (dependency inversion).
- Controllers MUST NOT call repositories or external clients directly.
- Services MUST NOT import framework request/response objects.
- Repositories MUST NOT contain business rules.
- Cross-feature calls go through the other feature's public service API or through domain events, never through its repository or tables.
- Circular dependencies are forbidden at file, package, and feature level. Break cycles by extracting a shared contract or by using an event.
- Boundaries MUST be enforced by tooling where available (`eslint-plugin-boundaries` / `import/no-restricted-paths`, `import-linter`, ArchUnit, Go `internal/` packages).

### 6.2 Import Order

Groups separated by one blank line, alphabetical within each group (let the formatter or `goimports` / Ruff `isort` do it):

1. Standard library
2. Third-party packages
3. Internal absolute imports (`@/shared/...`, `app.shared...`, module path)
4. Relative imports within the same feature

```ts
import { randomUUID } from "node:crypto";

import { z } from "zod";

import { AppError } from "@/shared/errors";
import { logger } from "@/shared/logging";

import { OrderRepository } from "./order.repository";
import type { CreateOrderRequest } from "./order.dto";
```

### 6.3 Import Rules

- Use path aliases or absolute imports across features and for `shared/`. Relative imports only inside the same feature, at most one `../`.
- No wildcard imports (`import *`, `from x import *`, `import java.util.*`).
- No deep imports into another feature (`@/features/billing/domain/invoice` is forbidden; use `@/features/billing`).
- Use `import type` (TS) for type-only imports.
- Remove unused imports. No side-effect imports unless the framework requires them.

### 6.4 Third-Party Libraries

- Add a dependency only when the standard library or an existing dependency cannot reasonably do the job. Prefer well-maintained, widely adopted packages with a compatible license.
- Commit the lockfile. Pin exact versions for applications; use ranges only in published libraries.
- Separate runtime and development dependencies.
- Wrap vendor SDKs in a `Client` / `Gateway` under `infrastructure/`. Business code MUST NOT depend on vendor types.
- Never add a dependency to solve a one-line problem.

---

## 7. Code Rules

### 7.1 Functions and Classes

- Single responsibility. Functions SHOULD stay under ~40 lines; files SHOULD stay under ~300 lines. Exceeding either is a signal to split.
- Maximum 3 positional parameters; beyond that, pass an options object / dataclass / struct.
- Prefer early returns over nested conditionals. Maximum nesting depth: 3.
- Prefer immutability: `const`, `readonly`, `final`, frozen dataclasses.
- No magic numbers or strings; use named constants or enums.
- No boolean flag parameters that switch behavior; split into two functions.
- Public functions declare explicit types (parameters and return).
- No `any` (TS), bare `except:` (Python), or `interface{}` / `any` (Go) without a justified one-line comment.

### 7.2 Error Handling

- Throw / return typed errors derived from base types in `shared/errors/`. Never throw strings or plain objects.
- Handle each error once: either log it or propagate it, never both.
- Wrap errors with context when crossing a layer boundary (`fmt.Errorf("create order: %w", err)`, `raise OrderError(...) from err`).
- Never swallow errors silently.
- Map domain errors to transport errors (HTTP status, gRPC code) only in the `api` layer.
- No `panic` / `process.exit` / `System.exit` in library or request-handling code.

### 7.3 Logging

- Structured logs (JSON in production) with fields, not string concatenation.
- Levels: `debug` for diagnostics, `info` for business events, `warn` for recoverable anomalies, `error` for failures that need attention.
- Every log in a request path carries a correlation / request id.
- Never log secrets, tokens, passwords, full card numbers, or personal data.

### 7.4 Configuration and Security

- Config is read once at startup in `config/`, validated against a schema, and injected. Code MUST NOT read `process.env` / `os.environ` outside `config/`.
- `.env.example` lists every variable with a safe dummy value; real `.env` files are git-ignored.
- Validate all external input at the boundary. Use parameterized queries only.
- Apply least privilege to credentials, tokens, and service accounts.

### 7.5 API Design

- Version in the path: `/api/v1/...`.
- Resource nouns, HTTP verbs for actions: `POST /orders`, `GET /orders/{orderId}`, `PATCH /orders/{orderId}`, `DELETE /orders/{orderId}`.
- Consistent error body:

```json
{ "error": { "code": "ORDER_NOT_FOUND", "message": "Order was not found.", "details": [] } }
```

- Timestamps in ISO 8601 UTC. Money as integer minor units plus currency code.
- Pagination via `page` + `pageSize` or cursor; response includes pagination metadata.

### 7.6 Testing

- Every behavior change ships with tests in the same change.
- Test files mirror source paths. One behavior per test; Arrange-Act-Assert structure.
- Test names describe behavior: `should reject refund when order is unpaid`.
- Unit tests do not touch network, filesystem, or real databases. Integration tests use disposable containers or in-memory equivalents.
- No sleeps for synchronization; use fakes, clocks, or explicit waits.
- Coverage is a signal, not a goal; critical domain logic SHOULD be fully covered.

---

## 8. Git Workflow

### 8.1 Branches

`<type>/<short-kebab-description>`: `feat/order-refund`, `fix/invoice-rounding`, `chore/upgrade-node-22`.

### 8.2 Commits (Conventional Commits 1.0.0)

```
<type>(<scope>): <imperative summary, lowercase, no trailing period, max 72 chars>

<optional body: why the change was made>

<optional footer: BREAKING CHANGE: description>
```

| Type       | Use for                                    |
|------------|--------------------------------------------|
| `feat`     | New user-facing capability                 |
| `fix`      | Bug fix                                    |
| `refactor` | Code change without behavior change        |
| `perf`     | Performance improvement                    |
| `test`     | Adding or fixing tests                     |
| `docs`     | Documentation only                         |
| `style`    | Formatting only                            |
| `build`    | Build system or dependencies               |
| `ci`       | CI configuration                           |
| `chore`    | Maintenance not covered above              |
| `revert`   | Reverting a previous commit                |

Breaking changes use `!` after the type/scope (`feat(api)!: ...`) and a `BREAKING CHANGE:` footer.

### 8.3 Change Size

- Keep each change small and self-contained: one logical change, ideally under ~200 changed lines excluding generated files and lockfiles.
- Refactors and behavior changes go in separate commits.
- Each change includes its related tests.

### 8.4 Agent Restrictions

- Agents MUST NOT run `git commit`, `git push`, `git rebase`, `git reset --hard`, or force operations.
- Agents MUST propose a Conventional Commit command for the human to run:

```
git commit -m "feat(orders): add partial refund support"
```

- No AI attribution or co-author trailers in commit messages.

---

## 9. Agent Behavior

- Read this file and any nested `AGENT.md` before editing.
- Match existing patterns in the surrounding code before introducing new ones.
- Make minimal, surgical edits. Do not reformat, rename, or refactor code outside the task scope.
- Deliver complete, working code. No stubs, placeholders, or partial implementations.
- Explain changes in the chat response, never in code comments.
- Do not create summary or report files (`CHANGES.md`, `NOTES.md`, `IMPLEMENTATION.md`, `SUMMARY.md`) unless explicitly requested.
- Do not create new top-level folders or new dependencies without stating why in the response.
- Ask before destructive or irreversible actions: deleting files, dropping tables, rewriting migrations that already ran, changing public API contracts.
- No emojis in code, comments, logs, commit messages, or responses.

---

## 10. Definition of Done

- [ ] `format`, `lint`, `typecheck`, and `test` pass with zero warnings.
- [ ] All identifiers, comments, logs, and messages are in English.
- [ ] Every new or touched source file has exactly one single-line header comment.
- [ ] No redundant, narrative, or commented-out code; no TODOs, placeholders, ticket IDs, or emojis.
- [ ] Names follow Section 3 (casing, grammar, verbs, suffixes, file names).
- [ ] Files are in the correct feature and layer (Section 5).
- [ ] Imports are ordered, aliased correctly, free of cycles, and respect boundaries (Section 6).
- [ ] Errors, logging, config, and security follow Section 7.
- [ ] Tests cover the change.
- [ ] A Conventional Commit command is proposed, not executed.