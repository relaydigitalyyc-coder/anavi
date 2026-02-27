import { http, HttpResponse } from 'msw';

export const handlers = [
    // Onfido Checks Mock
    http.post('https://api.onfido.com/v3.6/checks', async ({ request }) => {
        return HttpResponse.json({
            id: "chk_" + Math.random().toString(36).substring(7),
            status: "in_progress",
            result: null,
            created_at: new Date().toISOString()
        });
    }),

    // ComplyAdvantage AML/Sanctions Mock
    http.post('https://api.complyadvantage.com/v1/searches', async ({ request }) => {
        return HttpResponse.json({
            content: {
                data: {
                    id: "ca_" + Math.random().toString(36).substring(7),
                    match_status: "no_match",
                    risk_level: "low"
                }
            }
        });
    }),

    // DocuSign Envelope Creation Mock
    http.post('https://demo.docusign.net/restapi/v2.1/accounts/:accountId/envelopes', async ({ request, params }) => {
        return HttpResponse.json({
            envelopeId: "env_" + Math.random().toString(36).substring(7),
            uri: `/envelopes/env_mock`,
            statusDateTime: new Date().toISOString(),
            status: "sent"
        });
    }),
];
