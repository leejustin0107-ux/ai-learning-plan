# Contributing

Thank you for contributing to PlanIt. This document explains how to set up the project locally, follow the code style, and submit changes.

---

## Setup Development

### 1. Fork and clone the repository

```bash
git clone https://github.com/leejustin0107-ux/ai-learning-plan.git
cd ai-learning-plan
```

### 2. Set up environment variables

Copy `.env.example` to `.env` and fill in the required values.

```bash
cd server
cp .env.example .env
```

Example:

```env
DATABASE_URL=postgres://user:password@localhost:5433/planner
JWT_SECRET=your_jwt_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
GEMINI_API_KEY=your_gemini_api_key
LLM_PROVIDER=mock
PORT=3000
```

### 3. Start PostgreSQL

From the project root:

```bash
docker compose up db -d
```

### 4. Start the backend

```bash
cd server
npm install
npm run migrate:up
npm run dev
```

### 5. Start the frontend

Open a second terminal:

```bash
cd client
npm install
npm run dev
```

---

## Code Style

Please follow these standards:

- Use clear and descriptive variable names.
- Keep routes, services, and components organized by responsibility.
- Validate backend request bodies with Zod.
- Keep user-specific data protected with authentication and ownership checks.
- Add tests for new backend behavior.
- Avoid committing `.env`, `node_modules`, build output, or local database files.

### Linting

Run linting if available:

```bash
npm run lint
```

### Testing

Run backend tests before opening a pull request:

```bash
cd server
npm test
```

Run coverage:

```bash
npm test -- --coverage
```

---

## Conventional Commits

Use conventional commits for commit messages:

```bash
git commit -m "feat: add circuit breaker for LLM API"
git commit -m "fix: progress calculation edge case when no tasks"
git commit -m "docs: update README with architecture diagram"
git commit -m "test: add edge case tests for status transition"
git commit -m "refactor: simplify calendar task fetching"
```

Recommended prefixes:

| Prefix | Usage |
|---|---|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation update |
| `test:` | Test changes |
| `refactor:` | Code restructuring |
| `chore:` | Maintenance work |

---

## Pull Request

Before submitting a pull request:

1. Create a branch from `main`.

```bash
git checkout main
git pull origin main
git checkout -b feat/your-feature-name
```

2. Make your changes.

3. Make sure all backend tests pass.

```bash
cd server
npm test
```

4. Make sure the frontend builds.

```bash
cd client
npm run build
```

5. Ensure lint is clean if linting is configured.

```bash
npm run lint
```

6. Write a clear pull request description.

Suggested PR format:

```md
## Summary
- What changed?

## Testing
- What tests did you run?

## Screenshots
- Add screenshots if the UI changed.

## Notes
- Any known limitations or follow-up work.
```

---

## Branch Naming

Use clear branch names:

```txt
feat/ai-reschedule-options
fix/calendar-overdue-task-status
docs/update-readme
test/idempotent-task-creation
refactor/progress-service
```

---

## Release Process

Create a release tag:

```bash
git tag -a v1.0.0 -m "Release v1.0.0 — Plan.it"
git push origin v1.0.0
```

Then create a GitHub Release from the tag and include release notes with:

```txt
- Main features
- Bug fixes
- Testing improvements
- Production-readiness updates
- Known limitations
```