from datetime import datetime
from dateutil import parser
import json
import os
from api.models import Survey, Question, Answer, RangeOptions, QuestionTypeEnum

def initialize_survey_from_json(db, fpath="surveys.json"):
    """Initialize survey objects and dependents from a json file

    Args:
        db (SQLAlchemy object): SQLAlchemy database object
        fpath (String): Local filepath to json file to use. Defaults to "surveys.json"
    """
    CURR_DIR = os.path.dirname(os.path.realpath(__file__))
    with open(os.path.join(CURR_DIR, fpath), 'r') as f:
        surveys = json.load(f)['surveys']
    for survey in surveys:
        survey_exists = db.session.query(Survey).filter_by(title=survey['title']).first()
        if not survey_exists:
            s = Survey()
            s.start_date = parser.parse(survey['start_date'])
            s.title = survey['title']
            s.days_after_install = survey['days_after_install']

            qs = []
            for question in survey['questions']:
                q = Question()
                q.question_text = question["question_text"]
                q.question_type = question["question_type"]
                if "select_options" in question:
                    q.select_options = question['select_options']
                if "range_options" in question:
                    r = RangeOptions()
                    ro = question['range_options']
                    r.start_val = ro['start_val']
                    r.end_val = ro['end_val']
                    r.incremenet = r['increment']
                    q.range_options = r
                qs.append(q)
            s.questions = qs
            db.session.add(s)
    db.session.commit()
