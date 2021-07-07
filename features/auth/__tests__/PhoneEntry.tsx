import React from 'react';
import { Provider } from 'react-redux';
import { store } from '../../../store/store';
import { render, fireEvent, cleanup, waitFor } from '@testing-library/react-native';

import { QueryClientProvider, QueryClient } from 'react-query';
const queryClient = new QueryClient();
const qMount = (c) => <QueryClientProvider client={queryClient}>{c}</QueryClientProvider>;

afterEach(cleanup);

import PhoneEntry from '../PhoneEntry';

describe('<PhoneEntry/>', () => {
    it('formats phone number corectly when entered', () => {
        const { getByTestId, toJSON } = render(
            qMount(
                <Provider store={store}>
                    <PhoneEntry />
                </Provider>
            )
        );
        expect(toJSON()).toMatchSnapshot();
        const phoneInput = getByTestId('phone-input');
        /* expect(getByTestId('phone-input').textContent).tobe(''); */
        fireEvent.changeText(phoneInput, '5555555555');
        expect(phoneInput.props.value).toBe('(555) 555-5555');
    });

    it('disables submit button if phone number is not correctly formatted', () => {
        const { getByTestId, toJSON } = render(
            qMount(
                <Provider store={store}>
                    <PhoneEntry />
                </Provider>
            )
        );
        expect(toJSON()).toMatchSnapshot();
        const phoneInput = getByTestId('phone-input');
        /* expect(getByTestId('phone-input').textContent).tobe(''); */
        fireEvent.changeText(phoneInput, '55564333333322');
        expect(phoneInput.props.value).toBe('55564333333322');
        const submitText = getByTestId('request-code-button-text');
        expect(submitText.props.children).toBe('Enter a Valid Number');
    });

    it('enables submit button if phone number is correctly formatted', () => {
        const { getByTestId, toJSON } = render(
            qMount(
                <Provider store={store}>
                    <PhoneEntry />
                </Provider>
            )
        );
        expect(toJSON()).toMatchSnapshot();
        const phoneInput = getByTestId('phone-input');
        /* expect(getByTestId('phone-input').textContent).tobe(''); */
        fireEvent.changeText(phoneInput, '7325630288');
        const submitText = getByTestId('request-code-button-text');
        expect(submitText.props.children).toBe('Request Code');
    });

    it('moves to verify otp screen if phone is submitted', async () => { 
         const { getByTestId, toJSON } = render( 
             qMount( 
                 <Provider store={store}> 
                     <PhoneEntry /> 
                 </Provider> 
             ) 
         ); 
         expect(toJSON()).toMatchSnapshot(); 
         const phoneInput = getByTestId('phone-input'); 
        //  expect(getByTestId('phone-input').textContent).tobe(''); 
         fireEvent.changeText(phoneInput, '9082298992'); 
         const submitButton = getByTestId('request-code-button'); 
         fireEvent.press(submitButton);
         expect(toJSON()).toMatchSnapshot(); 
         await waitFor(() => expect(getByTestId('verify-code-button')).toBeTruthy()) 
     }); 

});
