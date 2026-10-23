"""add monthly_profit_target to chama_settings

Revision ID: 0e14ff4ad770
Revises: 5d8343acef63
Create Date: 2026-10-23 16:45:50

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0e14ff4ad770'
down_revision = '5d8343acef63'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('chama_settings', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                'monthly_profit_target',
                sa.Float(),
                nullable=False,
                server_default='0.0',
            )
        )
        batch_op.add_column(
            sa.Column(
                'profit_target_basis',
                sa.String(length=20),
                nullable=False,
                server_default='savings',
            )
        )
        batch_op.add_column(
            sa.Column(
                'profit_target_period',
                sa.String(length=20),
                nullable=False,
                server_default='month',
            )
        )


def downgrade():
    with op.batch_alter_table('chama_settings', schema=None) as batch_op:
        batch_op.drop_column('profit_target_period')
        batch_op.drop_column('profit_target_basis')
        batch_op.drop_column('monthly_profit_target')