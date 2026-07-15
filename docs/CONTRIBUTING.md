# Contributing to Inventor Client

First off, thank you for considering contributing to Inventor Client! 

This project follows an enterprise-grade GitHub Flow and aims to build software that is highly maintainable, scalable, and secure.

## Development Workflow

We use a strict branching and Pull Request workflow. **Never commit directly to the `main` branch.**

1. **Find or Create an Issue:** Always ensure there is an open GitHub issue for the work you intend to do. This allows for architectural discussion before code is written.
2. **Branching:** Create a feature or bugfix branch off `main`. Use the following naming conventions:
   - `feature/your-feature-name`
   - `bugfix/issue-description`
   - `docs/what-you-documented`
3. **Development:** 
   - Write your code following the rules in `SPEC.md` and `CONSTITUTION.md`.
   - Ensure you follow the "Clean Architecture" and feature-based structure.
   - Keep commits small and atomic.
4. **Testing:** Write unit/integration tests for your changes. Run `npm run lint` and `npm run typecheck` to ensure there are no regressions.
5. **Pull Request:** Open a PR against the `main` branch. 
   - Fill out the PR template.
   - Link the relevant issue (e.g., `Fixes #12`).
6. **Review:** A maintainer will review your code. You may need to make changes based on feedback.
7. **Merge:** Once approved and CI passes, your branch will be merged using Squash and Merge.

## Commit Guidelines

We enforce **Conventional Commits**. Please format your commit messages like so:

* `feat(auth): add OTP timeout handling`
* `fix(ui): resolve button alignment issue on mobile`
* `docs(readme): update deployment instructions`
* `refactor(inventory): optimize search algorithm`

## Local Development Setup

1. Clone the repository.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and fill in your local or remote Supabase credentials.
4. Run `npm run dev`.

Please read the `SPEC.md` carefully before contributing to understand the architectural boundaries (especially the strict separation between the Admin Dashboard and Counter Terminal).
