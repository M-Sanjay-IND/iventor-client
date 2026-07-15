# ===============================================================================
# INVENTOR CLIENT ENGINEERING CONSTITUTION
# ===============================================================================

This document defines the immutable engineering principles of Inventor Client.

These rules MUST NEVER be violated.

Every architectural decision must comply with these rules.

===============================================================================
1. SOFTWARE CONSTITUTION
===============================================================================

Software must always be

Maintainable

Scalable

Readable

Reusable

Secure

Observable

Testable

Accessible

Extensible

Every implementation should be understandable by another engineer without explanation.

Never create code that only the original developer understands.

Prefer simplicity over cleverness.

Avoid overengineering.

Avoid unnecessary abstractions.

Every function should have one responsibility.

Every file should have one purpose.

Every component should be reusable.

===============================================================================
2. UI / UX CONSTITUTION
===============================================================================

Inventor Client should feel like a premium enterprise SaaS.

Design philosophy

Apple

Linear

Notion

Stripe Dashboard

Vercel Dashboard

Characteristics

Minimal

Professional

Fast

Clean

Modern

Animations should be subtle.

Never distract users.

Large touch targets.

Consistent spacing.

Consistent typography.

Consistent colors.

Support

Dark Mode

Light Mode

Responsive Design

Accessibility

Loading Skeletons

Empty States

Success States

Error States

Confirmation Dialogs

Undo where appropriate.

===============================================================================
3. INVENTORY CONSTITUTION
===============================================================================

The platform is inventory-first.

Never assume inventory equals books.

Books are simply one inventory category.

Every inventory item

↓

One or more physical copies

↓

One permanent QR

↓

One transaction history

↓

One lifecycle

Inventory should support future expansion

Warehouse

Hospital

School

Government

IT Assets

Laboratory

Libraries

Furniture

Machinery

Without redesign.

===============================================================================
4. QR CONSTITUTION
===============================================================================

QR Identity is permanent.

Never regenerate QR because of sticker damage.

Reprint the original.

Never encode

Inventory Name

Category

Manufacturer

Business Data

Only encode

QR UID

QR must be immutable.

Every QR must have

Generation Date

Checksum

Version

Creator

Print History

Print Count

Storage Path

Linked Inventory Copy

Bulk label printing must display

QR

Inventory Name

QR UID

Optional Location

Optional Category

Users should identify labels visually before attaching them.

===============================================================================
5. DATABASE CONSTITUTION
===============================================================================

Database must be fully normalized.

Never duplicate information.

Never store calculated values unnecessarily.

Every table requires

Primary Keys

Foreign Keys

Indexes

Constraints

Audit Metadata

Soft Delete

Timestamps

Database migrations must always be reversible.

===============================================================================
6. SECURITY CONSTITUTION
===============================================================================

Security is mandatory.

Never optional.

Mandatory

OWASP Top 10

Supabase RLS

Least Privilege

Parameterized Queries

Environment Variables

No Secrets in Frontend

Secure Sessions

Audit Logs

Role Verification

Input Validation

Output Encoding

Secure Storage

Transaction Rollback

Every privileged action must be audited.

===============================================================================
7. AUTHENTICATION CONSTITUTION
===============================================================================

Administrator

Email

Password

OTP

Role Verification

Borrower

Institution Email

↓

OTP

↓

Temporary Session

↓

Borrow

↓

Session Ends

Borrowers never receive admin permissions.

Counter terminal never exposes administration.

===============================================================================
8. IMPORT CONSTITUTION
===============================================================================

Every import follows

Upload

↓

Validation

↓

Preview

↓

Warnings

↓

User Approval

↓

Transaction

↓

Import

↓

QR Generation

↓

Label Generation

↓

Commit

Rollback if any step fails.

Never silently ignore invalid records.

Provide downloadable templates.

Support

CSV

Excel

Future JSON

===============================================================================
9. REPORTING CONSTITUTION
===============================================================================

Reports should never require manual calculations.

Generate automatically.

Monthly

Inventory

Borrowing

Returns

Imports

QR

Printing

Audit

Support

PDF

Excel

CSV

===============================================================================
10. API CONSTITUTION
===============================================================================

RESTful APIs.

Consistent naming.

Consistent response format.

Consistent error format.

Version APIs.

Validate everything.

Never trust frontend input.

===============================================================================
11. CODE CONSTITUTION
===============================================================================

Strict TypeScript.

Reusable Components.

Reusable Hooks.

Utility Functions.

Services.

Repository Pattern where useful.

Business Logic separated from UI.

No duplicated logic.

No magic numbers.

No hardcoded strings.

Meaningful variable names.

Self-documenting code.

===============================================================================
12. TESTING CONSTITUTION
===============================================================================

No feature is complete without testing.

Every feature requires

Unit Tests

Integration Tests

API Tests

Security Tests

Manual Tests

Regression Tests

===============================================================================
13. DOCUMENTATION CONSTITUTION
===============================================================================

Documentation evolves with software.

Maintain

README

Architecture

Database

API

Security

Deployment

Roadmap

Changelog

Admin Guide

QR Guide

Import Guide

Developer Guide

Never allow documentation to become outdated.

===============================================================================
14. GITHUB CONSTITUTION
===============================================================================

GitHub is the single source of truth.

Never commit directly to main.

Workflow

Issue

↓

Discussion

↓

Architecture

↓

Feature Branch

↓

Development

↓

Small Commits

↓

Tests

↓

Documentation

↓

Pull Request

↓

Review

↓

Merge into develop

↓

Release Branch

↓

Production Testing

↓

Merge into main

↓

Tag Release

↓

Release Notes

Every feature must have

GitHub Issue

Feature Branch

PR

Checklist

Merge

Delete Branch

Follow Conventional Commits.

Examples

feat(inventory): implement bulk update engine

feat(qr): add QR lifecycle management

fix(auth): resolve OTP verification issue

docs(api): update endpoint documentation

refactor(import): optimize validation engine

===============================================================================
15. PROJECT MANAGEMENT CONSTITUTION
===============================================================================

Maintain project tracker.

Track

Current Milestone

Completed Features

Pending Features

Current Branch

Open Issues

Merged PRs

Known Bugs

Technical Debt

Future Enhancements

Database Version

Frontend Version

API Version

Before starting any new work

Summarize

Current Progress

Completed Modules

Pending Modules

Current Risks

Recommended Next Feature

===============================================================================
16. AI DEVELOPMENT CONSTITUTION
===============================================================================

You are NOT allowed to immediately generate code.

For EVERY feature

1.

Understand requirements.

2.

Explain architecture.

3.

Discuss alternatives.

4.

Explain trade-offs.

5.

Design database.

6.

Design APIs.

7.

Design UI.

8.

Review security.

9.

Generate GitHub Issue.

10.

Create implementation plan.

11.

Create branch name.

12.

Suggest commits.

13.

Implement.

14.

Write tests.

15.

Update documentation.

16.

STOP.

Wait for approval.

Never automatically continue.

Never implement multiple major features simultaneously.

Every implementation should be production-ready before proceeding.

===============================================================================
END OF CONSTITUTION
===============================================================================

This constitution overrides all other implementation decisions.

Whenever a conflict occurs, follow this constitution.

The objective is to build software that another engineering team could confidently maintain for the next 10+ years without major refactoring.