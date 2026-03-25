import React, { useCallback, useEffect, useRef, useState } from 'react';
import ConfirmDialog from '../../../components/ConfirmDialog';
import { useToast } from '../../../components/ToastProvider';
import { buildAuthHeaders, isAuthTokenMissingError } from '../../../services/auth';

type ApiResponse<T> = {
    success: boolean;
    message?: string;
    data?: T;
};

type PageResult<T> = {
    content: T[];
    number: number;
    totalPages: number;
    totalElements: number;
};

export interface AdminOrder {
    id: number;
    userId: number;
    userName: string;
    phoneNumber: string;
    totalAmount: number;
    discountAmount: number;
    finalAmount: number;
    promotionCode?: string | null;
    shippingAddress: string;
    paymentMethod: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

interface OrderTableProps {
    refreshKey?: number;
    onViewDetail?: (order: AdminOrder) => void;
}

const OrderTable: React.FC<OrderTableProps> = ({ refreshKey = 0, onViewDetail }) => {
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [page, setPage] = useState(0);
    const [size] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const lastEffectFetchKeyRef = useRef<string | null>(null);
    const [confirmState, setConfirmState] = useState<{
        open: boolean;
        action?: 'confirm' | 'cancel';
        order?: AdminOrder;
        isLoading: boolean;
    }>({ open: false, isLoading: false });

    const { pushToast } = useToast();

    const fetchOrders = useCallback(async (pageIndex = 0) => {
        setIsLoading(true);
        setError('');

        try {
            const authHeaders = buildAuthHeaders();
            const res = await fetch(`http://localhost:8080/api/admin/orders?page=${pageIndex}&size=${size}&sortBy=createdAt&sortDir=desc`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders,
                },
            });

            if (!res.ok) {
                const text = await res.text();
                const data = text ? JSON.parse(text) : {};
                const message = data.message || `Lỗi tải danh sách đơn hàng (code ${res.status}).`;
                setError(message);
                return;
            }

            const data: ApiResponse<PageResult<AdminOrder>> = await res.json();
            if (!data.success) {
                setError(data.message || 'Lỗi tải danh sách đơn hàng.');
                return;
            }

            const pageData = data.data;
            if (!pageData) {
                setError('Dữ liệu trả về không hợp lệ.');
                return;
            }

            setOrders(pageData.content || []);
            setTotalPages(pageData.totalPages ?? 0);
            setTotalElements(pageData.totalElements ?? 0);
        } catch (e) {
            if (isAuthTokenMissingError(e)) {
                setError('Bạn chưa đăng nhập hoặc thiếu token.');
                return;
            }
            console.error('Fetch orders error:', e);
            setError('Không thể kết nối máy chủ.');
        } finally {
            setIsLoading(false);
        }
    }, [size]);

    useEffect(() => {
        const fetchKey = `${page}-${refreshKey}`;
        if (lastEffectFetchKeyRef.current === fetchKey) {
            return;
        }

        lastEffectFetchKeyRef.current = fetchKey;
        fetchOrders(page);
    }, [fetchOrders, page, refreshKey]);

    const handlePageChange = (nextPage: number) => {
        setPage(nextPage);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CREATED':
                return 'bg-yellow-100 text-yellow-700';
            case 'DELIVERED':
                return 'bg-green-100 text-green-700';
            case 'CANCELLED':
                return 'bg-red-100 text-red-700';
            case 'SHIPPING':
                return 'bg-blue-100 text-blue-700';
            case 'PROCESSING':
                return 'bg-blue-100 text-blue-700';
            default:
                return 'bg-slate-100 text-slate-700';
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const callOrderAction = async (orderId: number, action: 'confirm' | 'cancel') => {
        const authHeaders = buildAuthHeaders();
        const res = await fetch(`http://localhost:8080/api/admin/orders/${orderId}/${action}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...authHeaders,
            },
        });

        const text = await res.text();
        const data = text ? JSON.parse(text) : {};

        if (!res.ok || !data.success) {
            throw new Error(data.message || `Thao tác thất bại (code ${res.status}).`);
        }

        await fetchOrders(page);
        return data.message || 'Thành công';
    };

    const openConfirm = (order: AdminOrder, action: 'confirm' | 'cancel') => {
        setConfirmState({ open: true, action, order, isLoading: false });
    };

    const handleConfirmAction = async () => {
        if (!confirmState.order || !confirmState.action) {
            setConfirmState({ open: false, isLoading: false });
            return;
        }

        setConfirmState((prev) => ({ ...prev, isLoading: true }));
        try {
            const message = await callOrderAction(confirmState.order.id, confirmState.action);
            pushToast(message, 'success');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Thao tác thất bại.';
            pushToast(errorMessage, 'error');
        } finally {
            setConfirmState({ open: false, isLoading: false });
        }
    };

    return (
        <div className="w-full flex-1 bg-white shadow rounded-lg overflow-hidden border border-slate-200">
            <div className="p-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800">Danh sách đơn hàng</h2>
                <div className="flex items-center gap-2">
                    {error && (
                        <button
                            onClick={() => fetchOrders(page)}
                            className="text-sm px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                        >
                            Thử lại
                        </button>
                    )}
                    <button
                        onClick={() => fetchOrders(page)}
                        className="px-4 py-2 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
                    >
                        Tải lại
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="p-4 text-slate-500">Đang tải...</div>
            ) : error ? (
                <div className="p-4 text-red-600 text-sm">{error}</div>
            ) : orders.length === 0 ? (
                <div className="p-4 text-slate-500 text-sm">Chưa có đơn hàng.</div>
            ) : (
                <div className="overflow-x-auto w-full">
                    <table className="min-w-full w-full text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                            <tr>
                                <th className="px-4 py-2 text-left">ID</th>
                                <th className="px-4 py-2 text-left">Tên khách hàng</th>
                                <th className="px-4 py-2 text-left">Số điện thoại</th>
                                <th className="px-4 py-2 text-right">Thành tiền</th>
                                <th className="px-4 py-2 text-left w-52">Địa chỉ giao hàng</th>
                                <th className="px-4 py-2 text-left">Trạng thái</th>
                                <th className="px-4 py-2 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {orders.map((order) => (
                                <tr key={order.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-2">{order.id}</td>
                                    <td className="px-4 py-2 font-medium">{order.userName}</td>
                                    <td className="px-4 py-2">{order.phoneNumber}</td>
                                    <td className="px-4 py-2 text-right">
                                        <p className="font-semibold">{formatCurrency(order.finalAmount)}</p>
                                        {order.discountAmount > 0 && (
                                            <p className="text-xs text-slate-500">Giảm {formatCurrency(order.discountAmount)}</p>
                                        )}
                                    </td>
                                    <td className="px-4 py-2 w-52 max-w-[13rem] whitespace-normal break-words leading-5" title={order.shippingAddress}>
                                        {order.shippingAddress}
                                    </td>
                                    <td className="px-4 py-2">
                                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                        <div className="inline-flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => onViewDetail?.(order)}
                                                className="p-2 rounded border border-slate-200 hover:border-blue-500 hover:text-blue-600 transition"
                                                title="Xem chi tiết"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => openConfirm(order, 'confirm')}
                                                disabled={order.status !== 'CREATED'}
                                                className={`p-2 rounded border transition ${order.status === 'CREATED'
                                                    ? 'border-slate-200 hover:border-green-500 hover:text-green-600 cursor-pointer'
                                                    : 'border-slate-100 text-slate-300 cursor-not-allowed opacity-50'
                                                    }`}
                                                title={order.status === 'CREATED' ? 'Xác nhận đơn hàng' : 'Không thể xác nhận'}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => openConfirm(order, 'cancel')}
                                                disabled={!(order.status === 'CREATED' || order.status === 'SHIPPING')}
                                                className={`p-2 rounded border transition ${order.status === 'CREATED' || order.status === 'SHIPPING'
                                                    ? 'border-slate-200 hover:border-red-500 hover:text-red-600 cursor-pointer'
                                                    : 'border-slate-100 text-slate-300 cursor-not-allowed opacity-50'
                                                    }`}
                                                title={order.status === 'CREATED' || order.status === 'SHIPPING' ? 'Hủy đơn hàng' : 'Không thể hủy'}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {!isLoading && !error && totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-sm text-slate-700">
                    <span>
                        Trang {page + 1}/{totalPages} • Tổng {totalElements} đơn hàng
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handlePageChange(Math.max(page - 1, 0))}
                            disabled={page === 0}
                            className="px-3 py-1 rounded border border-slate-300 disabled:opacity-50 hover:bg-slate-50"
                        >
                            Trước
                        </button>
                        <button
                            onClick={() => handlePageChange(Math.min(page + 1, totalPages - 1))}
                            disabled={page >= totalPages - 1}
                            className="px-3 py-1 rounded border border-slate-300 disabled:opacity-50 hover:bg-slate-50"
                        >
                            Sau
                        </button>
                    </div>
                </div>
            )}
            <ConfirmDialog
                open={confirmState.open}
                title={confirmState.action === 'confirm' ? 'Xác nhận đơn hàng' : 'Hủy đơn hàng'}
                message={confirmState.order
                    ? `Bạn có chắc muốn ${confirmState.action === 'confirm' ? 'xác nhận' : 'hủy'} đơn hàng #${confirmState.order.id}?`
                    : 'Bạn có chắc muốn thực hiện thao tác này?'}
                confirmText={confirmState.action === 'confirm' ? 'Xác nhận' : 'Hủy đơn'}
                cancelText="Đóng"
                isLoading={confirmState.isLoading}
                onConfirm={handleConfirmAction}
                onCancel={() => setConfirmState({ open: false, isLoading: false })}
            />
        </div>
    );
};

export default OrderTable;
