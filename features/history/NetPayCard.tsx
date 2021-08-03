import React, { useRef, useState } from 'react';
import {
    Dimensions,
    FlatList,
    LayoutAnimation,
    Pressable,
    ScrollView,
    Text,
    View,
} from 'react-native';
import moment, { Moment } from 'moment';
import { tailwind } from 'tailwind';
import { useQuery, useQueryClient } from 'react-query';
import { store } from '../../store/store';
import { getClient } from '../../utils';
import { gql } from 'graphql-request';
import { DateRangeFilterPill } from '../../components/FilterPills';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { StackedBarChart } from 'react-native-chart-kit';
import { WeeklyStats } from './WeeklyStats';
import { getWeeksInAYear } from './utils';

const getNetPay = (startDate: Moment | null, endDate: Moment | null) => {
    const client = getClient(store);
    const query = gql`
        query query($startDate: DateTime, $endDate: DateTime) {
            getNetPay(startDate: $startDate, endDate: $endDate) {
                mileageDeduction
                tip
                pay
                startDate
                endDate
                clockedInTime
                jobTime
            }
        }
    `;
    const vars = { startDate, endDate };
    console.log('sending query w vars:', vars);
    const res = client.request(query, vars);
    return res;
};

const NetPayCard = () => {
    const queryClient = useQueryClient();
    const [dates, setDates] = useState<{ startDate: Moment | null; endDate: Moment | null }>({
        startDate: moment().startOf('week'),
        endDate: moment(),
    });

    const { status, data } = useQuery(
        ['stats', 'netPay', dates.startDate, dates.endDate],
        () => getNetPay(dates.startDate, dates.endDate),
        {
            onSuccess: (d) => {
                console.log('Successfully got net pay:', d);
            },
            onError: (err) => {
                console.log('error:', err);
            },
            select: (d) => {
                return d.getNetPay;
            },
        }
    );

    const [helpButtonPressed, setHelpButtonPressed] = useState<boolean>(false);
    const [activeHelpButtonPressed, setActiveHelpButtonPressed] = useState<boolean>(false);

    const netPay = data && data.pay + data.tip - data.mileageDeduction;

    let weeks = getWeeksInAYear();
    weeks = weeks.sort((a, b) => {
        const diff = b.startDate.week() - a.startDate.week();
        return diff;
    });
    weeks = weeks.filter((week) => week.startDate < moment());
    weeks = weeks.slice(0, 10);

    const screenWidth = Dimensions.get('window').width;

    const viewabilityConfig = {
        viewAreaCoveragePercentThreshold: 0.75,
    };

    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const flatList = useRef();
    const onViewableItemsChanged = (info) => {
        console.log('viewable items:', info);
        if (info.viewableItems.length > 0) {
            setDates(info.viewableItems[0].item);
            setCurrentIndex(info.viewableItems[0].index);
        }
        queryClient.invalidateQueries('netPay');
    };

    // see https://github.com/facebook/react-native/issues/30171
    const viewabilityConfigCallbackPairs = useRef([{ viewabilityConfig, onViewableItemsChanged }]);

    const incrementWeek = () => {
        flatList.current.scrollToIndex({
            animated: true,
            index: currentIndex + 1,
        });
    };

    const decrementWeek = () => {
        flatList.current.scrollToIndex({ animated: true, index: Math.max(0, currentIndex - 1) });
    };

    return (
        <View style={tailwind('rounded-lg bg-white w-full flex-col mt-2 mb-2 pb-5')}>
            <View style={tailwind('flex-row w-full p-2 items-center justify-between')}>
                <Text style={tailwind('font-bold text-3xl')}>Summary</Text>
                <View style={tailwind('rounded-lg p-2')}>
                    <Text style={tailwind('font-bold text-sm')}>
                        {dates.startDate.format('l')} - {dates.endDate.format('l')}
                    </Text>
                </View>
            </View>

            <View style={tailwind('flex-row p-2 justify-around items-center')}>
                <Pressable
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setHelpButtonPressed(!helpButtonPressed);
                        setActiveHelpButtonPressed(false);
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    }}
                >
                    <View style={tailwind('flex-col rounded-lg p-1 bg-gray-100')}>
                        <View style={tailwind('flex-row justify-between')}>
                            <Text style={tailwind('font-bold text-xl')}>
                                {status == 'success'
                                    ? `$${(netPay / data.clockedInTime || 0).toFixed(2)}`
                                    : '...'}
                            </Text>
                            <Ionicons
                                name={'help-circle'}
                                size={24}
                                color={helpButtonPressed ? 'black' : 'gray'}
                            />
                        </View>
                        <Text style={tailwind('text-sm')}>Per Hour</Text>
                        <Text style={tailwind('text-xs')}>(Incl. Waiting Time)</Text>
                    </View>
                </Pressable>
                <Pressable
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setActiveHelpButtonPressed(!activeHelpButtonPressed);
                        setHelpButtonPressed(false);
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    }}
                >
                    <View style={tailwind('flex-col rounded-lg p-1 bg-gray-100')}>
                        <View style={tailwind('flex-row justify-between')}>
                            <Text style={tailwind('font-bold text-xl')}>
                                {status == 'success'
                                    ? `$${(netPay / data.jobTime || 0).toFixed(2)}`
                                    : '...'}
                            </Text>
                            <Ionicons
                                name={'help-circle'}
                                size={24}
                                color={activeHelpButtonPressed ? 'black' : 'gray'}
                            />
                        </View>
                        <Text style={tailwind('text-sm')}>Per Hour</Text>
                        <Text style={tailwind('text-xs')}>(Active Time Only)</Text>
                    </View>
                </Pressable>
            </View>

            {(helpButtonPressed || activeHelpButtonPressed) && (
                <>
                    {helpButtonPressed ? (
                        <View style={tailwind('flex-row bg-gray-100 p-2 m-2 rounded-xl')}>
                            <Text style={tailwind('text-base')}>
                                You clocked{' '}
                                <Text style={tailwind('font-bold')}>
                                    {data.clockedInTime.toFixed(0)}
                                </Text>{' '}
                                hours, and you made...
                            </Text>
                        </View>
                    ) : (
                        <View style={tailwind('flex-row bg-gray-100 p-2 m-2 rounded-xl')}>
                            <Text style={tailwind('text-base')}>
                                <Text style={tailwind('font-bold')}>{data.jobTime.toFixed(0)}</Text>{' '}
                                of your hours were "active" (in a job), and you made...
                            </Text>
                        </View>
                    )}

                    <View style={tailwind('flex-row p-2 justify-around items-center')}>
                        <View style={tailwind('flex-col rounded-lg p-1 bg-gray-100')}>
                            <Text style={tailwind('font-bold text-lg')}>
                                {status == 'success' ? `$${data.pay.toFixed(2)}` : '...'}
                            </Text>
                            <Text style={tailwind('text-sm')}>Base Pay</Text>
                        </View>
                        <Text style={tailwind('text-xl')}>+</Text>
                        <View style={tailwind('flex-col rounded-lg p-1 bg-gray-100')}>
                            <Text style={tailwind('font-bold text-lg')}>
                                {status == 'success' ? `$${data.tip.toFixed(2)}` : '...'}
                            </Text>
                            <Text style={tailwind('text-sm')}>Tips</Text>
                        </View>

                        <Text style={tailwind('text-xl')}>-</Text>
                        <View style={tailwind('flex-col rounded-lg p-1 bg-gray-100')}>
                            <Text style={tailwind('font-bold text-lg')}>
                                {status == 'success'
                                    ? `$${data.mileageDeduction.toFixed(2)}`
                                    : '...'}
                            </Text>
                            <Text style={tailwind('text-sm')}>Expenses</Text>
                        </View>
                        <Text style={tailwind('text-xl')}>=</Text>
                        <View style={tailwind('flex-col rounded-lg p-1 bg-gray-100')}>
                            <Text style={tailwind('font-bold text-lg')}>
                                {status == 'success' ? `$${netPay.toFixed(2)}` : '...'}
                            </Text>
                            <Text style={tailwind('text-sm')}>Net Pay</Text>
                        </View>
                    </View>
                </>
            )}
            <FlatList
                style={[tailwind('w-full pr-2')]}
                ref={flatList}
                pagingEnabled={true}
                data={weeks}
                horizontal={true}
                initialNumToRender={5}
                inverted={true}
                keyExtractor={(week, index) => week.startDate.format('L')}
                viewabilityConfig={viewabilityConfig}
                viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
                getItemLayout={(data, index) => ({
                    length: screenWidth * 0.95,
                    offset: screenWidth * 0.95 * index,
                    index,
                })}
                renderItem={({ item, index, seps }) => {
                    console.log('rendering item:', item.startDate.format('L'));
                    return (
                        <View
                            style={[
                                tailwind(
                                    'flex-col h-full border border-transparent bg-transparent'
                                ),

                                { width: screenWidth * 0.95 },
                            ]}
                        >
                            <View
                                style={[
                                    tailwind(
                                        'flex-col bg-gray-100 rounded-lg pt-2 pr-2 pl-2 items-center'
                                    ),
                                ]}
                            >
                                <View style={tailwind('flex-row items-center justify-between')}>
                                    <Pressable onPress={() => incrementWeek()}>
                                        <Ionicons
                                            name={'arrow-back-circle'}
                                            size={32}
                                            color={'gray'}
                                        />
                                    </Pressable>
                                    <Text style={tailwind('font-bold text-xl pl-2 pr-2')}>
                                        {item.startDate.format('ll')} - {item.endDate.format('ll')}{' '}
                                    </Text>

                                    <Pressable onPress={() => decrementWeek()}>
                                        <Ionicons
                                            name={'arrow-forward-circle'}
                                            size={32}
                                            color={'gray'}
                                        />
                                    </Pressable>
                                </View>
                                <Text style={tailwind('font-bold text-lg self-start')}>Pay</Text>
                                <WeeklyStats dates={item} />
                            </View>
                        </View>
                    );
                }}
            ></FlatList>
        </View>
    );
};

export default NetPayCard;
