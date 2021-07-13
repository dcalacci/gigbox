import React from 'react';
import { Text, View } from 'react-native';
import moment from 'moment';
import { tailwind } from 'tailwind';
import { useQuery } from 'react-query';
import { store } from '../../store/store';
import { getClient } from '../../utils';
import { gql } from 'graphql-request';

const useNetPay = (startDate: Date, endDate: Date) => {
    const getNetPay = () => {
        const client = getClient(store);
        const query = gql`
            query getNetPay {
                getNetPay {
                    mileageDeduction
                    tip
                    pay
                    startDate
                    endDate
                }
            }
        `;
        const vars = { startDate, endDate };
        const res = client.request(query);
        return res;
    };
    return useQuery(['netPay', startDate, endDate], getNetPay, {
        onSuccess: (d) => {
            console.log('Successfully got net pay:', d);
        },
        onError: (err) => {
            console.log('error:', err);
        },
    });
};

const NetPayCard = () => {
    const { status, data } = useNetPay(
        moment().startOf('week').toDate(),
        moment().endOf('week').toDate()
    );

    if (status === 'success') {
        return (
            <View style={tailwind('rounded-lg bg-white p-2')}>
                <Text style={tailwind('font-bold')}>Net Pay</Text>
                <Text style={tailwind('')}>${data.pay}</Text>
                <Text style={tailwind('')}>${data.mileageDeduction}</Text>
            </View>
        );
    } else {
        return (
            <View style={tailwind('rounded-lg bg-white p-2')}>
                <Text style={tailwind('')}>Loading...</Text>
            </View>
        );
    }
};

export default NetPayCard;
