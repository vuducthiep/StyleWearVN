import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import { Send } from 'lucide-react';

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

interface ChatUserDto {
    id: number;
    fullName: string;
    email: string;
}

interface MessageDto {
    id: number;
    senderId: number;
    receiverId: number;
    content: string;
    createdAt: string;
    read: boolean;
}

const API_BASE_URL = 'http://localhost:8080';

const formatTime = (iso: string): string => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
        return iso;
    }
    return `${date.toLocaleDateString('vi-VN')} ${date.toLocaleTimeString('vi-VN')}`;
};

const parseCurrentUserId = (): number | null => {
    try {
        const userRaw = localStorage.getItem('user');
        if (!userRaw) {
            return null;
        }
        const user = JSON.parse(userRaw) as { id?: number | string };
        if (user?.id === undefined || user?.id === null) {
            return null;
        }
        const id = Number(user.id);
        return Number.isFinite(id) ? id : null;
    } catch {
        return null;
    }
};

const SupportChatPage = () => {
    const [chatUsers, setChatUsers] = useState<ChatUserDto[]>([]);
    const [selectedUser, setSelectedUser] = useState<ChatUserDto | null>(null);
    const [messages, setMessages] = useState<MessageDto[]>([]);
    const [draft, setDraft] = useState('');
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState('');
    const [socketConnected, setSocketConnected] = useState(false);
    const messageContainerRef = useRef<HTMLDivElement | null>(null);

    const token = localStorage.getItem('token');
    const currentUserId = useMemo(() => parseCurrentUserId(), []);

    const loadChatUsers = useCallback(async () => {
        if (!token) {
            setError('Không tìm thấy token đăng nhập.');
            return;
        }

        setIsLoadingUsers(true);
        setError('');

        try {
            const response = await fetch(`${API_BASE_URL}/api/messages/chat-users`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const result = (await response.json()) as ApiResponse<ChatUserDto[]>;
            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Không thể tải danh sách người dùng đã chat.');
            }

            const users = Array.isArray(result.data) ? result.data : [];
            setChatUsers(users);

            if (users.length > 0) {
                setSelectedUser((prev) => {
                    if (prev) {
                        const stillExists = users.find((u) => u.id === prev.id);
                        if (stillExists) {
                            return stillExists;
                        }
                    }
                    return users[0];
                });
            } else {
                setSelectedUser(null);
                setMessages([]);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Không thể tải danh sách người dùng đã chat.');
        } finally {
            setIsLoadingUsers(false);
        }
    }, [token]);

    const loadConversation = useCallback(
        async (otherUserId: number) => {
            if (!token) {
                setError('Không tìm thấy token đăng nhập.');
                return;
            }

            setIsLoadingMessages(true);
            setError('');

            try {
                const response = await fetch(`${API_BASE_URL}/api/messages/conversation/${otherUserId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const result = (await response.json()) as ApiResponse<MessageDto[]>;
                if (!response.ok || !result.success) {
                    throw new Error(result.message || 'Không thể tải đoạn chat.');
                }

                setMessages(Array.isArray(result.data) ? result.data : []);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Không thể tải đoạn chat.');
                setMessages([]);
            } finally {
                setIsLoadingMessages(false);
            }
        },
        [token],
    );

    useEffect(() => {
        loadChatUsers();
    }, [loadChatUsers]);

    useEffect(() => {
        if (selectedUser) {
            loadConversation(selectedUser.id);
        }
    }, [selectedUser, loadConversation]);

    useEffect(() => {
        if (!selectedUser || isLoadingMessages) {
            return;
        }

        const timer = window.setTimeout(() => {
            if (messageContainerRef.current) {
                messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
            }
        }, 0);

        return () => window.clearTimeout(timer);
    }, [selectedUser, isLoadingMessages, messages]);

    useEffect(() => {
        if (!token || !currentUserId) {
            return;
        }

        let subscription: StompSubscription | null = null;
        const client = new Client({
            brokerURL: `${API_BASE_URL.replace('http', 'ws')}/ws-native`,
            connectHeaders: { Authorization: `Bearer ${token}` },
            reconnectDelay: 2000,
            debug: () => undefined,
        });

        client.onConnect = () => {
            setSocketConnected(true);
            subscription = client.subscribe(`/topic/messages/${currentUserId}`, (message: IMessage) => {
                try {
                    const payload = JSON.parse(message.body) as MessageDto;
                    setMessages((prev) => {
                        if (!selectedUser) {
                            return prev;
                        }

                        const belongsToCurrentConversation =
                            payload.senderId === selectedUser.id || payload.receiverId === selectedUser.id;

                        if (!belongsToCurrentConversation) {
                            return prev;
                        }

                        const exists = prev.some((item) => item.id === payload.id);
                        if (exists) {
                            return prev;
                        }

                        return [...prev, payload];
                    });

                    loadChatUsers();
                } catch {
                    // ignore invalid payload
                }
            });
        };

        client.onWebSocketClose = () => {
            setSocketConnected(false);
        };

        client.onStompError = () => {
            setSocketConnected(false);
        };

        client.activate();

        return () => {
            if (subscription) {
                subscription.unsubscribe();
            }
            client.deactivate();
            setSocketConnected(false);
        };
    }, [token, currentUserId, selectedUser, loadChatUsers]);

    const handleSend = async () => {
        if (!selectedUser || !draft.trim()) {
            return;
        }
        if (!token) {
            setError('Không tìm thấy token đăng nhập.');
            return;
        }

        setIsSending(true);
        setError('');

        try {
            const response = await fetch(`${API_BASE_URL}/api/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    receiverUserId: selectedUser.id,
                    content: draft.trim(),
                }),
            });

            const result = (await response.json()) as ApiResponse<MessageDto>;
            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Gửi tin nhắn thất bại.');
            }

            setDraft('');
            setMessages((prev) => {
                const exists = prev.some((item) => item.id === result.data.id);
                if (exists) {
                    return prev;
                }
                return [...prev, result.data];
            });
            loadChatUsers();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gửi tin nhắn thất bại.');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-[calc(100vh-4rem)] flex overflow-hidden">
            <div className="w-80 border-r border-gray-200 flex flex-col">
                <div className="px-4 py-3 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800">Hỗ trợ khách hàng</h2>
                    <p className="text-xs mt-1 text-gray-500">
                        {socketConnected ? 'Đang kết nối realtime' : 'Mất kết nối realtime'}
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {isLoadingUsers && <p className="p-4 text-sm text-gray-500">Đang tải người dùng...</p>}
                    {!isLoadingUsers && chatUsers.length === 0 && (
                        <p className="p-4 text-sm text-gray-500">Chưa có người dùng nào từng chat.</p>
                    )}

                    {chatUsers.map((user) => (
                        <button
                            key={user.id}
                            type="button"
                            onClick={() => setSelectedUser(user)}
                            className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${selectedUser?.id === user.id ? 'bg-blue-50' : ''
                                }`}
                        >
                            <p className="text-sm font-medium text-gray-800">{user.fullName || `User #${user.id}`}</p>
                            <p className="text-xs text-gray-500 mt-1">{user.email}</p>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 flex flex-col">
                <div className="px-4 py-3 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-800">
                        {selectedUser ? `Đoạn chat với ${selectedUser.fullName || selectedUser.email}` : 'Chọn người dùng để xem chat'}
                    </h3>
                </div>

                <div ref={messageContainerRef} className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-3">
                    {isLoadingMessages && <p className="text-sm text-gray-500">Đang tải đoạn chat...</p>}
                    {!isLoadingMessages && selectedUser && messages.length === 0 && (
                        <p className="text-sm text-gray-500">Chưa có tin nhắn trong đoạn chat này.</p>
                    )}
                    {!selectedUser && <p className="text-sm text-gray-500">Chọn một user ở bên trái để bắt đầu.</p>}

                    {!isLoadingMessages &&
                        selectedUser &&
                        messages.map((message) => {
                            const isMine = message.senderId === currentUserId;
                            return (
                                <div
                                    key={message.id}
                                    className={`max-w-[75%] rounded-lg px-3 py-2 ${isMine ? 'ml-auto bg-blue-600 text-white' : 'mr-auto bg-gray-200 text-gray-800'
                                        }`}
                                >
                                    <p className="text-sm break-words">{message.content}</p>
                                    <p className={`mt-1 text-[11px] ${isMine ? 'text-blue-100' : 'text-gray-500'}`}>
                                        {formatTime(message.createdAt)}
                                    </p>
                                </div>
                            );
                        })}
                </div>

                <div className="border-t border-gray-200 p-4">
                    {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            placeholder={selectedUser ? 'Nhập tin nhắn...' : 'Chọn user để nhắn tin'}
                            disabled={!selectedUser || isSending}
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                        />
                        <button
                            type="button"
                            onClick={handleSend}
                            disabled={!selectedUser || !draft.trim() || isSending}
                            className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg px-4 py-2 text-sm"
                        >
                            <Send className="w-4 h-4" />
                            Gửi
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupportChatPage;
