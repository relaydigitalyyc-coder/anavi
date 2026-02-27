/**
 * AI Matching Engine
 * 
 * Responsible for parsing user intents into vectors via the 
 * model-agnostic `llmFactory` and comparing them against the 
 * `pineconeStore` vector database for intent matchmaking.
 */
import { llmService } from '../_core/llmFactory';
import { pineconeStore } from '../db/pinecone';

export class MatchingEngine {

    /**
     * Parses raw unstructured deal criteria into a vectorized embedding,
     * stores it in Pinecone, and returns matching candidates > 85% confidence score.
     */
    async processAndMatchIntent(intentId: string, rawText: string) {
        console.log(`[Matching Engine] Generating embeddings for intent: ${intentId}`);

        // 1. Generate Embedding using universal LLM layer (Defaults to OpenAI `text-embedding-3-small` in factory)
        // Supports fallback to Gemini if configured
        const embedding = await llmService.generateEmbedding(rawText);

        // 2. Persist Vector in Pinecone DB
        await pineconeStore.upsert([{
            id: intentId,
            values: embedding,
            metadata: { sourceText: rawText.substring(0, 50) } // Example metadata snippet
        }]);

        // 3. Query Pinecone for semantic matches
        console.log(`[Matching Engine] Searching vector space for candidates...`);
        const results = await pineconeStore.query(embedding, 5);

        // 4. Filter by confidence threshold (> 85% match confidence as per PRD)
        const highConfidenceMatches = results.matches.filter(match => (match.score || 0) > 0.85);

        return {
            success: true,
            matchesFound: highConfidenceMatches.length,
            candidates: highConfidenceMatches
        }
    }
}

export const aiMatchingEngine = new MatchingEngine();
