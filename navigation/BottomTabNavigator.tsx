import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import React, { useEffect } from 'react';

import Colors from '../constants/Colors';
import HomeScreen from '../screens/HomeScreen';
import ShiftsScreen from '../screens/ShiftsScreen';
import JobsScreen from '../screens/JobsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { RootState } from '../store/index';
import { BottomTabParamList, HomeParamList } from '../types';
import tailwind from 'tailwind-rn';
import { SafeAreaView, View } from 'react-native';

import { setOnboarded } from '../features/auth/authSlice';
import { useDispatch } from 'react-redux';
import PhoneEntry from '../features/auth/PhoneEntry';
import { ConsentFlow } from '../features/consent/ConsentFlow';
import { InitialSurvey } from '../features/consent/InitialSurvey';
import { Onboarding } from '../features/onboarding/Onboarding';
import { User } from '../types';
import * as SplashScreen from 'expo-splash-screen';
import { SurveyForm } from '../features/surveys/Survey'

const BottomTab = createBottomTabNavigator<BottomTabParamList>();

export default function BottomTabNavigator({ }) {
    const dispatch = useDispatch();
    const user = useSelector((state: RootState): User | null => state.auth.user);
    const isAuthenticated = useSelector((state: RootState): boolean => state.auth.authenticated);
    const isOnboarded = useSelector((state: RootState): boolean => state.auth.onboarded);

    useEffect(() => {
        async function maybeShowSplash() {
            // if "user" isn't defined, then we should show our splash screen
            if (!user) {
                console.log('preventing splash screen hide...');
                await SplashScreen.preventAutoHideAsync();
            } else {
                console.log('hiding splash screen...');
                await SplashScreen.hideAsync();
            }
        }
        maybeShowSplash();
    }, []);

    if (!isOnboarded) {
        return <Onboarding onOnboardingFinish={() => dispatch(setOnboarded(true))} />;
    } else if (!isAuthenticated) {
        console.log('not authenticated, redirecting to phoneEntry...');
        // if not authenticated, show phone entry screen. isAuthenticated should be True at the end of the flow.
        return (
            <View>
                <PhoneEntry />
            </View>
        );
    } else if (!user) {
        // otherwise, return null. If we're here, we should be showing the splash screen (see above)
        return null;
    } else if (!user.consent) {
        return (
            <SafeAreaView>
                <ConsentFlow
                    onConsentFinish={() => {
                        console.log('Finished consent');
                    }}
                />
            </SafeAreaView>
        );
    } else if (!user.employers || user.employers.length == 0) {
        return (
            <SafeAreaView>
                <InitialSurvey onSurveyFinish={() => console.log('finished survey')} />
            </SafeAreaView>
        );
    } else {
        // if we're authenticated, and we have all onboarding done, show them the money
        return (
            <BottomTab.Navigator
                tabBarOptions={{
                    activeTintColor: Colors.light.tint,
                }}
            >
                <>
                    <BottomTab.Screen
                        name="Home"
                        component={HomeRoot}
                        options={{
                            tabBarIcon: ({ color }) => (
                                <TabBarIcon name="caret-forward-circle-outline" color={color} />
                            ),
                        }}
                    />
                    <BottomTab.Screen
                        name="Trips"
                        component={ShiftsScreen}
                        options={{
                            tabBarIcon: ({ color }) => (
                                <TabBarIcon name="receipt-outline" color={color} />
                            ),
                        }}
                    />
                    <BottomTab.Screen
                        name="Jobs"
                        component={JobsScreen}
                        options={{
                            tabBarIcon: ({ color }) => (
                                <TabBarIcon name="list-outline" color={color} />
                            ),
                        }}
                    />
                    <BottomTab.Screen
                        name="Settings"
                        component={SettingsScreen}
                        options={{
                            tabBarIcon: ({ color }) => (
                                <TabBarIcon name="settings-outline" color={color} />
                            ),
                        }}
                    />
                </>
            </BottomTab.Navigator>
        );
    }
}

// You can explore the built-in icon families and icons on the web at:
// https://icons.expo.fyi/
function TabBarIcon(props: { name: string; color: string }) {
    return <Ionicons size={30} style={{ marginBottom: -3 }} color={props.color} name={props.name}/>;
}

// Each tab has its own navigation stack, you can read more about this pattern here:
// https://reactnavigation.org/docs/tab-based-navigation#a-stack-navigator-for-each-tab
const HomeStack = createStackNavigator<HomeParamList>();

function HomeRoot() {
    return (
        <HomeStack.Navigator>
            <HomeStack.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    headerTitle: 'Home',
                    headerStyle: tailwind('bg-white'),
                }}
            />
            <HomeStack.Screen 
            name="Survey" 
            component={SurveyForm} 
            options={{
                headerBackTitle: 'Home'
            }}/>
        </HomeStack.Navigator>
    );
}
