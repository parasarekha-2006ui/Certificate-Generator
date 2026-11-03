import os
import uuid
import random
import zipfile
import io
from datetime import datetime
from flask import Blueprint, request, jsonify, send_file, send_from_directory, current_app
from flask_jwt_extended import jwt_required
from config import Config
from database import query_db, execute_db
from services.qr_service import generate_qr_code
from services.pdf_service import generate_certificate_pdf
from services.excel_service import parse_bulk_file, create_sample_excel

certificate_bp = Blueprint('certificates', __name__, url_prefix='/api/certificates')

def generate_unique_cert_id():
    """Generates a unique ID like CERT-2026-A1B2C3"""
    year = datetime.now().year
    while True:
        suffix = ''.join(random.choices('0123456789ABCDEF', k=6))
        candidate = f"CERT-{year}-{suffix}"
        existing = query_db("SELECT id FROM certificates WHERE certificate_id = %s", (candidate,), one=True)
        if not existing:
            return candidate

def format_body_text(template_text, student_name, college_name, department, year, event_name, event_date):
    """Replaces placeholders in template body text"""
    text = template_text or ""
    replacements = {
        '{student_name}': student_name or '',
        '{college_name}': college_name or '',
        '{department}': department or '',
        '{year}': year or '',
        '{event_name}': event_name or '',
        '{event_date}': str(event_date or '')
    }
    for k, v in replacements.items():
        text = text.replace(k, str(v))
    return text

@certificate_bp.route('/generate', methods=['POST'])
@jwt_required()
def generate_single_certificate():
    data = request.get_json() or {}

    student_db_id = data.get('student_db_id')
    student_id_str = data.get('student_id', '').strip()
    student_name = data.get('student_name', '').strip()
    college_name = data.get('college_name', '').strip()
    department = data.get('department', '').strip()
    year = data.get('year', '').strip()

    event_id = data.get('event_id')
    template_key = data.get('template_key', 'participation').strip()
    event_date = data.get('event_date', '').strip()
    issue_date = data.get('issue_date', datetime.now().strftime('%Y-%m-%d')).strip()
    custom_description = data.get('description', '').strip()
    issuing_authority = data.get('issuing_authority', '').strip()
    logo_path = data.get('logo_path', '').strip()
    signature_path = data.get('signature_path', '').strip()

    # Load student if student_db_id provided
    if student_db_id and (not student_name or not college_name):
        student = query_db("SELECT * FROM students WHERE id = %s", (student_db_id,), one=True)
        if student:
            student_id_str = student['student_id']
            student_name = student['name']
            college_name = student['college']
            department = student['department']
            year = student['year']

    # Load event if event_id provided
    event_name = data.get('event_name', '')
    if event_id:
        event = query_db("SELECT * FROM events WHERE id = %s", (event_id,), one=True)
        if event:
            event_name = event['name']
            if not event_date:
                event_date = str(event['event_date'])
            if not issuing_authority:
                issuing_authority = event['issuing_authority']

    # Load template
    template = query_db("SELECT * FROM certificate_templates WHERE template_key = %s", (template_key,), one=True)
    if not template:
        template = query_db("SELECT * FROM certificate_templates LIMIT 1", one=True)

    if not student_name or not college_name or not event_name:
        return jsonify({'success': False, 'message': 'Student name, college name, and event name are required.'}), 400

    title = template['title']
    primary_color = template['primary_color']
    secondary_color = template['secondary_color']
    accent_color = template['accent_color']

    # Format body text
    if custom_description:
        description = custom_description
    else:
        description = format_body_text(
            template['default_body'],
            student_name, college_name, department, year, event_name, event_date
        )

    # 1. Unique Certificate ID
    certificate_id = generate_unique_cert_id()

    # 2. QR Code
    qr_filename, qr_filepath = generate_qr_code(certificate_id, Config.FRONTEND_BASE_URL)

    # 3. PDF Generation
    cert_data = {
        'certificate_id': certificate_id,
        'certificate_type': template['name'],
        'title': title,
        'student_name': student_name,
        'college_name': college_name,
        'department': department,
        'year': year,
        'event_name': event_name,
        'event_date': event_date,
        'issue_date': issue_date,
        'description': description,
        'issuing_authority': issuing_authority or 'Dean of Academic Affairs',
        'primary_color': primary_color,
        'secondary_color': secondary_color,
        'accent_color': accent_color,
        'logo_path': logo_path,
        'signature_path': signature_path
    }

    pdf_filename, pdf_filepath = generate_certificate_pdf(cert_data, qr_filepath)

    # 4. Save to Database
    new_cert_id = execute_db("""
        INSERT INTO certificates (
            certificate_id, student_id, event_id, template_id,
            certificate_type, title, student_name, college_name, department, year,
            event_name, event_date, issue_date, description, issuing_authority,
            status, qr_code_path, pdf_path, logo_path, signature_path
        ) VALUES (
            %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s,
            'Valid', %s, %s, %s, %s
        )
    """, (
        certificate_id, student_db_id, event_id, template['id'],
        template['name'], title, student_name, college_name, department, year,
        event_name, event_date, issue_date, description, issuing_authority,
        qr_filename, pdf_filename, logo_path, signature_path
    ), return_id=True)

    cert_record = query_db("SELECT * FROM certificates WHERE id = %s", (new_cert_id,), one=True)

    return jsonify({
        'success': True,
        'message': f"Certificate generated successfully with ID {certificate_id}.",
        'certificate': cert_record,
        'download_url': f"/api/certificates/{certificate_id}/download",
        'qr_url': f"/api/certificates/qr/{qr_filename}"
    }), 201

@certificate_bp.route('/bulk', methods=['POST'])
@jwt_required()
def bulk_generate_certificates():
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'No file uploaded.'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'message': 'No selected file.'}), 400

    event_id = request.form.get('event_id')
    template_key = request.form.get('template_key', 'participation')
    issue_date = request.form.get('issue_date', datetime.now().strftime('%Y-%m-%d'))
    custom_authority = request.form.get('issuing_authority', '').strip()
    logo_path = request.form.get('logo_path', '').strip()
    signature_path = request.form.get('signature_path', '').strip()

    if not event_id:
        return jsonify({'success': False, 'message': 'An event must be selected for bulk certificate generation.'}), 400

    event = query_db("SELECT * FROM events WHERE id = %s", (event_id,), one=True)
    if not event:
        return jsonify({'success': False, 'message': 'Selected event not found.'}), 404

    template = query_db("SELECT * FROM certificate_templates WHERE template_key = %s", (template_key,), one=True)
    if not template:
        template = query_db("SELECT * FROM certificate_templates LIMIT 1", one=True)

    issuing_authority = custom_authority or event['issuing_authority']

    try:
        parse_result = parse_bulk_file(file.stream, file.filename)
    except Exception as e:
        return jsonify({'success': False, 'message': f"File parsing error: {str(e)}"}), 400

    valid_rows = parse_result['valid_rows']
    invalid_rows = parse_result['invalid_rows']

    if not valid_rows:
        return jsonify({
            'success': False,
            'message': 'No valid student records found in uploaded file.',
            'total_rows': parse_result['total_rows'],
            'valid_count': 0,
            'invalid_count': len(invalid_rows),
            'invalid_rows': invalid_rows
        }), 400

    # Process all valid rows
    generated_certs = []
    generated_pdf_files = []

    for row in valid_rows:
        # Check or insert student
        student = query_db("SELECT * FROM students WHERE student_id = %s", (row['student_id'],), one=True)
        if not student:
            student_db_id = execute_db("""
                INSERT INTO students (student_id, name, college, department, year, email, phone)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (row['student_id'], row['name'], row['college'], row['department'], row['year'], row['email'], row['phone']), return_id=True)
        else:
            student_db_id = student['id']

        certificate_id = generate_unique_cert_id()
        qr_filename, qr_filepath = generate_qr_code(certificate_id, Config.FRONTEND_BASE_URL)

        description = format_body_text(
            template['default_body'],
            row['name'], row['college'], row['department'], row['year'], event['name'], event['event_date']
        )

        cert_data = {
            'certificate_id': certificate_id,
            'certificate_type': template['name'],
            'title': template['title'],
            'student_name': row['name'],
            'college_name': row['college'],
            'department': row['department'],
            'year': row['year'],
            'event_name': event['name'],
            'event_date': event['event_date'],
            'issue_date': issue_date,
            'description': description,
            'issuing_authority': issuing_authority,
            'primary_color': template['primary_color'],
            'secondary_color': template['secondary_color'],
            'accent_color': template['accent_color'],
            'logo_path': logo_path,
            'signature_path': signature_path
        }

        pdf_filename, pdf_filepath = generate_certificate_pdf(cert_data, qr_filepath)
        generated_pdf_files.append((pdf_filename, pdf_filepath))

        new_cert_id = execute_db("""
            INSERT INTO certificates (
                certificate_id, student_id, event_id, template_id,
                certificate_type, title, student_name, college_name, department, year,
                event_name, event_date, issue_date, description, issuing_authority,
                status, qr_code_path, pdf_path, logo_path, signature_path
            ) VALUES (
                %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s,
                'Valid', %s, %s, %s, %s
            )
        """, (
            certificate_id, student_db_id, event['id'], template['id'],
            template['name'], template['title'], row['name'], row['college'], row['department'], row['year'],
            event['name'], event['event_date'], issue_date, description, issuing_authority,
            qr_filename, pdf_filename, logo_path, signature_path
        ), return_id=True)

        generated_certs.append({
            'id': new_cert_id,
            'certificate_id': certificate_id,
            'student_name': row['name'],
            'department': row['department'],
            'download_url': f"/api/certificates/{certificate_id}/download"
        })

    # Create ZIP file of all generated PDFs
    zip_id = uuid.uuid4().hex[:8]
    zip_filename = f"certificates_bulk_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{zip_id}.zip"
    zip_filepath = os.path.join(Config.GENERATED_FOLDER, zip_filename)

    with zipfile.ZipFile(zip_filepath, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for fname, fpath in generated_pdf_files:
            if os.path.exists(fpath):
                zipf.write(fpath, arcname=fname)

    return jsonify({
        'success': True,
        'message': f"Generated {len(valid_rows)} certificates successfully." + (f" ({len(invalid_rows)} row(s) had errors)" if invalid_rows else ""),
        'total_rows': parse_result['total_rows'],
        'valid_count': len(valid_rows),
        'invalid_count': len(invalid_rows),
        'invalid_rows': invalid_rows,
        'certificates': generated_certs,
        'zip_filename': zip_filename,
        'zip_url': f"/api/certificates/bulk-zip/{zip_filename}"
    }), 201

@certificate_bp.route('/sample-template', methods=['GET'])
def download_sample_template():
    """Download sample Excel template for bulk upload"""
    excel_bytes = create_sample_excel()
    return send_file(
        io.BytesIO(excel_bytes),
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name='sample_bulk_students_template.xlsx'
    )

@certificate_bp.route('/history', methods=['GET'])
@jwt_required()
def get_certificate_history():
    search = request.args.get('search', '').strip()
    event_id = request.args.get('event_id', '').strip()
    cert_type = request.args.get('type', '').strip()
    status = request.args.get('status', '').strip()

    sql = """
        SELECT 
            c.*, 
            e.name AS event_title
        FROM certificates c
        LEFT JOIN events e ON c.event_id = e.id
        WHERE 1=1
    """
    params = []

    if search:
        sql += " AND (c.certificate_id LIKE %s OR c.student_name LIKE %s OR c.college_name LIKE %s)"
        term = f"%{search}%"
        params.extend([term, term, term])

    if event_id:
        sql += " AND c.event_id = %s"
        params.append(event_id)

    if cert_type:
        sql += " AND c.certificate_type = %s"
        params.append(cert_type)

    if status:
        sql += " AND c.status = %s"
        params.append(status)

    sql += " ORDER BY c.created_at DESC"

    records = query_db(sql, tuple(params))
    return jsonify({'success': True, 'certificates': records, 'total': len(records)}), 200

@certificate_bp.route('/<certificate_id>/download', methods=['GET'])
def download_certificate_pdf(certificate_id):
    cert = query_db("SELECT * FROM certificates WHERE certificate_id = %s", (certificate_id,), one=True)
    if not cert:
        return jsonify({'success': False, 'message': 'Certificate record not found.'}), 404

    pdf_filename = cert.get('pdf_path') or f"{certificate_id}.pdf"
    pdf_filepath = os.path.join(Config.GENERATED_FOLDER, pdf_filename)

    if not os.path.exists(pdf_filepath):
        # Regenerate on the fly if missing
        qr_file = cert.get('qr_code_path') or f"qr_{certificate_id}.png"
        qr_path = os.path.join(Config.GENERATED_FOLDER, qr_file)
        if not os.path.exists(qr_path):
            generate_qr_code(certificate_id, Config.FRONTEND_BASE_URL)
        generate_certificate_pdf(cert, qr_path)

    return send_from_directory(
        Config.GENERATED_FOLDER,
        pdf_filename,
        as_attachment=True,
        download_name=f"{certificate_id}_{cert['student_name'].replace(' ', '_')}.pdf"
    )

@certificate_bp.route('/bulk-zip/<filename>', methods=['GET'])
@jwt_required()
def download_bulk_zip(filename):
    zip_path = os.path.join(Config.GENERATED_FOLDER, filename)
    if not os.path.exists(zip_path):
        return jsonify({'success': False, 'message': 'Bulk archive file not found or expired.'}), 404

    return send_from_directory(
        Config.GENERATED_FOLDER,
        filename,
        as_attachment=True,
        download_name=filename
    )

@certificate_bp.route('/<certificate_id>/revoke', methods=['POST'])
@jwt_required()
def revoke_certificate(certificate_id):
    cert = query_db("SELECT id, certificate_id, student_name, status FROM certificates WHERE certificate_id = %s", (certificate_id,), one=True)
    if not cert:
        return jsonify({'success': False, 'message': 'Certificate not found.'}), 404

    if cert['status'] == 'Revoked':
        return jsonify({'success': True, 'message': f"Certificate {certificate_id} is already marked as Revoked."}), 200

    execute_db("""
        UPDATE certificates 
        SET status = 'Revoked', revoked_at = NOW()
        WHERE certificate_id = %s
    """, (certificate_id,))

    return jsonify({
        'success': True,
        'message': f"Certificate {certificate_id} for {cert['student_name']} has been successfully REVOKED.",
        'certificate_id': certificate_id,
        'status': 'Revoked'
    }), 200

@certificate_bp.route('/qr/<filename>', methods=['GET'])
def serve_qr(filename):
    return send_from_directory(Config.GENERATED_FOLDER, filename)

@certificate_bp.route('/uploads/<filename>', methods=['GET'])
def serve_upload(filename):
    return send_from_directory(Config.UPLOAD_FOLDER, filename)
