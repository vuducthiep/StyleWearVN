import { useEffect, useMemo, useRef, useState } from 'react';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import AIChatHero from './components/AIChatHero';
import AIChatChatPanel from './components/AIChatChatPanel';
import AIChatSidebar from './components/AIChatSidebar';
import type { ChatMessage } from './AIChat.types';
import { askProductAi } from '../../../services/aiChat';

const quickPrompts = [
    'Gợi ý áo nam dưới 500k dễ phối đồ',
    'Tôi cần áo sơ mi nam giá từ 300k đến 700k',
    'Tôi muốn mua váy nữ màu xanh dương',
    'Tôi đang tìm quần jean nữ dáng rộng',
];

const CHAT_HISTORY_STORAGE_KEY = 'stylestore-ai-chat-history-v1';

const welcomeMessage: ChatMessage = {
    id: 'welcome',
    role: 'assistant',
    content:
        'Mình là trợ lý tư vấn sản phẩm của StyleStore. Hãy mô tả nhu cầu, mức giá, giới tính, chất liệu hoặc màu sắc, mình sẽ gợi ý sản phẩm phù hợp.',
};

const isChatMessageArray = (value: unknown): value is ChatMessage[] => {
    if (!Array.isArray(value)) {
        return false;
    }

    return value.every((item) => {
        if (!item || typeof item !== 'object') {
            return false;
        }

        const candidate = item as ChatMessage;
        return typeof candidate.id === 'string' && (candidate.role === 'user' || candidate.role === 'assistant') && typeof candidate.content === 'string';
    });
};

const getInitialMessages = (): ChatMessage[] => {
    if (typeof window === 'undefined') {
        return [welcomeMessage];
    }

    try {
        const stored = window.localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
        if (!stored) {
            return [welcomeMessage];
        }

        const parsed = JSON.parse(stored) as unknown;
        if (!isChatMessageArray(parsed) || parsed.length === 0) {
            return [welcomeMessage];
        }

        return parsed;
    } catch {
        return [welcomeMessage];
    }
};

const extractMaxPrice = (question: string): number | undefined => {
    const normalized = question.toLowerCase().replace(/[,]/g, '.');
    const patterns = [
        /(?:dưới|duoi|không quá|khong qua|tối đa|toi da|<=|<)\s*(\d+(?:\.\d+)?)\s*(triệu|tr|nghìn|ngan|k)?/i,
        /(\d+(?:\.\d+)?)\s*(triệu|tr|nghìn|ngan|k)\s*(?:trở xuống|tro xuong)?/i,
    ];

    for (const pattern of patterns) {
        const match = normalized.match(pattern);
        if (!match) {
            continue;
        }

        const value = Number.parseFloat(match[1]);
        if (Number.isNaN(value)) {
            continue;
        }

        const unit = match[2];
        if (unit === 'triệu' || unit === 'tr') {
            return value * 1_000_000;
        }

        if (unit === 'nghìn' || unit === 'ngan' || unit === 'k') {
            return value * 1_000;
        }

        return value;
    }

    return undefined;
};

const AIChatPage = () => {
    const [messages, setMessages] = useState<ChatMessage[]>(() => getInitialMessages());
    const [draft, setDraft] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const listRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!listRef.current) {
            return;
        }
        listRef.current.scrollTop = listRef.current.scrollHeight;
    }, [messages, isLoading]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        try {
            window.localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(messages));
        } catch {
            // Ignore local storage quota or privacy errors.
        }
    }, [messages]);

    const lastAssistantProducts = useMemo(() => {
        for (let i = messages.length - 1; i >= 0; i -= 1) {
            const item = messages[i];
            if (item.role === 'assistant' && item.products && item.products.length > 0) {
                return item.products;
            }
        }
        return [];
    }, [messages]);

    const sendMessage = async (question: string) => {
        const trimmed = question.trim();
        if (!trimmed || isLoading) {
            return;
        }

        setDraft('');
        setError('');
        setIsLoading(true);

        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: trimmed,
        };

        setMessages((prev) => [...prev, userMessage]);

        try {
            const maxPrice = extractMaxPrice(trimmed);
            const result = await askProductAi({
                question: trimmed,
                top_k: 4,
                max_price: maxPrice,
            });

            const assistantMessage: ChatMessage = {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: result.answer || 'Mình chưa tìm thấy gợi ý phù hợp. Hãy thử mô tả cụ thể hơn.',
                products: result.products || [],
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Không thể lấy phản hồi từ AI.');
            setMessages((prev) => [
                ...prev,
                {
                    id: `assistant-error-${Date.now()}`,
                    role: 'assistant',
                    content: 'Đã xảy ra lỗi khi tư vấn. Vui lòng thử lại sau.',
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.18),_transparent_32%),linear-gradient(180deg,_#fff7ed_0%,_#fffdf8_42%,_#f8fafc_100%)]">
            <Header />

            <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
                <div className="mx-auto max-w-7xl">
                    <AIChatHero quickPrompts={quickPrompts} onPromptClick={sendMessage} />

                    <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
                        <div className="min-w-0">
                            <AIChatChatPanel
                                messages={messages}
                                draft={draft}
                                isLoading={isLoading}
                                error={error}
                                onDraftChange={setDraft}
                                onSendMessage={sendMessage}
                                onClearChat={() => {
                                    setMessages([welcomeMessage]);
                                    if (typeof window !== 'undefined') {
                                        window.localStorage.removeItem(CHAT_HISTORY_STORAGE_KEY);
                                    }
                                }}
                                listRef={listRef}
                            />
                        </div>

                        <div className="min-w-0">
                            <AIChatSidebar products={lastAssistantProducts} />
                        </div>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default AIChatPage;
