import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._element.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._element.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def add_code_block(doc, code_text):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    
    cell = tbl.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_background(cell, "F1F5F9")
    set_cell_margins(cell, top=120, bottom=120, left=180, right=180)
    
    # Border
    tcPr = cell._element.get_or_add_tcPr()
    borders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:top w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>'
        f'<w:left w:val="single" w:sz="18" w:space="0" w:color="3B82F6"/>'
        f'<w:bottom w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>'
        f'<w:right w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.15
    run = p.add_run(code_text.strip())
    run.font.name = 'Consolas'
    run.font.size = Pt(9)
    run.font.color.rgb = RGBColor(30, 41, 59)
    
    # Empty space after table
    sp = doc.add_paragraph()
    sp.paragraph_format.space_before = Pt(0)
    sp.paragraph_format.space_after = Pt(4)

def add_callout(doc, text, title="IMPORTANT NOTICE"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    
    cell = tbl.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_background(cell, "EFF6FF")
    set_cell_margins(cell, top=120, bottom=120, left=180, right=180)
    
    tcPr = cell._element.get_or_add_tcPr()
    borders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:top w:val="single" w:sz="4" w:space="0" w:color="BFDBFE"/>'
        f'<w:left w:val="single" w:sz="24" w:space="0" w:color="2563EB"/>'
        f'<w:bottom w:val="single" w:sz="4" w:space="0" w:color="BFDBFE"/>'
        f'<w:right w:val="single" w:sz="4" w:space="0" w:color="BFDBFE"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    run_t = p.add_run(f"[{title}] ")
    run_t.bold = True
    run_t.font.name = 'Calibri'
    run_t.font.size = Pt(10)
    run_t.font.color.rgb = RGBColor(29, 78, 216)
    
    run = p.add_run(text)
    run.font.name = 'Calibri'
    run.font.size = Pt(10)
    run.font.color.rgb = RGBColor(30, 41, 59)
    
    sp = doc.add_paragraph()
    sp.paragraph_format.space_before = Pt(0)
    sp.paragraph_format.space_after = Pt(4)

def build_deployment_docx(output_path):
    doc = Document()
    
    # Page setup
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)
        
    # Styles
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(12)
    title_p.paragraph_format.space_after = Pt(2)
    title_run = title_p.add_run("iVentor Library System")
    title_run.font.name = 'Calibri'
    title_run.font.size = Pt(26)
    title_run.bold = True
    title_run.font.color.rgb = RGBColor(15, 23, 42)
    
    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_before = Pt(0)
    sub_p.paragraph_format.space_after = Pt(14)
    sub_run = sub_p.add_run("Complete Deployment, Hardware Lockdown & Circulation Manual\nDepartment Library Edition (700-800 Books • 300 Students • 1 Workstation)")
    sub_run.font.name = 'Calibri'
    sub_run.font.size = Pt(13)
    sub_run.font.color.rgb = RGBColor(71, 85, 105)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(6)
    
    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(18)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Calibri'
        run.font.size = Pt(16)
        run.bold = True
        run.font.color.rgb = RGBColor(30, 58, 138)
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Calibri'
        run.font.size = Pt(12.5)
        run.bold = True
        run.font.color.rgb = RGBColor(51, 65, 85)
        return p

    def add_body(text, bold_prefix=None):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            r_pre = p.add_run(bold_prefix)
            r_pre.bold = True
            r_pre.font.name = 'Calibri'
            r_pre.font.size = Pt(10.5)
            r_pre.font.color.rgb = RGBColor(15, 23, 42)
        run = p.add_run(text)
        run.font.name = 'Calibri'
        run.font.size = Pt(10.5)
        run.font.color.rgb = RGBColor(51, 65, 85)
        return p

    def add_bullet(text, bold_prefix=None):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            r_pre = p.add_run(bold_prefix)
            r_pre.bold = True
            r_pre.font.name = 'Calibri'
            r_pre.font.size = Pt(10.5)
            r_pre.font.color.rgb = RGBColor(15, 23, 42)
        run = p.add_run(text)
        run.font.name = 'Calibri'
        run.font.size = Pt(10.5)
        run.font.color.rgb = RGBColor(51, 65, 85)
        return p

    # Section 1
    add_h1("1. Executive Summary & Dual Topology")
    add_body("iVentor is an enterprise-grade cloud inventory and library circulation system built with React 19, TypeScript, Tailwind CSS, and Supabase PostgreSQL. It is optimized for departmental libraries managing 700 to 800 physical books and a circulation volume of 300 students.")
    add_body("The platform is engineered around two distinct operational surfaces:")
    add_bullet(" Multi-category inventory valuation, single-sheet Excel onboarding, batch QR sticker printing layouts, transaction audit ledgers, and administrative overrides.", "• Admin Command Console (/admin):")
    add_bullet(" High-speed touch and scanner terminal. Borrowers authenticate via transient 6-digit email OTP passcodes, continuously scan physical books, and receive automated digital receipts.", "• Counter Kiosk Terminal (/counter):")
    
    add_callout(doc, "The counter terminal strictly distinguishes optical laser/barcode scanner inputs from manual keyboard typing through microsecond burst arrival timing. It blocks unauthorized keyboard typing or pasting of QR identifiers.", "SECURITY HIGHLIGHT")

    # Section 2
    add_h1("2. Hardware & Software Requirements")
    add_bullet(" Any standard desktop or laptop PC running Windows 10 or 11 (Home, Pro, or Enterprise). 4 GB RAM minimum.", "Workstation PC:")
    add_bullet(" Any standard 2D optical USB or Bluetooth barcode/QR scanner operating in HID Keyboard Emulation mode.", "Handheld Scanner:")
    add_bullet(" Standard office printer for printing self-adhesive A4 QR sticker sheets (e.g. 24-up or 30-up Avery labels).", "Label Printer:")
    add_bullet(" Node.js v20 LTS+, Git, and Microsoft Edge or Google Chrome browser.", "Software Environment:")
    add_bullet(" Free tier Supabase project and Brevo/Sendinblue transactional email account (300 emails/day free).", "Cloud Infrastructure:")

    # Section 3
    add_h1("3. Step 1: Repository Cloning & Configuration")
    add_body("Open PowerShell or Command Prompt on the library counter computer and execute:")
    add_code_block(doc, 
        "git clone https://github.com/M-Sanjay-IND/iventor-client.git\n"
        "cd iventor-client\n"
        "npm install\n"
        "copy .env.example .env"
    )
    add_body("Configure your production environment variables inside the .env file:")
    add_code_block(doc,
        "VITE_SUPABASE_URL=https://your-project.supabase.co\n"
        "VITE_SUPABASE_ANON_KEY=eyJhbGciOi...your_anon_key\n"
        "VITE_COUNTER_DUE_DAYS=14\n"
        "VITE_COUNTER_EMAIL_DOMAIN=college.edu"
    )

    # Section 4
    add_h1("4. Step 2: Database Setup & Email Edge Function")
    add_body("In your Supabase project dashboard, open the SQL Editor and apply the database migrations in sequence from supabase/migrations/:")
    add_bullet(" Creates core tables for items, copies, transactions, and terminal sessions.", "001_initial_schema.sql:")
    add_bullet(" Enforces PostgreSQL Row-Level Security and secure RPC checkout procedures.", "002_rls_policies.sql:")
    add_bullet(" Configures the qr-codes storage bucket with public read policies.", "003_storage_setup.sql:")
    add_bullet(" Enables atomic single-sheet bulk import of inventory spreadsheets.", "004_bulk_operations.sql:")
    add_bullet(" Installs the transaction audit log and administrative override mechanisms.", "005_audit_and_overrides.sql:")
    
    add_body("Deploy the transactional email Edge Function for student OTPs and digital return receipts:")
    add_code_block(doc,
        "supabase secrets set BREVO_API_KEY=xkeysib-...\n"
        "supabase secrets set FROM_EMAIL=library@college.edu\n"
        "supabase functions deploy send-email --no-verify-jwt"
    )

    # Section 5
    add_h1("5. Step 3: Initial Book Onboarding (700-800 Books)")
    add_body("Instead of manually entering hundreds of titles, use the Single-Sheet Unified Importer:")
    add_bullet(" Prepare an Excel (.xlsx) file with columns: title, author, category, quantity, location, unit_value, isbn.", "Spreadsheet Structure:")
    add_bullet(" Log in to /admin/inventory and click 'Bulk Import Spreadsheet'.", "Upload:")
    add_bullet(" The importer automatically parses rows, creates categories and storage racks, instantiates unique copy numbers (Copy #1, #2...), and generates vector QR code UIDs.", "Auto-Resolution:")

    # Section 6
    add_h1("6. Step 4: Batch Sticker Printing & Book Labeling")
    add_body("To label the physical books:")
    add_bullet(" Navigate to Admin Console -> QR Management (/admin/qr).", "1. Open QR Deck:")
    add_bullet(" Click 'Print Sticker Sheet' and choose either the 24-Up A4 Grid or 30-Up Compact Grid.", "2. Select Grid Format:")
    add_bullet(" The template renders high-resolution 300 DPI vector QR codes alongside department title, book title, and Copy UID.", "3. High-DPI Output:")
    add_bullet(" Affix printed labels to the inside front cover or top-right back cover of each book.", "4. Affix Labels:")

    # Section 7
    add_h1("7. Step 5: Workstation Hardening (Windows Kiosk Account Alternative)")
    add_body("Many guides suggest creating a dedicated Windows user account with Assigned Access and group policy tweaks to block Ctrl+Alt+Del. However, this is deeply flawed for library environments because:")
    add_bullet(" Assigned Access is disabled on Windows 10/11 Home and requires complex configuration on Pro/Enterprise.", "• Edition Incompatibility:")
    add_bullet(" Exiting Kiosk mode to install printer drivers or software updates requires switching user profiles and typing admin credentials.", "• Maintenance Overhead:")
    add_bullet(" Assigned Access frequently disables or restricts standard USB/Bluetooth barcode scanner HID drivers.", "• Driver Breakage:")

    add_h2("The Recommended Solution: Microsoft Edge Native App Kiosk")
    add_body("Microsoft Edge is built into every Windows 10 and 11 PC. Launching Edge in dedicated kiosk mode provides full isolation without multi-user complexity:")
    add_code_block(doc,
        "start msedge.exe --kiosk http://localhost:5173/counter --edge-kiosk-type=fullscreen --no-first-run --disable-pinch --overscroll-history-navigation=0 --kiosk-printing"
    )
    add_body("This command natively hides:")
    add_bullet(" Address bar, navigation controls, bookmarks bar, and back/forward history.", "• Full UI Suppression:")
    add_bullet(" Context menus, download shelves, and browser settings pages.", "• Menu Blocking:")
    add_bullet(" Combined with iVentor's built-in React Kiosk Guard, F12, Ctrl+Shift+I, Ctrl+U, and Ctrl+P are intercepted and silenced.", "• Hotkey Interception:")

    add_h2("Automating Workstation Startup & Task Manager Lock")
    add_body("Two automated scripts are provided in the scripts/ folder:")
    add_bullet(" Automatically registers the fullscreen Edge Kiosk in the Windows Startup folder so the PC boots straight to the counter.", "• scripts/setup-autostart-kiosk.bat:")
    add_bullet(" A 1-click toggle that disables Task Manager for students without creating separate Windows accounts, and re-enables it anytime staff needs it.", "• scripts/toggle-taskmgr-lock.bat:")

    add_h2("Workstation Topologies: 3 Supported Counter Configurations")
    add_body("Because iVentor strictly decouples the /counter kiosk route from the authenticated /admin console and synchronizes live data via Supabase Cloud, all three physical setups below work out-of-the-box with zero code changes:")

    # Comparison Table for the 3 setups
    top_tbl = doc.add_table(rows=1, cols=3)
    top_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    top_tbl.autofit = False
    
    top_headers = ["Setup 1: Single PC (Role-Switched)", "Setup 2: Dual-Monitor on 1 PC", "Setup 3: Dedicated Kiosk + Mobile/Laptop"]
    top_widths = [Inches(2.1), Inches(2.2), Inches(2.2)]
    
    top_hdr_cells = top_tbl.rows[0].cells
    for i, h in enumerate(top_headers):
        top_hdr_cells[i].width = top_widths[i]
        set_cell_background(top_hdr_cells[i], "1E3A8A")
        set_cell_margins(top_hdr_cells[i], top=100, bottom=100, left=120, right=120)
        p = top_hdr_cells[i].paragraphs[0]
        run = p.add_run(h)
        run.bold = True
        run.font.name = 'Calibri'
        run.font.size = Pt(9.5)
        run.font.color.rgb = RGBColor(255, 255, 255)

    top_row = top_tbl.add_row().cells
    top_items = [
        "• 1 PC Tower / Laptop\n• 1 Single Monitor\n• 1 Handheld Scanner\n• Zero extra hardware cost\n• Role-switched for staff tasks",
        "• 1 PC Tower (2 Video Ports)\n• 2 Monitors (Student + Staff)\n• 1 Handheld Scanner\n• Simultaneous student checkout & staff management",
        "• 1 Counter PC (Student only)\n• 1 Staff Laptop or Smartphone\n• 1 Handheld Scanner\n• Absolute physical isolation\n• Remote terminal control via Wi-Fi"
    ]
    for i, text in enumerate(top_items):
        top_row[i].width = top_widths[i]
        set_cell_background(top_row[i], "F1F5F9")
        set_cell_margins(top_row[i], top=90, bottom=90, left=110, right=110)
        p = top_row[i].paragraphs[0]
        p.paragraph_format.line_spacing = 1.15
        run = p.add_run(text)
        run.font.name = 'Calibri'
        run.font.size = Pt(9)
        run.font.color.rgb = RGBColor(51, 65, 85)

    doc.add_paragraph().paragraph_format.space_before = Pt(8)

    add_h2("Setup 1: Single PC (Role-Switched / Single Monitor)")
    add_bullet(" Place the PC on the circulation desk. Plug in the handheld USB barcode scanner.", "Hardware Setup:")
    add_bullet(" Run scripts/setup-autostart-kiosk.bat to boot directly into /counter. Run scripts/toggle-taskmgr-lock.bat [1] to lock Task Manager.", "Kiosk Lockdown:")
    add_bullet(" The PC runs in fullscreen /counter. Students enter email, receive OTP, and scan books.", "Student Operation:")
    add_bullet(" Librarian clicks 'Admin Console' (or presses Alt+F4), logs in at /login, and completes inventory or export tasks. When done, clicks 'Launch Counter Terminal' to return to student mode.", "Staff Administration:")
    add_bullet(" Even if a student attempts to navigate to /admin, Supabase authentication strictly blocks access with an admin password wall.", "Security Check:")

    add_h2("Setup 2: Dual-Monitor on Single PC (The Bank / Circulation Counter Model)")
    add_bullet(" 1 PC Tower with two video outputs (HDMI + VGA/DisplayPort), 2 Monitors, 1 USB Scanner.", "Hardware Setup:")
    add_bullet(" In Windows Settings -> System -> Display, select 'Extend these displays' (do NOT duplicate). Monitor 1 faces staff, Monitor 2 faces students.", "Windows Display Setup:")
    add_bullet(" On Monitor 1 (Staff Screen), open normal browser to /admin and log in. On Monitor 2 (Student Screen), launch fullscreen kiosk mode targeting /counter.", "Window Routing:")
    add_bullet(" Students scan and borrow books independently on Monitor 2, while the librarian catalogs books, audits overdue loans, and prints stickers on Monitor 1 simultaneously.", "Daily Workflow:")

    add_h2("Setup 3: Dedicated Counter PC + Remote Admin on Librarian Laptop / Mobile")
    add_bullet(" Counter PC is 100% dedicated to students on /counter. Librarian connects personal laptop, tablet, or smartphone to college Wi-Fi.", "Hardware Setup:")
    add_bullet(" The Counter PC boots straight into /counter and runs 24/7. Students never see desktop icons, browser bars, or admin controls.", "Counter Isolation:")
    add_bullet(" Librarian navigates to https://dept-library.vercel.app/admin on laptop/phone and logs in.", "Remote Console:")
    add_bullet(" Librarian can click 'Open Terminal Session' or 'Close Terminal Session' remotely from anywhere in the library. All borrow events stream live to staff dashboard.", "Remote Operation:")

    # Section 8
    add_h1("8. Step 6: Optical Scanner Anti-Tamper Configuration")
    add_body("To ensure students cannot type arbitrary numbers or paste codes from clipboards:")
    add_bullet(" Scan the 'Add CR/LF (Enter) Suffix' barcode in your handheld scanner manual so it sends an Enter key after each scan.", "1. Scanner Suffix Setup:")
    add_bullet(" Optical readers emit characters at superhuman speeds (<20ms per character). Human typing takes >100ms per character. If human typing or pasting is detected, the entry is rejected immediately.", "2. Keystroke Burst Filter:")
    add_bullet(" If a physical sticker is torn or scratched, the librarian can click 'Staff Override'. A secure modal requires the 4-digit Staff PIN (default: 8821) before unlocking manual keyboard typing. Students cannot bypass the scanner because they do not know the PIN.", "3. PIN-Protected Staff Override:")
    add_bullet(" If Alt+F4 is pressed, the kiosk launcher script catches the event and requires the 4-digit Staff PIN (8821) to exit to the Windows Desktop. Without the PIN, it automatically relaunches fullscreen within 1 second.", "4. Anti-Tamper Exit Gate:")

    # Section 9
    add_h1("9. Step 7: Daily Librarian Circulation Runbook")
    add_bullet(" Librarian powers on the terminal PC. Edge Kiosk launches automatically. Librarian opens /admin on second tab or phone and clicks 'Open Terminal Session'.", "Morning Opening (1 min):")
    add_bullet(" Student enters college email -> Receives 6-digit OTP -> Scans book QR codes with handheld reader -> Clicks 'Confirm Borrow' -> Receives email receipt.", "Student Borrow Flow:")
    add_bullet(" Student enters email & OTP -> Selects 'Return Books' -> Views checklist of active loans -> Scans physical books -> Stock updates in real time.", "Student Return Flow:")
    add_bullet(" Librarian clicks 'Close Terminal Session' to lock checkout after library hours. Clicks 'Export Daily Ledger' in Reports for audit logs.", "Evening Closing:")

    # Section 10
    add_h1("10. Troubleshooting & FAQ")
    
    # Add table
    tbl = doc.add_table(rows=1, cols=3)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    
    headers = ["Symptom", "Underlying Cause", "Action Required"]
    widths = [Inches(1.8), Inches(2.2), Inches(2.5)]
    
    hdr_cells = tbl.rows[0].cells
    for i, h in enumerate(headers):
        hdr_cells[i].width = widths[i]
        set_cell_background(hdr_cells[i], "1E293B")
        set_cell_margins(hdr_cells[i], top=100, bottom=100, left=120, right=120)
        p = hdr_cells[i].paragraphs[0]
        run = p.add_run(h)
        run.bold = True
        run.font.name = 'Calibri'
        run.font.size = Pt(9.5)
        run.font.color.rgb = RGBColor(255, 255, 255)

    faqs = [
        ("Scanner beeps but does not add item", "Scanner is not configured to send an Enter key suffix after reading the code.", "Scan the 'Add CR/LF Suffix' barcode in the scanner user guide."),
        ("Manual keyboard typing blocked error", "Keystrokes arrived too slowly (>70ms per char) or clipboard paste was attempted.", "Use the optical handheld scanner. If barcode is damaged, click 'Staff Override'."),
        ("Student did not receive OTP code", "Brevo email credentials missing or email filtered to spam folder.", "Check Brevo API dashboard. Librarian can view the local OTP code in terminal console."),
        ("How to close Kiosk for PC maintenance?", "Workstation is locked in fullscreen kiosk mode.", "Press Alt + F4 on the physical keyboard to cleanly exit the Edge Kiosk window."),
    ]

    for row_idx, (symp, cause, action) in enumerate(faqs):
        row_cells = tbl.add_row().cells
        for i, val in enumerate([symp, cause, action]):
            row_cells[i].width = widths[i]
            set_cell_background(row_cells[i], "F8FAFC" if row_idx % 2 == 0 else "FFFFFF")
            set_cell_margins(row_cells[i], top=80, bottom=80, left=100, right=100)
            p = row_cells[i].paragraphs[0]
            run = p.add_run(val)
            run.font.name = 'Calibri'
            run.font.size = Pt(9)
            run.font.color.rgb = RGBColor(51, 65, 85)

    doc.add_paragraph().paragraph_format.space_before = Pt(14)
    
    # Footer notice
    p_foot = doc.add_paragraph()
    p_foot.paragraph_format.space_before = Pt(20)
    p_foot.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_foot = p_foot.add_run("Certified for College Department Library Deployments • iVentor Client v1.0")
    r_foot.font.name = 'Calibri'
    r_foot.font.size = Pt(9)
    r_foot.italic = True
    r_foot.font.color.rgb = RGBColor(148, 163, 184)
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    try:
        doc.save(output_path)
        print(f"Successfully generated Word document at: {output_path}")
    except PermissionError:
        alt_path = output_path.replace(".docx", "_UPDATED.docx")
        doc.save(alt_path)
        print(f"Original file is currently open in Microsoft Word. Saved to: {alt_path}")

if __name__ == '__main__':
    build_deployment_docx(r"c:\Users\Sanjay M\OneDrive\Documents\iventor-client\docs\LIBRARY_DEPLOYMENT_GUIDE.docx")
