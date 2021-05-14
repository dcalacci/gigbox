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
import { useQueryClient, useMutation, useQuery } from 'react-query';
import * as Haptics from 'expo-haptics';
import BinarySurveyQuestion from './BinarySurveyQuestion';
import { submitConsent } from './api';
import { Extras } from './Extras';
import { Signature } from './Signature';

export const DataConsentSection = ({
    sectionTitle,
    sectionText,
    questionText,
    declineText,
    onConsent,
    value,
    visible,
}: {
    sectionTitle: string;
    sectionText: string;
    questionText: string;
    declineText: string;
    onConsent: (yes: boolean) => void;
    value: boolean | undefined;
    visible: boolean;
}) => {
    if (visible) {
        return (
            <>
                <Text style={tailwind('text-lg font-bold text-green-500 pt-5 pb-2')}>
                    {sectionTitle}
                </Text>
                <Text style={tailwind('text-base pt-2 pb-2')}>{sectionText}</Text>

                <BinarySurveyQuestion
                    questionText={questionText}
                    declineText={declineText}
                    onPress={onConsent}
                    value={value}
                />
            </>
        );
    } else {
        return null;
    }
};

// hides content if visible is false
export const VisibleSection = ({
    visible,
    children,
}: {
    visible: boolean;
    children: JSX.Element;
}) => {
    if (visible) {
        return children;
    } else {
        return null;
    }
};

export const ConsentFlow = ({ onConsentFinish }: { onConsentFinish: () => void }) => {
    const [locationConsent, setLocationConsent] = useState<boolean>();
    const [photoConsent, setPhotoConsent] = useState<boolean>();
    const [surveyConsent, setSurveyConsent] = useState<boolean>();
    const [dataConsent, setDataConsent] = useState<boolean>();
    const [dataSharingConsent, setDataSharingConsent] = useState<boolean>();
    const [interviewConsent, setInterviewConsent] = useState<boolean>();
    const [extrasConsent, setExtrasConsent] = useState<boolean>(false);
    const [name, setName] = useState<string>('');
    const [sigText, setSigText] = useState<string>('');
    const finishConsent = useMutation(submitConsent, {
        onSuccess: (data) => {
            console.log('woohoo, submitted consent:', data);
        },
        onError: (err) => {
            console.log("couldn't submit consent:", err);
        },
    });

    if (dataConsent && extrasConsent) {
        return (
            <Signature
                saveName={setName}
                saveSignature={setSigText}
                isLoading={finishConsent.isLoading}
                onPressContinue={() => {
                    finishConsent.mutate({
                        interview: interviewConsent || false,
                        dataSharing: dataSharingConsent || false,
                        sigText,
                    });
                }}
            />
        );
    } else if (dataConsent && !extrasConsent) {
        return (
            <Extras
                onPressContinue={() => setExtrasConsent(true)}
                setInterviewConsent={setInterviewConsent}
                setDataSharingConsent={setDataSharingConsent}
                dataSharingConsent={dataSharingConsent}
                interviewConsent={interviewConsent}
            />
        );
    } else {
        return (
            <ScrollView style={tailwind('bg-gray-100 ')}>
                <View style={tailwind('p-2')}>
                    <Text style={[tailwind('text-3xl font-bold text-green-500')]}>
                        By using gigbox, you consent to being part of an MIT research study.
                    </Text>

                    <Text style={tailwind('text-lg')}>
                        Because this app is also a research project, you need to consent to being
                        part of the study to use it.
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
                    <Text style={tailwind('text-base')}>
                        By participating in this study, you will help estimate the effective wages
                        of app-based workers like yourself, and help researchers make better tools
                        for workers to track wages, time, and expenses. You will also help uncover
                        any pay discrepancies people of different backgrounds might make from gig
                        work, and help measure how safe gig work is for workers. To do this, the app
                        uses your location, screenshots you take of your work apps, and your survey
                        responses.
                    </Text>
                    <Text style={tailwind('text-xl font-bold text-green-500 underline pt-5 pb-2')}>
                        Procedures: what you need to do
                    </Text>
                    <Text style={tailwind('text-base')}>
                        If you volunteer to be part of this study, we’d ask you to:
                    </Text>

                    <Text style={tailwind('text-base p-2 font-bold')}>
                        Use gigbox during your normal working day to track jobs so we can help
                        measure your pay and expenses
                    </Text>

                    <Text style={tailwind('text-base p-2 font-bold')}>
                        Answer a series of survey questions to help measure potential pay
                        differences between people of different backgrounds
                    </Text>

                    <Text style={tailwind('text-base')}>
                        Your participation is completely voluntary, and you’re free to choose if
                        you’d like to be in it. You can choose to withdraw at any time without any
                        consequences.
                    </Text>
                </View>

                <View style={tailwind('flex-col p-5')}>
                    <View style={tailwind('flex-row -ml-3 pb-5')}>
                        <Text style={tailwind('text-2xl font-bold text-green-500 pr-1')}>2/5</Text>
                        <Text style={tailwind('text-2xl font-bold')}>Privacy & Data 🔐</Text>
                    </View>
                    <Text style={tailwind('text-base pt-2 pb-2')}>
                        The only people who will know that you are a research subject are members of
                        the research team which might include outside collaborators not affiliated
                        with MIT. No information about you, or provided by you during the research
                        will be disclosed to others without your written permission, except: if
                        necessary to protect your rights or welfare, or if required by law. In
                        addition, your information may be reviewed by authorized MIT representatives
                        to ensure compliance with MIT policies and procedures.
                    </Text>
                    <Text style={tailwind('text-base pt-2 pb-2')}>
                        When the results of the research are published or discussed in conferences,
                        no information will be included that would reveal your identity. If
                        photographs, videos, or audio-tape recordings of you will be used for
                        educational purposes, your identity will be protected or disguised.
                    </Text>
                    <Text style={tailwind('text-xl font-bold text-green-500 underline pt-5 pb-2')}>
                        Data about you
                    </Text>

                    <Text style={tailwind('text-base pt-2 pb-2')}>
                        Three kinds of data will be collected through your device.
                        <Text style={tailwind('font-bold')}>
                            {' '}
                            Any data that is collected will either be stored on your phone, or on
                            secure servers at MIT, unless you explicitly consent to your data being
                            used for other projects or by other researchers.
                        </Text>
                    </Text>
                    <Text style={tailwind('text-lg font-bold text-green-500 pt-5 pb-2')}>
                        All of your data will be associated with an anonymous ID - not traceable to
                        your name, phone number, or any other identifier.
                    </Text>

                    <DataConsentSection
                        sectionTitle={' 1. Your Location + accelerometer 📍'}
                        sectionText={
                            'We’ll keep track of your location + accelerometer readings in the background while you use the app, to track how far you travel for jobs, how much you’re standing, sitting, and walking while on the job, and to help make job tracking more accurate in the future.'
                        }
                        questionText={
                            'Do you consent to your location being tracked to estimate your pay, expenses, and to improve job tracking?'
                        }
                        declineText={
                            "You can't use gigbox without consenting to your location data being used."
                        }
                        onConsent={(yes: boolean) => {
                            console.log('Location consent:', yes);
                            setLocationConsent(yes);
                        }}
                        value={locationConsent}
                        visible={true}
                    ></DataConsentSection>

                    <DataConsentSection
                        sectionTitle={'2. Your Photos (screenshots) 📸'}
                        sectionText={
                            'To track jobs, and make job tracking better, the app will automatically find screenshots you take of apps like Instacart, Doordash, or GrubHub, and collect them together. We’ll use these screenshots, and your location, to re-construct your working days. We won’t access, analyze, or do anything with photos that aren’t screenshots from these apps.'
                        }
                        questionText={
                            'Do you consent to sharing screenshots you take of your working apps so we can estimate your pay and improve job tracking?'
                        }
                        declineText={
                            "You can't use gigbox without granting permissions for your photos."
                        }
                        onConsent={(yes: boolean) => {
                            setPhotoConsent(yes);
                            console.log('photos consent:', yes);
                        }}
                        value={photoConsent}
                        visible={locationConsent ? locationConsent : false}
                    ></DataConsentSection>

                    <DataConsentSection
                        sectionTitle={'3. Survey responses❓'}
                        sectionText={
                            'We’ll also ask you to respond to 3 surveys - one during the start of the study, one in the middle, and one at the end. Your responses to these surveys will also be saved.'
                        }
                        questionText={
                            'Do you consent to recieving and responding to 3 surveys while enrolled in the study?'
                        }
                        declineText={"You can't use gigbox without consenting to the surveys."}
                        onConsent={(yes: boolean) => {
                            setSurveyConsent(yes);
                            console.log('survey consent:', yes);
                        }}
                        value={surveyConsent}
                        visible={
                            locationConsent && photoConsent
                                ? locationConsent && photoConsent
                                : false
                        }
                    ></DataConsentSection>
                </View>
                <VisibleSection
                    visible={
                        locationConsent && photoConsent && surveyConsent
                            ? locationConsent && photoConsent && surveyConsent
                            : false
                    }
                >
                    <>
                        <View style={tailwind('flex-col p-5')}>
                            <View style={tailwind('flex-row -ml-3 pb-5')}>
                                <Text style={tailwind('text-2xl font-bold text-green-500 pr-1')}>
                                    3/5
                                </Text>
                                <Text style={tailwind('text-2xl font-bold')}>
                                    Study info and Risks
                                </Text>
                            </View>
                            <Text
                                style={tailwind(
                                    'text-xl font-bold text-green-500 underline pt-5 pb-2'
                                )}
                            >
                                How long will I be enrolled?
                            </Text>

                            <Text style={tailwind('text-base pt-2 pb-2')}>
                                As soon as you sign for consent below, you will be enrolled. You can
                                leave the study at any time in the settings screen of the app.
                            </Text>

                            <Text
                                style={tailwind(
                                    'text-xl font-bold text-green-500 underline pt-5 pb-2'
                                )}
                            >
                                What are the risks?
                            </Text>
                            <Text style={tailwind('text-base pt-2 pb-2')}>
                                It’s possible that using the app or participating in interviews
                                might put you at risk of retribution from an app-based employer like
                                Instacart or Doordash, particularly in the case of a data breach. To
                                mitigate this, we will keep all your data private unless you give us
                                explicit consent to share it. Any shared data will be associated
                                with an anonymous ID, not your name, phone number, or other
                                identifier.
                            </Text>
                            <Text
                                style={tailwind(
                                    'text-xl font-bold text-green-500 underline pt-5 pb-2'
                                )}
                            >
                                Your Investigators
                            </Text>

                            <Text style={tailwind('text-base pt-2 pb-2')}>
                                If you have any questions or concerns about the research, or feel
                                like the study isn’t treating you fairly, please feel free to
                                contact Dan Calacci (dcalacci@media.mit.edu) or @dcalacci on
                                Twitter. You can also reach him at
                                <Text style={tailwind('font-bold')}> 908-229-8992 </Text>or through
                                mail:
                                <Text
                                    style={tailwind('font-bold')}
                                >{`\nDan Calacci \nE15-384b\nMIT\nCambridge, MA, 02139`}</Text>
                            </Text>

                            <Text
                                style={tailwind(
                                    'text-xl font-bold text-green-500 underline pt-5 pb-2'
                                )}
                            >
                                What if I have problems?
                            </Text>
                            <Text style={tailwind('text-base pt-2 pb-2')}>
                                If you have any questions or concerns, or feel like the study isn’t
                                treating you fairly, you can contact the Chairman of the Committee
                                on the Use of Humans as Experimental Subjects at MIT. Their contact
                                information is here, and will be available in the settings screen of
                                the app.
                            </Text>

                            <Text
                                style={tailwind(
                                    'text-xl font-bold text-green-500 underline pt-5 pb-2'
                                )}
                            >
                                Your Rights
                            </Text>
                            <Text style={tailwind('text-base pt-2 pb-2')}>
                                You are not waiving any legal claims, rights or remedies because of
                                your participation in this research study. If you feel you have been
                                treated unfairly, or you have questions regarding your rights as a
                                research subject, you may contact:
                                <Text
                                    style={tailwind('font-bold')}
                                >{`\n\nChairman of the Committee on the Use of Humans as Experimental Subjects\nM.I.T.\nRoom E25-143B\n77 Massachusetts Ave, Cambridge, MA 02139\nphone 1-617-253 6787.`}</Text>
                            </Text>

                            <Text
                                style={tailwind(
                                    'text-xl font-bold text-green-500 underline pt-5 pb-2'
                                )}
                            >
                                Emergency care and compensation for injury
                            </Text>

                            <Text style={tailwind('text-base pt-2 pb-2')}>
                                If you feel you have suffered an injury, which may include emotional
                                trauma, as a result of participating in this study, please contact
                                the person in charge of the study as soon as possible. In the event
                                you suffer such an injury, M.I.T. may provide itself, or arrange for
                                the provision of, emergency transport or medical treatment,
                                including emergency treatment and follow-up care, as needed, or
                                reimbursement for such medical services. M.I.T. does not provide any
                                other form of compensation for injury. In any case, neither the
                                offer to provide medical assistance, nor the actual provision of
                                medical services shall be considered an admission of fault or
                                acceptance of liability. Questions regarding this policy may be
                                directed to MIT’s Insurance Office, (617) 253-2823. Your insurance
                                carrier may be billed for the cost of emergency transport or medical
                                treatment, if such services are determined not to be directly
                                related to your participation in this study.
                            </Text>
                        </View>
                        <Pressable
                            style={[
                                tailwind('rounded-lg p-5 m-2'),
                                !locationConsent || !photoConsent || !surveyConsent
                                    ? tailwind('bg-gray-400')
                                    : tailwind('bg-green-500'),
                            ]}
                            disabled={!locationConsent || !photoConsent || !surveyConsent}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                setDataConsent(true);
                                //TODO: send value to server, wait until we get a response back, and continue
                            }}
                        >
                            <Text style={tailwind('font-bold text-white text-xl text-center')}>
                                {!locationConsent || !photoConsent || !surveyConsent
                                    ? `You need to consent above to continue`
                                    : `Continue`}
                            </Text>
                        </Pressable>
                    </>
                </VisibleSection>
            </ScrollView>
        );
    }
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
