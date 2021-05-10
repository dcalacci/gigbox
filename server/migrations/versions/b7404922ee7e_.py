"""empty message

Revision ID: b7404922ee7e
Revises: 0ea7363b5967
Create Date: 2021-04-24 19:58:44.732609

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'b7404922ee7e'
down_revision = '0ea7363b5967'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('trips')
    op.add_column('jobs', sa.Column('user_id', sa.String(), nullable=True))
    op.drop_index('idx_jobs_end_location', table_name='jobs')
    op.drop_index('idx_jobs_start_location', table_name='jobs')
    op.create_foreign_key(None, 'jobs', 'users', ['user_id'], ['id'], ondelete='CASCADE')
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint(None, 'jobs', type_='foreignkey')
    op.create_index('idx_jobs_start_location', 'jobs', ['start_location'], unique=False)
    op.create_index('idx_jobs_end_location', 'jobs', ['end_location'], unique=False)
    op.drop_column('jobs', 'user_id')
    op.create_table('trips',
    sa.Column('date_created', postgresql.TIMESTAMP(), autoincrement=False, nullable=True),
    sa.Column('date_modified', postgresql.TIMESTAMP(), autoincrement=False, nullable=True),
    sa.Column('id', postgresql.UUID(), autoincrement=False, nullable=False),
    sa.Column('shift_id', postgresql.UUID(), autoincrement=False, nullable=True),
    sa.Column('start_screenshot', postgresql.UUID(), autoincrement=False, nullable=True),
    sa.Column('end_screenshot', postgresql.UUID(), autoincrement=False, nullable=True),
    sa.Column('start_location', geoalchemy2.types.Geometry(geometry_type='POINT', from_text='ST_GeomFromEWKT', name='geometry'), autoincrement=False, nullable=True),
    sa.Column('end_location', geoalchemy2.types.Geometry(geometry_type='POINT', from_text='ST_GeomFromEWKT', name='geometry'), autoincrement=False, nullable=True),
    sa.Column('mileage', postgresql.DOUBLE_PRECISION(precision=53), autoincrement=False, nullable=True),
    sa.Column('total_pay', postgresql.DOUBLE_PRECISION(precision=53), autoincrement=False, nullable=True),
    sa.Column('tip', postgresql.DOUBLE_PRECISION(precision=53), autoincrement=False, nullable=True),
    sa.Column('employer', postgresql.ENUM('DOORDASH', 'INSTACART', 'SHIPT', 'GRUBHUB', 'UBEREATS', name='employernames'), autoincrement=False, nullable=True),
    sa.Column('end_time', postgresql.TIMESTAMP(), autoincrement=False, nullable=True),
    sa.Column('estimated_mileage', postgresql.DOUBLE_PRECISION(precision=53), autoincrement=False, nullable=True),
    sa.Column('start_time', postgresql.TIMESTAMP(), autoincrement=False, nullable=True),
    sa.ForeignKeyConstraint(['end_screenshot'], ['screenshots.id'], name='trips_end_screenshot_fkey'),
    sa.ForeignKeyConstraint(['shift_id'], ['shifts.id'], name='trips_shift_id_fkey', ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['start_screenshot'], ['screenshots.id'], name='trips_start_screenshot_fkey'),
    sa.PrimaryKeyConstraint('id', name='trips_pkey')
    )
    # ### end Alembic commands ###
