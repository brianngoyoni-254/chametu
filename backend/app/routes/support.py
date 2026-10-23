from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from app import db
from app.models.support import Ticket, TicketMessage
from app.models.user import User
from datetime import datetime

support_bp = Blueprint('support', __name__)

@support_bp.route('/', methods=['GET'])
@jwt_required()
def get_tickets():
    cid = get_jwt().get('chama_id')
    tickets = Ticket.query.filter_by(chama_id=cid).order_by(Ticket.updated_at.desc()).all()
    return jsonify([{
        "id": t.id,
        "subject": t.subject,
        "description": t.description,
        "requester": t.user.name if t.user else 'Unknown',
        "category": t.category,
        "priority": t.priority,
        "status": t.status,
        "createdAt": t.created_at.isoformat(),
        "updatedAt": t.updated_at.isoformat(),
        "messages": [{
            "id": m.id,
            "author": m.author_name,
            "role": m.role,
            "body": m.body,
            "internal": m.internal,
            "at": m.created_at.isoformat()
        } for m in t.messages]
    } for t in tickets]), 200

@support_bp.route('/', methods=['POST'])
@jwt_required()
def create_ticket():
    cid = get_jwt().get('chama_id')
    uid = get_jwt_identity()
    data = request.get_json()
    
    new_ticket = Ticket(
        chama_id=cid,
        user_id=uid,
        subject=data['subject'],
        description=data['description'],
        category=data.get('category', 'technical'),
        priority=data.get('priority', 'normal'),
        status='open'
    )
    db.session.add(new_ticket)
    db.session.flush()

    first_msg = TicketMessage(
        ticket_id=new_ticket.id,
        author_name=data['requesterName'],
        role='requester',
        body=data['description'],
        internal=False
    )
    db.session.add(first_msg)
    db.session.commit()

    return jsonify({"message": "Ticket created", "ticket_id": new_ticket.id}), 201

@support_bp.route('/<ticket_id>/status', methods=['PATCH'])
@jwt_required()
def update_ticket_status(ticket_id):
    ticket = Ticket.query.filter_by(id=ticket_id, chama_id=get_jwt().get('chama_id')).first()
    if not ticket: return jsonify({"message": "Not found"}), 404
    
    ticket.status = request.get_json().get('status')
    db.session.commit()
    return jsonify({"message": "Status updated"}), 200

@support_bp.route('/<ticket_id>/messages', methods=['POST'])
@jwt_required()
def add_message(ticket_id):
    ticket = Ticket.query.filter_by(id=ticket_id, chama_id=get_jwt().get('chama_id')).first()
    if not ticket: return jsonify({"message": "Not found"}), 404
    
    data = request.get_json()
    msg = TicketMessage(
        ticket_id=ticket.id,
        author_name=data['author'],
        role=data['role'],
        body=data['body'],
        internal=data.get('internal', False)
    )
    ticket.updated_at = datetime.utcnow()
    db.session.add(msg)
    db.session.commit()
    return jsonify({"message": "Message added"}), 201