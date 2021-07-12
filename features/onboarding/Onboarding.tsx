import React, { useState } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    Image,
    Pressable,
} from 'react-native';
import { tailwind } from 'tailwind';
import * as Haptics from 'expo-haptics';

const NUM_PAGES = 3;

export const Onboarding = ({ onOnboardingFinish }: { onOnboardingFinish: () => void }) => {
    const [page, setPage] = useState<number>(0);

    const Pages = [
        <View style={tailwind('flex-col flex-grow w-full justify-items-end p-5 pt-10 -mb-10')}>
            <View style={tailwind('flex-row')}>
                <Text style={tailwind('text-4xl text-white font-bold')}>Welcome to gigbox.</Text>
            </View>
            <Image
                style={tailwind('w-3/4 h-64 mt-10 mb-10 self-center')}
                resizeMode={'contain'}
                source={require('./Gigbox-Preview.png')}
            />
            <Text style={tailwind('text-2xl text-white font-bold pb-2')}>
                Gigbox is an open-source work tracker designed with & for app-based workers.
            </Text>
        </View>,

        <View style={tailwind('flex-col flex-grow w-full justify-items-end p-5 pt-10 -mb-10')}>
            <View style={tailwind('flex-col')}>
                <Text style={tailwind('text-4xl text-white font-bold')}>Your data is yours.</Text>
                <Text style={tailwind('text-2xl text-white font-bold')}>
                    And there's power in numbers.
                </Text>
            </View>
            <Image
                style={tailwind('w-3/4 h-48 mt-10 mb-10 self-center')}
                resizeMode={'contain'}
                source={require('./gigbox-group.png')}
            />
            <Text style={tailwind('text-2xl text-white font-bold pb-2')}>
                Gigbox is designed to make it easy to share your work data with anyone —
                researchers, advocates, other workers, and organizers.
            </Text>
        </View>,
        <View style={tailwind('flex-col flex-grow w-full justify-items-end p-5 pt-10 -mb-10')}>
            <View style={tailwind('flex-col')}>
                <Text style={tailwind('text-4xl text-white font-bold')}>
                    Gigbox is a research project
                </Text>
                <Text style={tailwind('text-2xl text-white font-bold')}>
                    Run by researchers at the MIT Media Lab.
                </Text>
            </View>
            <Image
                style={tailwind('w-3/4 h-48 mt-10 mb-10 self-center')}
                resizeMode={'contain'}
                source={require('./graph-1.png')}
            />
            <Text style={tailwind('text-xl text-white font-bold pb-2')}>
                We believe that you have rights to the data you generate while you work. We will
                never sell your data, and will only share your information in ways you explicitly
                tell us we can.
            </Text>
        </View>,
    ];

    return (
        <SafeAreaView style={tailwind('flex-col w-full h-full bg-green-500')}>
            {Pages[page]}

            <View style={tailwind('flex-col h-20')}>
                <View style={tailwind('flex-row w-full')}>
                    {page == 0 ? null : (
                        <Pressable
                            onPress={() => {
                                setPage(page == 0 ? 0 : page - 1);
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            }}
                            style={tailwind(
                                'rounded-lg border flex-grow border-white m-2 self-center'
                            )}
                        >
                            <Text style={tailwind('text-white font-bold text-lg text-center p-1')}>
                                Back
                            </Text>
                        </Pressable>
                    )}
                    <Pressable
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            if (page == Pages.length - 1) {
                                onOnboardingFinish();
                            } else {
                                setPage(page + 1);
                            }
                        }}
                        style={tailwind('rounded-lg border flex-grow border-white m-2 self-center')}
                    >
                        <Text style={tailwind('text-white font-bold text-lg text-center p-1')}>
                            Next
                        </Text>
                    </Pressable>
                </View>
                <View style={tailwind('flex-row w-full')}>
                    <Dots numPages={3} currentPage={page} />
                </View>
            </View>
        </SafeAreaView>
    );
};

const Dots = ({
    numPages,
    currentPage,
    style,
}: {
    numPages: number;
    currentPage: number;
    style?: any;
}) => (
    <View
        style={[
            tailwind('p-2 w-full h-12 bg-transparent flex-row justify-center items-center'),
            style,
        ]}
    >
        {[...Array(numPages)].map((_, index) => (
            <Dot key={index} selected={index === currentPage} />
        ))}
    </View>
);

const Dot = ({ selected }: { selected: boolean }) => {
    return (
        <View
            style={[
                tailwind('w-4 h-4 rounded-xl ml-2 mr-2'),
                selected ? tailwind('bg-white') : tailwind('bg-gray-300'),
            ]}
        />
    );
};
