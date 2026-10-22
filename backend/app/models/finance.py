from app import db
from datetime import datetime
import uuid

class Transaction(db.Model):
    __tablename__ = 'transactions'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    chama_id = db.Column(db.String(36), db.ForeignKey('chamas.id'), nullable=False)
    member_id = db.Column(db.String(36), db.ForeignKey('members.id'), nullable=True)
    
    amount = db.Column(db.Float, nullable=False)
    type = db.Column(db.String(50), nullable=False) # contribution, loan_disbursement, etc.
    status = db.Column(db.String(20), default='completed')
    reference = db.Column(db.String(100), nullable=True) # M-Pesa Code
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Loan(db.Model):
    __tablename__ = 'loans'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    chama_id = db.Column(db.String(36), db.ForeignKey('chamas.id'), nullable=False)
    member_id = db.Column(db.String(36), db.ForeignKey('members.id'), nullable=False)
    
    amount = db.Column(db.Float, nullable=False)
    balance = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='pending') # pending, approved, disbursed, repaid, rejected
    purpose = db.Column(db.String(255), nullable=True) # <-- ADDED THIS
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Invoice(db.Model):
    __tablename__ = 'invoices'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    chama_id = db.Column(db.String(36), db.ForeignKey('chamas.id'), nullable=False)
    
    amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='unpaid') # paid, unpaid, overdue
    due_date = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)