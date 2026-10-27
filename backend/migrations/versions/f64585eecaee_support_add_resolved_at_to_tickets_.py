"""support: add resolved_at to tickets, author_user_id to messages

Revision ID: f64585eecaee
Revises: 3926fa03ff7e
Create Date: 2026-10-27

SQLite note: batch_alter_table(recreate='always') rebuilds the table so the
new FK can be added without an unnamed drop_constraint directive.
"""
from alembic import op
import sqlalchemy as sa


revision = 'f64585eecaee'
down_revision = '3926fa03ff7e'
branch_labels = None
depends_on = None


def upgrade():
    # --- tickets.resolved_at (simple add) ---
    with op.batch_alter_table('tickets', schema=None) as batch_op:
        batch_op.add_column(sa.Column('resolved_at', sa.DateTime(), nullable=True))

    # --- ticket_messages.author_user_id (adds FK → rebuild table) ---
    with op.batch_alter_table(
        'ticket_messages',
        schema=None,
        recreate='always',
    ) as batch_op:
        batch_op.add_column(
            sa.Column('author_user_id', sa.String(36), nullable=True)
        )
        batch_op.create_foreign_key(
            'fk_ticket_messages_author_user_id',
            'users',
            ['author_user_id'],
            ['id'],
        )


def downgrade():
    with op.batch_alter_table('ticket_messages', schema=None, recreate='always') as batch_op:
        batch_op.drop_constraint(
            'fk_ticket_messages_author_user_id', type_='foreignkey'
        )
        batch_op.drop_column('author_user_id')

    with op.batch_alter_table('tickets', schema=None) as batch_op:
        batch_op.drop_column('resolved_at')
