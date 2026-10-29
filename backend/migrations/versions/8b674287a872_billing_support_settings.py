"""add billing, support fields and platform settings

Revision ID: 8b674287a872
Revises: 4bdefb64910f
Create Date: 2026-10-29

Replaces the three broken migrations that referenced each other's parents
in a cycle. Adds everything the current models expect on top of 4bdefb64910f:
  - chamas.is_blocked, chamas.blocked_at
  - tickets.assignee, tickets.tags, tickets.sla_response_due, tickets.sla_resolve_due
  - platform_settings table
All operations are guarded so this migration is re-runnable and tolerates
partially-applied state from earlier failed upgrades.
"""
from alembic import op
import sqlalchemy as sa


revision = '8b674287a872'
down_revision = '4bdefb64910f'
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()

    # ---------- chamas ----------
    cols = {c[1] for c in bind.execute(sa.text("PRAGMA table_info(chamas)")).fetchall()}
    if 'is_blocked' not in cols:
        op.add_column(
            'chamas',
            sa.Column('is_blocked', sa.Boolean(), nullable=False, server_default=sa.text('0'))
        )
    if 'blocked_at' not in cols:
        op.add_column('chamas', sa.Column('blocked_at', sa.DateTime(), nullable=True))

    # ---------- tickets ----------
    cols = {c[1] for c in bind.execute(sa.text("PRAGMA table_info(tickets)")).fetchall()}
    if 'assignee' not in cols:
        op.add_column('tickets', sa.Column('assignee', sa.String(100), nullable=True))
    if 'tags' not in cols:
        op.add_column('tickets', sa.Column('tags', sa.JSON(), nullable=True))
    if 'sla_response_due' not in cols:
        op.add_column('tickets', sa.Column('sla_response_due', sa.DateTime(), nullable=True))
    if 'sla_resolve_due' not in cols:
        op.add_column('tickets', sa.Column('sla_resolve_due', sa.DateTime(), nullable=True))

    # ---------- platform_settings ----------
    tables = {row[0] for row in bind.execute(
        sa.text("SELECT name FROM sqlite_master WHERE type='table'")
    ).fetchall()}
    if 'platform_settings' not in tables:
        op.create_table(
            'platform_settings',
            sa.Column('id', sa.String(36), primary_key=True),
            sa.Column('platform_name', sa.String(100), nullable=False, server_default='Chametu'),
            sa.Column('support_email', sa.String(120), nullable=False, server_default='support@chametu.co.ke'),
            sa.Column('timezone', sa.String(50), nullable=False, server_default='Africa/Nairobi'),
            sa.Column('paybill', sa.String(20), nullable=False, server_default='400200'),
            sa.Column('account_ref', sa.String(50), nullable=False, server_default='CHAMETU'),
            sa.Column('grace_period', sa.Integer, nullable=False, server_default='7'),
            sa.Column('auto_block_days', sa.Integer, nullable=False, server_default='14'),
            sa.Column('prices', sa.JSON(), nullable=True),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
        )


def downgrade():
    op.drop_table('platform_settings')
    op.drop_column('tickets', 'sla_resolve_due')
    op.drop_column('tickets', 'sla_response_due')
    op.drop_column('tickets', 'tags')
    op.drop_column('tickets', 'assignee')
    op.drop_column('chamas', 'blocked_at')
    op.drop_column('chamas', 'is_blocked')
