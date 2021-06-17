import React from 'react';
import { Provider } from 'react-redux';
import { store } from '../../../store/store';
import { render, fireEvent, cleanup } from '@testing-library/react-native';
import renderer from 'react-test-renderer';

import { QueryClientProvider, QueryClient } from 'react-query';
const queryClient = new QueryClient();
const qMount = (c) => <QueryClientProvider client={queryClient}>{c}</QueryClientProvider>;

afterEach(cleanup);

import PhoneEntry from '../PhoneEntry';

describe('<PhoneEntry/>', () => {
    it('formats phone number corectly when entered', () => {
        const { getByTestId, toJSON} = render(
            qMount(
                <Provider store={store}>
                    <PhoneEntry />
                </Provider>
            )
        );
        expect(toJSON()).toMatchSnapshot()
        const phoneInput = getByTestId('phone-input')
        /* expect(getByTestId('phone-input').textContent).tobe(''); */
        fireEvent.changeText(phoneInput, "5555555555")
        expect(phoneInput.props.value).toBe("(555) 555-5555")
    });

    it('disables submit button if phone number is not correctly formatted', () => {
        const { getByTestId, toJSON} = render(
            qMount(
                <Provider store={store}>
                    <PhoneEntry />
                </Provider>
            )
        );
        expect(toJSON()).toMatchSnapshot()
        const phoneInput = getByTestId('phone-input')
        /* expect(getByTestId('phone-input').textContent).tobe(''); */
        fireEvent.changeText(phoneInput, "55564333333322")
        expect(phoneInput.props.value).toBe("55564333333322")
        const submitText = getByTestId("request-code-button-text")
        expect(submitText.props.children).toBe("Enter a Valid Number")
    });

    it('enables submit button if phone number is correctly formatted', () => {
        const { getByTestId, toJSON} = render(
            qMount(
                <Provider store={store}>
                    <PhoneEntry />
                </Provider>
            )
        );
        expect(toJSON()).toMatchSnapshot()
        const phoneInput = getByTestId('phone-input')
        /* expect(getByTestId('phone-input').textContent).tobe(''); */
        fireEvent.changeText(phoneInput, "7325630288")
        const submitText = getByTestId("request-code-button-text")
        expect(submitText.props.children).toBe("Request Code")
    });



    /* it('formats a phone number when entered', () => { */
    /*     const wrapper = mount( */
    /*         qMount( */
    /*             <Provider store={store}> */
    /*                 <PhoneEntry /> */
    /*             </Provider> */
    /*         ) */
    /*     ); */

    /*     expect(wrapper).toMatchSnapshot(); */

    /*     wrapper.find('TextInput').simulate('change', { target: { value: '5555555555' } }); */
    /*     expect(wrapper.find('TextInput').instance().value == '(555) 555-5555'); */

    /*     /1* act(() => { *1/ */
    /*     /1*     const wrapper = component.root; *1/ */
    /*     /1*     wrapper.findByType(TextInput).props.onChangeText('5555555555'); *1/ */
    /*     /1* }); *1/ */

    /*     /1* tree.props.setFormattedPhone("5555555555") *1/ */

    /*     expect(wrapper).toMatchSnapshot(); */
    /* }); */
});
