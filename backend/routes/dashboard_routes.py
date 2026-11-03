from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from database import query_db

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')

@dashboard_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    # Counts
    student_count = query_db("SELECT COUNT(*) AS total FROM students", one=True)['total']
    certificate_count = query_db("SELECT COUNT(*) AS total FROM certificates", one=True)['total']
    valid_certificates = query_db("SELECT COUNT(*) AS total FROM certificates WHERE status = 'Valid'", one=True)['total']
    revoked_certificates = query_db("SELECT COUNT(*) AS total FROM certificates WHERE status = 'Revoked'", one=True)['total']
    event_count = query_db("SELECT COUNT(*) AS total FROM events", one=True)['total']
    template_count = query_db("SELECT COUNT(*) AS total FROM certificate_templates", one=True)['total']

    # Recent activities (recent 8 certificates)
    recent_certs = query_db("""
        SELECT 
            c.id, c.certificate_id, c.student_name, c.certificate_type, 
            c.event_name, c.issue_date, c.status, c.created_at
        FROM certificates c
        ORDER BY c.created_at DESC
        LIMIT 8
    """)

    # Certificate distribution by type
    by_type = query_db("""
        SELECT certificate_type, COUNT(*) AS count
        FROM certificates
        GROUP BY certificate_type
        ORDER BY count DESC
    """)

    return jsonify({
        'success': True,
        'stats': {
            'total_students': student_count,
            'total_certificates': certificate_count,
            'valid_certificates': valid_certificates,
            'revoked_certificates': revoked_certificates,
            'total_events': event_count,
            'total_templates': template_count
        },
        'recent_activity': recent_certs,
        'distribution': by_type
    }), 200
