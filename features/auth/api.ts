import { fetchWithQueryParams } from "../../utils"

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
    const response = await fetchWithQueryParams('http://localhost:5000/api/v1/auth/get_otp',
        { phone: phone }, 'POST')
    const data = response.json()
    return data
}

export interface VerifyOtpResponse {
    status: number,
    message: string,
    phone: string,
    otp: string
}

export const verifyOtp = async (phone: string, otp: string): Promise<VerifyOtpResponse> => {
    const response = await fetchWithQueryParams('http://localhost:5000/api/v1/auth/verify_otp',
        { phone: phone }, 'POST')
    const data = response.json()
    return data
}

export enum AuthResponseTypes {
    OtpResponse,
    VerifyOtpResponse
}