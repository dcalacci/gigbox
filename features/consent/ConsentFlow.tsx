import React, { useState, useEffect } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    Image,
    Pressable,
    TextInput,
    StyleSheet,
} from 'react-native';
import { tailwind } from 'tailwind';
import { Region, Marker, LatLng } from 'react-native-maps';
import { useQueryClient, useMutation, useQuery } from 'react-query';
import moment from 'moment';
import { Job, Screenshot, Shift } from '../../types';
import { parse } from 'wellknown';
import TripMap from '../shiftList/TripMap';

export const ConsentFlow = ({}) => {
    return (
        <ScrollView>
            <View style={tailwind('p-2')}>
                <Text style={[tailwind('text-2xl font-bold text-green-500')]}>
                    By using gigbox, you consent to being part of an MIT research study.
                </Text>

                <Text style={tailwind('text-lg')}>
                    Because this app is also a research project, you need to consent to being part
                    of the study to use it.
                </Text>
            </View>

            <View style={tailwind('flex-col p-5')}>
                <View style={tailwind('flex-row -ml-3 pb-5')}>
                    <Text style={tailwind('text-2xl font-bold text-green-500 pr-1')}>1/5</Text>
                    <Text style={tailwind('text-2xl font-bold ')}>Summary and Procedures</Text>
                </View>
                <Text style={tailwind('text-xl font-bold text-green-500 underline pb-2')}>
                    What are the study goals? 🎯
                </Text>
                <Text style={tailwind('text-sm')}>
                    By participating in this study, you will help estimate the effective wages of
                    app-based workers like yourself, and help researchers make better tools for
                    workers to track wages, time, and expenses. You will also help uncover any pay
                    discrepancies people of different backgrounds might make from gig work, and help
                    measure how safe gig work is for workers. To do this, the app uses your
                    location, screenshots you take of your work apps, and your survey responses.
                </Text>
                <Text style={tailwind('text-xl font-bold text-green-500 underline pt-5 pb-2')}>
                    Procedures: what you need to do
                </Text>
                <Text style={tailwind('text-sm')}>
                    If you volunteer to be part of this study, we’d ask you to:
                </Text>

                <Text style={tailwind('text-sm p-2 font-bold')}>
                    Use gigbox during your normal working day to track jobs so we can help measure
                    your pay and expenses
                </Text>

                <Text style={tailwind('text-sm p-2 font-bold')}>
                    Answer a series of survey questions to help measure potential pay differences
                    between people of different backgrounds
                </Text>

                <Text style={tailwind('text-sm')}>
                    Your participation is completely voluntary, and you’re free to choose if you’d
                    like to be in it. You can choose to withdraw at any time without any
                    consequences.
                </Text>
            </View>

            <View style={tailwind('flex-col p-5')}>
                <View style={tailwind('flex-row -ml-3 pb-5')}>
                    <Text style={tailwind('text-2xl font-bold text-green-500 pr-1')}>2/5</Text>
                    <Text style={tailwind('text-2xl font-bold')}>Privacy & Data 🔐</Text>
                </View>
                <Text style={tailwind('text-sm pt-2 pb-2')}>
                    The only people who will know that you are a research subject are members of the
                    research team which might include outside collaborators not affiliated with MIT.
                    No information about you, or provided by you during the research will be
                    disclosed to others without your written permission, except: if necessary to
                    protect your rights or welfare, or if required by law. In addition, your
                    information may be reviewed by authorized MIT representatives to ensure
                    compliance with MIT policies and procedures.
                </Text>
                <Text style={tailwind('text-sm pt-2 pb-2')}>
                    When the results of the research are published or discussed in conferences, no
                    information will be included that would reveal your identity. If photographs,
                    videos, or audio-tape recordings of you will be used for educational purposes,
                    your identity will be protected or disguised.
                </Text>
                <Text style={tailwind('text-xl font-bold text-green-500 underline pt-5 pb-2')}>
                    Data about you
                </Text>

                <Text style={tailwind('text-sm pt-2 pb-2')}>
                    Three kinds of data will be collected through your device.
                    <Text style={tailwind('font-bold')}>
                        {' '}
                        Any data that is collected will either be stored on your phone, or on secure
                        servers at MIT, unless you explicitly consent to your data being used for
                        other projects or by other researchers.
                    </Text>
                </Text>
                <Text style={tailwind('text-lg font-bold text-green-500 pt-5 pb-2')}>
                    All of your data will be associated with an anonymous ID - not traceable to your
                    name, phone number, or any other identifier.
                </Text>

                <Text style={tailwind('text-lg font-bold text-green-500 pt-5 pb-2')}>
                    1. Your Location + accelerometer📍
                </Text>
                <Text style={tailwind('text-sm pt-2 pb-2')}>
                    We’ll keep track of your location + accelerometer readings in the background
                    while you use the app, to track how far you travel for jobs, how much you’re
                    standing, sitting, and walking while on the job, and to help make job tracking
                    more accurate in the future.
                </Text>
                <Text style={tailwind('text-lg pt-2 pb-2 underline text-center')}>
                    Do you consent to your location being tracked to estimate your pay, expenses,
                    and to improve job tracking?
                </Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    imgItem: {
        backgroundColor: '#eeeeee',
        padding: 20,
        width: '100%',
    },
    imgImage: {
        width: '100%',
        height: 500,
    },
});
