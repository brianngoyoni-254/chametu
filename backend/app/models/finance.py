# app/models/finance.py
from app import db
from datetime import datetime
import uuid


class Transaction(db.Model):
    __tablename__ = 'transactions'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    chama_id = db.Column(db.String(36), db.ForeignKey('chamas.id'), nullable=False)
    member_id = db.Column(db.String(36), db.ForeignKey('members.id'), nullable=True)

    amount = db.Column(db.Float, nullable=False)
    type = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(20), default='completed')
    reference = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Loan(db.Model):
    __tablename__ = 'loans'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    chama_id = db.Column(db.String(36), db.ForeignKey('chamas.id'), nullable=False)
    member_id = db.Column(db.String(36), db.ForeignKey('members.id'), nullable=False)

    amount = db.Column(db.Float, nullable=False)
    balance = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='pending')
    purpose = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Invoice(db.Model):
    __tablename__ = 'invoices'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    chama_id = db.Column(db.String(36), db.ForeignKey('chamas.id'), nullable=False)

    amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='unpaid')
    due_date = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class WelfareClaim(db.Model):
    __tablename__ = 'welfare_claims'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    chama_id = db.Column(db.String(36), db.ForeignKey('chamas.id'), nullable=False)
    member_id = db.Column(db.String(36), db.ForeignKey('members.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    reason = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(20), default='pending')
    note = db.Column(db.String(255), nullable=True)
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)
    reviewed_at = db.Column(db.DateTime, nullable=True)

    member = db.relationship('Member', backref='welfare_claims')


class Meeting(db.Model):
    __tablename__ = 'meetings'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    chama_id = db.Column(db.String(36), db.ForeignKey('chamas.id'), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    date = db.Column(db.String(50), nullable=False)
    time = db.Column(db.String(50), nullable=False)
    agenda = db.Column(db.String(255), nullable=True)
    location = db.Column(db.String(100), nullable=True)
    locked = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Proposal(db.Model):
    __tablename__ = 'proposals'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    chama_id = db.Column(db.String(36), db.ForeignKey('chamas.id'), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    amount = db.Column(db.String(100), nullable=True)
    closes = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class MemberVote(db.Model):
    __tablename__ = 'member_votes'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    proposal_id = db.Column(db.String(36), db.ForeignKey('proposals.id'), nullable=False)
    member_id = db.Column(db.String(36), db.ForeignKey('members.id'), nullable=False)
    choice = db.Column(db.String(10), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('proposal_id', 'member_id', name='_member_proposal_vote'),
    )


class Asset(db.Model):
    __tablename__ = 'assets'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    chama_id = db.Column(db.String(36), db.ForeignKey('chamas.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    price = db.Column(db.Float, nullable=False)
    value = db.Column(db.Float, nullable=False)
    ownership = db.Column(db.Integer, default=100)
    acquired = db.Column(db.String(50), nullable=True)


class Payout(db.Model):
    __tablename__ = 'payouts'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    chama_id = db.Column(db.String(36), db.ForeignKey('chamas.id'), nullable=False)
    member_id = db.Column(db.String(36), db.ForeignKey('members.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class PayoutOrder(db.Model):
    __tablename__ = 'payout_order'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    chama_id = db.Column(db.String(36), db.ForeignKey('chamas.id'), nullable=False)
    member_id = db.Column(db.String(36), db.ForeignKey('members.id'), nullable=False)
    position = db.Column(db.Integer, nullable=False)