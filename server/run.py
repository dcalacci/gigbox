from flask_migrate import Migrate, MigrateCommand
from flask_script import Manager
from flask_script import Server, Manager
from api import create_app, db
from termcolor import cprint

app = create_app('development')
manager = Manager(app)


# app.config.from_object(os.environ['APP_SETTINGS'])

migrate = Migrate(app, db)
manager = Manager(app)

manager.add_command('db', MigrateCommand)
manager.add_command('runserver', Server(
    host='0.0.0.0', port=5000, use_debugger=True))

if __name__ == '__main__':
    manager.run()
