import React, { useState, useEffect } from 'react';
import {
    ScrollView,
    View,
    Text,
    Image,
    Pressable,
    TextInput,
} from 'react-native';
import { tailwind } from 'tailwind';
import { Region, Marker, LatLng } from 'react-native-maps';
import { useQueryClient, useMutation } from 'react-query';
import moment from 'moment';
import { Job, Screenshot, Shift } from '../../types';
import { parse } from 'wellknown';
import TripMap from '../shiftList/TripMap';
import ScreenshotUploader from './ScreenshotPicker';
import { updateJobValue } from './api';
import { JobItem } from './Job'


export interface JobFilter {
    after: Date
    before: Date
    needsEntry: boolean
    minTotalPay: number
    minTip: number
    minMileage: number
  }


//List of job components
//TODO: remove shift screenshot bits here
export const JobList = ({ jobs, shift }: { jobs: [{ node: Job }] | undefined; shift: Shift }) => {
    return (
        <ScrollView style={[tailwind('flex-col w-full pl-2 pr-2')]}>
            {jobs?.map((j) => (
                <JobItem job={j.node} shift={shift} key={j.node.id} />
            ))}
        </ScrollView>
    );
};
