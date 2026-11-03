from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import check_password_hash
from database import query_db

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'success': False, 'message': 'Email and password are required.'}), 400

    admin = query_db("SELECT id, name, email, password_hash FROM admins WHERE email = %s", (email,), one=True)
    if not admin:
        return jsonify({'success': False, 'message': 'Invalid email or password.'}), 401

    if not check_password_hash(admin['password_hash'], password):
        return jsonify({'success': False, 'message': 'Invalid email or password.'}), 401

    # Generate JWT token
    access_token = create_access_token(identity=str(admin['id']), additional_claims={'email': admin['email'], 'name': admin['name']})

    return jsonify({
        'success': True,
        'message': 'Login successful.',
        'token': access_token,
        'admin': {
            'id': admin['id'],
            'name': admin['name'],
            'email': admin['email']
        }
    }), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_admin():
    admin_id = get_jwt_identity()
    admin = query_db("SELECT id, name, email, created_at FROM admins WHERE id = %s", (admin_id,), one=True)
    if not admin:
        return jsonify({'success': False, 'message': 'Admin not found.'}), 404

    return jsonify({
        'success': True,
        'admin': admin
    }), 200
