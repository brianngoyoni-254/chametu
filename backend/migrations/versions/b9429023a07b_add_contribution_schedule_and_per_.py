"""add contribution schedule and per-member override

Revision ID: b9429023a07b
Revises: 0e14ff4ad770
Create Date: 2026-10-23 17:18:58.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b9429023a07b'
down_revision = '0e14ff4ad770'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('chamas', schema=None) as batch_op:
        batch_op.add_column(sa.Column(
            'contribution_frequency', sa.String(length=20),
            nullable=False, server_default='monthly',
        ))
        batch_op.add_column(sa.Column(
            'due_weekday', sa.Integer(),
            nullable=False, server_default='1',
        ))

    with op.batch_alter_table('members', schema=None) as batch_op:
        batch_op.add_column(sa.Column(
            'contribution_override', sa.Float(),
            nullable=True,
        ))


def downgrade():
    with op.batch_alter_table('members', schema=None) as batch_op:
        batch_op.drop_column('contribution_override')
    with op.batch_alter_table('chamas', schema=None) as batch_op:
        batch_op.drop_column('due_weekday')
        batch_op.drop_column('contribution_frequency')