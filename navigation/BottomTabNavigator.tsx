import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import * as React from 'react';

import Colors from '../constants/Colors';
import TabOneScreen from '../screens/TabOneScreen';
import ShiftsScreen from '../screens/ShiftsScreen';
import JobsScreen from '../screens/JobsScreen';
import Onboarding from '../screens/Onboarding';
import { RootState } from '../store/index';
import { BottomTabParamList, TabOneParamList, TabTwoParamList } from '../types';
import tailwind from 'tailwind-rn';
import { StackActions } from '@react-navigation/routers';
import { SafeAreaView, View, Text } from 'react-native';

import { useQuery } from 'react-query';
import { logIn, LogInResponse } from '../features/auth/api';
import { setLoggedIn } from '../features/auth/authSlice';
import { useDispatch } from 'react-redux';

const BottomTab = createBottomTabNavigator<BottomTabParamList>();

export default function BottomTabNavigator() {
    const jwt = useSelector((state: RootState): boolean => state.auth.jwt);
    const isAuthenticated = useSelector((state: RootState): boolean => state.auth.authenticated);
    const authIsLoading = useSelector((state: RootState): boolean => state.auth.isLoading);
    const loggedIn = () => {
        return logIn(jwt);
    };
    const dispatch = useDispatch();
    const loggedInStatus = useQuery('loggedIn', loggedIn, {
        refetchInterval: 5000,
        onSuccess: (data: LogInResponse) => {
            if (isAuthenticated && data.authenticated) {
                // do nothing 
                return;
            }
            // otherwise, set our state appropriately
            dispatch(setLoggedIn({ authenticated: data.authenticated, user_id: data.user_id }));
        },
        onError: (data: LogInResponse) => {
            dispatch(setLoggedIn({ authenticated: false, user_id: null }));
        },
    });

    //TODO: check for live (authenticated) token

    if (authIsLoading) {
        return (
            <View>
                <Text>Loading....</Text>
            </View>
        );
    } else if (loggedInStatus.isLoading) {
        return (
            <View>
                <Text>Loading....</Text>
            </View>
        );
    } else {
        // if we're not authenticated, show the login screen
        return (
            <BottomTab.Navigator
                initialRouteName="Home"
                tabBarOptions={{ activeTintColor: Colors.light.tint }}
            >
                {isAuthenticated ? (
                    <>
                        <BottomTab.Screen
                            name="Home"
                            component={TabOneNavigator}
                            options={{
                                tabBarIcon: ({ color }) => (
                                    <TabBarIcon name="ios-home" color={color} />
                                ),
                            }}
                        />
                        <BottomTab.Screen
                            name="Shifts"
                            component={ShiftsScreen}
                            options={{
                                tabBarIcon: ({ color }) => (
                                    <TabBarIcon name="ios-code" color={color} />
                                ),
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
                ) : (
                    <>
                        <BottomTab.Screen
                            name="Onboarding"
                            component={Onboarding}
                        ></BottomTab.Screen>
                    </>
                )}
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
