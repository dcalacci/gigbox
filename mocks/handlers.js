// mocks/handlers.js
import { rest } from 'msw';

export const handlers = [
    // Handles a POST /login request
    rest.post('https://dev.gigbox.app/api/v1/auth/get_otp', (req, res, ctx) => {
        //TODO: check if phone given in request is valid
        console.log('HIT MOCKED ENDPOINT');
        return res(
            ctx.json({
                status: 200,
                message: 'Success',
                message_sid: 'fake-sid',
            })
        );
    }),
    rest.post('/api/v1/auth/verify_otp', null),
    rest.post('/api/v1/auth/login', null),
];
