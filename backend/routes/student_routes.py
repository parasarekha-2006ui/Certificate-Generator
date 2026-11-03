import re
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from database import query_db, execute_db

student_bp = Blueprint('students', __name__, url_prefix='/api/students')

EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')
PHONE_REGEX = re.compile(r'^\+?[0-9]{7,15}$')

@student_bp.route('', methods=['GET'])
@jwt_required()
def list_students():
    search = request.args.get('search', '').strip()
    department = request.args.get('department', '').strip()
    year = request.args.get('year', '').strip()

    sql = "SELECT * FROM students WHERE 1=1"
    params = []

    if search:
        sql += " AND (name LIKE %s OR student_id LIKE %s OR email LIKE %s OR college LIKE %s)"
        like_term = f"%{search}%"
        params.extend([like_term, like_term, like_term, like_term])

    if department:
        sql += " AND department = %s"
        params.append(department)

    if year:
        sql += " AND year = %s"
        params.append(year)

    sql += " ORDER BY id DESC"

    students = query_db(sql, tuple(params))
    return jsonify({'success': True, 'students': students, 'total': len(students)}), 200

@student_bp.route('/<int:student_id>', methods=['GET'])
@jwt_required()
def get_student(student_id):
    student = query_db("SELECT * FROM students WHERE id = %s", (student_id,), one=True)
    if not student:
        return jsonify({'success': False, 'message': 'Student not found.'}), 404
    return jsonify({'success': True, 'student': student}), 200

@student_bp.route('', methods=['POST'])
@jwt_required()
def create_student():
    data = request.get_json() or {}
    student_id = data.get('student_id', '').strip()
    name = data.get('name', '').strip()
    college = data.get('college', '').strip()
    department = data.get('department', '').strip()
    year = data.get('year', '').strip()
    email = data.get('email', '').strip()
    phone = data.get('phone', '').strip()

    # Validations
    if not student_id or not name or not college or not department or not year or not email or not phone:
        return jsonify({'success': False, 'message': 'All fields are required.'}), 400

    if not EMAIL_REGEX.match(email):
        return jsonify({'success': False, 'message': 'Please provide a valid email address.'}), 400

    clean_phone = phone.replace(' ', '').replace('-', '')
    if not PHONE_REGEX.match(clean_phone):
        return jsonify({'success': False, 'message': 'Please provide a valid phone number (7-15 digits).'}), 400

    existing = query_db("SELECT id FROM students WHERE student_id = %s", (student_id,), one=True)
    if existing:
        return jsonify({'success': False, 'message': f"Student ID '{student_id}' is already registered."}), 409

    new_id = execute_db("""
        INSERT INTO students (student_id, name, college, department, year, email, phone)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (student_id, name, college, department, year, email, phone), return_id=True)

    student = query_db("SELECT * FROM students WHERE id = %s", (new_id,), one=True)
    return jsonify({'success': True, 'message': 'Student created successfully.', 'student': student}), 201

@student_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_student(id):
    student = query_db("SELECT id FROM students WHERE id = %s", (id,), one=True)
    if not student:
        return jsonify({'success': False, 'message': 'Student not found.'}), 404

    data = request.get_json() or {}
    student_id = data.get('student_id', '').strip()
    name = data.get('name', '').strip()
    college = data.get('college', '').strip()
    department = data.get('department', '').strip()
    year = data.get('year', '').strip()
    email = data.get('email', '').strip()
    phone = data.get('phone', '').strip()

    if not student_id or not name or not college or not department or not year or not email or not phone:
        return jsonify({'success': False, 'message': 'All fields are required.'}), 400

    if not EMAIL_REGEX.match(email):
        return jsonify({'success': False, 'message': 'Please provide a valid email address.'}), 400

    clean_phone = phone.replace(' ', '').replace('-', '')
    if not PHONE_REGEX.match(clean_phone):
        return jsonify({'success': False, 'message': 'Please provide a valid phone number (7-15 digits).'}), 400

    # Ensure uniqueness of student_id
    duplicate = query_db("SELECT id FROM students WHERE student_id = %s AND id != %s", (student_id, id), one=True)
    if duplicate:
        return jsonify({'success': False, 'message': f"Student ID '{student_id}' is already used by another student."}), 409

    execute_db("""
        UPDATE students 
        SET student_id = %s, name = %s, college = %s, department = %s, year = %s, email = %s, phone = %s
        WHERE id = %s
    """, (student_id, name, college, department, year, email, phone, id))

    updated_student = query_db("SELECT * FROM students WHERE id = %s", (id,), one=True)
    return jsonify({'success': True, 'message': 'Student updated successfully.', 'student': updated_student}), 200

@student_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_student(id):
    student = query_db("SELECT id, name FROM students WHERE id = %s", (id,), one=True)
    if not student:
        return jsonify({'success': False, 'message': 'Student not found.'}), 404

    execute_db("DELETE FROM students WHERE id = %s", (id,))
    return jsonify({'success': True, 'message': f"Student '{student['name']}' deleted successfully."}), 200

@student_bp.route('/departments', methods=['GET'])
@jwt_required()
def get_departments():
    depts = query_db("SELECT DISTINCT department FROM students WHERE department IS NOT NULL AND department != '' ORDER BY department ASC")
    return jsonify({'success': True, 'departments': [d['department'] for d in depts]}), 200

@student_bp.route('/years', methods=['GET'])
@jwt_required()
def get_years():
    years = query_db("SELECT DISTINCT year FROM students WHERE year IS NOT NULL AND year != '' ORDER BY year ASC")
    return jsonify({'success': True, 'years': [y['year'] for y in years]}), 200
