import React from 'react';
import { Provider } from 'react-redux';
import { store } from '../../../store/store';
import { render, fireEvent, cleanup, waitFor } from '@testing-library/react-native';

import { QueryClientProvider, QueryClient } from 'react-query';
const queryClient = new QueryClient();
const qMount = (c) => <QueryClientProvider client={queryClient}>{c}</QueryClientProvider>;

import { ConsentFlow } from '../ConsentFlow';

afterEach(cleanup);

describe('<ConsentFlow/>', () => {
    it('should ask for location permissions if we have none', () => {
        const { getByTestId, toJSON } = render(qMount(<ConsentFlow />));

        expect(toJSON()).toMatchSnapshot();
        const locationDataConsentYes = getByTestId('location-data-consent-yes');
        fireEvent.press(locationDataConsentYes);
    });
});
