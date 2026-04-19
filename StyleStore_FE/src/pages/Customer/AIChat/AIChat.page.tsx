import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Bot, Sparkles, ShoppingBag, RefreshCw } from 'lucide-react';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { askProductAi, type AiRecommendedProduct } from '../../../services/aiChat';

type ChatMessage = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    products?: AiRecommendedProduct[];
};

const quickPrompts = [
    'Gợi ý áo nam dưới 500k dễ phối đồ',
    'Tôi cần đồ cho nữ đi làm, màu trung tính',
    'Tư vấn sản phẩm theo phong cách trẻ trung, thoải mái',
    'Gợi ý sản phẩm theo danh mục mới nhất',
];

const formatPrice = (price?: number) => {
    if (price === undefined || price === null) {
        return 'Liên hệ';
    }

    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(price);
};

const AIChatPage = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content:
                'Mình là trợ lý tư vấn sản phẩm của StyleStore. Hãy mô tả nhu cầu, mức giá, giới tính, chất liệu hoặc màu sắc, mình sẽ gợi ý sản phẩm phù hợp.',
        },
    ]);
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
            const result = await askProductAi({
                question: trimmed,
                top_k: 4,
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
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.18),_transparent_32%),linear-gradient(180deg,_#fff7ed_0%,_#fffdf8_42%,_#f8fafc_100%)] flex flex-col">
            <Header />

            <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-6xl">
                    <section className="mb-8 overflow-hidden rounded-[2rem] border border-orange-200/70 bg-white/75 shadow-[0_30px_80px_-30px_rgba(234,88,12,0.35)] backdrop-blur-xl">
                        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                            <div className="p-8 sm:p-10 lg:p-12">
                                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700">
                                    <Sparkles className="h-4 w-4" />
                                    AI tư vấn sản phẩm
                                </div>
                                <h1 className="max-w-xl text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                                    Chọn đúng sản phẩm nhanh hơn, ít phải đoán hơn.
                                </h1>
                                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                                    Hỏi theo nhu cầu thực tế như giới tính, phong cách, ngân sách, màu sắc hoặc chất liệu.
                                    AI sẽ đọc catalog hiện tại và gợi ý sản phẩm phù hợp nhất.
                                </p>

                                <div className="mt-6 flex flex-wrap gap-3">
                                    {quickPrompts.map((prompt) => (
                                        <button
                                            key={prompt}
                                            type="button"
                                            onClick={() => sendMessage(prompt)}
                                            className="rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:text-orange-700"
                                        >
                                            {prompt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-8 text-white sm:p-10 lg:p-12">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/20 text-orange-300">
                                        <Bot className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-300">Tư vấn theo catalog thực tế</p>
                                        <p className="text-lg font-semibold">RAG + LangChain</p>
                                    </div>
                                </div>

                                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                                    {[
                                        'Gợi ý theo giá',
                                        'Gợi ý theo giới tính',
                                        'Gợi ý theo danh mục',
                                        'Gợi ý theo chất liệu',
                                    ].map((item) => (
                                        <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                            <p className="text-sm font-medium text-slate-100">{item}</p>
                                        </div>
                                    ))}
                                </div>

                                <p className="mt-8 text-sm leading-6 text-slate-300">
                                    Phù hợp khi khách cần hỏi nhanh kiểu “nên mua gì”, “mẫu nào hợp”, hoặc “sản phẩm nào dưới mức giá X”.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)]">
                            <div className="border-b border-slate-100 px-6 py-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900">Chat với AI</h2>
                                        <p className="text-sm text-slate-500">Gõ câu hỏi hoặc chọn một gợi ý sẵn.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setMessages(messages.slice(0, 1))}
                                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-orange-300 hover:text-orange-600"
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                        Xóa đoạn chat
                                    </button>
                                </div>
                            </div>

                            <div ref={listRef} className="max-h-[34rem] space-y-4 overflow-y-auto bg-slate-50/80 px-6 py-5">
                                {messages.map((message) => {
                                    const isUser = message.role === 'user';
                                    return (
                                        <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                                            <div
                                                className={`max-w-[85%] rounded-[1.5rem] px-4 py-3 shadow-sm ${isUser
                                                    ? 'bg-orange-500 text-white'
                                                    : 'bg-white text-slate-800 border border-slate-200'
                                                    }`}
                                            >
                                                <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                                                {message.products && message.products.length > 0 && (
                                                    <div className="mt-4 grid gap-3">
                                                        {message.products.map((product) => (
                                                            <div
                                                                key={`${message.id}-${product.id ?? product.name}`}
                                                                className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
                                                            >
                                                                <div className="flex gap-3 p-3">
                                                                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-slate-200">
                                                                        {product.thumbnail ? (
                                                                            <img
                                                                                src={product.thumbnail}
                                                                                alt={product.name}
                                                                                className="h-full w-full object-cover"
                                                                            />
                                                                        ) : (
                                                                            <div className="flex h-full w-full items-center justify-center text-slate-500">
                                                                                <ShoppingBag className="h-5 w-5" />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="flex items-start justify-between gap-3">
                                                                            <div>
                                                                                <p className="truncate text-sm font-semibold text-slate-900">{product.name}</p>
                                                                                <p className="mt-1 text-xs text-slate-500">
                                                                                    {product.category || 'Không rõ danh mục'}
                                                                                    {product.brand ? ` • ${product.brand}` : ''}
                                                                                </p>
                                                                            </div>
                                                                            <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700">
                                                                                {formatPrice(product.price)}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                                            AI đang suy nghĩ...
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-slate-100 bg-white p-4 sm:p-5">
                                {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                    <textarea
                                        value={draft}
                                        onChange={(e) => setDraft(e.target.value)}
                                        placeholder="Ví dụ: Gợi ý áo nam màu trung tính dưới 500k, dễ phối đồ"
                                        rows={2}
                                        className="min-h-[56px] flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-200"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                void sendMessage(draft);
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => void sendMessage(draft)}
                                        disabled={!draft.trim() || isLoading}
                                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                                    >
                                        <ArrowRight className="h-4 w-4" />
                                        Gửi câu hỏi
                                    </button>
                                </div>
                            </div>
                        </div>

                        <aside className="space-y-6">
                            <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
                                <h3 className="text-lg font-bold text-emerald-950">Sản phẩm vừa được AI gợi ý</h3>
                                <p className="mt-1 text-sm text-emerald-800/80">Hiển thị 1 nhóm gợi ý gần nhất từ kết quả RAG.</p>

                                <div className="mt-5 space-y-3">
                                    {lastAssistantProducts.length === 0 && (
                                        <div className="rounded-2xl border border-dashed border-emerald-200 bg-white p-4 text-sm text-emerald-900/70">
                                            Chưa có gợi ý nào. Hãy gửi một câu hỏi để nhận đề xuất sản phẩm.
                                        </div>
                                    )}

                                    {lastAssistantProducts.map((product) => (
                                        <div key={product.id ?? product.name} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
                                            <div className="h-14 w-14 overflow-hidden rounded-xl bg-emerald-100">
                                                {product.thumbnail ? (
                                                    <img src={product.thumbnail} alt={product.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-emerald-700">
                                                        <ShoppingBag className="h-5 w-5" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-slate-900">{product.name}</p>
                                                <p className="mt-1 text-xs text-slate-500">{product.category || 'Không rõ danh mục'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-emerald-700">{formatPrice(product.price)}</p>
                                                {product.score !== undefined && (
                                                    <p className="text-[11px] text-slate-500">{Math.round(product.score * 100)}% khớp</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-900">Mẹo hỏi AI hiệu quả</h3>
                                <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                                    <li>• Nêu rõ giới tính, kiểu trang phục và ngân sách.</li>
                                    <li>• Thêm màu sắc, chất liệu, hoặc dịp sử dụng nếu có.</li>
                                    <li>• Hỏi theo cách tự nhiên như đang nói với tư vấn viên.</li>
                                </ul>
                            </div>
                        </aside>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default AIChatPage;
