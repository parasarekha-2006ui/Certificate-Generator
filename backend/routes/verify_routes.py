from flask import Blueprint, jsonify
from database import query_db

verify_bp = Blueprint('verify', __name__, url_prefix='/api/verify')

@verify_bp.route('/<certificate_id>', methods=['GET'])
def verify_certificate(certificate_id):
    """
    Public Verification API endpoint.
    NO authentication required.
    Does NOT leak email, phone, or any other sensitive personal data.
    Only returns: student_name, certificate_type, title, event_name, issue_date, certificate_id, status.
    """
    cleaned_id = certificate_id.strip()
    cert = query_db("""
        SELECT 
            certificate_id,
            student_name,
            certificate_type,
            title,
            event_name,
            issue_date,
            issuing_authority,
            status,
            created_at,
            revoked_at
        FROM certificates
        WHERE certificate_id = %s
    """, (cleaned_id,), one=True)

    if not cert:
        return jsonify({
            'success': False,
            'status': 'Not found',
            'valid': False,
            'message': f"No certificate found with ID '{cleaned_id}'.",
            'certificate': None
        }), 404

    is_valid = (cert['status'] == 'Valid')

    return jsonify({
        'success': True,
        'status': cert['status'],
        'valid': is_valid,
        'message': f"Certificate is verified as {cert['status']}.",
        'certificate': {
            'certificate_id': cert['certificate_id'],
            'student_name': cert['student_name'],
            'certificate_type': cert['certificate_type'],
            'title': cert['title'],
            'event_name': cert['event_name'],
            'issue_date': str(cert['issue_date']),
            'issuing_authority': cert['issuing_authority'],
            'status': cert['status'],
            'revoked_at': str(cert['revoked_at']) if cert['revoked_at'] else None
        }
    }), 200
