from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from database import query_db, execute_db

event_bp = Blueprint('events', __name__, url_prefix='/api/events')

@event_bp.route('', methods=['GET'])
@jwt_required()
def list_events():
    events = query_db("SELECT * FROM events ORDER BY event_date DESC, id DESC")
    return jsonify({'success': True, 'events': events}), 200

@event_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_event(id):
    event = query_db("SELECT * FROM events WHERE id = %s", (id,), one=True)
    if not event:
        return jsonify({'success': False, 'message': 'Event not found.'}), 404
    return jsonify({'success': True, 'event': event}), 200

@event_bp.route('', methods=['POST'])
@jwt_required()
def create_event():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    event_date = data.get('event_date', '').strip()
    description = data.get('description', '').strip()
    issuing_authority = data.get('issuing_authority', '').strip()

    if not name or not event_date or not issuing_authority:
        return jsonify({'success': False, 'message': 'Name, event date, and issuing authority are required.'}), 400

    new_id = execute_db("""
        INSERT INTO events (name, event_date, description, issuing_authority)
        VALUES (%s, %s, %s, %s)
    """, (name, event_date, description, issuing_authority), return_id=True)

    event = query_db("SELECT * FROM events WHERE id = %s", (new_id,), one=True)
    return jsonify({'success': True, 'message': 'Event created successfully.', 'event': event}), 201

@event_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_event(id):
    event = query_db("SELECT id FROM events WHERE id = %s", (id,), one=True)
    if not event:
        return jsonify({'success': False, 'message': 'Event not found.'}), 404

    data = request.get_json() or {}
    name = data.get('name', '').strip()
    event_date = data.get('event_date', '').strip()
    description = data.get('description', '').strip()
    issuing_authority = data.get('issuing_authority', '').strip()

    if not name or not event_date or not issuing_authority:
        return jsonify({'success': False, 'message': 'Name, event date, and issuing authority are required.'}), 400

    execute_db("""
        UPDATE events
        SET name = %s, event_date = %s, description = %s, issuing_authority = %s
        WHERE id = %s
    """, (name, event_date, description, issuing_authority, id))

    updated_event = query_db("SELECT * FROM events WHERE id = %s", (id,), one=True)
    return jsonify({'success': True, 'message': 'Event updated successfully.', 'event': updated_event}), 200

@event_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_event(id):
    event = query_db("SELECT id, name FROM events WHERE id = %s", (id,), one=True)
    if not event:
        return jsonify({'success': False, 'message': 'Event not found.'}), 404

    execute_db("DELETE FROM events WHERE id = %s", (id,))
    return jsonify({'success': True, 'message': f"Event '{event['name']}' deleted successfully."}), 200
