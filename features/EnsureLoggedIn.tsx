import { StatusBar } from 'expo-status-bar';
import React, { useCallback } from 'react';
import { SafeAreaView, View, Text, Settings } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from 'react-native-fast-toast';

import { useQuery, QueryClientProvider, QueryClient } from 'react-query';
import * as TaskManager from 'expo-task-manager';
import { LocationObject } from 'expo-location';
import { useDispatch, useSelector } from 'react-redux';
import { logIn, LogInResponse } from '../features/auth/api';
import { getUserInfo } from '../features/consent/api';
import { setLoggedIn, setUser } from '../features/auth/authSlice';
import { RootState } from 'store/index';
import { User } from '../types';
import { tailwind } from 'tailwind';
import * as SplashScreen from 'expo-splash-screen';

export const EnsureLoggedIn = ({ children }: { children: JSX.Element }) => {
    const isAuthenticated = useSelector((state: RootState): boolean => state.auth.authenticated);
    const user = useSelector((state: RootState): User | null => state.auth.user);
    const jwt = useSelector((state: RootState): string | null => state.auth.jwt);
    const dispatch = useDispatch();
    const loggedIn = async () => {
        return await logIn(jwt);
    };
    SplashScreen.preventAutoHideAsync().catch(console.warn);
    const userInfoStatus = useQuery('userInfo', getUserInfo, {
        // Also change onboarding status whenever the 'userInfo' query is refetched.
        onSuccess: (d) => {
            console.log('user info:', d);
            dispatch(setUser(d));
        },
        onError: (err) => {
            console.log('had an issue getting user info:');
            console.log(err);
        },
        select: (d) => d.getUserInfo,
        enabled: isAuthenticated,
    });

    const loggedInStatus = useQuery('loggedIn', loggedIn, {
        refetchInterval: 60 * 1000,
        onSuccess: (data: LogInResponse) => {
            // set log in response using our our REST login endpoint.
            // do this every minute, just to ensure our token is up to date.
            if (data.status != 200) {
                console.log('No token -- not authenticated');
                dispatch(
                    setLoggedIn({
                        authenticated: false,
                    })
                );
            } else if (isAuthenticated && data.authenticated) {
                // do nothing
                console.log('already authenticated! Doing nothing...');
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

    const onLayoutRootView = useCallback(async () => {
        if (loggedInStatus.isLoading || loggedInStatus.isError || !user) {
            console.log('preventing splash screen hide...');
            await SplashScreen.preventAutoHideAsync();
        } else {
            console.log('hiding splash screen...');
            await SplashScreen.hideAsync();
        }
    }, [loggedInStatus]);

    if (loggedInStatus.isLoading || loggedInStatus.isError) {
        console.log('loggedinStatus:', loggedInStatus);
        return null;
    }

    return (
        <View style={tailwind('w-full h-full')} onLayout={onLayoutRootView}>
            {children}
        </View>
    );
};
