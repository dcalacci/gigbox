import importlib
import inspect

from termcolor import cprint


def create_tables(conn, r, DB_NAME):
    try:
        # Create the application tables if they do not exist
        lib = importlib.import_module('api.models')
        for cls in inspect.getmembers(lib, inspect.isclass):
            for base in cls[1].__bases__:
                if base.__name__ == "RethinkDBModel":
                    table_name = getattr(cls[1], '_table')
                    index_name = getattr(cls[1], '_index')
                    r.db(DB_NAME).table_create(table_name).run(conn)
                    r.db(DB_NAME).table(table_name).indexCreate(index_name)
                    cprint("Created table '{}'...".format(table_name), 'green', attrs=['bold'])
        print("Created tables for testing")
    except Exception as e:
        cprint("An error occured --> {}".format(e.message), 'red', attrs=['bold'])

