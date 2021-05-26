import { request, gql } from 'graphql-request';
import { log, getClient } from '../../utils';
import { QuestionType } from '../../types';
import { store } from '../../store/store';

export const submitSurveyAnswers = ({
    surveyId,
    surveyResponses,
}: {
    surveyId: string;
    surveyResponses: {
        questionId: string;
        questionType: QuestionType;
        value: string | string[] | number | boolean;
    }[];
}) => {
    const client = getClient(store);

    const responsesToSubmit = surveyResponses.map(({ questionId, questionType, value }) => {
        if (questionType == QuestionType.TEXT) {
            return {
                questionId,
                textValue: value,
            };
        } else if (
            questionType == QuestionType.MULTISELECT ||
            questionType == QuestionType.SELECT
        ) {
            return {
                questionId,
                selectValue: value,
            };
        } else if (questionType == QuestionType.RANGE) {
            return {
                questionId,
                numericValue: value,
            };
        } else if (questionType == QuestionType.CHECKBOX) {
            return {
                questionId,
                ynValue: value,
            };
        }
    });

    const mutation = gql`
        mutation mutation($surveyId: ID!, $surveyResponses: [AnswerInput]!) {
            submitSurvey(surveyId: $surveyId, surveyResponses: $surveyResponses) {
                ok
            }
        }
    `;
    return client.request(mutation, {
        surveyId,
        surveyResponses: responsesToSubmit,
    });
};

export const fetchAvailableSurveys = () => {
    const client = getClient(store);
    const query = gql`
        query {
            allSurveys {
                edges {
                    node {
                        title
                        id
                        startDate
                        endDate
                        questions {
                            edges {
                                node {
                                    questionText
                                    id
                                    questionType
                                    selectOptions
                                    rangeOptions {
                                        startVal
                                        endVal
                                        increment
                                    }
                                    answers {
                                        edges {
                                            node {
                                                date
                                                answerText
                                                answerNumeric
                                                answerOptions
                                                answerYn
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    `;

    return client.request(query);
};
