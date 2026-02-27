/**
 * Stripe Connect Escrow Mock Service
 * 
 * Simulates the integration with Stripe Connect for multi-party transaction 
 * disbursements and custodial holds defined in the Webaroo Spec.
 */

export class StripeConnectMock {

    async createCustomAccount(email: string) {
        console.log(`[Stripe Mock] Creating Connect Account for: ${email}`);
        return "acct_mock_" + Math.random().toString(36).substring(7);
    }

    async createEscrowHold(amountCents: number, currency: string = "usd") {
        console.log(`[Stripe Mock] Placing $${(amountCents / 100).toFixed(2)} in Escrow Hold`);
        return "pi_mock_" + Math.random().toString(36).substring(7);
    }

    async disburseFunds(paymentIntentId: string, destinationAccountId: string, amountCents: number) {
        console.log(`[Stripe Mock] Disbursing $${(amountCents / 100).toFixed(2)} to Connect Account: ${destinationAccountId}`);
        return "tr_mock_" + Math.random().toString(36).substring(7);
    }
}

export const escrowService = new StripeConnectMock();
