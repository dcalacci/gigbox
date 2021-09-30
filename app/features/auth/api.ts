import { fetchWithQueryParams, uri } from '../../utils';
import { User } from '../../types';

export interface OtpResponse {
    status: number;
    message: string;
    phone: string;
}

/**
 *
 * @param phone Request a one-time passcode from our API
 * @returns A promise that resolves to an OtpResponse
 */
export const getOtp = async (phone: string): Promise<OtpResponse> => {
    const response = await fetchWithQueryParams(
        `${uri}/api/v1/auth/get_otp`,
        { phone: phone },
        'POST'
    );
    console.log(` SENDING REQUEST TO: ${uri}/api/v1/auth/get_otp`);
    const data = await response.json();
    return { ...data, phone };
};

export interface VerifyOtpResponse {
    status: number;
    message: string;
    user_id: string;
    authenticated: boolean;
    userCreated: boolean;
}

/**
 * Login / verify one-time-passcode for a given phone
 * @param phone phone to verify for
 * @param otp one-time passcode
 * @returns a VerifyOtpResponse with OTP login data
 */
export const verifyOtp = async (
    phone: string,
    otp: string
): Promise<VerifyOtpResponse | OtpResponse> => {
    const response = await fetchWithQueryParams(
        `${uri}/api/v1/auth/verify_otp`,
        { phone, otp },
        'POST'
    );
    const data = response.json();
    return data;
};

export interface LogInResponse {
    status: number;
    message?: string;
    onboarded?: boolean;
    user_id?: string;
    user?: User;
    authenticated: boolean;
}

export const logIn = async (jwt: string | null): Promise<LogInResponse> => {
    if (!jwt) {
        console.log('No token found. Not authenticated.');
        return {
            status: 401,
            onboarded: false,
            authenticated: false,
        };
    }
    const response = await fetchWithQueryParams(
        `${uri}/api/v1/auth/login`,
        {},
        'POST',
        new Headers({
            authorization: jwt,
        })
    );
    const data = response.json();
    return data;
};

export enum AuthResponseTypes {
    OtpResponse,
    VerifyOtpResponse,
}
