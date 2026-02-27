import { GoogleGenAI } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';
import { OpenAI } from 'openai';
import { ENV } from './env';

export type LLMProvider = 'openai' | 'anthropic' | 'gemini';

export interface LLMConfig {
    provider: LLMProvider;
    model: string;
}

const defaultProvider: LLMProvider = 'openai';

class LLMFactory {
    private openaiClient?: OpenAI;
    private anthropicClient?: Anthropic;
    private geminiClient?: GoogleGenAI;

    constructor() {
        // Initialize clients eagerly if keys are available
        if (process.env.OPENAI_API_KEY) {
            this.openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        }

        if (process.env.ANTHROPIC_API_KEY) {
            this.anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        }

        if (process.env.GEMINI_API_KEY) {
            this.geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        }
    }

    async generateEmbedding(text: string, provider: LLMProvider = defaultProvider): Promise<number[]> {
        if (provider === 'openai' && this.openaiClient) {
            const response = await this.openaiClient.embeddings.create({
                model: "text-embedding-3-small",
                input: text,
            });
            return response.data[0].embedding;
        }

        if (provider === 'gemini' && this.geminiClient) {
            const response = await this.geminiClient.models.embedContent({
                model: 'text-embedding-004',
                contents: text,
            });
            return response.embeddings?.[0]?.values || [];
        }

        // Anthropic doesn't have a native embeddings API yet, fallback to OpenAI if not supported
        throw new Error(`Embedding generation not supported or configured for provider: ${provider}`);
    }

    // Common Text Generation wrapper
    async generateText(prompt: string, provider: LLMProvider = defaultProvider): Promise<string> {
        if (provider === 'openai' && this.openaiClient) {
            const res = await this.openaiClient.chat.completions.create({
                model: 'gpt-4-turbo',
                messages: [{ role: 'user', content: prompt }]
            });
            return res.choices[0].message.content || '';
        }

        if (provider === 'anthropic' && this.anthropicClient) {
            const res = await this.anthropicClient.messages.create({
                model: 'claude-3-opus-20240229',
                max_tokens: 1024,
                messages: [{ role: 'user', content: prompt }]
            });
            if (res.content[0].type === 'text') {
                return res.content[0].text;
            }
            return '';
        }

        if (provider === 'gemini' && this.geminiClient) {
            const res = await this.geminiClient.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });
            return res.text || '';
        }

        throw new Error(`Text generation not configured for provider: ${provider}`);
    }
}

export const llmService = new LLMFactory();
