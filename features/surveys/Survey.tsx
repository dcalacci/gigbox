import React, { useRef, useEffect, useState } from 'react';
import { Pressable, Text, View, TextInput } from 'react-native';
import Slider from '@react-native-community/slider';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import moment from 'moment';
import { tailwind } from 'tailwind';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Ionicons } from '@expo/vector-icons';
import { fetchAvailableSurveys, submitSurveyAnswers } from './api';
import { Survey, Question } from '../../types';
import Ellipsis from '../../components/Ellipsis';
import { log } from '../../utils';
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
        <View style={[tailwind('flex-col rounded-xl'), { overflow: 'hidden' }]}>
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

const TextQuestion = ({ q, onSubmit }: { q: Question; onSubmit: (text: string) => void }) => {
    const [value, setValue] = useState<string>('');
    return (
        <View style={[tailwind('flex-col pt-2'), { overflow: 'hidden' }]}>
            <Text style={tailwind('text-xl font-bold p-2')}>{q.questionText}</Text>
            <TextInput
                style={[tailwind('items-center py-2 px-2 rounded-md border h-16')]}
                value={value}
                returnKeyType="done"
                onChangeText={(val) => {
                    setValue(val)
                    onSubmit(val)
                }}
                onSubmitEditing={() => {
                    onSubmit(value);
                }}
            ></TextInput>
        </View>
    );
};

const NumberQuestion = ({ q, onSubmit }: { q: Question; onSubmit: (n: string) => void }) => {
    const [value, setValue] = useState<string>('');
    return (
        <View style={[tailwind('flex-col pt-2'), { overflow: 'hidden' }]}>
            <Text style={tailwind('text-xl font-bold p-2')}>{q.questionText}</Text>
            <TextInput
                style={[tailwind('py-2 px-2 rounded-md border h-16')]}
                value={value}
                keyboardType="numeric"
                returnKeyType="done"
                onChangeText={(val) => {
                    setValue(val)
                    onSubmit(val)
                }}
                onSubmitEditing={() => {
                    onSubmit(value);
                }}
                onSubmit
            ></TextInput>
        </View>
    );
};

const RangeQuestion = ({ q, onSubmit }: { q: Question; onSubmit: (n: number) => void }) => {
    const [value, setValue] = useState<string>(50);
    console.log('q', q);
    let suffix = '';
    if (q.rangeOptions?.unit == 'percent') {
        suffix = '%';
    }
    return (
        <View style={[tailwind('flex-col pt-2'), { overflow: 'hidden' }]}>
            <Text style={tailwind('text-xl font-bold p-2')}>{q.questionText}</Text>
            <View style={tailwind('flex-col')}>
                <Slider
                    minimumValue={q.rangeOptions?.startVal}
                    maximumValue={q.rangeOptions?.endVal}
                    step={q.rangeOptions?.interval}
                    value={value}
                    onValueChange={setValue}
                    onSlidingComplete={(val) => onSubmit(val)}
                />
                <View style={tailwind('flex-row justify-between')}>
                    <Text>{q.rangeOptions?.startVal}{suffix}</Text>
                    <Text>{value.toFixed(0)}{suffix}</Text>
                    <Text>{q.rangeOptions?.endVal}{suffix}</Text>
                </View>
            </View>
        </View>
    );
};

const SurveyItem = ({ survey, navigation }: { survey: Survey; navigation: any }) => {
    const [questionAnswers, setQuestionAnswers] = useState(Object);
    const [surveyDone, setSurveyDone] = useState<boolean>(false);
    const queryClient = useQueryClient();
    const submitSurvey = useMutation(submitSurveyAnswers, {
        //TODO: submit not working for text/number fields, it seems
        onSuccess: (d) => {
            console.log('Submitted survey!', d);
            queryClient.invalidateQueries(['surveys']);
            navigation.navigate('TabOneScreen');
        },
    });
    useEffect(() => {
        console.log("survey:", survey)
        const answeredKeys = Object.keys(questionAnswers);
        const questionIds = survey.questions.edges.map(({ node }) => node.id);
        const nQuestionsAnswered = questionIds.filter((id) => answeredKeys.includes(id)).length;
        console.log('nquestions:', nQuestionsAnswered, questionIds.length)
        console.log(questionAnswers)
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
                } else if (node.questionType == 'TEXT') {
                    let key = node.id;
                    return (
                        <TextQuestion
                            key={node.id}
                            q={node}
                            onSubmit={(text: string) => {
                                let key = node.id;
                                setQuestionAnswers({ ...questionAnswers, [key]: text });
                            }}
                        ></TextQuestion>
                    );
                } else if (node.questionType == 'NUMBER') {
                    let key = node.id;
                    return (
                        <NumberQuestion
                            key={node.id}
                            q={node}
                            onSubmit={(n: string) => {
                                let key = node.id;
                                setQuestionAnswers({ ...questionAnswers, [key]: n });
                            }}
                        ></NumberQuestion>
                    );
                } else if (node.questionType == 'RANGE') {
                    let key = node.id;
                    console.log('node:', node);
                    return (
                        <RangeQuestion
                            key={node.id}
                            q={node}
                            onSubmit={(n: number) => {
                                let key = node.id;
                                setQuestionAnswers({ ...questionAnswers, [key]: n });
                            }}
                        ></RangeQuestion>
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
                <SurveyItem
                    survey={s.node}
                    navigation={route.params?.navigation}
                    key={s.node.title}
                />
            ))}
        </KeyboardAwareScrollView>
    );
};
