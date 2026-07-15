# ===============================================================================
# SOFTWARE ENGINEERING STANDARDS
# ===============================================================================

This project must follow enterprise software engineering standards.

Never sacrifice maintainability for speed.

Always optimize for readability.

Every file should have a single responsibility.

Every function should have one purpose.

Every component should be reusable.

Avoid duplicated logic.

Avoid hardcoded values.

Use dependency injection where appropriate.

Follow SOLID principles.

Follow DRY.

Follow KISS.

Follow Clean Architecture.

Follow Feature Driven Development.

======================================================================
PROJECT STRUCTURE
======================================================================

The application must use Feature-Based Architecture instead of Layer-Based Architecture.

Preferred structure

src/

app/

components/

features/

dashboard/

inventory/

qr/

borrow/

reports/

settings/

auth/

hooks/

services/

api/

lib/

types/

constants/

utils/

assets/

styles/

Each feature must contain

components/

hooks/

services/

types/

pages/

validation/

Feature folders should not depend directly on one another.

Shared logic belongs inside shared folders.

======================================================================
DATABASE PHILOSOPHY
======================================================================

Design PostgreSQL like an enterprise ERP.

Normalize every table.

Never duplicate data.

Every table requires

Primary Key

Indexes

Foreign Keys

Created Timestamp

Updated Timestamp

Soft Delete

Audit Metadata

Avoid nullable columns whenever possible.

Never store derived data unless justified.

======================================================================
INVENTORY MODEL
======================================================================

Separate Inventory Items from Physical Copies.

Example

Laptop

↓

Laptop #1

Laptop #2

Laptop #3

Monitor

↓

Monitor #1

Monitor #2

Book

↓

Book Copy #1

Book Copy #2

Book Copy #3

Every physical object receives exactly one inventory copy.

Every inventory copy receives one permanent QR.

======================================================================
BORROW MODEL
======================================================================

Transactions should never modify historical data.

Create immutable transaction records.

Borrow

↓

Transaction Created

↓

Inventory Updated

Return

↓

Transaction Closed

↓

Inventory Updated

Never delete transactions.

======================================================================
QR LIFECYCLE
======================================================================

QR generation occurs exactly once.

Generate

↓

Store Original PNG

↓

Store SVG

↓

Store Metadata

↓

Print

↓

Attach

↓

Reprint if necessary

Never regenerate a QR because the sticker faded.

Always retrieve the original image.

Every QR has

Unique UID

Checksum

Version

Generation Date

Print Count

Print History

Linked Inventory Copy

Bulk printing should display

QR

Inventory Name

QR UID

Location (optional)

Category (optional)

Users must be able to identify labels before printing.

======================================================================
IMPORT ENGINE
======================================================================

Support

CSV

XLS

XLSX

Provide downloadable templates.

Template Download

↓

Fill Data

↓

Upload

↓

Validation

↓

Duplicate Detection

↓

Preview

↓

Warnings

↓

User Confirmation

↓

Database Import

↓

QR Generation

↓

Sticker Generation

↓

Complete

Never import blindly.

Rollback entire transaction if import fails.

======================================================================
EXPORT ENGINE
======================================================================

Support exporting

Inventory

Transactions

Reports

Audit Logs

Print History

QR Metadata

Formats

CSV

Excel

PDF

Future API Export

======================================================================
SEARCH
======================================================================

Implement global search.

Search by

Inventory Name

QR UID

Category

Manufacturer

Brand

Location

Status

Transaction ID

Borrower Email

Search should be instant.

======================================================================
FILTERING
======================================================================

Every table should support

Sorting

Filtering

Pagination

Column Visibility

Column Resizing

Column Export

Saved Filters

======================================================================
ERROR HANDLING
======================================================================

Never expose internal errors.

Always log technical errors.

Show user-friendly messages.

Unexpected exceptions

↓

Audit Log

↓

Developer Log

↓

User Notification

======================================================================
AUDIT LOGGING
======================================================================

Every critical action must create an audit log.

Examples

Login

Logout

Import

Delete

QR Generation

QR Printing

Borrow

Return

Settings Update

Role Change

Audit log stores

Timestamp

User

IP (if available)

Browser

Action

Affected Record

Result

======================================================================
PERFORMANCE
======================================================================

Optimize for

Lazy Loading

Pagination

Caching

Code Splitting

Image Optimization

Query Optimization

Memoization

Virtualized Tables

Avoid unnecessary re-renders.

======================================================================
ACCESSIBILITY
======================================================================

Meet WCAG AA standards.

Keyboard Navigation

Screen Reader Support

High Contrast

Focus Indicators

ARIA Labels

Responsive Layout

======================================================================
RESPONSIVE DESIGN
======================================================================

Support

Desktop

Laptop

Tablet

Counter Monitor

Mobile (Admin Only)

Counter interface should be optimized for widescreen monitors.

======================================================================
DEPLOYMENT
======================================================================

Use

GitHub

↓

Develop Branch

↓

Pull Request

↓

Merge

↓

GitHub Actions

↓

Deploy Preview

↓

Production

Production deploys only from main.

Never deploy from feature branches.

======================================================================
CI/CD
======================================================================

Automate

Lint

Formatting

Type Checking

Testing

Build

Deployment

Fail deployment if

Lint fails

Tests fail

Build fails

======================================================================
FINAL ENGINEERING RULES
======================================================================

Always think before coding.

Always explain trade-offs.

Always justify architecture.

Always produce implementation plans.

Never create technical debt intentionally.

Every module must be reviewable independently.

Every merge should improve the software.

Software quality is more important than implementation speed.
