import { getUserInfo, submitUserEmployers } from '../features/consent/api';
import React, { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { Employers, User } from '../types';
import AnimatedEllipsis from './Ellipsis';
import BinaryFilterPill from './BinaryFilterPill';
import { Pressable, View, Text} from 'react-native';
import Toast from 'react-native-root-toast';
import { tailwind } from 'tailwind';
import ModalMultiSelect from './ModalMultiSelect';

export default () => {
    const queryClient = useQueryClient();
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const submitSurvey = useMutation(submitUserEmployers, {
        onSuccess: (data) => {
            queryClient.invalidateQueries('userInfoSettings');
            queryClient.invalidateQueries('userInfo');
        },
    });
    const userStatus = useQuery('userInfoSettings', getUserInfo, {
        select: (d): User => d.getUserInfo,
    });

    const PillsOrLoadingDots = useCallback(() => {
        if (userStatus.status == 'loading') {
            return (
                <AnimatedEllipsis
                    numberOfDots={3}
                    style={{
                        minHeight: 50,
                        color: '#1C1C1C',
                        fontSize: 100,
                    }}
                />
            );
        } else {
            return (
                <>
                    {userStatus.data?.employers.map((e) => (
                        <BinaryFilterPill
                            key={e}
                            displayText={e}
                            onPress={() => console.log('pressed', e)}
                            value={true}
                        />
                    ))}
                </>
            );
        }
    }, [userStatus]);

    return (
        <View style={tailwind('flex-col m-2 rounded-lg bg-white p-2 m-2')}>
            <View style={tailwind('flex-row flex-wrap')}>
                <PillsOrLoadingDots />
                <Pressable
                    onPress={() => setModalOpen(true)}
                    style={tailwind('bg-black p-2 rounded-lg items-center mt-5 mb-5 w-full')}
                >
                    <Text style={tailwind('text-white font-bold text-lg')}>Edit</Text>
                </Pressable>
                <ModalMultiSelect
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    promptText={'What apps do you work for?'}
                    options={Object.keys(Employers)}
                    selected={userStatus.data?.employers || []}
                    onSelectOptions={(selected: string[]) => {
                        if (selected.length == 0) {
                            Toast.show('You need to work for at least one service to use Gigbox.');
                        }
                        setModalOpen(false);
                        submitSurvey.mutate({ employers: (selected as Employers[]) || [] });
                    }}
                    buttonText={'Save'}
                ></ModalMultiSelect>
            </View>
        </View>
    );
};
