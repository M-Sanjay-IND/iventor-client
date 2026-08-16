# 🏷️ QR Code Management & Printing Guide (QR_GUIDE.md)

This document provides technical and operational guidelines for generating, managing, printing, and scanning QR codes within Inventor Client.

---

## 📑 Table of Contents
1. [QR Architecture & Structure](#1-qr-architecture--structure)
2. [Physical Copy vs Shared Item QR Codes](#2-physical-copy-vs-shared-item-qr-codes)
3. [Vector & High-Resolution Asset Storage](#3-vector--high-resolution-asset-storage)
4. [Sticker Sheet & Thermal Label Printing](#4-sticker-sheet--thermal-label-printing)
5. [Hardware Scanner Configuration](#5-hardware-scanner-configuration)
6. [Reprinting & Label Replacement](#6-reprinting--label-replacement)

---

## 1. QR Architecture & Structure
In accordance with security best practices, QR codes **never contain human-readable or business data** (such as item names, prices, or borrower details) directly embedded in the matrix.

- **QR Matrix Payload**: Contains ONLY the unique QR UID (e.g. `INV-000000001` or `INV-ITEM-1A2B3C4D`).
- **Database Mapping**: The system maps the QR UID to the physical copy, catalog item, and location within PostgreSQL.
- **Benefits**:
  - Scanning is lightning-fast even on low-cost 2D image sensors.
  - QR codes never become outdated if an item is renamed, re-categorized, or moved to a new storage rack.

---

## 2. Physical Copy vs Shared Item QR Codes

| Characteristic | Physical Copy QR Code | Shared Item-Level QR Code |
| :--- | :--- | :--- |
| **UID Format** | `INV-000000001` (Sequential 9-digit pad) | `INV-ITEM-XXXXXXXX` (Item Hash UID) |
| **Attached To** | Individual physical asset unit | Bin, shelf, product box, or rack header |
| **Purpose** | Precise 1:1 serial tracking of an asset | High-throughput batch scanning of identical consumable/equipment units |
| **Borrow Resolution** | Reserves that exact physical copy | Auto-allocates the earliest available copy (`copy_number ASC`) |
| **Return Resolution** | Marks that exact physical copy returned | Auto-resolves the borrower's active loan for that item |

---

## 3. Vector & High-Resolution Asset Storage
Every generated QR code produces two permanent formats stored in Supabase Storage (`qrcodes/` bucket):
- **SVG (Vector Format)**: Infinite resolution without pixelation, ideal for thermal label printers and custom label design software.
- **PNG (300 DPI High-Resolution)**: Raster format optimized for office inkjet/laser label sheets.

---

## 4. Sticker Sheet & Thermal Label Printing

Navigate to `/admin/qr/print` to generate printable sticker sheets:

### A. A4 / Letter Sheet Layouts
- **24-up Standard Sheet (3 × 8 grid)**: Common Avery label format (e.g., Avery 5160 / 7159).
- **40-up High-Density Sheet (4 × 10 grid)**: Ideal for small tools, USB adapters, and handheld components.
- **Printed Label Elements**:
  - Vector QR Code matrix
  - QR UID (monospace)
  - Catalog Item Name
  - Category & Copy #

### B. Direct Thermal Label Printers
- Supports standard Zebra, Dymo, Brother, and TSC thermal label printers.
- Preset dimensions: `1" × 1"` square, `2" × 1"` standard asset tag, `4" × 6"` bin card.

---

## 5. Hardware Scanner Configuration

The Counter Terminal (`/counter`) is engineered for instant plug-and-play with hardware 1D/2D QR and Barcode scanners:

1. **Connection Types**:
   - **USB Wired**: Plug into the counter terminal workstation.
   - **Bluetooth / 2.4GHz Wireless**: Pair with the workstation.
2. **Scanner Mode**: Set scanner to **HID Keyboard Emulation** (Default for 99% of scanners).
3. **Suffix Setting**: Ensure your scanner transmits an `Enter` (Carriage Return / `\n`) suffix after scanning.
4. **Auto-Focus Engine**:
   - The scanner input field on `/counter` automatically captures scanner input regardless of mouse clicks, ensuring staff never need to manually select the input field between scans.

---

## 6. Reprinting & Label Replacement
If a physical label is damaged or worn:
1. Navigate to `/admin/qr` and locate the copy by Item Name or QR UID.
2. Click **Download PNG** or **Download SVG** for instant single-label printing.
3. If an asset is decommissioned or replaced, the admin can re-assign or archive the QR UID via the Item Detail page.
