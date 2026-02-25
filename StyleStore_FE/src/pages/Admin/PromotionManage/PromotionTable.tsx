import React, { useCallback, useEffect, useState } from 'react';
import { buildAuthHeaders, isAuthTokenMissingError } from '../../../services/auth';

type ApiResponse<T> = {
    success: boolean;
    message?: string;
    data?: T;
};

interface PageData<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

const isPageData = <T,>(data: unknown): data is PageData<T> => {
    return (
        typeof data === 'object' &&
        data !== null &&
        'content' in data &&
        Array.isArray((data as PageData<T>).content)
    );
};

export interface AdminPromotion {
    id: number;
    code: string;
    name: string;
    description?: string;
    discountPercent: number;
    maxDiscountAmount: number;
    minOrderAmount: number;
    startAt: string;
    endAt: string;
    isActive: boolean;
}

interface PromotionTableProps {
    refreshKey?: number;
    onEdit?: (promotion: AdminPromotion) => void;
}

const formatDateTime = (value?: string) => {
    if (!value) return '-';
    return new Date(value).toLocaleString('vi-VN');
};

const PAGE_SIZE = 10;

const PromotionTable: React.FC<PromotionTableProps> = ({ refreshKey = 0, onEdit }) => {
    const [promotions, setPromotions] = useState<AdminPromotion[]>([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchPromotions = useCallback(async (pageIndex = 0) => {
        setIsLoading(true);
        setError('');

        try {
            const authHeaders = buildAuthHeaders();
            const res = await fetch(
                `http://localhost:8080/api/admin/promotions?page=${pageIndex}&size=${PAGE_SIZE}&sortBy=createdAt&sortDir=desc`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        ...authHeaders,
                    },
                });

            if (!res.ok) {
                const text = await res.text();
                const data = text ? JSON.parse(text) : {};
                const message = data.message || `Lỗi tải danh sách khuyến mãi (code ${res.status}).`;
                setError(message);
                return;
            }

            const data: ApiResponse<PageData<AdminPromotion> | AdminPromotion[]> = await res.json();
            if (!data.success) {
                setError(data.message || 'Lỗi tải danh sách khuyến mãi.');
                return;
            }

            const pageData = data.data;
            if (Array.isArray(pageData)) {
                const total = pageData.length;
                const pages = total > 0 ? Math.ceil(total / PAGE_SIZE) : 0;
                const safePageIndex = pages > 0 ? Math.min(pageIndex, pages - 1) : 0;
                const start = safePageIndex * PAGE_SIZE;
                const end = start + PAGE_SIZE;

                setPromotions(pageData.slice(start, end));
                setTotalElements(total);
                setTotalPages(pages);
                setPage(safePageIndex);
                return;
            }

            if (isPageData<AdminPromotion>(pageData)) {
                setPromotions(pageData.content || []);
                setPage(pageData.number ?? pageIndex);
                setTotalPages(pageData.totalPages || 0);
                setTotalElements(pageData.totalElements || 0);
                return;
            }

            setPromotions([]);
            setTotalPages(0);
            setTotalElements(0);
        } catch (e) {
            if (isAuthTokenMissingError(e)) {
                setError('Bạn chưa đăng nhập hoặc thiếu token.');
                return;
            }
            console.error('Fetch promotions error:', e);
            setError('Không thể kết nối máy chủ.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPromotions(page);
    }, [fetchPromotions, page, refreshKey]);

    useEffect(() => {
        setPage(0);
    }, [refreshKey]);

    const handlePageChange = (nextPage: number) => {
        setPage(nextPage);
        fetchPromotions(nextPage);
    };

    return (
        <div className="w-full flex-1 bg-white shadow rounded-lg overflow-hidden border border-slate-200">
            <div className="p-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800">Danh sách khuyến mãi</h2>
                <div className="flex items-center gap-2">
                    {error && (
                        <button
                            onClick={() => fetchPromotions(page)}
                            className="text-sm px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                        >
                            Thử lại
                        </button>
                    )}
                    <button
                        onClick={() => fetchPromotions(page)}
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
            ) : promotions.length === 0 ? (
                <div className="p-4 text-slate-500 text-sm">Chưa có khuyến mãi.</div>
            ) : (
                <div className="overflow-x-auto w-full">
                    <table className="min-w-full w-full text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                            <tr>
                                <th className="px-4 py-2 text-left">Mã</th>
                                <th className="px-4 py-2 text-left">Tên</th>
                                <th className="px-4 py-2 text-left">Giảm %</th>
                                <th className="px-4 py-2 text-left">Bắt đầu</th>
                                <th className="px-4 py-2 text-left">Kết thúc</th>
                                <th className="px-4 py-2 text-left">Trạng thái</th>
                                <th className="px-4 py-2 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {promotions.map((promotion) => (
                                <tr key={promotion.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-2 font-semibold">{promotion.code}</td>
                                    <td className="px-4 py-2 max-w-xs truncate" title={promotion.name}>{promotion.name}</td>
                                    <td className="px-4 py-2">{Number(promotion.discountPercent)}%</td>
                                    <td className="px-4 py-2">{formatDateTime(promotion.startAt)}</td>
                                    <td className="px-4 py-2">{formatDateTime(promotion.endAt)}</td>
                                    <td className="px-4 py-2">
                                        <span className={`px-2 py-1 rounded text-xs ${promotion.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                                            {promotion.isActive ? 'ACTIVE' : 'INACTIVE'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                        <button
                                            type="button"
                                            onClick={() => onEdit?.(promotion)}
                                            className="p-2 rounded border border-slate-200 hover:border-blue-500 hover:text-blue-600 transition"
                                            title="Sửa"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 012.652 2.652l-1.688 1.687m-2.651-2.651L6.478 15.37a4.5 4.5 0 00-1.184 2.216l-.3 1.201a.75.75 0 00.91.91l1.2-.3a4.5 4.5 0 002.217-1.184l9.383-9.383m-2.651-2.651l2.651 2.651" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {!isLoading && !error && totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-sm text-slate-700">
                    <span>
                        Trang {page + 1}/{totalPages} • Tổng {totalElements} khuyến mãi
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
        </div>
    );
};

export default PromotionTable;
