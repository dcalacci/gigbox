import React, { useState } from 'react';
import { Pressable, View, Text } from 'react-native';
import { useMutation } from 'react-query';
import { tailwind } from 'tailwind';
import { updateJobEmployer } from '../features/jobs/api';
import ModalPicker from './ModalPicker';
import { Job, Employers } from '../types';

export default ({
    job,
    onEmployerChange = undefined,
    submitChange = true,
}: {
    job: Job;
    onEmployerChange?: (e: Employers) => void;
    submitChange?: boolean;
}) => {
    const [selectedEmployer, setSelectedEmployer] = useState<String | undefined>(job.employer);
    const [open, setOpen] = useState<boolean>(false);

    const updateJob = useMutation(['updateJobEmployer', job.id], updateJobEmployer);

    return (
        <View style={tailwind('m-1 pl-2 pr-2')}>
            <Text style={tailwind('text-base text-black p-0 m-0')}>Service</Text>
            <Pressable
                style={tailwind('flex flex-col rounded-lg w-40 flex-col bg-gray-100 p-1')}
                onPress={() => setOpen(true)}
            >
                <ModalPicker
                    options={Object.keys(Employers)}
                    onSelectOption={(option) => {
                        setSelectedEmployer(option);
                        setOpen(false);
                        if (option === 'Select Service') {
                            return;
                        } else {
                            const enumEmployer: Employers = option as Employers;
                            if (onEmployerChange) onEmployerChange(enumEmployer);
                            if (submitChange && job.id) {
                                console.log('job:', job);
                                updateJob.mutate({
                                    jobId: job.id,
                                    employer: enumEmployer,
                                });
                            }
                        }
                    }}
                    onClose={() => setOpen(false)}
                    isOpen={open}
                    defaultText={'Select Service'}
                    promptText={'What service was this job for?'}
                />
                <View style={tailwind('flex-row items-center')}>
                    <Text style={tailwind('p-1 text-black')}>{selectedEmployer}</Text>
                </View>
            </Pressable>
        </View>
    );
};
