"""add contribution payment method fields to chama_settings

Revision ID: df75baf137b9
Revises: 0e705e1c4bc2
Create Date: 2026-11-11 07:53:46.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'df75baf137b9'
down_revision = '0e705e1c4bc2'
branch_labels = None
depends_on = None


def upgrade():
    # Add columns WITH server_default so existing rows are backfilled
    with op.batch_alter_table('chama_settings', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('contribution_method', sa.String(length=20),
                      nullable=False, server_default='paybill')
        )
        batch_op.add_column(
            sa.Column('contribution_number', sa.String(length=20),
                      nullable=False, server_default='')
        )
        batch_op.add_column(
            sa.Column('contribution_account_ref', sa.String(length=50),
                      nullable=False, server_default='')
        )

    # Optional: drop the server_default afterwards so future inserts must
    # explicitly provide a value (matches the SQLAlchemy model definition).
    with op.batch_alter_table('chama_settings', schema=None) as batch_op:
        batch_op.alter_column('contribution_method', server_default=None)
        batch_op.alter_column('contribution_number', server_default=None)
        batch_op.alter_column('contribution_account_ref', server_default=None)


def downgrade():
    with op.batch_alter_table('chama_settings', schema=None) as batch_op:
        batch_op.drop_column('contribution_account_ref')
        batch_op.drop_column('contribution_number')
        batch_op.drop_column('contribution_method')