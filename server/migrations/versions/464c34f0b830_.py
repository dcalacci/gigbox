"""empty message

Revision ID: 464c34f0b830
Revises: 019ba528137a
Create Date: 2021-03-31 16:31:27.108716

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '464c34f0b830'
down_revision = '019ba528137a'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint('users_user_id_key', 'users', type_='unique')
    op.create_index(op.f('ix_users_user_id'), 'users', ['user_id'], unique=True)
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_users_user_id'), table_name='users')
    op.create_unique_constraint('users_user_id_key', 'users', ['user_id'])
    # ### end Alembic commands ###
