import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import React, { useState } from 'react';

import Colors from '../constants/Colors';
import TabOneScreen from '../screens/TabOneScreen';
import ShiftsScreen from '../screens/ShiftsScreen';
import JobsScreen from '../screens/JobsScreen';
import Onboarding from '../screens/Onboarding';
import { RootState } from '../store/index';
import { Consent, BottomTabParamList, TabOneParamList, TabTwoParamList } from '../types';
import tailwind from 'tailwind-rn';
import { StackActions } from '@react-navigation/routers';
import { SafeAreaView, View, Text } from 'react-native';

import { useQuery } from 'react-query';
import { logIn, LogInResponse } from '../features/auth/api';
import { setLoggedIn } from '../features/auth/authSlice';
import { useDispatch } from 'react-redux';
import PhoneEntry from '../features/auth/PhoneEntry';
import { ConsentFlow } from '../features/consent/ConsentFlow';
import { Signature } from '../features/consent/Signature';
import { Extras } from '../features/consent/Extras';
import { getUserInfo } from '../features/consent/api'

const BottomTab = createBottomTabNavigator<BottomTabParamList>();

export default function BottomTabNavigator() {
    const dispatch = useDispatch();
    const jwt = useSelector((state: RootState): boolean => state.auth.jwt);
    const isAuthenticated = useSelector((state: RootState): boolean => state.auth.authenticated);
    const authIsLoading = useSelector((state: RootState): boolean => state.auth.isLoading);
    const [isOnboarded, setIsOnboarded] = useState<boolean>(false)
    const loggedIn = async () => {
        return logIn(jwt);
    };
    const loggedInStatus = useQuery('loggedIn', loggedIn, {
        refetchInterval: 60*1000,
        onSuccess: (data: LogInResponse) => {
            if (isAuthenticated && data.authenticated) {
                // do nothing
                return;
            } else {
                // otherwise, set our state appropriately
                dispatch(
                    setLoggedIn({
                        authenticated: data.authenticated,
                        user_id: data.user_id,
                        isLoading: false,
                    })
                );
            }
        },
        onError: (data: LogInResponse) => {
            console.log('Login error:', data);
            dispatch(setLoggedIn({ authenticated: false, user_id: null, isLoading: false }));
        },
    });

    const userInfoStatus = useQuery('userInfo', getUserInfo, {
        onSuccess: (d) => {
            console.log("user info:", d)
            if (d.consent?.consented) {
                setIsOnboarded(true)
            }
        },
        select: (d) => d.getUserInfo
    })

    //TODO: check for live (authenticated) token

    if (loggedInStatus.isLoading || authIsLoading) {
        console.log('fucken logging in');
        return (
            <View>
                <Text>Loading....</Text>
            </View>
        );
    } else if (!isAuthenticated) {
        console.log('is authenticated:', isAuthenticated);
        return (
            <View>
                <PhoneEntry />
            </View>
        );
    } else if (!isOnboarded) {
        return (
            <SafeAreaView>
                <ConsentFlow onConsentFinish={() => setConsentFinished(true)}/>
            </SafeAreaView>
        );
    } else {
        // if we're authenticated, and we have all onboarding done, show them the money
        return (
            <BottomTab.Navigator
                initialRouteName="Home"
                tabBarOptions={{ activeTintColor: Colors.light.tint }}
            >
                <>
                    <BottomTab.Screen
                        name="Home"
                        component={TabOneNavigator}
                        options={{
                            tabBarIcon: ({ color }) => <TabBarIcon name="ios-home" color={color} />,
                        }}
                    />
                    <BottomTab.Screen
                        name="Shifts"
                        component={ShiftsScreen}
                        options={{
                            tabBarIcon: ({ color }) => <TabBarIcon name="ios-code" color={color} />,
                        }}
                    />
                    <BottomTab.Screen
                        name="Jobs List"
                        component={JobsScreen}
                        options={{
                            tabBarIcon: ({ color }) => (
                                <TabBarIcon name="ios-plane" color={color} />
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
    return <Ionicons size={30} style={{ marginBottom: -3 }} {...props} />;
}

// Each tab has its own navigation stack, you can read more about this pattern here:
// https://reactnavigation.org/docs/tab-based-navigation#a-stack-navigator-for-each-tab
const TabOneStack = createStackNavigator<TabOneParamList>();

function TabOneNavigator() {
    return (
        <TabOneStack.Navigator>
            <TabOneStack.Screen
                name="TabOneScreen"
                component={TabOneScreen}
                options={{
                    headerTitle: 'Home',
                    headerStyle: tailwind('bg-white'),
                }}
            />
        </TabOneStack.Navigator>
    );
}
