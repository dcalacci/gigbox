import { request, gql } from 'graphql-request';
import { log, getClient } from '../../utils';
import { store } from '../../store/store';

export const fetchWeeklySummary = () => {
    const client = getClient(store);
    const query = gql`
        query {
            getWeeklySummary {
                miles
                numShifts
                numJobs
                totalPay
                totalTips
                meanTips
                meanPay
                earnings
                expenses
            }
        }
    `;

    return client.request(query);
};
