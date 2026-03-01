# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ClicknCut is a custom cutting platform built with Next.js 15 (App Router), Supabase (SSR auth), Prisma (PostgreSQL ORM), TanStack Query (async state), React Hook Form, and Tailwind CSS. The application handles DXF file uploads, material selection, and generates quotes for custom cutting jobs.

## Development Commands

```bash
# Development with debugging
npm run dev                    # Starts Next.js dev server with Node inspector on port 9230

# Build and deployment
npm run build                  # Builds production application
npm start                      # Starts production server

# Code quality
npm run lint                   # Runs Next.js ESLint

# Database
npm run postinstall           # Generates Prisma client (runs automatically after npm install)
npx prisma studio             # Opens Prisma Studio GUI for database inspection
npx prisma migrate dev        # Creates and applies new migration
npx prisma migrate reset      # Resets database and applies all migrations
npx prisma db push            # Pushes schema changes without migrations (dev only)
```

## Architecture

### Authentication Flow

- **Supabase SSR**: Authentication is handled via Supabase with server-side rendering support
- **Middleware**: `src/middleware.ts` intercepts all requests (except static assets) to refresh user sessions via `@supabase/ssr`
- **Server client**: Use `createClient()` from `src/lib/supabase/server.ts` in Server Components and Route Handlers
- **Client client**: Use `supabase` from `src/lib/supabase/client.ts` in Client Components
- **Auth mutations**: Custom hooks in `src/hooks/auth/` wrap auth operations with TanStack Query

### Database Architecture

- **Supabase PostgreSQL**: Unified database for both authentication and application data
- **Prisma 7 ORM**: Used for type-safe database access and migrations
- **User sync**: Prisma User model uses Supabase UID as the primary key (`id` field)
- **Prisma client**: Singleton instance with `PrismaPg` driver adapter, exported from `src/lib/prisma.ts`
- **Generated client**: Output at `src/generated/prisma/` (gitignored, regenerated via `prisma generate`)
- **Imports**: Server files use `@/generated/prisma/client`, client components use `@/generated/prisma/browser`
- **Config**: `prisma.config.ts` (root) defines datasource URL, migrations path, and seed command
- **Schema location**: `prisma/schema.prisma`

### Multi-Step Quoting Flow

The quoting system uses a **global context provider** for state management across multiple pages:

- **Context**: `src/context/quotingContext.tsx` manages the entire quoting workflow state
- **Provider**: `QuotingProvider` wraps the `/quoting` route group via `src/app/quoting/layout.tsx`
- **Steps**: File upload → Material selection → Extras → Review (defined in context)
- **State**: Cart items, current step, validation, errors managed by `useReducer`
- **Navigation**: `useQuoting()` hook provides `nextStep()`, `prevStep()`, `goToStep()` functions
- **Validation**: Each step validates requirements before allowing progression via `canProceed()`

### App Router Structure

- **Root layout**: `src/app/layout.tsx` wraps all routes with TanStack Query Provider
- **Grouped routes**:
    - `(dashboard)` - Protected admin routes with custom layout
    - `/quoting` - Multi-step quoting flow with QuotingProvider context
    - `/auth` - Authentication pages (login, signup, password reset)
- **API routes**: Located in `src/app/api/` (e.g., `/api/file` for Supabase Storage operations)

### File Upload & Storage

- **Supabase Storage**: DXF files stored in Supabase Storage bucket (`dxf-files`)
- **Admin client**: `src/lib/supabase/admin.ts` provides service role client for storage operations
- **Route handler**: `src/app/api/file/route.ts` handles uploads (POST) and retrieval (GET)
- **Storage paths**: Files organized by user ID: `{userId}/{timestamp}-{idx}-{filename}`
- **DXF parsing**: Uses `dxf-parser` for file validation
- **DXF viewing**: Three.js-based viewers in components (`DXFViewerSimple`, `DXFViewerTest`)
- **Webpack config**: `next.config.ts` ensures single Three.js instance via alias resolution

### State Management Patterns

- **TanStack Query**: For server state, async operations, caching
    - Custom hooks pattern: `src/hooks/useLoginMutation.ts`, `useUploadFileMutation.ts`
    - DevTools enabled in development via `src/app/providers.tsx`
- **Context API**: For complex, multi-page flows (QuotingContext)
- **React Hook Form**: For form state and validation

## Environment Variables

Required variables (see `.env.example`):

**Client-side** (NEXT*PUBLIC*\*):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`

**Server-side**:

- `DATABASE_URL` - Supabase PostgreSQL connection string
- `SUPABASE_SERVICE_ROLE_KEY` - For server-side Supabase operations (admin client, storage)

## Key Technical Decisions

1. **Next.js 15 with App Router**: Uses latest routing patterns, Server Components by default
2. **Supabase for full backend**: Authentication, PostgreSQL database (via Prisma ORM), and file storage unified in Supabase
3. **Context for multi-page flows**: QuotingContext manages state across quoting steps instead of URL params
4. **Supabase Storage for files**: DXF files stored in Supabase Storage with user-based organization, metadata in PostgreSQL via Prisma
5. **Three.js for DXF viewing**: Client-side 3D rendering of uploaded design files

## Component Library

- **Radix UI**: Unstyled primitives (Dialog, Checkbox, Progress, etc.)
- **Custom components**: Located in `src/components/ui/` (shadcn-style)
- **Tailwind**: v4.x with plugins (@tailwindcss/forms, @tailwindcss/typography, @tailwindcss/aspect-ratio)
- **Icons**: Lucide React

## MCP Servers (Model Context Protocol)

MCP servers extend Claude Code's capabilities with specialized tools for database access, browser automation, and external services.

### Recommended MCP Servers

#### 1. PostgreSQL MCP (CRITICAL - Database inspection)

**Purpose**: Direct database queries, schema inspection, query optimization

**Configuration** (`.claude/settings.json`):

```json
{
	"mcpServers": {
		"postgres": {
			"command": "npx",
			"args": [
				"-y",
				"@modelcontextprotocol/server-postgres",
				"postgresql://..."
			],
			"env": {
				"DATABASE_URL": "${env:DATABASE_URL}"
			}
		}
	}
}
```

**When to use**:

- Inspecting database schema during development
- Debugging query performance with EXPLAIN ANALYZE
- Validating Prisma migrations
- Checking RLS policies (if using Supabase RLS)

**Example usage**:

```typescript
// Use MCP Postgres tool to inspect schema
// Then write Prisma queries based on actual schema
```

#### 2. Playwright MCP (HIGH - Browser testing)

**Purpose**: Automated browser testing, visual regression, E2E testing

**Configuration**:

```json
{
	"mcpServers": {
		"playwright": {
			"command": "npx",
			"args": ["-y", "@modelcontextprotocol/server-playwright"]
		}
	}
}
```

**When to use**:

- Testing quoting flow end-to-end
- Verifying DXF file upload and preview
- Accessibility testing with real browser
- Visual regression testing after UI changes

#### 3. Filesystem MCP (INCLUDED - Codebase awareness)

**Purpose**: Repository-wide file search, git operations, file tree analysis

**Note**: This is included by default in Claude Code.

**When to use**:

- Finding all components using a specific pattern
- Analyzing import dependencies
- Searching across large codebases
- Git history analysis

### MCP Server Usage Guidelines

**DO use MCP servers for**:

- Database inspection and schema validation
- E2E testing with real browser
- Complex file tree analysis
- External service integration

**DON'T use MCP servers for**:

- Simple file reads (use Read tool)
- Basic git operations (use Bash tool)
- Code editing (use Edit/Write tools)
- Tasks that built-in tools handle well

### Configuration Location

MCP servers are configured in:

- **Project-level**: `.claude/settings.json` (shared with team, checked into git)
- **Personal-level**: `~/.claude/settings.json` (user-specific, not in git)

### Security Considerations

- **Database credentials**: Use environment variables (${env:DATABASE_URL}), never hardcode
- **API keys**: Store in `.env`, reference via ${env:VAR_NAME}
- **Sensitive operations**: MCP servers run with your local permissions - be cautious

### Example: Using Postgres MCP

```bash
# 1. Configure MCP server in .claude/settings.json
# 2. Claude Code will auto-connect on startup
# 3. Use in architectural reviews:

/audit-types
# Claude uses Postgres MCP to:
# - Check actual table schemas
# - Verify foreign key constraints
# - Compare Prisma schema to actual DB
# - Suggest index optimizations
```

### Example: Using Playwright MCP

```bash
# Test the quoting flow
/test-quoting-flow

# Claude uses Playwright MCP to:
# 1. Open browser to /quoting
# 2. Upload test DXF file
# 3. Select material
# 4. Add extras
# 5. Verify quote generated
# 6. Check accessibility with axe
```

## Claude Code Agent System

This repository uses a custom agent system defined in `.claude/`:

- **Agents**: Specialized AI assistants (workspace-orchestrator, nextjs-architect, ui-engineer, typescript-guardian)
- **Skills**: Command-line workflows (e.g., `/feature`, `/review`, `/audit-app-router`)
- **Rules**: Automatically enforced architectural patterns (path-based)

See `.claude/README.md` for complete documentation on the agent system.

### Quick Reference

**Core workflows**:

- `/feature <description>` - Implement new feature with full review
- `/bug <description>` - Fix bug with root cause analysis
- `/review [file|pr]` - Code review with architectural checklist

**Audits**:

- `/audit-app-router` - Check Next.js patterns
- `/audit-tailwind` - Check UI and accessibility
- `/audit-types` - Check TypeScript safety

**Deployment**:

- `/deploy-preview` - Deploy to staging
- `/deploy-prod` - Deploy to production (requires approval)
