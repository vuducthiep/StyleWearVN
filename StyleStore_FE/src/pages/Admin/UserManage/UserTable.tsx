import React, { useCallback, useEffect, useRef, useState } from 'react';
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

export interface AdminRole {
    id: number;
    name: string;
}

export interface AdminUser {
    id: number;
    fullName: string;
    email: string;
    phoneNumber?: string;
    role?: AdminRole | null;
    roleId?: number | null;
    roleName?: string;
    status?: string;
    createdAt?: string;
}

interface UserTableProps {
    refreshKey?: number;
    onEdit?: (user: AdminUser) => void;
}

const getRoleName = (role?: AdminRole | null) => {
    return role?.name || 'N/A';
};

const normalizeUsers = (users: AdminUser[]): AdminUser[] => {
    return users.map((user) => ({
        ...user,
        roleId: user.role?.id ?? null,
        roleName: getRoleName(user.role),
    }));
};

const UserTable: React.FC<UserTableProps> = ({ refreshKey = 0, onEdit }) => {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [page, setPage] = useState(0);
    const [size] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const lastEffectFetchKeyRef = useRef<string | null>(null);

    const fetchUsers = useCallback(async (pageIndex = 0, keywordParam = searchKeyword) => {
        setIsLoading(true);
        setError('');

        try {
            const authHeaders = buildAuthHeaders();
            const keyword = keywordParam.trim();
            const queryParams = new URLSearchParams({
                page: String(pageIndex),
                size: String(size),
                sortBy: 'createdAt',
                sortDir: 'desc',
            });
            if (keyword) {
                queryParams.set('keyword', keyword);
            }
            const endpoint = keyword
                ? `http://localhost:8080/api/admin/users/search?${queryParams.toString()}`
                : `http://localhost:8080/api/admin/users?${queryParams.toString()}`;

            // Fetch users list from backend
            const res = await fetch(endpoint, {
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders,
                },
            });

            if (!res.ok) {
                const text = await res.text();
                const data = text ? JSON.parse(text) : {};
                const message = data.message || `Lỗi tải danh sách user (code ${res.status}).`;
                setError(message);
                return;
            }

            const data: ApiResponse<PageResult<AdminUser>> = await res.json();
            if (!data.success) {
                setError(data.message || 'Lỗi tải danh sách user.');
                return;
            }

            const pageData = data.data;
            if (!pageData) {
                setError('Dữ liệu trả về không hợp lệ.');
                return;
            }

            setUsers(normalizeUsers(pageData.content || []));
            setTotalPages(pageData.totalPages ?? 0);
            setTotalElements(pageData.totalElements ?? 0);
        } catch (e) {
            if (isAuthTokenMissingError(e)) {
                setError('Bạn chưa đăng nhập hoặc thiếu token.');
                return;
            }
            console.error('Fetch users error:', e);
            setError('Không thể kết nối máy chủ.');
        } finally {
            setIsLoading(false);
        }
    }, [searchKeyword, size]);

    useEffect(() => {
        const fetchKey = `${page}-${searchKeyword}-${refreshKey}`;
        if (lastEffectFetchKeyRef.current === fetchKey) {
            return;
        }

        lastEffectFetchKeyRef.current = fetchKey;
        fetchUsers(page, searchKeyword);
    }, [fetchUsers, page, refreshKey, searchKeyword]);

    const handlePageChange = (nextPage: number) => {
        setPage(nextPage);
    };

    const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const keyword = searchInput.trim();
        setSearchKeyword(keyword);
        setPage(0);
    };

    const handleClearSearch = () => {
        setSearchInput('');
        setSearchKeyword('');
        setPage(0);
    };

    return (
        <div className="w-full flex-1 bg-white shadow rounded-lg overflow-hidden border border-slate-200">
            <div className="p-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800">Danh sách người dùng</h2>
                <div className="flex items-center gap-2">
                    {error && (
                        <button
                            onClick={() => fetchUsers(page)}
                            className="text-sm px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                        >
                            Thử lại
                        </button>
                    )}
                    <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                            placeholder="Tên / email"
                            className="w-52 px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                        <button
                            type="submit"
                            className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
                        >
                            Tìm
                        </button>
                        {searchKeyword && (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 text-sm hover:bg-slate-50 transition"
                            >
                                Xóa
                            </button>
                        )}
                    </form>
                </div>
            </div>

            {isLoading ? (
                <div className="p-4 text-slate-500">Đang tải...</div>
            ) : error ? (
                <div className="p-4 text-red-600 text-sm">{error}</div>
            ) : users.length === 0 ? (
                <div className="p-4 text-slate-500 text-sm">Chưa có người dùng.</div>
            ) : (
                <div className="overflow-x-auto w-full">
                    <table className="min-w-full w-full text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                            <tr>
                                <th className="px-4 py-2 text-left">ID</th>
                                <th className="px-4 py-2 text-left">Họ tên</th>
                                <th className="px-4 py-2 text-left">Email</th>
                                <th className="px-4 py-2 text-left">SĐT</th>
                                <th className="px-4 py-2 text-left">Role</th>
                                <th className="px-4 py-2 text-left">Trạng thái</th>
                                <th className="px-4 py-2 text-left">Ngày tạo</th>
                                <th className="px-4 py-2 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-2">{user.id}</td>
                                    <td className="px-4 py-2 font-medium">{user.fullName}</td>
                                    <td className="px-4 py-2">{user.email}</td>
                                    <td className="px-4 py-2">{user.phoneNumber || '-'}</td>
                                    <td className="px-4 py-2">{user.roleName || 'N/A'}</td>
                                    <td className="px-4 py-2">
                                        <span className="px-2 py-1 rounded text-xs bg-slate-100 text-slate-700">{user.status || '-'}</span>
                                    </td>
                                    <td className="px-4 py-2">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</td>
                                    <td className="px-4 py-2 text-right">
                                        <div className="inline-flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => onEdit?.(user)}
                                                className="p-2 rounded border border-slate-200 hover:border-blue-500 hover:text-blue-600 transition"
                                                title="Sửa"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 012.652 2.652l-1.688 1.687m-2.651-2.651L6.478 15.37a4.5 4.5 0 00-1.184 2.216l-.3 1.201a.75.75 0 00.91.91l1.2-.3a4.5 4.5 0 002.217-1.184l9.383-9.383m-2.651-2.651l2.651 2.651" />
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
                        Trang {page + 1}/{totalPages} • Tổng {totalElements} người dùng
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

export default UserTable;