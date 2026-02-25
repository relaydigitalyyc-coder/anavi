import { eq } from "drizzle-orm";
import { ndaTemplates } from "../../drizzle/schema";
import { getDb } from "./connection";

const DEFAULT_NDA_CONTENT = `MUTUAL NON-DISCLOSURE AGREEMENT

This Mutual Non-Disclosure Agreement ("Agreement") is entered into as of {{DATE}} between:

Party A: {{PARTY_A_NAME}} ("Disclosing Party A")
Party B: {{PARTY_B_NAME}} ("Disclosing Party B")

1. CONFIDENTIAL INFORMATION
Each party may disclose to the other certain non-public, confidential, and proprietary information
("Confidential Information") in connection with evaluating a potential business transaction ("Purpose").

2. OBLIGATIONS
Each party agrees to: (a) hold all Confidential Information in strict confidence; (b) not disclose
Confidential Information to any third party without prior written consent; (c) use Confidential
Information solely for the Purpose.

3. EXCLUSIONS
Confidential Information does not include information that: (a) is or becomes publicly known through
no breach of this Agreement; (b) was rightfully known before disclosure; (c) is independently
developed without use of Confidential Information.

4. TERM
This Agreement remains in effect for two (2) years from the date of execution.

5. GOVERNING LAW
This Agreement shall be governed by the laws of {{JURISDICTION}}.

AGREED AND ACCEPTED:
Party A Signature: _______________________  Date: ______________
Party B Signature: _______________________  Date: ______________`;

export async function seedDefaultNdaTemplate(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const existing = await db
    .select({ id: ndaTemplates.id })
    .from(ndaTemplates)
    .where(eq(ndaTemplates.isDefault, true))
    .limit(1);

  if (existing.length > 0) return;

  await db.insert(ndaTemplates).values({
    name: "Standard Mutual NDA",
    content: DEFAULT_NDA_CONTENT,
    jurisdiction: "US",
    isDefault: true,
    createdBy: null,
  });
}

export async function getDefaultNdaTemplate() {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(ndaTemplates)
    .where(eq(ndaTemplates.isDefault, true))
    .limit(1);
  return result[0];
}

export async function getNdaTemplateById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(ndaTemplates)
    .where(eq(ndaTemplates.id, id))
    .limit(1);
  return result[0];
}
