import os
import uuid
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required
from werkzeug.utils import secure_filename
from PIL import Image
from config import Config
from database import query_db, execute_db

template_bp = Blueprint('templates', __name__, url_prefix='/api/templates')

def is_allowed_image(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_IMAGE_EXTENSIONS

@template_bp.route('', methods=['GET'])
@jwt_required()
def list_templates():
    templates = query_db("SELECT * FROM certificate_templates ORDER BY id ASC")
    return jsonify({'success': True, 'templates': templates}), 200

@template_bp.route('/<identifier>', methods=['GET'])
@jwt_required()
def get_template(identifier):
    if identifier.isdigit():
        template = query_db("SELECT * FROM certificate_templates WHERE id = %s", (int(identifier),), one=True)
    else:
        template = query_db("SELECT * FROM certificate_templates WHERE template_key = %s", (identifier,), one=True)

    if not template:
        return jsonify({'success': False, 'message': 'Template not found.'}), 404

    return jsonify({'success': True, 'template': template}), 200

@template_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_template(id):
    tpl = query_db("SELECT id FROM certificate_templates WHERE id = %s", (id,), one=True)
    if not tpl:
        return jsonify({'success': False, 'message': 'Template not found.'}), 404

    data = request.get_json() or {}
    title = data.get('title', '').strip()
    default_body = data.get('default_body', '').strip()
    primary_color = data.get('primary_color', '#1e3a8a').strip()
    secondary_color = data.get('secondary_color', '#6366f1').strip()
    accent_color = data.get('accent_color', '#d97706').strip()

    if not title or not default_body:
        return jsonify({'success': False, 'message': 'Title and default body text are required.'}), 400

    execute_db("""
        UPDATE certificate_templates
        SET title = %s, default_body = %s, primary_color = %s, secondary_color = %s, accent_color = %s
        WHERE id = %s
    """, (title, default_body, primary_color, secondary_color, accent_color, id))

    updated = query_db("SELECT * FROM certificate_templates WHERE id = %s", (id,), one=True)
    return jsonify({'success': True, 'message': 'Template updated successfully.', 'template': updated}), 200

@template_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_asset():
    """
    Uploads a college logo or signature image.
    Validates file type (PNG/JPG only), file size (<= 5MB), and image integrity.
    """
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'No file part in the request.'}), 400

    file = request.files['file']
    upload_type = request.form.get('type', 'asset') # 'logo' or 'signature'

    if file.filename == '':
        return jsonify({'success': False, 'message': 'No file selected.'}), 400

    if not is_allowed_image(file.filename):
        return jsonify({'success': False, 'message': 'Only PNG and JPG/JPEG images are allowed.'}), 400

    # Ensure uploads directory exists
    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)

    # Secure and unique filename
    orig_ext = file.filename.rsplit('.', 1)[1].lower()
    unique_id = uuid.uuid4().hex[:10]
    safe_name = f"{upload_type}_{unique_id}.{orig_ext}"
    dest_path = os.path.join(Config.UPLOAD_FOLDER, safe_name)

    # Check file size & verify image with Pillow
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    if file_size > Config.MAX_IMAGE_SIZE:
        return jsonify({'success': False, 'message': f'Image size exceeds maximum limit of {Config.MAX_IMAGE_SIZE // (1024 * 1024)}MB.'}), 400
    file.seek(0)

    try:
        # Validate that the uploaded file is indeed a valid image
        img = Image.open(file)
        img.verify()
        file.seek(0)
        file.save(dest_path)
    except Exception as e:
        return jsonify({'success': False, 'message': f'Uploaded file is corrupted or not a valid image: {str(e)}'}), 400

    file_url = f"/api/certificates/uploads/{safe_name}"

    return jsonify({
        'success': True,
        'message': f'{upload_type.capitalize()} uploaded successfully.',
        'filename': safe_name,
        'url': file_url
    }), 200
