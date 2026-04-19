export interface AiChatRequest {
    question: string;
    top_k?: number;
    gender?: string;
    category?: string;
    brand?: string;
    max_price?: number;
}

export interface AiRecommendedProduct {
    id?: number;
    name: string;
    price?: number;
    category?: string;
    brand?: string;
    thumbnail?: string;
    score?: number;
}

export interface AiChatResponse {
    answer: string;
    products: AiRecommendedProduct[];
    source_count: number;
}

const DEFAULT_AI_BASE_URL = 'http://localhost:8001';

const getAiBaseUrl = (): string => {
    return import.meta.env.VITE_AI_SERVICE_URL || DEFAULT_AI_BASE_URL;
};

export const askProductAi = async (payload: AiChatRequest): Promise<AiChatResponse> => {
    const response = await fetch(`${getAiBaseUrl()}/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        let message = 'Không thể kết nối tới AI service.';
        try {
            const data = (await response.json()) as { detail?: string; message?: string };
            message = data.detail || data.message || message;
        } catch {
            // ignore parse errors and keep default message
        }
        throw new Error(message);
    }

    return (await response.json()) as AiChatResponse;
};
