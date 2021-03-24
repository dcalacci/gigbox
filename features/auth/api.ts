import { fetchWithQueryParams, uri} from "../../utils"
//TODO: interface for checking if currently authenticated with server (if token is valid)

export interface OtpResponse {
    status: number,
    message: string
}

/**
 * 
 * @param phone Request a one-time passcode from our API
 * @returns A promise that resolves to an OtpResponse
 */
export const getOtp = async (phone: string): Promise<OtpResponse> => {
    const response = await fetchWithQueryParams(`${uri}/api/v1/auth/get_otp`,
        { phone: phone }, 'POST')
    const data = response.json()
    return data
}

export interface VerifyOtpResponse {
    status: number,
    message: string,
    user_id: string,
    authenticated: boolean,
    userCreated: boolean,
}

/**
 * Login / verify one-time-passcode for a given phone
 * @param phone phone to verify for
 * @param otp one-time passcode
 * @returns a VerifyOtpResponse with OTP login data
 */
export const verifyOtp = async (phone: string, otp: string): Promise<VerifyOtpResponse | OtpResponse> => {
    const response = await fetchWithQueryParams(`${uri}/api/v1/auth/verify_otp`,
        { phone, otp }, 'POST')
    const data = response.json()
    return data
}

export enum AuthResponseTypes {
    OtpResponse,
    VerifyOtpResponse
}