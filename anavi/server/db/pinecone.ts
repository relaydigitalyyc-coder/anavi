/**
 * Pinecone Vector Database Mock Service
 * 
 * Implements a mock storage interface simulating Pinecone SDK features
 * such as vector ingestion and cosine-similarity searches. To be replaced
 * with `@pinecone-database/pinecone` API connections in Phase 3.
 */

export interface PineconeRecord {
    id: string;
    values: number[];
    metadata?: Record<string, any>;
}

class PineconeMockService {
    private fakeIndex: Map<string, PineconeRecord>;

    constructor() {
        this.fakeIndex = new Map();
    }

    async upsert(records: PineconeRecord[]): Promise<boolean> {
        for (const record of records) {
            this.fakeIndex.set(record.id, record);
        }
        console.log(`[Pinecone Mock] Upserted ${records.length} vectors.`);
        return true;
    }

    // Naive cosine similarity mock (does not actually do math, just returns a static mock match for agent sandbox)
    async query(vector: number[], topK: number = 5, filter?: Record<string, any>) {
        console.log(`[Pinecone Mock] Querying for top ${topK} neighbors with dimensionality ${vector.length}...`);

        // Simulate finding a high-confidence match
        return {
            matches: [
                {
                    id: "intent_mock_" + Math.random().toString(36).substring(7),
                    score: 0.89, // High confidence score threshold mock
                    metadata: {
                        industry: "saas",
                        dealType: "equity"
                    }
                },
                {
                    id: "intent_mock_" + Math.random().toString(36).substring(7),
                    score: 0.72,
                    metadata: {
                        industry: "fintech"
                    }
                }
            ],
            namespace: ""
        }
    }

    async delete(id: string): Promise<boolean> {
        this.fakeIndex.delete(id);
        return true;
    }
}

export const pineconeStore = new PineconeMockService();
