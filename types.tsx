import { StringValueNode } from 'graphql/language/ast';
import { LatLng } from 'react-native-maps';

export type RootStackParamList = {
    Root: undefined;
    NotFound: undefined;
};

export type BottomTabParamList = {
    TabOne: undefined;
    TabTwo: undefined;
};

export type TabOneParamList = {
    TabOneScreen: undefined;
};

export type TabTwoParamList = {
    TabTwoScreen: undefined;
};

export type BoundingBox = {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
};

export type MapLine = {
    geometries: [number, number][];
    bounding_box: BoundingBox;
};

export type LocationInput = {
    lat: number;
    lng: number;
    timestamp: Date;
    accuracy: number;
};

// if you change this, make sure this is the same as the enum in our database
export enum Employers {
    INSTACART = 'INSTACART',
    DOORDASH = 'DOORDASH',
    SHIPT = 'SHIPT',
    GRUBHUB = 'GRUBHUB',
    UBEREATS = 'UBEREATS',
}

export type WeeklySummary = {
    earnings: number,
    expenses: number,
    miles: number,
    numJobs: number,
    numShifts: number,
    totalPay: number,
    totalTips: number,
    meanTips: number,
    meanPay: number
}

export type Job = {
    id: string;
    startTime: Date;
    endTime: Date | undefined;
    startLocation: LatLng | string;
    endLocation: LatLng | string;
    mileage: number;
    estimatedMileage: number | undefined;
    totalPay: number | undefined;
    tip: number | undefined;
    employer: Employers;
    snappedGeometry: string;
    shiftId: string;
    screenshots: Screenshot[]
};

export type Shift = {
    id: string;
    active: boolean;
    startTime: Date;
    roadSnappedMiles: number;
    snappedGeometry: string | MapLine;
    employers: Employers[];
    jobs: {edges: [{node: Job}]}
};

export type Screenshot = {
    id: string;
    shiftId: string;
    onDeviceUri: string;
    imgFilename: string;
    timestamp: Date;
    userId: string;
    employer: string;
};

export type Consent = {
    userId: string;
    dateModified: Date;
    dateCreated: Date;
    dataSharing: Boolean | null;
    interview: Boolean | null;
    consented: Boolean | null;
    signatureFilename: string
}

export type User = {
    consent: Consent;
    dateCreated: Date;
    email?: string
    phone?: string
    name?: string
}