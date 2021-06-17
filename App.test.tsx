import React from 'react';
import renderer from 'react-test-renderer';

import App from './App';


import { QueryClientProvider, QueryClient } from 'react-query';
const queryClient = new QueryClient();
const mount = (c) => <QueryClientProvider client={queryClient}>{c}</QueryClientProvider>;

describe('<App />', () => {
    it('renders correctly', () => {
        const tree = renderer.create(mount(<App />)).toJSON() as renderer.ReactTestRendererJSON;
        expect(tree).toMatchSnapshot();
    });
});
