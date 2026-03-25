import React, { useCallback, useEffect, useState } from 'react';
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

type ProductSizeDto = {
    size?: {
        id: number;
        name?: string;
    };
    stock?: number;
};

type AdminProductDetail = AdminProduct & {
    productSizes?: ProductSizeDto[];
};

export interface AdminProduct {
    id: number;
    name: string;
    description?: string;
    gender?: string;
    brand?: string;
    material?: string;
    price: number;
    thumbnail?: string;
    status?: string;
    category?: {
        id: number;
        name: string;
    };
    createdAt?: string;
}

interface ProductTableProps {
    refreshKey?: number;
    onEdit?: (product: AdminProduct) => void;
}

const ProductTable: React.FC<ProductTableProps> = ({ refreshKey = 0, onEdit }) => {
    const [products, setProducts] = useState<AdminProduct[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [page, setPage] = useState(0);
    const [size] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [exportLoading, setExportLoading] = useState(false);

    const fetchProducts = useCallback(async (pageIndex = 0, keywordParam = searchKeyword) => {
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
                ? `http://localhost:8080/api/admin/products/search?${queryParams.toString()}`
                : `http://localhost:8080/api/admin/products?${queryParams.toString()}`;

            // Fetch products list from backend
            const res = await fetch(endpoint, {
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders,
                },
            });

            if (!res.ok) {
                const text = await res.text();
                const data = text ? JSON.parse(text) : {};
                const message = data.message || `Lỗi tải danh sách sản phẩm (code ${res.status}).`;
                setError(message);
                return;
            }

            const data: ApiResponse<PageResult<AdminProduct>> = await res.json();
            if (!data.success) {
                setError(data.message || 'Lỗi tải danh sách sản phẩm.');
                return;
            }

            const pageData = data.data;
            if (!pageData) {
                setError('Dữ liệu trả về không hợp lệ.');
                return;
            }

            setProducts(pageData.content || []);
            setPage(pageData.number ?? pageIndex);
            setTotalPages(pageData.totalPages ?? 0);
            setTotalElements(pageData.totalElements ?? 0);
        } catch (e) {
            if (isAuthTokenMissingError(e)) {
                setError('Bạn chưa đăng nhập hoặc thiếu token.');
                return;
            }
            console.error('Fetch products error:', e);
            setError('Không thể kết nối máy chủ.');
        } finally {
            setIsLoading(false);
        }
    }, [searchKeyword, size]);

    useEffect(() => {
        fetchProducts(page);
    }, [fetchProducts, page, refreshKey]);

    const handlePageChange = (nextPage: number) => {
        setPage(nextPage);
        fetchProducts(nextPage);
    };

    const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const keyword = searchInput.trim();
        setSearchKeyword(keyword);
        setPage(0);
        fetchProducts(0, keyword);
    };

    const handleClearSearch = () => {
        setSearchInput('');
        setSearchKeyword('');
        setPage(0);
        fetchProducts(0, '');
    };

    const handleExportInvoice = useCallback(async () => {
        setExportLoading(true);
        setError('');

        try {
            const authHeaders = buildAuthHeaders();
            const headers = {
                'Content-Type': 'application/json',
                ...authHeaders,
            };

            const fetchPage = async (pageIndex: number) => {
                const res = await fetch(`http://localhost:8080/api/admin/products?page=${pageIndex}&size=100&sortBy=createdAt&sortDir=desc`, {
                    headers,
                });

                if (!res.ok) {
                    throw new Error(`Không tải được danh sách sản phẩm (code ${res.status}).`);
                }

                const data: ApiResponse<PageResult<AdminProduct>> = await res.json();
                if (!data.success || !data.data) {
                    throw new Error(data.message || 'Dữ liệu danh sách sản phẩm không hợp lệ.');
                }

                return data.data;
            };

            const firstPage = await fetchPage(0);
            let allProducts: AdminProduct[] = [...(firstPage.content || [])];

            for (let pageIndex = 1; pageIndex < (firstPage.totalPages || 0); pageIndex += 1) {
                const pageData = await fetchPage(pageIndex);
                allProducts = allProducts.concat(pageData.content || []);
            }

            if (allProducts.length === 0) {
                throw new Error('Không có sản phẩm để in hóa đơn.');
            }

            const productsWithStock = await Promise.all(
                allProducts.map(async (product) => {
                    const detailRes = await fetch(`http://localhost:8080/api/admin/products/${product.id}`, {
                        headers,
                    });

                    if (!detailRes.ok) {
                        throw new Error(`Không tải được chi tiết sản phẩm ID ${product.id}.`);
                    }

                    const detailData: ApiResponse<AdminProductDetail> = await detailRes.json();
                    if (!detailData.success || !detailData.data) {
                        throw new Error(detailData.message || `Dữ liệu chi tiết sản phẩm ID ${product.id} không hợp lệ.`);
                    }

                    const totalStock = (detailData.data.productSizes || []).reduce((sum, item) => {
                        return sum + (Number(item.stock) || 0);
                    }, 0);

                    return {
                        ...product,
                        totalStock,
                    };
                })
            );

            const ExcelJS = await import('exceljs');
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Hoa don san pham');

            worksheet.columns = [
                { header: 'ID', key: 'id', width: 10 },
                { header: 'Ten san pham', key: 'name', width: 40 },
                { header: 'Thuong hieu', key: 'brand', width: 20 },
                { header: 'Chat lieu', key: 'material', width: 20 },
                { header: 'Danh muc', key: 'category', width: 24 },
                { header: 'Gia', key: 'price', width: 16 },
                { header: 'Ton kho', key: 'stock', width: 12 },
                { header: 'Trang thai', key: 'status', width: 14 },
                { header: 'Ngay tao', key: 'createdAt', width: 16 },
            ];

            worksheet.getRow(1).font = { bold: true };

            productsWithStock.forEach((product) => {
                worksheet.addRow({
                    id: product.id,
                    name: product.name,
                    brand: product.brand || '-',
                    material: product.material || '-',
                    category: product.category?.name || '-',
                    price: product.price || 0,
                    stock: product.totalStock,
                    status: product.status || '-',
                    createdAt: product.createdAt ? new Date(product.createdAt).toLocaleDateString('vi-VN') : '-',
                });
            });

            worksheet.getColumn('price').numFmt = '#,##0';
            worksheet.getColumn('stock').numFmt = '#,##0';

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob(
                [buffer],
                { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
            );

            const fileUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = fileUrl;
            link.download = `hoa-don-san-pham-ton-kho-${new Date().toISOString().slice(0, 10)}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(fileUrl);
        } catch (e) {
            if (isAuthTokenMissingError(e)) {
                setError('Bạn chưa đăng nhập hoặc thiếu token.');
                return;
            }

            console.error('Export invoice error:', e);
            setError(e instanceof Error ? e.message : 'Không thể in hóa đơn.');
        } finally {
            setExportLoading(false);
        }
    }, []);

    return (
        <div className="w-full flex-1 bg-white shadow rounded-lg overflow-hidden border border-slate-200">
            <div className="p-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800">Danh sách sản phẩm</h2>
                <div className="flex items-center gap-2">
                    {error && (
                        <button
                            onClick={() => fetchProducts(page)}
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
                            placeholder="Tên SP / danh mục"
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
                    <button
                        onClick={handleExportInvoice}
                        disabled={exportLoading}
                        className="px-4 py-2 rounded bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition disabled:opacity-60"
                    >
                        {exportLoading ? 'Đang in...' : 'In hóa đơn'}
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="p-4 text-slate-500">Đang tải...</div>
            ) : error ? (
                <div className="p-4 text-red-600 text-sm">{error}</div>
            ) : products.length === 0 ? (
                <div className="p-4 text-slate-500 text-sm">Chưa có sản phẩm.</div>
            ) : (
                <div className="overflow-x-auto w-full">
                    <table className="min-w-full w-full text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                            <tr>
                                <th className="px-4 py-2 text-left">ID</th>
                                <th className="px-4 py-2 text-left">Hình ảnh</th>
                                <th className="px-4 py-2 text-left">Tên sản phẩm</th>
                                <th className="px-4 py-2 text-left">Thương hiệu</th>                                <th className="px-4 py-2 text-left">Giới tính</th>
                                <th className="px-4 py-2 text-left">Giá</th>
                                <th className="px-4 py-2 text-left">Danh mục</th>
                                <th className="px-4 py-2 text-left">Trạng thái</th>
                                <th className="px-4 py-2 text-left">Ngày tạo</th>
                                <th className="px-4 py-2 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {products.map((product) => (
                                <tr key={product.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-2">{product.id}</td>
                                    <td className="px-4 py-2">
                                        {product.thumbnail ? (
                                            <img
                                                src={product.thumbnail}
                                                alt={product.name}
                                                className="w-12 h-12 object-cover rounded border border-slate-200"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 bg-slate-100 rounded border border-slate-200 flex items-center justify-center text-slate-400 text-xs">
                                                No img
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-2 font-medium">{product.name}</td>
                                    <td className="px-4 py-2">{product.brand || '-'}</td>
                                    <td className="px-4 py-2">{product.gender || '-'}</td>
                                    <td className="px-4 py-2">
                                        {product.price.toLocaleString('vi-VN')}₫
                                    </td>
                                    <td className="px-4 py-2">{product.category?.name || '-'}</td>
                                    <td className="px-4 py-2">
                                        <span className="px-2 py-1 rounded text-xs bg-slate-100 text-slate-700">{product.status || '-'}</span>
                                    </td>
                                    <td className="px-4 py-2">{product.createdAt ? new Date(product.createdAt).toLocaleDateString() : '-'}</td>
                                    <td className="px-4 py-2 text-right">
                                        <button
                                            type="button"
                                            onClick={() => onEdit?.(product)}
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

            {/* Pagination */}
            {!isLoading && !error && totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-sm text-slate-700">
                    <span>
                        Trang {page + 1}/{totalPages} • Tổng {totalElements} sản phẩm
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

export default ProductTable;