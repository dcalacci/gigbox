from flask_script import Server, Manager
import inspect
import importlib
from rethinkdb import RethinkDB
from api import create_app
from termcolor import cprint

app = create_app('development')
manager = Manager(app)
manager.add_command('runserver', Server(host='0.0.0.0', port=5000))

r = RethinkDB()


@manager.command
def migrate():
    try:
        db_name = app.config['DATABASE_NAME']
        conn = r.connect(db=db_name)
        # Create the application tables if they do not exist
        lib = importlib.import_module('api.models')
        for cls in inspect.getmembers(lib, inspect.isclass):
            for base in cls[1].__bases__:
                if base.__name__ == "RethinkDBModel":
                    table_name = getattr(cls[1], '_table')
                    index_name = getattr(cls[1], '_index')
                    r.db(db_name).table_create(table_name).run(conn)
                    r.db(db_name).table(table_name).index_create(index_name)
                    print("Created table '{}'...".format(table_name))
        print("Running RethinkDB migration command")
    except Exception as e:
        cprint("An error occured --> {}".format(e.message),
               'red', attrs=['bold'])


if __name__ == '__main__':
    manager.run()
