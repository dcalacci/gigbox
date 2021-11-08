import * as Linking from 'expo-linking';

export default {
    // I removed this because I don't think we use these links, and it breaks our testing
    // prefixes: [Linking.makeUrl('/', { scheme: 'gigbox' })],
    config: {
        screens: {
            Root: {
                screens: {
                    TabOne: {
                        screens: {
                            TabOneScreen: 'one',
                        },
                    },
                    TabTwo: {
                        screens: {
                            TabTwoScreen: 'two',
                        },
                    },
                },
            },
            NotFound: '*',
        },
    },
};
