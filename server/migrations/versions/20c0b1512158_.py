"""empty message

Revision ID: 20c0b1512158
Revises: 80ac07ace056
Create Date: 2021-04-07 10:33:00.859489

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20c0b1512158'
down_revision = '80ac07ace056'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('employers', sa.Column('shift_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key(None, 'employers', 'shifts', ['shift_id'], ['id'])
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint(None, 'employers', type_='foreignkey')
    op.drop_column('employers', 'shift_id')
    # ### end Alembic commands ###
