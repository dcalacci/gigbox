import { Moment } from 'moment';
import { store } from '../store/store';
import { getClient } from '../utils';
import { gql } from 'graphql-request';
import { QueryKey, useQuery } from 'react-query';
import moment from 'moment';

export const getWorkingTime = (startDate: Moment | null, endDate: Moment | null) => {
    const client = getClient(store);
    const query = gql`
        query query($startDate: DateTime, $endDate: DateTime) {
            getWorkingTime(startDate: $startDate, endDate: $endDate) {
                clockedInTime
                jobTime
                shiftHoursDaily {
                    date
                    hrs
                }
                startDate
                endDate
            }
        }
    `;
    const vars = { startDate, endDate };
    const res = client.request(query, vars);
    return res;
};

export const useWorkingTime = (startDate: Moment | null, endDate: Moment | null) => {
    return useQuery(
        ['stats', 'workingTime', startDate, endDate],
        () => {
            return getWorkingTime(startDate, endDate);
        },
        {
            onSuccess: (d) => {
                console.log('Got working time:', d);
            },
            onError: (err) => {
                console.log('working time error:', err);
            },
            select: (d) => {
                return {
                    ...d.getWorkingTime,
                    clockPct: 1,
                    jobPct: d.getWorkingTime.jobTime / d.getWorkingTime.clockedInTime,
                };
            },
        }
    );
};

export const useShiftsByDay = (date: Moment) => {
    return useQuery(
        ['shiftsByDay', date],
        ({ queryKey }: { queryKey: QueryKey }) => {
            const date = queryKey[1];
            const client = getClient(store);
            const startString = date.startOf('day').format();
            const endString = date.endOf('day').format();
            const query = gql`query {
            allShifts(filters: {endTimeGte: "${startString}", endTimeLte: "${endString}"}) {
                edges {
                    node { 
                        id
                        startTime
                        endTime
                    }
                }
            }
        }
        `;
            return client.request(query);
        },
        {
            select: (d) =>
                d.allShifts.edges
                    .map((n) => n.node)
                    .sort((a, b) => {
                        const aLength = moment(a.endTime).diff(a.startTime, 'minutes');
                        const bLength = moment(b.endTime).diff(b.startTime, 'minutes');
                        return bLength - aLength;
                    }),
        }
    );
};
