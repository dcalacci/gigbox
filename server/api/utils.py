from werkzeug.utils import secure_filename
import random
import string


def randstr():
    '''Creates a random string of alphanumeric characters.'''
    return ''.join(random.choice(string.ascii_uppercase + string.digits)
                   for _ in range(30))


def generate_filename(text):
    safefilename = secure_filename(f'${randstr()}-${text}.png')
    return safefilename


def get_or_create(session, model, **kwargs):
    '''Gets or creates a model if it does not exist. Queries by any keyword arguments. Returns first match.'''
    instance = session.query(model).filter_by(**kwargs).first()
    if instance:
        return (instance, False)
    else:
        instance = model(**kwargs)
        session.add(instance)
        session.commit()
        return (instance, True)
