import { invokeLLM } from "./llm";

const EMBEDDING_DIM = 32;

/**
 * Generate a 32-float embedding for text using the LLM.
 * Used for semantic intent matching.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text.trim()) {
    return new Array(EMBEDDING_DIM).fill(0);
  }

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are an embedding model. For the given text, return a JSON object with a single key "embedding" containing an array of exactly ${EMBEDDING_DIM} floats between -1 and 1 that represent the semantic meaning of the text. Normalize so values are typically in [-0.5, 0.5]. Return nothing else.`,
      },
      { role: "user", content: text.slice(0, 2000) },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "embedding",
        strict: true,
        schema: {
          type: "object",
          properties: {
            embedding: {
              type: "array",
              items: { type: "number" },
              minItems: EMBEDDING_DIM,
              maxItems: EMBEDDING_DIM,
            },
          },
          required: ["embedding"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("Empty embedding response");
  }

  const parsed = JSON.parse(content) as { embedding?: number[] };
  const arr = parsed.embedding;
  if (!Array.isArray(arr) || arr.length !== EMBEDDING_DIM) {
    throw new Error(`Invalid embedding: expected ${EMBEDDING_DIM} floats`);
  }
  return arr.map((n) => (typeof n === "number" ? n : 0));
}

/**
 * Cosine similarity between two vectors. Returns value in [-1, 1].
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
