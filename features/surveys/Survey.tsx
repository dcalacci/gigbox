import React, { useRef, useEffect, useState } from 'react';
import { Pressable, Text, View, SafeAreaView } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import moment from 'moment';
import { tailwind } from 'tailwind';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Ionicons } from '@expo/vector-icons';
import { fetchAvailableSurveys, submitSurveyAnswers } from './api';
import { Survey, Question } from '../../types';

import Ellipsis from '../../components/Ellipsis'

import * as Haptics from 'expo-haptics';
import { Picker } from '@react-native-picker/picker';
import MultiSelect from 'react-native-multiple-select';

const SelectQuestion = ({
    q,
    value,
    onSelect,
}: {
    q: Question;
    value: string | string[];
    onSelect: (selected: string | string[]) => void;
}) => {
    const multiSelect = q.questionType === 'MULTISELECT';
    const msRef = useRef();
    const items = q.selectOptions?.map((s) => ({ name: s, id: s }));
    return (
        <View style={tailwind('flex-col rounded-xl')}>
            <Text style={tailwind('text-xl font-bold p-2')}>{q.questionText}</Text>
            <MultiSelect
                items={items}
                textInputProps={{ autoFocus: false }}
                uniqueKey={'id'}
                fontSize={18}
                itemFontSize={24}
                ref={msRef}
                hideSearch={true}
                submitButtonColor={'#2BBC8A'}
                selectedItemIconColor={'#2BBC8A'}
                selectedItemTextColor={'#2BBC8A'}
                tagBorderColor={'#2BBC8A'}
                tagTextColor={'black'}
                tagRemoveIconColor={'#2ba6bc'}
                single={!multiSelect}
                selectedItems={value}
                onSelectedItemsChange={(items) => {
                    onSelect(items);
                }}
            />
        </View>
    );
};

const SurveyItem = ({ survey, navigation }: { survey: Survey }) => {
    const [questionAnswers, setQuestionAnswers] = useState(Object);
    const [surveyDone, setSurveyDone] = useState<boolean>(false);
    const queryClient = useQueryClient();
    const submitSurvey = useMutation(submitSurveyAnswers, {
        onSuccess: (d) => {
            console.log('Submitted survey!', d);
            queryClient.invalidateQueries(['surveys']);
            navigation.navigate('TabOneScreen')
        },
    });
    useEffect(() => {
        const answeredKeys = Object.keys(questionAnswers);
        const questionIds = survey.questions.edges.map(({ node }) => node.id);
        const nQuestionsAnswered = questionIds.filter((id) => answeredKeys.includes(id)).length;
        setSurveyDone(nQuestionsAnswered === questionIds.length);
    }, [questionAnswers]);
    return (
        <View style={tailwind('flex-1 flex-col m-2 p-5 rounded-xl bg-white')}>
            <Text style={tailwind('text-2xl font-bold')}>{survey.title}</Text>
            {survey.questions.edges.map(({ node }) => {
                if (node.questionType == 'SELECT' || node.questionType == 'MULTISELECT') {
                    let key = node.id;
                    return (
                        <SelectQuestion
                            key={node.id}
                            q={node}
                            value={questionAnswers[key]}
                            onSelect={(val) => {
                                let key = node.id;
                                setQuestionAnswers({ ...questionAnswers, [key]: val });
                            }}
                        ></SelectQuestion>
                    );
                } else {
                    return <Text>{node.questionText}</Text>;
                }
            })}
            <Pressable
                style={[
                    tailwind('rounded-lg p-5 m-2'),
                    !surveyDone ? tailwind('bg-gray-400') : tailwind('bg-green-500'),
                ]}
                disabled={!surveyDone}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    const surveyResponses = Object.keys(questionAnswers).map((k) => {
                        const questionType = survey.questions.edges.filter(
                            ({ node }) => node.id == k
                        )[0].node.questionType;
                        return {
                            questionId: k,
                            questionType,
                            value: questionAnswers[k],
                        };
                    });
                    submitSurvey.mutate({
                        surveyId: survey.id,
                        surveyResponses,
                    });
                    //TODO: send value to server, wait until we get a response back, and continue
                }}
            >
                {submitSurvey.isLoading ? (
                    <Ellipsis style={tailwind('text-lg self-center')} />
                ) : (
                    <Text style={tailwind('font-bold text-white text-xl text-center')}>
                        {!surveyDone ? `Finish the survey to submit!` : `Submit Survey`}
                    </Text>
                )}
            </Pressable>
        </View>
    );
};

export const SurveyForm = ({ route }) => {
    const surveys = route.params?.surveys as { node: Survey }[];
    return (
        <KeyboardAwareScrollView style={tailwind('flex-1 flex-col m-2 p-2')}>
            {surveys.map((s) => (
                <SurveyItem survey={s.node} navigation={route.params?.navigation} key={s.node.title} />
            ))}
        </KeyboardAwareScrollView>
    );
};
