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

export type Job = {
    id: string,
   startTime: Date,
   endTime: Date | undefined,
   startLocation: LatLng,
   mileage: number,
   estimatedMileage: number | undefined,
   totalPay: number | undefined,
   tip: number | undefined,
   employer: string

}

export type Shift = {
    id: string;
    active: boolean;
    startTime: Date;
    roadSnappedMiles: number;
    snappedGeometry: string | MapLine;
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
