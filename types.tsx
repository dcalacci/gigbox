import { LatLng } from 'react-native-maps'

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
    lat: number
    lng: number
    timestamp: Date,
    accuracy: number
}


// if you change this, make sure this is the same as the enum in our database
export enum Employers {
    INSTACART="INSTACART",
    DOORDASH="DOORDASH",
    SHIPT="SHIPT",
    GRUBHUB="GRUBHUB",
    UBEREATS="UBEREATS"
}

export type Job = {
    id: string,
   startTime: Date,
   endTime: Date | undefined,
   startLocation: LatLng,
   mileage: number,
   estimatedMileage: number | undefined,
   totalPay: number | undefined,
   tip: number | undefined,
   employer: Employers

}

export type Shift = {
    id: string;
    active: boolean;
    startTime: Date;
    roadSnappedMiles: number;
    snappedGeometry: string | MapLine;
    employers: Employers[]
    jobs: Job[]
};

export type Screenshot = {
    shiftId: string;
    onDeviceUri: string;
    imgFilename: string;
    timestamp: Date;
    userId: string;
    employer: string;
};
