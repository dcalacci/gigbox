from datetime import datetime
from dateutil import parser
from api.models import Survey, Question, Answer, RangeOptions, QuestionTypeEnum

def initialize_survey_data(db):
    print("Creating survey question data...")

    survey1 = Survey()
    survey1.start_date = parser.parse("05/21/21")
    survey1.title = "Demographic survey"


    question1 = Question()
    question1.question_text = "This is a test question?"
    question1.question_type = QuestionTypeEnum.TEXT

    question2 = Question()
    question2.question_text = "This is a test selection question?"
    question2.question_type = QuestionTypeEnum.SELECT
    question2.select_options = ["Option 1", "Option 2"]

    survey1.questions = [question1, question2]

    db.session.add(survey1)
    db.session.commit()