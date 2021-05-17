"""empty message

Revision ID: 1b5dc18dc6f7
Revises: 8370bf03b272
Create Date: 2021-05-10 19:11:12.566347

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '1b5dc18dc6f7'
down_revision = '8370bf03b272'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('consent',
    sa.Column('id', sa.String(), nullable=False),
    sa.Column('user_id', sa.String(), nullable=True),
    sa.Column('date_modified', sa.DateTime(), nullable=True),
    sa.Column('date_created', sa.DateTime(), nullable=True),
    sa.Column('location', sa.DateTime(), nullable=True),
    sa.Column('accelerometery', sa.DateTime(), nullable=True),
    sa.Column('photos', sa.DateTime(), nullable=True),
    sa.Column('data_sharing', sa.DateTime(), nullable=True),
    sa.Column('interview', sa.DateTime(), nullable=True),
    sa.Column('consent_final_agree', sa.DateTime(), nullable=True),
    sa.Column('signature_filename', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_consent_id'), 'consent', ['id'], unique=True)
    op.add_column('users', sa.Column('email', sa.String(), nullable=True))
    op.add_column('users', sa.Column('name', sa.String(), nullable=True))
    op.add_column('users', sa.Column('phone', sa.String(), nullable=True))
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('users', 'phone')
    op.drop_column('users', 'name')
    op.drop_column('users', 'email')
    op.drop_index(op.f('ix_consent_id'), table_name='consent')
    op.drop_table('consent')
    # ### end Alembic commands ###
