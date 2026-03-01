## # ClicknCut Claude Code Configuration

This directory contains the autonomous engineering system for ClicknCut.

## Directory Structure

```
.claude/
├── README.md                      # This file
├── agents/                        # Custom specialized agents
│   ├── workspace-orchestrator/    # Primary repository coordinator
│   ├── nextjs-architect/          # Next.js 15 App Router specialist
│   ├── ui-engineer/               # Tailwind v4 & accessibility specialist
│   └── typescript-guardian/       # Type safety enforcement
├── skills/                        # Command skills (installed + custom)
│   ├── react-best-practices/      # [INSTALLED] Vercel React patterns
│   ├── web-design-guidelines/     # [INSTALLED] Vercel design patterns
│   ├── postgres-best-practices/   # [INSTALLED] Supabase Postgres patterns
│   ├── skill-creator/             # [INSTALLED] Skill creation helper
│   ├── feature/                   # [CUSTOM] Feature implementation workflow
│   ├── bug/                       # [CUSTOM] Bug fix workflow
│   ├── review/                    # [CUSTOM] Code review workflow
│   ├── audit-app-router/          # [CUSTOM] Next.js App Router audit
│   ├── audit-tailwind/            # [CUSTOM] Tailwind usage audit
│   ├── audit-types/               # [CUSTOM] TypeScript audit
│   ├── deploy-preview/            # [CUSTOM] Preview deployment
│   ├── deploy-prod/               # [CUSTOM] Production deployment
│   └── refactor-boundaries/       # [CUSTOM] Server/Client refactoring
└── rules/                         # Architectural enforcement rules
    ├── nextjs/
    │   └── server-first.md        # Server Components by default
    ├── typescript/
    │   └── zod-boundaries.md      # Zod only at API boundaries
    ├── ui/
    │   └── tailwind-first.md      # Tailwind utilities over custom CSS
    └── architecture/
        └── separation-of-concerns.md  # Layer separation
```

## Agents

### workspace-orchestrator (PRIMARY)
**The repository owner.** Coordinates all work, enforces architecture, manages branches and PRs.

**Use when**: Any significant work that requires coordination or final review.

```bash
# Invoke via Task tool with agent parameter
Task(agent: workspace-orchestrator, prompt: "Review this PR")
```

### nextjs-architect
**Next.js specialist.** Handles App Router patterns, Server/Client Components, data fetching, caching.

**Use when**: Making routing decisions, optimizing data fetching, reviewing Server Component usage.

### ui-engineer
**UI specialist.** Handles Tailwind composition, accessibility, responsive design, shadcn/ui patterns.

**Use when**: Building UI components, reviewing accessibility, auditing Tailwind usage.

### typescript-guardian
**Type safety specialist.** Enforces type safety, validates Zod usage, reviews type patterns.

**Use when**: Adding type definitions, reviewing API boundaries, auditing type safety.

## Skills (Commands)

### Installed Skills (from registry)

**vercel-react-best-practices**: React/Next.js performance optimization (57 rules)
- Triggers: React components, Next.js pages, performance issues
- Reference in code reviews and implementations

**web-design-guidelines**: UI design patterns and accessibility
- Triggers: UI work, responsive design, accessibility

**supabase-postgres-best-practices**: Postgres optimization patterns
- Triggers: Database queries, schema design, Prisma usage

**skill-creator**: Helper for creating new custom skills
- Use when: Need to create additional project-specific skills

### Custom Skills (project-specific)

**Core Workflows**:
- `/feature <description>` - Implement new feature with full architectural review
- `/bug <description>` - Fix bug with root cause analysis
- `/review [pr-url|file]` - Code review with architectural checklist

**Audits**:
- `/audit-app-router` - Audit Next.js App Router patterns
- `/audit-tailwind` - Audit Tailwind usage and accessibility
- `/audit-types` - Audit TypeScript type safety

**Deployment**:
- `/deploy-preview [branch]` - Deploy to preview/staging
- `/deploy-prod` - Deploy to production (requires approval)

**Refactoring**:
- `/refactor-boundaries [file]` - Refactor Server/Client Component boundaries

## Architectural Rules

Rules are automatically loaded based on file paths. They enforce critical patterns.

### nextjs/server-first.md
**Applies to**: `src/app/**/*.tsx`, `src/components/**/*.tsx`

Server Components by default. 'use client' only when necessary.

### typescript/zod-boundaries.md
**Applies to**: `src/app/api/**/*.ts`, `src/lib/**/*.ts`

Zod validation at API boundaries only. TypeScript internally.

### ui/tailwind-first.md
**Applies to**: All `.tsx` files

Tailwind utilities over custom CSS. Accessibility required.

### architecture/separation-of-concerns.md
**Applies to**: All TypeScript files

Separate: UI → Server Components → Services → Database

## Workflow Examples

### Implementing a Feature

```bash
# Option 1: Use the /feature skill
/feature Add user profile editing

# Option 2: Invoke workspace-orchestrator directly
Task(
  agent: workspace-orchestrator,
  prompt: "Implement user profile editing"
)
```

The orchestrator will:
1. Clarify requirements
2. Explore existing patterns
3. Delegate to specialists (nextjs-architect, ui-engineer, typescript-guardian)
4. Implement following architectural rules
5. Review before committing
6. Create semantic commit

### Reviewing Code

```bash
# Review current changes
/review

# Review specific PR
/review https://github.com/user/repo/pull/123

# Review specific file
/review src/app/users/page.tsx
```

### Running Audits

```bash
# Audit all App Router usage
/audit-app-router

# Audit Tailwind and accessibility
/audit-tailwind

# Audit TypeScript type safety
/audit-types
```

## Agent Coordination Flow

```
User Request
     ↓
workspace-orchestrator (analyzes, plans, delegates)
     ├→ nextjs-architect (App Router review)
     ├→ ui-engineer (UI/accessibility review)
     └→ typescript-guardian (type safety review)
     ↓
workspace-orchestrator (integrates feedback, final review)
     ↓
Implementation
     ↓
Commit (semantic, reviewed)
```

## Architectural Principles (ENFORCED)

1. **Server Components by Default**
   - Only use 'use client' when necessary
   - Data fetching in Server Components
   - Minimal client-side JavaScript

2. **Zod at Boundaries Only**
   - API routes, forms, env vars
   - NOT between internal functions
   - Infer types with z.infer

3. **Tailwind Utilities**
   - No custom CSS unless absolutely necessary
   - Mobile-first responsive
   - Accessibility standards (WCAG AA)

4. **Separation of Concerns**
   - UI components: presentation
   - Server Components: data fetching
   - Services: business logic
   - Database: persistence

## Quality Gates

Before any commit:
- ✅ Server/Client boundary violations checked
- ✅ Type safety verified at API boundaries
- ✅ No unnecessary client-side JavaScript
- ✅ Tailwind utilities used correctly
- ✅ Accessibility standards met
- ✅ No security vulnerabilities

## Extending the System

### Adding Skills from Registry

```bash
# Browse: https://skills.sh/
# Install manually (npx has TTY issues in automation):
cd /tmp
git clone --depth 1 https://github.com/owner/repo.git skill-name
cp -r /tmp/skill-name/skills/* .claude/skills/
```

### Creating Custom Skills

```bash
# Use the skill-creator
/skill-creator my-custom-skill

# Or manually
mkdir .claude/skills/my-skill
cat > .claude/skills/my-skill/SKILL.md << 'EOF'
---
name: my-skill
description: What it does
agent: workspace-orchestrator
---

# My Skill

Instructions here...
EOF
```

### Adding New Rules

```bash
# Create rule file in appropriate category
cat > .claude/rules/category/rule-name.md << 'EOF'
---
paths:
  - "src/**/*.ts"
---

# Rule Name

Rule description and examples...
EOF
```

## Operating Principles

- **Autonomous**: Make decisions within established principles
- **Opinionated**: Push back on bad architecture with reasoning
- **Quality-first**: Never compromise on architectural standards
- **Explicit**: Reference files with line numbers (file.ts:123)
- **Educational**: Explain WHY, not just WHAT

## Communication Style

- Direct and technical
- Reference specific patterns from installed skills
- Provide before/after code examples
- Flag violations by severity: CRITICAL, WARNING, SUGGESTION
- No unnecessary emojis or praise

---

**This is a living system.** Extend agents, skills, and rules as the project evolves.
