// component to allow user to select employers they're working for
// on a particular shift.
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, LayoutAnimation} from 'react-native';
import { tailwind } from 'tailwind';
import { useSelector } from 'react-redux';
import { useQueryClient, useMutation } from 'react-query';
import { AuthState } from '../auth/authSlice';
import { RootState } from '../../store/index';
import { Employers, Shift } from '../../types';

import Ellipsis from '../../components/Ellipsis';

import { setShiftEmployers } from './api';

const EmployerBox = ({
    employer,
    toggleSelect,
}: {
    employer: Employers;
    toggleSelect: (e: Employers, selected: boolean) => void;
}) => {
    const [selected, setSelected] = useState<boolean>(false);
    return (
        <Pressable
            onPress={() => {
                toggleSelect(employer, !selected);
                setSelected(!selected);
            }}
            style={[
                tailwind(
                    'h-14 w-14 m-2 flex-col justify-center rounded-lg bg-white border-green-500 border-2'
                ),
                selected ? tailwind('bg-green-500') : null,
            ]}
        >
            <Text
                style={[
                    tailwind('self-center text-2xl font-bold'),
                    selected ? tailwind('text-white') : null,
                ]}
            >
                {employer.charAt(0)}
            </Text>
        </Pressable>
    );
};

const EmployerBoxes = ({ hidden, shift }: { hidden: boolean; shift: Shift }) => {
    const auth = useSelector((state: RootState): AuthState => state.auth);
    const [selectedEmployers, setSelectedEmployers] = useState<Employers[]>([]);

    const queryClient = useQueryClient();
    const setEmployers = useMutation(setShiftEmployers, 
      {
        onSuccess: (data) => {
          console.log("Successfully set employers:", data)
          queryClient.invalidateQueries('activeShift')
        },
        onError: (data) => {
          console.log("couldnt set employers...")
        }, 
        onMutate: async (data) => {
          console.log("optimistically updating employers for shift...", data)
          const previousShift = queryClient.getQueryData('activeShift');
          await queryClient.cancelQueries('activeShift')
          const newShift = {...previousShift, employers: data.employers}
          queryClient.setQueryData('activeShift', newShift)

        }
      });
    //TODO: when user object is more complex
    const submitEmployers = () => {

        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setEmployers.mutate({
            shiftId: shift.id,
            employers: selectedEmployers,
        });
        console.log('Submitting employers...');
    };

    const updateSelectedEmployers = (e: Employers, selected: boolean): void => {
        if (!selected && selectedEmployers.includes(e)) {
            const newEmployers = selectedEmployers.filter((empl) => empl == e);
            console.log('new employers, filtered:', newEmployers);
            setSelectedEmployers(newEmployers);
        } else if (selected && !selectedEmployers.includes(e)) {
            console.log('adding employer', e);
            setSelectedEmployers([...selectedEmployers, e]);
        }
    };
    useEffect(() => {
      console.log('selected employers:', selectedEmployers)
    }, [selectedEmployers])

    const employers = auth.user?.employers
        ? auth.user.employers
        : [
              Employers.INSTACART,
              Employers.DOORDASH,
              Employers.SHIPT,
              Employers.GRUBHUB,
              Employers.UBEREATS,
          ];
    return (
        <View
            style={[
                tailwind('flex-row justify-around content-center ml-2 mr-2 pr-2 pl-2 bg-white'),
                styles.roundedBottom,
                hidden ? tailwind('hidden') : null,
            ]}
        >
            {setEmployers.status == 'loading' || setEmployers.status == 'error' ? (
                <Ellipsis style={tailwind('text-lg self-center')} />
            ) : (
                <>
                    {employers.map((e) => (
                        <EmployerBox
                            toggleSelect={updateSelectedEmployers}
                            employer={e}
                            key={e}
                        ></EmployerBox>
                    ))}
                    <Pressable
                        onPress={() => submitEmployers()}
                        style={[
                            tailwind(
                                'h-14 w-14 m-2 flex-col justify-center rounded-lg bg-white border-green-500 border-4'
                            ),
                        ]}
                    >
                        <Text style={tailwind('self-center font-bold')}>
                            <Ionicons
                                size={30}
                                style={tailwind('text-green-500')}
                                name="checkmark-done-sharp"
                            />
                        </Text>
                    </Pressable>
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    roundedBottom: {
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
    },
});

export default EmployerBoxes;
