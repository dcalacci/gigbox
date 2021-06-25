// component to allow user to select employers they're working for
// on a particular shift.
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, LayoutAnimation, ViewStyle } from 'react-native';
import { tailwind } from 'tailwind';
import { Employers } from '../../types';

import Ellipsis from '../../components/Ellipsis';

export const EmployerBox = ({
    employer,
    toggleSelect,
    selectedEmployers,
    size,
    style,
}: {
    employer: Employers;
    selectedEmployers?: Employers[];
    toggleSelect?: (e: Employers, selected: boolean) => void;
    size?: number;
    style?: ViewStyle;
}) => {
    const [selected, setSelected] = useState<boolean>(false);
    useEffect(() => {
        if (selectedEmployers?.includes(employer)) {
            setSelected(true);
        } else {
            setSelected(false);
        }
    }, [selectedEmployers]);
    const sizeStr = size ? `h-${size} w-${size}` : 'h-12 w-12';
    const textSize = size && size < 14 ? 'text-sm' : 'text-2xl';
    return (
        <Pressable
            onPress={() => {
                toggleSelect(employer, !selected);
                setSelected(!selected);
            }}
            style={[
                tailwind(
                    `${sizeStr} m-1 flex-col justify-center rounded-lg bg-white border-green-500 border-2`
                ),
                selected ? tailwind('bg-green-500') : null,
                style,
            ]}
        >
            <Text
                style={[
                    tailwind(` ${textSize} self-center font-bold`),
                    selected ? tailwind('text-white') : null,
                ]}
            >
                {employer ? employer.charAt(0) : "?"}
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
    onEmployersSubmitted: (employers: Employers | Employers[]) => void;
    submissionStatus: string;
    singleSelect: boolean;
}) => {
    const [selectedEmployers, setSelectedEmployers] = useState<Employers[]>([]);

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
            const newEmployers = selectedEmployers.filter((empl) => empl != e);
            console.log('new employers, filtered:', newEmployers);
            setSelectedEmployers(newEmployers);
        } else if (selected && !selectedEmployers.includes(e)) {
            console.log('adding employer', e);
            setSelectedEmployers([...selectedEmployers, e]);
        }
    };

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
                tailwind('flex-row justify-around justify-center content-center ml-2 mr-2 pr-2 pl-2 bg-white'),
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
                                'h-12 w-12 m-1 flex-col justify-center rounded-lg bg-white border-green-500 border-4'
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
