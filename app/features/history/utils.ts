import Moment from 'moment';
import { extendMoment } from 'moment-range';

const moment = extendMoment(Moment);

export const getDaysInAMonth = (
    year = +moment().format('YYYY'),
    month = +moment().format('MM') - 1
) => {
    const moment = extendMoment(Moment);
    const startDate = moment([year, month]);

    const firstDay = moment(startDate).startOf('month');
    const endDay = moment(startDate).endOf('month');

    const monthRange = moment.range(firstDay, endDay);
    const weeks = [];
    const days = Array.from(monthRange.by('day'));
    days.forEach((it) => {
        if (!weeks.includes(it.week())) {
            weeks.push(it.week());
        }
    });

    const calendar = [];
    weeks.forEach((week) => {
        const firstWeekDay = moment([year, month]).week(week).day(1);
        const lastWeekDay = moment([year, month]).week(week).day(7);
        const weekRange = moment.range(firstWeekDay, lastWeekDay);
        calendar.push(Array.from(weekRange.by('day')));
    });

    return calendar;
};

export const getWeeksInAYear = (
    year = +moment().format('YYYY'),
    month = +moment().format('MM') - 1
) => {
    const startDate = moment([year, month]);
    const firstDay = moment(startDate).startOf('year');
    const endDay = moment(startDate).endOf('month');

    const monthRange = moment.range(firstDay, endDay);
    let weeks = [];
    const days = Array.from(monthRange.by('day'));
    days.forEach((it) => {
        if (!weeks.includes(it.week())) {
            weeks.push(it.week());
        }
    });

    let calendar = [];
    weeks.forEach((week) => {
        const firstWeekDay = moment([year, month]).week(week).day(1);
        const lastWeekDay = moment([year, month]).week(week).day(7);
        calendar.push({ startDate: firstWeekDay, endDate: lastWeekDay });
    });

    return calendar;
};
