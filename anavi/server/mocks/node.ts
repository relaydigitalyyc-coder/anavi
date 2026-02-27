import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

// Used to start the mock server early in the development lifecycle
export function startMocks() {
    if (process.env.NODE_ENV !== 'production' && process.env.ENABLE_MOCKS === 'true') {
        server.listen({ onUnhandledRequest: 'bypass' });
        console.log('🔶 MSW Interception Enabled (Mocking Provider APIs)');
    }
}
