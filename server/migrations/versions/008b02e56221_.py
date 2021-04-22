"""empty message

Revision ID: 008b02e56221
Revises: d2e20140e08f
Create Date: 2021-04-16 15:44:27.361953

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '008b02e56221'
down_revision = 'd2e20140e08f'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint('locations_shift_id_fkey', 'locations', type_='foreignkey')
    op.create_foreign_key(None, 'locations', 'shifts', ['shift_id'], ['id'], ondelete='CASCADE')
    op.drop_constraint('shifts_user_id_fkey', 'shifts', type_='foreignkey')
    op.create_foreign_key(None, 'shifts', 'users', ['user_id'], ['id'], ondelete='CASCADE')
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint(None, 'shifts', type_='foreignkey')
    op.create_foreign_key('shifts_user_id_fkey', 'shifts', 'users', ['user_id'], ['id'])
    op.drop_constraint(None, 'locations', type_='foreignkey')
    op.create_foreign_key('locations_shift_id_fkey', 'locations', 'shifts', ['shift_id'], ['id'])
    # ### end Alembic commands ###