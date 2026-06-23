# Organization & Project Permissions Model

## Core Principle

There are two separate permission scopes:

- **Org-scoped powers** — apply globally, regardless of project membership (create/delete projects, manage employees, delete org, transfer/reassign project ownership).
- **Project-scoped powers** — apply only within a specific project, and require the actor to actually hold a role on that project (file CRUD, project settings, adding people above the floor role).

Permission check order: **check org-level permission first → if granted, allow. If not granted at org level → check project-level permission → if granted, allow. Otherwise, deny.**

Org rank is **not** a blanket override of project rank. It only overrides for the specific global powers listed under each org role below. For everything else (e.g. file operations), an org ADMIN/OWNER with no role on a given project has **no access** to that project's contents.

---

## Org-Level Roles

| Role | Powers |
|---|---|
| **OWNER** | Highest authority in the org. Can do anything any other role can do, plus: delete the organization, demote/replace ADMIN. Cannot be removed from the org while owning any project (must transfer ownership first). |
| **ADMIN** | Everything OWNER can do **except**: cannot delete the org, cannot demote/replace the OWNER. Global powers regardless of own project membership: <br>• Add or remove employees from **any** project (add capped at VIEWER role by default; full role range if ADMIN also holds a role on that project) <br>• Remove people from any project at any role (offboarding/layoffs — no restriction) <br>• Transfer ownership of any project to an eligible org role (OWNER, ADMIN, or MANAGER) — **cannot remove an Owner outright, only transfer the role away first** <br>Cannot touch file contents of a project they hold no role on. |
| **MANAGER** | Can create new projects; can delete only the projects they created. Can be a project OWNER (typically PMs). Cannot add/remove employees (admin-only now). All other access is purely via whatever project role they hold. |
| **EMPLOYEE** | Cannot create projects. Can join existing projects they're invited to. Cannot be a project OWNER. All access is governed entirely by assigned project role. Cannot be removed from the org while owning any project (n/a, since employees can't own projects) — but applies if they hold OWNER-adjacent project roles in edge cases. |

### Org-level constraints
- Removing a user from the org is **blocked** if they currently own any project — they must transfer ownership first.
- Only org ADMIN (and OWNER, by inheritance) can add/remove employees from the org itself.

---

## Project-Level Roles

| Role | Powers |
|---|---|
| **OWNER** | Must be an org OWNER, ADMIN, or MANAGER (never EMPLOYEE). Full control of the project: add/remove any project member at any role, upload/delete any file (regardless of who uploaded it), change project settings, delete the project, transfer ownership to another eligible person. |
| **ADMIN** | Everything OWNER can do **except**: cannot delete the project, cannot demote or replace the project OWNER. |
| **EDITOR** | Can upload files. Can delete **only the files they personally uploaded** (not files added by others). Cannot add or remove project members. |
| **VIEWER** | Read-only. Cannot upload, delete, or manage members. |

### Project-level constraints
- Project OWNER is assigned at creation (the creator) or via explicit transfer — transferable by: the current project Owner, org OWNER, or org ADMIN.
- Ownership can only be **transferred**, never forcibly removed — there is always a successor before the prior Owner loses the role.
- If a project's sole Owner leaves the org, removal is blocked until ownership is transferred (see org-level constraints).

---

## Quick Escalation Reference

| Scenario | Outcome |
|---|---|
| Org ADMIN, not on Project X, tries to delete a file in Project X | **Denied** — no org-level power covers file CRUD; no project role held. |
| Org ADMIN adds a new hire to Project X, no role held on X | **Allowed, capped at VIEWER** — full role range only if ADMIN also holds a role on X. |
| Org ADMIN removes a project EDITOR from Project X (layoff) | **Allowed** — removal-only power is unrestricted by role. |
| Org ADMIN reassigns ownership of Project X away from a departing Manager | **Allowed** — global ownership-transfer power. |
| Project ADMIN tries to demote/replace the Project OWNER | **Denied** — explicitly disallowed at project level. |
| Org MANAGER (PM) owns Project X, wants to delete a file | **Allowed** — acting as Project OWNER. |
| Removing an Employee who owns a project from the org | **Denied** until ownership is transferred first. |