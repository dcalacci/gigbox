// component to allow user to select employers they're working for
// on a particular shift.
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, LayoutAnimation } from 'react-native';
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
    selectedEmployers,
}: {
    employer: Employers;
    selectedEmployers: Employers[];
    toggleSelect: (e: Employers, selected: boolean) => void;
}) => {
    const [selected, setSelected] = useState<boolean>(false);
    useEffect(() => {
        if (selectedEmployers.includes(employer)) {
            setSelected(true);
        } else {
            setSelected(false);
        }
    }, [selectedEmployers]);
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

const EmployerBoxes = ({
    potentialEmployers,
    onEmployersSubmitted,
    submissionStatus,
    singleSelect = false,
}: {
    potentialEmployers: Employers[];
    onEmployersSubmitted: ((employers: Employers[]) => void) | ((employer: Employers) => void);
    submissionStatus: string;
    singleSelect: boolean;
}) => {
    const auth = useSelector((state: RootState): AuthState => state.auth);
    const [selectedEmployers, setSelectedEmployers] = useState<Employers[]>([]);

    console.log('potential employers:', potentialEmployers);

    //TODO: when user object is more complex
    const submitEmployers = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        onEmployersSubmitted(selectedEmployers);
    };

    // employer enum and whether it was selected (true = it's selected on users screen)
    const updateSelectedEmployers = (e: Employers, selected: boolean): void => {
        // if single select, only one is ever selected
        if (selected && singleSelect) {
            setSelectedEmployers([e]);
        } else if (!selected && singleSelect) {
            setSelectedEmployers([]);
            // otherwise...
        } else if (!selected && selectedEmployers.includes(e)) {
            const newEmployers = selectedEmployers.filter((empl) => empl == e);
            console.log('new employers, filtered:', newEmployers);
            setSelectedEmployers(newEmployers);
        } else if (selected && !selectedEmployers.includes(e)) {
            console.log('adding employer', e);
            setSelectedEmployers([...selectedEmployers, e]);
        }
    };

    useEffect(() => {
        console.log('selected employers:', selectedEmployers);
    }, [selectedEmployers]);

    const employers = potentialEmployers
        ? potentialEmployers
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
            ]}
        >
            {submissionStatus == 'loading' || submissionStatus == 'error' ? (
                <Ellipsis style={tailwind('text-lg self-center')} />
            ) : (
                <>
                    {employers.map((e) => (
                        <EmployerBox
                            toggleSelect={updateSelectedEmployers}
                            employer={e}
                            selectedEmployers={selectedEmployers}
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
