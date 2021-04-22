"""empty message

Revision ID: d2e20140e08f
Revises: 28d2127e5cc2
Create Date: 2021-04-15 20:57:36.372753

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd2e20140e08f'
down_revision = '28d2127e5cc2'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('shifts', sa.Column('road_snapped_miles', sa.Float(), nullable=True))
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('shifts', 'road_snapped_miles')
    # ### end Alembic commands ###