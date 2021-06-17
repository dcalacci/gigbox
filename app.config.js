export default {
    name: 'Gigbox',
    slug: 'gigbox',
    description: 'Free, open-source work tracker designed with & for gig workers.',
    version: '1.0.1',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    primaryColor: '#2BBC8A',
    scheme: 'myapp',
    userInterfaceStyle: 'automatic',
    extra: {
        devApiUrl: process.env.DEV_API_URL,
        prodApiUrl: process.env.PROD_API_URL,
    },
    splash: {
        image: './assets/images/splash.png',
        resizeMode: 'cover',
        backgroundColor: '#2BBC8A',
    },
    updates: {
        fallbackToCacheTimeout: 0,
    },
    assetBundlePatterns: ['**/*'],
    ios: {
        supportsTablet: true,
        infoPlist: {
            NSPhotoLibraryUsageDescription:
                'Gigbox needs access to your photos to automatically recognize screenshots of gig apps to help track your jobs.',
            NSLocationWhenInUseUsageDescription:
                'Gigbox needs access to your location to track your mileage and job activity.',
            NSLocationAlwaysUsageDescription:
                "'Alway On' will let Gigbox access your location while you're tracking jobs, even when Gigbox is in the background.",
            UIBackgroundModes: ['location'],
        },
        bundleIdentifier: 'mit.media.hd.gigbox',
    },
    android: {
        package: 'mit.media.hd.gigbox',
        versionCode: 1,
        config: {
            googleMaps: {
                apiKey: process.env.GOOGLE_API_KEY,
            },
        },
        adaptiveIcon: {
            foregroundImage: './assets/images/adaptive-icon.png',
            backgroundColor: '#FFFFFF',
        },
        permissions: [
            'ACCESS_COARSE_LOCATION',
            'ACCESS_FINE_LOCATION',
            'ACCESS_BACKGROUND_LOCATION',
            'READ_EXTERNAL_STORAGE',
            'WRITE_EXTERNAL_STORAGE',
        ],
    },
    web: {
        favicon: './assets/images/favicon.png',
    },
};
