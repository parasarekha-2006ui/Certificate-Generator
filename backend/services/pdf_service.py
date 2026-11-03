import os
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from PIL import Image
from config import Config

def hex_to_color(hex_str, default=colors.HexColor('#1e3a8a')):
    try:
        if hex_str and hex_str.startswith('#'):
            return colors.HexColor(hex_str)
        elif hex_str:
            return colors.HexColor(f"#{hex_str}")
        return default
    except Exception:
        return default

def generate_certificate_pdf(data, qr_image_path):
    """
    Generates a high-quality landscape A4 certificate PDF.
    
    data dictionary requires:
      - certificate_id: str (e.g. CERT-2026-ABC123)
      - certificate_type: str (e.g. participation, achievement, workshop, etc.)
      - title: str (e.g. CERTIFICATE OF PARTICIPATION)
      - student_name: str
      - college_name: str
      - department: str
      - year: str
      - event_name: str
      - event_date: str or date
      - issue_date: str or date
      - description: str (body text)
      - issuing_authority: str
      - primary_color: str hex (e.g. '#1e3a8a')
      - secondary_color: str hex (e.g. '#3b82f6')
      - accent_color: str hex (e.g. '#d97706')
      - logo_path: optional path to college logo
      - signature_path: optional path to signature image
    """
    os.makedirs(Config.GENERATED_FOLDER, exist_ok=True)
    pdf_filename = f"{data['certificate_id']}.pdf"
    pdf_filepath = os.path.join(Config.GENERATED_FOLDER, pdf_filename)

    # Landscape A4 dimensions: 841.89 x 595.27 points
    width, height = landscape(A4)

    c = canvas.Canvas(pdf_filepath, pagesize=(width, height))
    c.setTitle(f"Certificate - {data.get('certificate_id')}")
    c.setSubject(f"{data.get('title')} for {data.get('student_name')}")
    c.setAuthor("Online Certificate Generator System")

    # Colors
    c_primary = hex_to_color(data.get('primary_color'), colors.HexColor('#1e3a8a'))
    c_secondary = hex_to_color(data.get('secondary_color'), colors.HexColor('#3b82f6'))
    c_accent = hex_to_color(data.get('accent_color'), colors.HexColor('#d97706'))
    c_text_dark = colors.HexColor('#0f172a')
    c_text_muted = colors.HexColor('#475569')
    c_bg_tint = colors.HexColor('#fcfcfd')

    # 1. Background fill
    c.setFillColor(c_bg_tint)
    c.rect(0, 0, width, height, fill=1, stroke=0)

    # 2. Outer Ornamental Borders
    # Outer solid border
    c.setStrokeColor(c_primary)
    c.setLineWidth(4)
    c.rect(20, 20, width - 40, height - 40, fill=0, stroke=1)

    # Middle thin accent border
    c.setStrokeColor(c_accent)
    c.setLineWidth(1.5)
    c.rect(26, 26, width - 52, height - 52, fill=0, stroke=1)

    # Inner decorative border
    c.setStrokeColor(c_secondary)
    c.setLineWidth(0.75)
    c.rect(30, 30, width - 60, height - 60, fill=0, stroke=1)

    # Corner cornerpiece ornaments
    corner_size = 18
    for (cx, cy) in [(30, 30), (width - 30, 30), (30, height - 30), (width - 30, height - 30)]:
        c.setFillColor(c_accent)
        c.circle(cx, cy, 3.5, fill=1, stroke=0)

    # Top-Left Logo / Seal (if provided, else collegiate crest design)
    logo_drawn = False
    logo_file = data.get('logo_path')
    if logo_file:
        full_logo_path = os.path.join(Config.UPLOAD_FOLDER, logo_file) if not os.path.isabs(logo_file) else logo_file
        if os.path.exists(full_logo_path):
            try:
                c.drawImage(full_logo_path, 45, height - 100, width=65, height=65, preserveAspectRatio=True, mask='auto')
                logo_drawn = True
            except Exception as e:
                print(f"Error drawing logo: {e}")

    if not logo_drawn:
        # Draw a distinguished collegiate emblem
        c.setFillColor(c_primary)
        c.circle(75, height - 70, 26, fill=1, stroke=0)
        c.setFillColor(c_accent)
        c.circle(75, height - 70, 22, fill=0, stroke=1)
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 14)
        c.drawCentredString(75, height - 75, "EDU")

    # Header: College / Institution Name
    college_name = data.get('college_name', 'INSTITUTE OF HIGHER EDUCATION & RESEARCH').upper()
    c.setFillColor(c_primary)
    c.setFont("Helvetica-Bold", 17)
    c.drawCentredString(width / 2, height - 65, college_name)

    c.setFillColor(c_text_muted)
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(width / 2, height - 80, "AFFILIATED INSTITUTION • EXCELLENCE IN ACADEMICS & INNOVATION")

    # Header Divider Line with Center Diamond
    c.setStrokeColor(c_accent)
    c.setLineWidth(1)
    c.line(width / 2 - 180, height - 90, width / 2 + 180, height - 90)
    c.setFillColor(c_accent)
    # Diamond glyph
    p = c.beginPath()
    p.moveTo(width / 2, height - 86)
    p.lineTo(width / 2 + 5, height - 90)
    p.lineTo(width / 2, height - 94)
    p.lineTo(width / 2 - 5, height - 90)
    p.close()
    c.drawPath(p, fill=1, stroke=0)

    # Certificate Title (e.g. CERTIFICATE OF PARTICIPATION)
    title = data.get('title', 'CERTIFICATE OF RECOGNITION').upper()
    c.setFillColor(c_primary)
    c.setFont("Helvetica-Bold", 24)
    c.drawCentredString(width / 2, height - 128, title)

    # Subtitle: Presentation formula
    c.setFillColor(c_text_muted)
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(width / 2, height - 150, "THIS CERTIFICATE IS PROUDLY PRESENTED TO")

    # Student Name (Large, distinguished)
    student_name = data.get('student_name', 'Student Name')
    c.setFillColor(c_accent)
    c.setFont("Helvetica-Bold", 28)
    c.drawCentredString(width / 2, height - 188, student_name)

    # Student Details Line (Dept & Year)
    dept = data.get('department', 'Engineering')
    year = data.get('year', '')
    details_line = f"Department of {dept}" + (f" ({year})" if year else "")
    c.setFillColor(c_text_muted)
    c.setFont("Helvetica", 12)
    c.drawCentredString(width / 2, height - 208, details_line)

    # Body Paragraph Text
    body_text = data.get('description', '')
    if not body_text:
        event_name = data.get('event_name', 'the college event')
        event_date = str(data.get('event_date', ''))
        body_text = f"for active and commendable involvement in {event_name} organized on {event_date}."

    styles = getSampleStyleSheet()
    body_style = ParagraphStyle(
        'CertBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=18,
        textColor=colors.HexColor('#334155'),
        alignment=TA_CENTER
    )
    para = Paragraph(body_text, body_style)
    # Allow 520 points width for text block
    pw = 560
    ph = 60
    px = (width - pw) / 2
    py = height - 280
    para.wrapOn(c, pw, ph)
    para.drawOn(c, px, py)

    # --- FOOTER SECTION ---
    # Bottom baseline y = 60-120

    # 1. Left Footer: QR Code & Verification Info
    if qr_image_path and os.path.exists(qr_image_path):
        try:
            c.drawImage(qr_image_path, 50, 52, width=72, height=72, preserveAspectRatio=True)
            c.setFillColor(c_text_muted)
            c.setFont("Helvetica-Bold", 7.5)
            c.drawString(130, 110, "OFFICIAL VERIFICATION")
            c.setFont("Helvetica", 7)
            c.drawString(130, 98, f"ID: {data.get('certificate_id')}")
            c.drawString(130, 86, f"Issue Date: {data.get('issue_date')}")
            c.drawString(130, 74, "Scan QR code to verify on")
            c.drawString(130, 62, "college portal in real-time.")
        except Exception as e:
            print(f"Error drawing QR in PDF: {e}")

    # 2. Center Footer: Authenticity Seal / Badge
    c.setFillColor(c_primary)
    c.circle(width / 2, 85, 24, fill=0, stroke=1)
    c.setStrokeColor(c_accent)
    c.circle(width / 2, 85, 21, fill=0, stroke=1)
    c.setFillColor(c_primary)
    c.setFont("Helvetica-Bold", 6.5)
    c.drawCentredString(width / 2, 90, "★ VERIFIED ★")
    c.drawCentredString(width / 2, 80, "AUTHENTIC")
    c.setFont("Helvetica", 5.5)
    c.drawCentredString(width / 2, 71, "CREDENTIAL")

    # 3. Right Footer: Signature and Issuing Authority
    sig_drawn = False
    sig_file = data.get('signature_path')
    if sig_file:
        full_sig_path = os.path.join(Config.UPLOAD_FOLDER, sig_file) if not os.path.isabs(sig_file) else sig_file
        if os.path.exists(full_sig_path):
            try:
                c.drawImage(full_sig_path, width - 230, 85, width=140, height=45, preserveAspectRatio=True, mask='auto')
                sig_drawn = True
            except Exception as e:
                print(f"Error drawing signature: {e}")

    if not sig_drawn:
        # Script-style representation
        c.setFillColor(colors.HexColor('#1e293b'))
        c.setFont("Times-Italic", 16)
        c.drawCentredString(width - 150, 96, "R. K. Sharma")

    # Signature line
    c.setStrokeColor(colors.HexColor('#94a3b8'))
    c.setLineWidth(1)
    c.line(width - 240, 82, width - 60, 82)

    # Authority Name & Role
    authority = data.get('issuing_authority', 'Dean of Academic Affairs')
    c.setFillColor(c_text_dark)
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(width - 150, 69, authority)
    c.setFillColor(c_text_muted)
    c.setFont("Helvetica", 7.5)
    c.drawCentredString(width - 150, 58, "Authorized Signatory")

    # Bottom Footer security note
    c.setFillColor(colors.HexColor('#94a3b8'))
    c.setFont("Helvetica", 6.5)
    c.drawCentredString(width / 2, 33, f"Document ID: {data.get('certificate_id')} • Digitally Generated & Registered • Validated through Online Certificate Management Portal")

    c.save()
    return pdf_filename, pdf_filepath
