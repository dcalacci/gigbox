import { StackNavigationProp } from '@react-navigation/stack';
import { StringValueNode } from 'graphql/language/ast';
import { LatLng } from 'react-native-maps';
import { JobFilter } from './components/FilterPills';

export type RootStackParamList = {
    Home: undefined;
    Jobs: {
        filters: JobFilter
    }
    NotFound: undefined;
};

export type BottomTabParamList = {
    Home: undefined;
    Jobs: undefined;
    'Your Stats': undefined;
    Settings: undefined
};

export type HomeParamList = {
    Home: undefined;
    Survey: {
        surveys: {node: Survey}
    },
};

export type TabTwoParamList = {
    TabTwoScreen: undefined;
};

export type HomeScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Home'
>;

export type TripsScreenNavigationProp = StackNavigationProp<RootStackParamList, "Trips">;


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
    endTime: Date;
    startLocation: string;
    endLocation: string;
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
    employers: Employers[];
    email?: string
    phone?: string
    name?: string
}

export enum QuestionType {
    TEXT = "TEXT",
    CHECKBOX = "CHECKBOX",
    MULTISELECT = "MULTISELECT",
    NUMBER = "NUMBER",
    RANGE = "RANGE",
    SELECT = "SELECT"
}
export type RangeOptions = {
    startVal: Number
    endVal: Number
    interval: Number
}

export type Answer = {
    user: User,
    question: Question
    date: Date
    answerText: string | undefined
    answerNumeric: Number | undefined
    answerOptions: string[] | undefined
    answerYn: Boolean | undefined
}

export type Question = {
    questionText: String
    questionType: QuestionType
    selectOptions: string[] | undefined
    rangeOptions: RangeOptions | undefined
    survey: Survey
    answers: Answer[]
    id: string
}

export type Survey = {
    startDate: Date;
    id: string;
    endDate: Date | undefined;
    title: string;
    daysAfterInstall: number;
    questions: {edges: {node: Question}[]}
}
