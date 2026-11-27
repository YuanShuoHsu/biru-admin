# AGENTS.md

本檔是給 coding agent（Claude Code、Codex、Cursor…）在這個 repo 寫程式時的指引。

## 語言（Language）

- 與開發者的對話、PR 描述、issue 與留言用繁體中文。
- commit 與 PR 標題用英文 Conventional Commits、小寫開頭，用詞先對照 `git log --format=%s -20`。
- 程式碼註解用繁體中文；識別字、指令、路徑、套件與 API 名稱維持原文。
- 本檔的「Behavioral Guidelines」（照抄上游）與 `next dev` 自動產生的 Next.js 區塊維持英文原文，不要翻譯。

## 維護本檔（Maintaining This File）

修改本檔時以替換或刪減為主，不讓它變長：新規則先併入或取代既有段落；與程式碼、其他段落或官方文件重複的內容刪掉，改成指向出處；改動讓某條規則過時，就在同一個改動刪掉它。

## 指令（Commands）

```bash
pnpm dev          # 啟動開發伺服器（localhost:3000）
pnpm build        # production build
pnpm start        # 啟動 production 伺服器
pnpm lint         # 執行 ESLint
pnpm format       # 用 Prettier 自動格式化
pnpm format:check # 檢查格式但不寫入
pnpm codegen      # 從 NestJS OpenAPI spec 重新產生 types/api.ts（需要 biru-api 在 :3001 執行中）
pnpm test:e2e     # Playwright 端對端測試（見下方）
```

`pnpm test:e2e` 會對 :3002 上的本 app 跑 `e2e/`（由 Playwright 的 `webServer` 啟動：本機用 `pnpm dev`，已在執行就沿用；CI 上在 `pnpm build` 後用 `pnpm start`），搭配一個在 :3001 的 biru-api，其資料庫由它的 `scripts/migrate-fresh-db.ts` 建立、`scripts/seed-e2e.ts` 填入資料（biru-api AGENTS.md「Database Schema」）：用你自己的空資料庫，絕不用共用的那個。把同一組 `E2E_{PLATFORM_ADMIN,OWNER,ADMIN,MEMBER,CUSTOMER}_{EMAIL,PASSWORD}` export 給 seed 與 Playwright；`setup` project 會讓每個門市角色各登入一次，並把 session 存到 `playwright/.auth/`。biru-api 執行時要設 `NEXT_ADMIN_URL=http://localhost:3002`，不設 `NODE_ENV=production`（否則它的 cookie 會設到 `.birucoffee.com`），也不設 `TRUSTED_PROXIES`／`CLIENT_IP_HEADER`（所有測試共用一個 client IP，每分鐘 100 次的限制會把整輪測試卡住）。`.github/workflows/e2e.yml` 在每個 PR 上用 PostgreSQL service 與 biru-api 的 `develop` 做完上述所有步驟。

pre-commit hook（Husky + lint-staged）會對 staged 的檔案跑 `pnpm format`、`pnpm lint` 與 `prettier --write`。不要用 `--no-verify` 跳過。

格式化一律在 `pnpm install --frozen-lockfile` 之後用 repo 自己的 Prettier（`pnpm format` 或 `pnpm exec prettier`），絕不用 `npx prettier`：沒有 `node_modules` 時它會下載最新版的 Prettier，格式可能和鎖定的版本不同。

連不到 `fonts.googleapis.com` 的環境（例如 sandbox）會讓 `next/font/google` build 失敗。把 `NEXT_FONT_GOOGLE_MOCKED_RESPONSES` 指向一個 export `{ [url]: css }` 的 CommonJS 檔，`app/[locale]/layout.tsx` 的每個字型一筆：URL 照 `node_modules/next/dist/compiled/@next/font/dist/google/get-google-fonts-url.js` 組出來的寫（`https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@100..900&display=swap`，JP、KR、SC 同理），css 寫一個 `font-weight: 100 900` 的 `@font-face`，`src` 為 `url(<任一本機 .woff2 的絕對路徑>)`。只有 webpack build 會讀它（`next build --webpack`）；出現 `Missing mocked response for URL` 錯誤時，訊息會指出要補的 URL。

從 `develop` 開分支，所有 PR 都開向 `develop`（GitHub 的預設分支）。絕不開向 `master`：只 merge 進 `master` 的 PR 永遠不會進到 `develop`，之後從 `develop` 開的分支會漏掉它，`master` merge 回來時也會衝突。因為 `develop` 是預設分支，PR 裡的 `Closes #n` 會在 PR merge 進 `develop` 時關閉 issue；只完成 issue 一部分的 PR 用 `Part of #n`。

## 架構（Architecture）

這是一個 **Next.js 16 App Router** 後台，使用 TypeScript、MUI，支援多語系。

### 路由結構（Routing Structure）

路由放在 `app/[locale]/` 底下以支援 i18n。除了 `(app)/maintenance/`，每個頁面都在 `(app)/(dashboard)/` 外殼裡；路由是公開還是受保護，由 `proxy.ts`（見下方）決定，不是看它的資料夾。

`(dashboard)` layout 會渲染三個 **parallel route slot**：`@breadcrumb`、`@subheader`（例如訂單搜尋）、`@toolbar`（例如新增品項、切換檢視）。`@subheader` 與 `@toolbar` 有回傳 `null` 的 `[...segments]` catch-all，`@breadcrumb/default.tsx` 從 `hooks/useRoutes.ts` 組出麵包屑，所以新路由除非真的有 subheader／toolbar，否則不需要 slot 檔案，但必須註冊在 `hooks/useRoutes.ts`（若屬於 drawer，也要加進 `components/TemporaryDrawer/NestedList`）。

`proxy.ts` 的 middleware 負責：

- 透過 `better-auth` session 檢查身分：平台管理員（`user.role === "admin"`）或組織成員（`isOrganizationMember`）；否則導向 `/auth/no-access`，不動到 session（它與 biru 前台共用）
- 把已登入、位於 `/` 的使用者導向 `DEFAULT_AUTHENTICATED_ROUTE`（`/dashboard`，見 `constants/route.ts`）
- 把未登入的使用者導向 `/auth/sign-in?redirectTo=...`
- 全域維護模式（`NEXT_PUBLIC_MAINTENANCE` 環境變數旗標）
- 公開頁面：`/auth/*`（登入、雙重驗證、email 驗證、忘記與重設密碼，以及 no-access）與 `/company/*`

瀏覽器的呼叫直接打 `NEXT_PUBLIC_NEST_URL`：`utils/fetcher.ts` 與 `lib/api-client.ts` 會替相對路徑 `/api/...` 加上前綴並送出 `credentials: "include"`，它也是 better-auth client 的 `baseURL`；繞過它們的瀏覽器請求必須做同樣的事。session cookie 能送到 API host 與本 app 的伺服器端請求，只是因為 biru-api 把它設在共用的上層網域（biru-api AGENTS.md「Global Setup」）。`next.config.ts` 只 rewrite API 回傳的相對圖片 URL（`/api/images/*` 與使用者頭像的 `/api/users/:id/image/*`），這些是 `<img>` 與 `next/image` 向本 app 請求的。相對的 better-auth `callbackURL`／`redirectTo` 是相對於 API 解析，不是本 app；只有在 biru-api 的信件會把它轉成 `redirectTo` query 時（驗證與重設密碼信）才傳相對路徑。

### 狀態管理（State Management）

`stores/` 裡的 Zustand store 採用 factory 模式（例如 `createAuthStore`）。每個 store 都包在 `providers/` 裡的 React Context provider 中，以便在伺服器端安全地建立實例。一律透過 hook 存取 store（例如 `useAuthStore((state) => state.x)`），不要直接存取。

### 資料抓取（Data Fetching）

- **伺服器端**：用 React `cache()` 去除重複請求（見 `utils/orders.ts`）
- **Client 端**：透過 `SWRProvider` 使用 SWR，錯誤會自動以 notistack 顯示（403／404 除外）
- **Fetcher**（`utils/fetcher.ts`）：兩端的相對 URL 都相對於 `NEXT_PUBLIC_NEST_URL` 解析；瀏覽器請求是跨來源、帶 `credentials: "include"`

### 表單（Forms）

React Hook Form + Zod schema（`definitions.ts` 檔）。表單 schema 與錯誤處理和頁面／元件放在一起。只為表單服務的非同步工作（例如先建立上層資料）放在它的 submit handler，由 `isSubmitting` 或對話框的 `confirmLoading` 涵蓋，不另加 loading state。對話框的確認按鈕永遠不 disable：無效或不完整的輸入在送出時由 schema 擋下，顯示為欄位錯誤。新密碼欄位透過 `hooks/usePasswordValidation.ts` 的規則清單顯示錯誤，而不是 schema 的訊息，所以在它們的 schema 加規則時也要加到那裡。

### 國際化（Internationalization）

5 個語系：`zh-TW`（預設）、`en`、`ja`、`ko`、`zh-CN`。翻譯檔在 `messages/[locale]/`。一律用 `next-intl` 的 `useTranslations()`，以及 `@/i18n/navigation`（不是 `next/navigation`）提供的會帶語系的 `Link`、`redirect`、`usePathname`、`useRouter`。

### UI 與主題（UI & Theme）

MUI v9 搭配自訂主題（`theme.ts`），透過 CSS 變數支援淺色／深色（`colorSchemeSelector: "class"`）。也可以用 Tailwind CSS v4 的 utility。所有表格資料都用 MUI DataGrid（`@mui/x-data-grid`），分頁、排序、篩選都在伺服器端。

淺色／深色切換：`ThemeSwitcher` 用 `document.startViewTransition` + `flushSync` 讓整頁淡入淡出，`ThemeProvider` 保留 `disableTransitionOnChange`，`theme.ts` 在 view transition 進行時關掉 CSS transition。不要為主題切換加 `color`／`background-color`／`border-color`／`fill`／`box-shadow` 的 transition；transition 只用在互動狀態（hover、open、expanded、selected）。React 的 `<ViewTransition>` 取代不了這個做法：它會取消根層的淡入淡出，讓 body 與 portal 出去的 Dialog、Menu、Drawer 瞬間切換。若導覽改用 Next.js `viewTransition` 或 React `<ViewTransition>`，要把主題淡入淡出移到 React 底下，因為兩個 view transition 會互相中斷。

### 3D 模型（3D Models）

門市配置 3D 頁的設備模型在 Blender 製作：`blender/<label>.blend`，匯出成 `public/models/<label>.glb`，並加進 `app/[locale]/(app)/(dashboard)/store-layout/Realistic/ItemBody.tsx` 的 `MODELS`。

- 單位為公尺，照 `docs/equipment.md` 的實際尺寸；原點在底部中心，正面朝 -Y。
- 只建機器本身與隨機附帶的配件，不建周邊的杯子、食物或道具。
- 以官方產品圖為準：在瀏覽器開 `docs/equipment.md` 連結的產品頁，照片缺漏或不清楚時，到原廠官網找同型號的頁面；看遍所有角度的照片，必要時加上實拍照，讓可見零件、按鈕、印刷文字與透明部件都對得上。參考圖不要 commit：repo 是公開的，照片屬於原廠。看不到任何照片時，向開發者要照片，不要憑記憶補細節。
- 材質用 Principled BSDF；透明部件用 Alpha Blend。
- 開 PR 前先渲染預覽圖給開發者確認。新品項的擺放位置透過 biru-api 的 migration 寫進 `store_layout`。

### 身分驗證（Auth）

`lib/auth-client.ts` 的 `better-auth` client 搭配 `adminClient` 與 `organizationClient` plugin。登入流程：登入 → 驗證平台管理員或組織成員身分（否則導向 `/auth/no-access`）→ 導向 `DEFAULT_AUTHENTICATED_ROUTE`（`/dashboard`）。

本 app 只有登入本 app 所需的頁面。會員自己的帳號頁（註冊、訂單、優惠券、點數、帳號與安全設定、刪除帳號）只在 biru 前台：帳號選單、drawer 與登入連結會在前台開啟它們（`hooks/useAuth.ts` 的 `useStorefrontHref`／`useStorefrontNavItem`），標籤、圖示與 query 取自 `hooks/useRoutes.ts` 裡保留的 `auth` 項目。不要把它們加回這裡。

建立在 better-auth 上的身分驗證 UI（登入、雙重驗證、email 驗證、重設密碼），流程與版面取自 better-auth 自己的 demo（better-auth repo 的 `demo/nextjs`），demo 沒有的再參考 Better Auth UI：功能放在哪張卡片、有哪些步驟與狀態。用本 repo 的 MUI 元件與慣例實作（React Hook Form + Zod、dialog store、next-intl）；絕不安裝 Better Auth UI，也不複製它的 markup 或翻譯。

### API 型別（API Types (Codegen)）

`types/api.ts` 由 `openapi-typescript` 從 `http://localhost:3001/api-json`（biru-api NestJS 伺服器）自動產生。後端 schema 改動後執行 `pnpm codegen` 重新產生。絕不手動編輯 `types/api.ts`。`pnpm codegen` 會用執行中的 API 整份重寫 `types/api.ts`，所以執行中的 biru-api 分支沒有的型別也會被刪掉，例如還沒 merge 進該分支的後端 PR 的型別。commit 前只留你的後端改動產生的 hunk，其餘還原。

`types/api.ts` 裡新增的 `AuditResource` 或 `DeletedRecordTable` 值，需要在 `getAuditLogHref`（`utils/audit.ts`；該資源沒有異動紀錄頁時回 `null`；沒加的話 `tsc` 會失敗）加一個 case，並在 `audit.json`（`resource.*`）與 `deletedRecords.json`（`table.*`）加標籤；`utils/enumOptions.ts` 會把其 `*Values` 陣列對應成標籤的任何 enum，新增值時也要加標籤（例如 `inventory.json` 的 `transactions.reason.options.*`）。在同一個 PR 把它們加進全部五個語系：`tsc` 只抓得到缺少的 `en` 標籤（`messages/index.ts` 以 `en` 推導訊息型別），其他語系要到執行時才會出錯。

### 路徑別名（Path Alias）

`@/` 對應到專案根目錄。所有非相對路徑的 import 都用它。

## biru 同步（biru Sync）

鏡像 repo（前台）：`/Users/yuanshuohsu/Desktop/biru`。完成任何檔案改動後，一定要同步到 biru 才算完成。

只有兩個 repo 都用到的檔案才鏡像：只有一邊用到的檔案不在另一邊建立；改到的檔案在鏡像沒有對應副本時不用同步，除非這次任務讓鏡像也要用到它。

每個改到的檔案，讀兩邊的版本後決定：

1. **Superset 檔案**（本 repo 有額外內容，只把改到的 hunk 移植到 biru，絕不覆寫整個檔案）：
   `messages/*/common.json`、`types/api.ts`

2. **其他所有鏡像檔案** — 只移植這次任務改到的 hunk。共用檔案以 biru 為準：絕不用本 repo 的版本 `cp` 蓋過 biru，即使它看起來比較新或比較符合慣例。

3. **同路徑、不同檔案** — `utils/menus.ts`、`utils/orders.ts`、`utils/banners.ts`、`utils/openingHours.ts`、`utils/storePhotos.ts`、`types/banners.ts`、`types/storePhotos.ts` 與 biru 是各自的實作；只手動合併相關的改動，兩個方向都絕不 `cp`。

4. **改名或刪除的檔案** — 在 biru 做同樣的操作（改目錄名、刪檔案）。

不確定差異是否刻意時，先讀 biru 的檔案再決定。

## 程式碼註解（Code Comments）

**預設：不寫註解。** 只有在少了它會導致改錯時才寫，內容是程式碼本身表達不出來的後果或前提：

- `// 店家角色尚未選到店家時不打 API，否則會落到平台管理員專用端點`（會 403）
- `// palette 色位名不能含小寫 "mode"，否則 MUI 產不出 CSS 變數`（框架陷阱）

檢驗方式：把它刪掉，一個稱職的人會不會因此改錯？如果老實的答案只是「會比較難懂」，就刪掉。

**例外：官方文件連結是要的。** 程式碼照著官方文件某一頁寫時，不論是套件（Next.js、MUI、better-auth、Drizzle、NestJS…）、外部 API 規格（ECPay、data.gov.tw…）或法規（law.moj.gov.tw），在程式碼上方放該頁的 `// https://…` 連結；整個檔案都照它寫時放在檔案開頭。網站有分版本時指向已安裝的版本。既有連結要保留（除非開發者刪掉了）；程式碼不再照該頁寫時，在同一個改動修正或刪除連結。連結不計入下面「一兩個註解」的訊號。

絕不寫：

- 重述下一行，或重述欄位、常數名稱（在 `useLocale()` 上寫 `// 取得目前語系`）
- 我們對話中的推理，或為自己的取捨辯護
- private helper 的 JSDoc
- 描述程式碼目前在做什麼：下次改動後就會變成謊言

**一個改動加了超過一兩個註解，本身就是訊號**，代表程式碼表達得不夠。改命名或結構，不要旁白。

**絕不加回被刪掉的註解。** 即使某個註解通過上面的檢驗，只要開發者說過那裡不要註解，或那個註解之前被刪過，之後的改動就不能把它加回來；開發者的決定優先於本規則。有話要說就寫在回覆裡，不要寫在程式碼裡。

改動讓既有註解變得不正確時，在同一個改動修正或刪除它；過時的註解比沒有更糟。不要把識別字寫死在註解裡，改名後就會變成錯誤資訊。

## 實作方式（Implementation Approach）

**預設：直接做，不要問（act, don't ask）。** 只有答案會改變資料模型、API 契約，或需要不可逆或對外的動作（共用資料庫的 migration、部署、push）時才問。其他不明確之處，自己決定並繼續，然後在回覆列出所做的假設，讓開發者事後修正。這一條優先於下方引用準則的「If uncertain, ask」。

依以下順序決定：

1. **已安裝版本的官方文件**：先查 `package.json`／`node_modules` 的版本，絕不憑記憶。Next.js（`node_modules/next/dist/docs/`、next-devtools MCP）、MUI（mui-mcp）、better-auth、Drizzle、NestJS、next-intl、SWR、Zod 等。用文件示範的寫法，不用繞路；絕不用文件標為 deprecated 的 API。已安裝套件的 `.d.ts` 是最終依據；部落格、問答等二手資料不能當依據。
2. **本 repo 的既有模式**：文件沒定死時，先用 `rg` 找同 repo 解決同一類問題的既有機制（helper、hook、元件、表單、store、SWR mutate），有就重用，照最相近實作的結構、命名與位置寫。照抄前先確認它沒有你正在修的缺陷；有的話那部分不要抄，並在 PR 點名那份複本，讓它也被修掉。
3. **最主流的選項**：前兩者都決定不了時。

**分層**：計算、驗證、權限判斷與業務規則放在 biru-api，前端只負責顯示與操作；需要後端配合時一起改 biru-api，不在前端繞過去。API 型別一律取自 `types/api.ts`，不手寫；能用 Server Component 就不加 `'use client'`。

## Behavioral Guidelines

Vendored from <https://github.com/multica-ai/andrej-karpathy-skills/blob/main/CLAUDE.md> (headings demoted one level). Don't add rules here — put project rules in the sections above, so this stays diffable against upstream.

Behavioral guidelines to reduce common LLM coding mistakes.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
