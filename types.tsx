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

export type Shift = {
    id: string;
    active: boolean;
    startTime: Date;
    roadSnappedMiles: number;
    snappedGeometry: string | MapLine;
};

export type Screenshot = {
    shiftId: string;
    onDeviceUri: string;
    imgFilename: string;
    timestamp: Date;
    userId: string;
    employer: string;
};
