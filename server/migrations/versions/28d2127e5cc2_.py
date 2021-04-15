"""empty message

Revision ID: 28d2127e5cc2
Revises: 2d6a1e017a9c
Create Date: 2021-04-15 15:15:53.293381

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '28d2127e5cc2'
down_revision = '2d6a1e017a9c'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('screenshots', sa.Column('employer', sa.Enum('DOORDASH', 'INSTACART', 'SHIPT', 'GRUBHUB', 'UBEREATS', name='employernames'), nullable=True))
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('screenshots', 'employer')
    # ### end Alembic commands ###
