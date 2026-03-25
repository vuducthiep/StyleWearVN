import React, { useCallback, useEffect, useRef, useState } from 'react';
import { buildAuthHeaders, isAuthTokenMissingError } from '../../../services/auth';

type ApiResponse<T> = {
    success: boolean;
    message?: string;
    data?: T;
};

export interface AdminCategory {
    id: number;
    name: string;
    description?: string;
    status: string;
    createdAt?: string;
    updatedAt?: string;
}

interface CategoryTableProps {
    refreshKey?: number;
    onEdit?: (category: AdminCategory) => void;
}

const CategoryTable: React.FC<CategoryTableProps> = ({ refreshKey = 0, onEdit }) => {
    const [categories, setCategories] = useState<AdminCategory[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const lastEffectFetchKeyRef = useRef<string | null>(null);

    const fetchCategories = useCallback(async () => {
        setIsLoading(true);
        setError('');

        try {
            const authHeaders = buildAuthHeaders();
            const res = await fetch(`http://localhost:8080/api/admin/categories`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders,
                },
            });

            if (!res.ok) {
                const text = await res.text();
                const data = text ? JSON.parse(text) : {};
                const message = data.message || `Lỗi tải danh sách danh mục (code ${res.status}).`;
                setError(message);
                return;
            }

            const data: ApiResponse<AdminCategory[]> = await res.json();
            if (!data.success) {
                setError(data.message || 'Lỗi tải danh sách danh mục.');
                return;
            }

            setCategories(data.data || []);
        } catch (e) {
            if (isAuthTokenMissingError(e)) {
                setError('Bạn chưa đăng nhập hoặc thiếu token.');
                return;
            }
            console.error('Fetch categories error:', e);
            setError('Không thể kết nối máy chủ.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const fetchKey = `${refreshKey}`;
        if (lastEffectFetchKeyRef.current === fetchKey) {
            return;
        }

        lastEffectFetchKeyRef.current = fetchKey;
        fetchCategories();
    }, [fetchCategories, refreshKey]);

    return (
        <div className="w-full flex-1 bg-white shadow rounded-lg overflow-hidden border border-slate-200">
            <div className="p-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800">Danh sách danh mục</h2>
                <div className="flex items-center gap-2">
                    {error && (
                        <button
                            onClick={fetchCategories}
                            className="text-sm px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                        >
                            Thử lại
                        </button>
                    )}
                    <button
                        onClick={fetchCategories}
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
            ) : categories.length === 0 ? (
                <div className="p-4 text-slate-500 text-sm">Chưa có danh mục.</div>
            ) : (
                <div className="overflow-x-auto w-full">
                    <table className="min-w-full w-full text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                            <tr>
                                <th className="px-4 py-2 text-left">ID</th>
                                <th className="px-4 py-2 text-left">Tên danh mục</th>
                                <th className="px-4 py-2 text-left">Mô tả</th>
                                <th className="px-4 py-2 text-left">Trạng thái</th>
                                <th className="px-4 py-2 text-left">Ngày tạo</th>
                                <th className="px-4 py-2 text-left">Cập nhật</th>
                                <th className="px-4 py-2 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {categories.map((category) => (
                                <tr key={category.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-2">{category.id}</td>
                                    <td className="px-4 py-2 font-medium">{category.name}</td>
                                    <td className="px-4 py-2 max-w-xs truncate" title={category.description}>
                                        {category.description || '-'}
                                    </td>
                                    <td className="px-4 py-2">
                                        <span className={`px-2 py-1 rounded text-xs ${category.status === 'ACTIVE'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-slate-100 text-slate-700'
                                            }`}>
                                            {category.status || '-'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2">
                                        {category.createdAt ? new Date(category.createdAt).toLocaleDateString('vi-VN') : '-'}
                                    </td>
                                    <td className="px-4 py-2">
                                        {category.updatedAt ? new Date(category.updatedAt).toLocaleDateString('vi-VN') : '-'}
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                        <button
                                            type="button"
                                            onClick={() => onEdit?.(category)}
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

            {/* Info Footer */}
            {!isLoading && !error && categories.length > 0 && (
                <div className="px-4 py-3 border-t border-slate-100 text-sm text-slate-700">
                    <span>Tổng {categories.length} danh mục</span>
                </div>
            )}
        </div>
    );
};

export default CategoryTable;
