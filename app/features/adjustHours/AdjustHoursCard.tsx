import React, { useEffect, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import moment, { Moment } from 'moment';
import { tailwind } from 'tailwind';
import { useSelector } from 'react-redux';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/core';
import { log } from '../../utils';
import { RootState } from '../../store/index';
import { Shift, User } from '../../types';

import Modal from 'react-native-modal';
import { CalendarList } from 'react-native-calendars';

import { getWorkingTime, useShiftsByDay, useWorkingTime } from '../../hooks/api';
import { LinearGradient } from 'expo-linear-gradient';
import { updateShiftEndTime, updateShiftStartTime } from '../clock/api';
import Toast from 'react-native-root-toast';
import DateTimeModalPicker from '../../components/DateTimeModalPicker';

interface ShiftChanges {
    startTime: Moment;
    endTime: Moment;
    shiftId: string;
}

export const EditShiftsModal = ({
    date,
    visible,
    onClose,
    onSubmit,
}: {
    date: Moment | string;
    visible: boolean;
    onClose: () => void;
    onSubmit: (s: ShiftChanges) => void;
}) => {
    const queryClient = useQueryClient();
    const updateShiftEnd = useMutation(updateShiftEndTime, {
        onSuccess: (d, v, c) => {
            log.info('Updated shift end time:', d);
        },
        onError: (err) => {
            log.error(`Problem updating shift end time: ${err.message}`);
            Toast.show(`Sorry, ${err.message}`);
        },
    });

    const updateShiftStart = useMutation(updateShiftStartTime, {
        onSuccess: (d, v, c) => {
            log.info('Updated shift start time:', d);
        },
        onError: (err) => {
            log.error(`Problem updating shift start time: ${err.message}`);
            Toast.show(`Sorry, ${err.message}`);
        },
    });

    const submitChange = async (s: ShiftChanges) => {
        if (s === undefined) {
            return;
        } else {
            updateShiftEnd
                .mutateAsync({ shiftId: s.shiftId, endTime: s.endTime.toDate() })
                .then(() =>
                    updateShiftStart.mutateAsync({
                        shiftId: s.shiftId,
                        startTime: s.startTime.toDate(),
                    })
                )
                .then(() => {
                    Toast.show('Hours changed!');
                    queryClient.invalidateQueries('stats');
                    onClose();
                })
                .catch((err) => {
                    console.log('Had a problem updating shifts:', err);
                    Toast.show('Oops! Ran into an issue. Try again?');
                });
        }
    };

    const { status, data } = useShiftsByDay(moment(date));

    console.log('Got shifts on day:', data);
    const [shiftChange, setShiftChange] = useState<ShiftChanges>();

    const ShiftItem = (shift: Shift) => {
        // const shiftLenHours = moment(shift.endTime).diff(shift.startTime, 'hours')
        const shiftLenStr = moment.duration(moment(shift.endTime).diff(shift.startTime)).humanize();
        return (
            <View style={tailwind('flex-row border-t pt-2 pb-2 w-full')} key={shift.id}>
                <View style={tailwind('flex-col')}>
                    <Text style={tailwind('text-lg')}>{shiftLenStr}</Text>
                    <View style={tailwind('flex-row items-center justify-start w-full')}>
                        <DateTimeModalPicker
                            defaultDate={
                                shiftChange?.shiftId == shift.id
                                    ? shiftChange.startTime.toDate()
                                    : moment.utc(shift.startTime).local().toDate()
                            }
                            onSetDate={
                                (date) =>
                                    setShiftChange({
                                        shiftId: shift.id,
                                        startTime: moment.utc(date).local(),
                                        endTime: moment.utc(shift.endTime).local(),
                                    })
                                // updateShiftEnd.mutate({ shiftId: shift.id, endTime: date })
                            }
                        />
                        <Text style={tailwind('text-xl')}> - </Text>
                        <DateTimeModalPicker
                            defaultDate={
                                shiftChange?.shiftId == shift.id
                                    ? shiftChange.endTime.toDate()
                                    : moment.utc(shift.endTime).local().toDate()
                            }
                            onSetDate={
                                (date) =>
                                    setShiftChange({
                                        shiftId: shift.id,
                                        startTime: moment.utc(shift.startTime).local(),
                                        endTime: moment.utc(date).local(),
                                    })
                                // updateShiftStart.mutate({ shiftId: shift.id, startTime: date })
                            }
                        />
                    </View>
                </View>
            </View>
        );
    };

    return (
        <Modal
            style={tailwind('flex-col items-center')}
            onDismiss={onClose}
            isVisible={visible}
            hasBackdrop={true}
            onBackdropPress={onClose}
            onModalWillHide={() => {}}
        >
            <View style={tailwind('w-full flex-col rounded-lg bg-white items-center p-5 h-1/2')}>
                <Text style={tailwind('text-xl font-bold mb-5 ')}>{moment(date).format('LL')}</Text>
                <ScrollView style={tailwind('flex-col flex-shrink w-full')}>
                    <View style={tailwind('flex-col')}>
                        <Text style={tailwind('text-lg font-bold')}>
                            Clocked in {data?.length} time{data?.length > 1 ? 's' : ''}
                        </Text>
                        {status == 'success' && data.map(ShiftItem)}
                    </View>
                </ScrollView>
            </View>
            {updateShiftEnd.status == 'loading' || updateShiftStart.status == 'loading' ? (
                <View style={tailwind('bg-black rounded-lg p-5 m-2 w-full items-center')}>
                    <Text style={tailwind('text-white font-bold')}>Submitting...</Text>
                </View>
            ) : (
                <Pressable
                    style={tailwind('bg-black rounded-lg p-5 m-2 w-full items-center')}
                    onPress={() => {
                        if (shiftChange) {
                            submitChange(shiftChange);
                        } else {
                            onClose();
                        }
                    }}
                >
                    <Text style={tailwind('text-white font-bold')}>Done</Text>
                </Pressable>
            )}
        </Modal>
    );
};

export const ClockedInCalendar = ({ width }: { width: number }) => {
    const [dates, setDates] = useState<{ startDate: Moment | null; endDate: Moment | null }>({
        startDate: null,
        endDate: moment(),
    });
    // if there are no unanswered surveys, don't show anything.

    const { status, data } = useWorkingTime(dates.startDate, dates.endDate);

    const opacityScale = (hrs: number) => {
        const hours = data.shiftHoursDaily
            .map((h: { date: Date; hrs: number }) => h.hrs)
            .filter((h: number) => h > 0);
        const minHours = Math.min(...hours);
        const maxHours = Math.max(...hours);
        const pct = (hrs - minHours) / (maxHours - minHours);
        return 0.3 + 0.7 * pct;
    };

    const calendarData =
        (status == 'success' &&
            Object.fromEntries(
                data.shiftHoursDaily.map((day: { date: Date; hrs: number }) => {
                    return [
                        moment(day.date).format('YYYY-MM-DD'),
                        {
                            customStyles: {
                                container: {
                                    backgroundColor:
                                        day.hrs > 8
                                            ? '#f25c5a'
                                            : `rgba(0,0,0,${opacityScale(day.hrs).toFixed(2)})`,
                                },
                                text: { color: day.hrs > 8 ? 'black' : 'white' },
                            },
                        },
                    ];
                })
            )) ||
        {};

    const [longShiftModalVisible, setLongShiftModalVisible] = useState<boolean>(false);
    const [selectedShift, setSelectedShift] = useState<Shift>();
    const [shiftLength, setShiftLength] = useState<number>(0);
    const [selectedDate, setSelectedDate] = useState<string>('');
    useEffect(() => {
        if (selectedShift) {
            setShiftLength(
                moment(selectedShift.endTime).diff(moment(selectedShift.startTime), 'hours')
            );
        }
    }, [selectedShift]);

    return (
        <>
            {selectedDate !== '' && (
                <EditShiftsModal
                    visible={longShiftModalVisible}
                    date={selectedDate}
                    onClose={() => setLongShiftModalVisible(false)}
                    onSubmit={(s: ShiftChanges) => {
                        console.log('changing shift:', s);
                    }}
                />
            )}
            <View style={tailwind('flex-col pb-2 pl-2 pr-2 w-full')}>
                <CalendarList
                    scrollEnabled={true}
                    calendarWidth={width}
                    onDayPress={(day) => {
                        setSelectedDate(day.dateString);
                        setLongShiftModalVisible(true);
                    }}
                    horizontal={true}
                    snapToAlignment={'center'}
                    decelerationRate={'fast'}
                    markingType={'custom'}
                    markedDates={calendarData}
                />
                {status == 'success' && (
                    <View style={tailwind('flex-col content-start items-center')}>
                        <View style={tailwind('w-full items-center flex-row content-evenly')}>
                            <Text style={tailwind('text-base pr-1')}>0 hrs</Text>
                            <LinearGradient
                                // Button Linear Gradient
                                colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,1)']}
                                end={{ x: 1, y: 1 }}
                                style={[
                                    tailwind('flex-row flex-grow rounded-xl h-2 mt-1 mb-1'),
                                    { borderRadius: 4 },
                                ]}
                            ></LinearGradient>

                            <Text style={tailwind('text-base pl-1')}>
                                {Math.max(...data.shiftHoursDaily.map((d) => d.hrs)).toFixed(0)} hrs
                            </Text>
                        </View>
                        <View style={tailwind('flex-row items-center w-full pl-1 pr-1')}>
                            <View
                                style={[
                                    tailwind('rounded w-4 h-4'),
                                    { backgroundColor: '#f25c5a' },
                                ]}
                            ></View>
                            <Text style={tailwind('text-base p-1 ')}>Clocked in over 8 hrs</Text>
                        </View>
                    </View>
                )}
            </View>
        </>
    );
};

// We moved this to the working time card in stats, but I'm keeping it
// in case we'd like to add it to the home screen.
const AdjustHoursCard = () => {
    const navigation = useNavigation();

    const screenWidth = Dimensions.get('window').width;
    return (
        <View style={[tailwind('flex-1 flex-col m-2 p-2 rounded-xl bg-white flex-col')]}>
            <View style={tailwind('flex-col items-start')}>
                <View style={tailwind('justify-start flex-row items-center')}>
                    <Ionicons style={tailwind('mr-2')} size={24} name="calendar-outline" />
                    <Text style={tailwind('text-black text-lg font-bold')}>
                        Adjust Clocked-In Time
                    </Text>
                </View>
                <Text style={tailwind('text-black text-base m-2 pb-2 ')}>
                    Tap on a day to change when you clocked in - getting this right helps Gigbox
                    estimate your hourly pay.
                </Text>
            </View>
            <View>
                <ClockedInCalendar width={screenWidth * 0.8} />
            </View>
        </View>
    );
};

export default AdjustHoursCard;
