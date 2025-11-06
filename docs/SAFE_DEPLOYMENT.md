# Safe workflow and rollback guide

This project deploys from GitHub to Vercel for both frontend and backend. To avoid breaking production, use the following workflow.

## Branching and previews
- Do NOT commit to `main` directly.
- Create feature branches from `main` (e.g., `feat/...`, `fix/...`).
- Open a Pull Request. Vercel will create Preview Deployments for both projects.
- Test the preview URLs end-to-end (login, dashboard stats, users CRUD, tasks CRUD, attendance check-in/out up to 4th checkout).

## Minimal CI checks (PR only)
- Backend: install dependencies (`npm ci`).
- Frontend: install and build web export (`expo export -p web`).
- CI runs on PRs only; production deploys are triggered only when merging to `main`.

## Environment variables
- Never commit secrets. Configure env vars in Vercel:
  - Backend: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`.
  - Frontend: `EXPO_PUBLIC_API_BASE_URL`.
- Locally, use `.env` files that are already ignored by `.gitignore`.

## Rollback options
1) Zip snapshot (manual): keep a zip of the working state (you already have one). If needed, restore and force-push to GitHub.
2) Git tag: tag known-good commits (e.g., `prechange-2025-11-06-backend`). To rollback, revert or checkout the tag and create a hotfix branch.

## Release checklist (before merge to main)
- [ ] CI green on PR
- [ ] Preview deployment tested (frontend + backend)
- [ ] Login with Google works
- [ ] Dashboard stats show expected numbers; no console errors
- [ ] Users: create/edit/activate/deactivate, stats modal opens
- [ ] Tasks: create pending, toggle status, filters, stats consistent
- [ ] Attendance: check-in/out sequence up to 4th checkout, dates show correctly in AR tz
- [ ] CORS OK from preview domain

## Notes
- If adding new web origins, update `allowedOrigins` in `backend/app.js`.
- Keep timezone handling consistent (backend: moment-timezone America/Argentina/Buenos_Aires; frontend: parse 'YYYY-MM-DD' to local-noon and format in es-AR).
- Prefer small PRs; if a preview reveals an issue, fix in the same branch and re-test.
