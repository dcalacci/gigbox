
import moment, { Moment } from 'moment';
import React, { useState, useEffect } from 'react';
import { LayoutAnimation, Pressable, Text } from 'react-native';
import { tailwind } from 'tailwind';
import Modal from 'react-native-modal'
import BinaryFilterPill from './BinaryFilterPill';
import DateRangePicker from './DateRangePicker';
import * as Haptics from 'expo-haptics';

export enum SortArgs {
    START,
    END,
    PAY,
    TIP,
    MILES,
}

export interface JobFilter {
    startDate?: Moment | null;
    endDate?: Moment | null;
    needsEntry?: boolean;
    saved?: boolean;
    minTotalPay?: number | undefined;
    minTip?: number | undefined;
    minMileage?: number | undefined;
    sort?: SortArgs | undefined;
}

export const defaultFilter: JobFilter = {
    startDate: moment().startOf('year'),
    endDate: moment().endOf('day'),
    needsEntry: false,
    saved: false,
    minTotalPay: undefined,
    minTip: undefined,
    minMileage: undefined,
    sort: undefined,
};

export const DateRangeFilterPill = ({
    displayText,
    onPress,
    onDateRangeChange,
    start,
    end,
}: {
    displayText: string;
    onPress: () => void;
    onDateRangeChange: (dates: { startDate: Moment | null; endDate: Moment | null }) => void;
    start: Moment | null;
    end: Moment | null;
}) => {
    const [open, setOpen] = useState<boolean>(false);
    const [dates, setDates] = useState<{ startDate: Moment | null; endDate: Moment | null }>({
        startDate: start,
        endDate: end,
    });
    const [pillText, setPillText] = useState<string>(displayText);
    useEffect(() => {
        if (start !== null && end != null) {
            setPillText(`${start.format('MM/DD/YY')}-${end.format('MM/DD/YY')}`);
        } else {
            setPillText(displayText);
        }
        setDates({ startDate: start, endDate: end });
    }, [start, end]);

    return (
        <>
            <Pressable
                style={[
                    tailwind('rounded-2xl m-2 p-1 pl-2 pr-2 bg-gray-200'),
                    start && end ? tailwind('bg-black') : null,
                ]}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setOpen(!open);
                }}
            >
                <Text
                    style={[
                        tailwind('text-sm font-bold'),
                        start && end ? tailwind('text-white') : tailwind('text-black'),
                    ]}
                >
                    {pillText}
                </Text>
            </Pressable>

            <Modal
                style={tailwind('flex-col')}
                onDismiss={() => setOpen(false)}
                isVisible={open}
                hasBackdrop={true}
                onBackdropPress={() => {
                    console.log('backdrop pressed');
                    setOpen(false);
                }}
                backdropOpacity={0.9}
                presentationStyle={'overFullScreen'}
                useNativeDriverForBackdrop={true}
                swipeDirection={'down'}
                onSwipeComplete={() => setOpen(false)}
                onModalWillHide={() => {
                    if (dates.startDate == null || dates.endDate == null) {
                        onDateRangeChange({ startDate: null, endDate: null });
                    } else if (dates.startDate != start || dates.endDate != end) {
                        onDateRangeChange(dates);
                    }
                }}
            >
                <DateRangePicker
                    initialRange={[
                        moment(dates.startDate).format('YYYY-MM-DD'),
                        moment(dates.endDate).format('YYYY-MM-DD'),
                    ]}
                    onSuccess={(start, end) => {
                        setDates({ startDate: moment(start), endDate: moment(end) });
                    }}
                    theme={{ markColor: '#0FB981', markTextColor: 'white' }}
                />

                <Pressable
                    style={tailwind('justify-self-end rounded-lg m-2 p-2 bg-red-400')}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onDateRangeChange({ startDate: null, endDate: null });
                        setDates({ startDate: null, endDate: null });
                        setOpen(false);
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                    }}
                >
                    <Text style={tailwind('text-white text-xl font-bold self-center')}>
                       Clear 
                    </Text>
                </Pressable>
                <Pressable
                    style={tailwind('justify-self-end rounded-lg m-2 p-2 bg-black')}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onDateRangeChange(dates);
                        setOpen(false);
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                    }}
                >
                    <Text style={tailwind('text-white text-xl font-bold self-center')}>Filter</Text>
                </Pressable>
            </Modal>
        </>
    );
};

export const NumericFilterPill = ({
    displayText,
    onPress,
    value,
}: {
    displayText: string;
    onPress: () => void;
    value: boolean;
}) => (
    <Pressable
        style={[
            tailwind('rounded-2xl m-2 p-1 pl-2 pr-2 bg-gray-200'),
            value ? tailwind('bg-black') : null,
        ]}
        onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPress();
        }}
    >
        <Text
            style={[
                tailwind('text-sm font-bold'),
                value ? tailwind('text-white') : tailwind('text-black'),
            ]}
        >
            {displayText}
        </Text>
    </Pressable>
);