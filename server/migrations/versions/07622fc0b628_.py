"""empty message

Revision ID: 07622fc0b628
Revises: 070178ec12d8
Create Date: 2021-05-14 19:25:31.300300

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '07622fc0b628'
down_revision = '070178ec12d8'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index('ix_consent_id', table_name='consent')
    op.drop_column('consent', 'id')
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('consent', sa.Column('id', sa.VARCHAR(), autoincrement=False, nullable=False))
    op.create_index('ix_consent_id', 'consent', ['id'], unique=True)
    # ### end Alembic commands ###
