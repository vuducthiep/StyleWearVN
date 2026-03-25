import { useEffect, useState } from 'react';
import { Empty, Spin } from 'antd';
import { getAuthToken } from '../../../services/auth';

interface StatsResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

interface BestSellingProduct {
    productId: number;
    categoryId: number;
    categoryName: string;
    productThumbnail: string;
    productName: string;
    totalSold: number;
}

let bestSellingInFlightRequest: Promise<StatsResponse<BestSellingProduct[]>> | null = null;

const BestSellingByCategory = () => {
    const [items, setItems] = useState<BestSellingProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBestSelling = async () => {
            try {
                setLoading(true);
                const token = getAuthToken();

                if (!token) {
                    throw new Error('No authentication token found. Please log in again.');
                }

                if (!bestSellingInFlightRequest) {
                    bestSellingInFlightRequest = (async () => {
                        const response = await fetch(
                            'http://localhost:8080/api/admin/stats/best-selling-product-in-categories',
                            {
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json',
                                }
                            }
                        );

                        if (!response.ok) {
                            throw new Error(`Failed to fetch best-selling products: ${response.status}`);
                        }

                        return (await response.json()) as StatsResponse<BestSellingProduct[]>;
                    })().finally(() => {
                        bestSellingInFlightRequest = null;
                    });
                }

                const data = await bestSellingInFlightRequest;
                setItems(data.data ?? []);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchBestSelling();
    }, []);

    if (loading) {
        return (
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <Spin />
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <Empty description={`Lỗi: ${error}`} />
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <Empty description="Chưa có dữ liệu bán chạy" />
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
                <h2 className="text-lg font-semibold text-slate-800">Bán chạy theo danh mục</h2>
                <p className="text-sm text-slate-500">Sản phẩm bán chạy nhất trong từng danh mục.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => (
                    <div
                        key={`${item.categoryId}-${item.productId}`}
                        className="flex gap-4 rounded-lg border border-slate-100 bg-slate-50 p-4"
                    >
                        <div className="h-16 w-16 overflow-hidden rounded-md bg-white">
                            <img
                                src={item.productThumbnail}
                                alt={item.productName}
                                className="h-full w-full object-cover"
                                loading="lazy"
                            />
                        </div>
                        <div className="flex flex-1 flex-col gap-1">
                            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                {item.categoryName}
                            </div>
                            <div className="text-sm font-semibold text-slate-800 line-clamp-2">
                                {item.productName}
                            </div>
                            <div className="text-xs text-slate-500">Đã bán: {item.totalSold}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BestSellingByCategory;
