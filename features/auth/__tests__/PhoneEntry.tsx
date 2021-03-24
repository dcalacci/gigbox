import React from 'react'
import { Provider } from 'react-redux'
import {store, persistor} from "../../../store/store"
import renderer from 'react-test-renderer'


import PhoneEntry from '../PhoneEntry'

describe('<PhoneEntry/>', () => {
    it('has 1 child', () => {
        const tree = renderer.create(
            <Provider store={store}>
                <PhoneEntry />
            </Provider>
        ).toJSON() as renderer.ReactTestRendererJSON;
        expect(tree?.children?.length).toBe(2)
    })

})

