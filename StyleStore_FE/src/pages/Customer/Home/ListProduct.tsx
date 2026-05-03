
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export interface Size {
    id: number;
    name: string;
}

export interface ProductSize {
    id: number;
    size: Size;
    stock: number;
}

export interface Category {
    id: number;
    name: string;
    description: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export interface Product {
    id: number;
    name: string;
    description: string;
    gender: string;
    brand: string;
    material?: string;
    color?: string;
    price: number;
    thumbnail: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    category: Category;
    productSizes: ProductSize[];
}
export type ListProductProps = {
    products: Product[];
    loading: boolean;
    error: string | null;
    currentPage: number;
    totalPages: number;
    onNextPage: () => void;
    onPrevPage: () => void;
};

export default function ListProduct({
    products,
    loading,
    error,
    currentPage,
    totalPages,
    onNextPage,
    onPrevPage,
}: ListProductProps) {
    const navigate = useNavigate();
    const [sortByPrice, setSortByPrice] = useState<"default" | "asc" | "desc">("default");
    const productCardRefs = useRef<Record<number, HTMLDivElement | null>>({});
    const [visibleProducts, setVisibleProducts] = useState<Set<number>>(new Set());

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(price);
    };

    const sortedProducts = useMemo(() => {
        const data = [...products];

        if (sortByPrice === "asc") {
            return data.sort((a, b) => a.price - b.price);
        }

        if (sortByPrice === "desc") {
            return data.sort((a, b) => b.price - a.price);
        }

        return data;
    }, [products, sortByPrice]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        return;
                    }

                    const productId = Number((entry.target as HTMLElement).dataset.productId);

                    setVisibleProducts((current) => {
                        if (current.has(productId)) {
                            return current;
                        }

                        const next = new Set(current);
                        next.add(productId);
                        return next;
                    });
                });
            },
            {
                threshold: 0,
                rootMargin: "0px 0px 50px 0px",
            }
        );

        sortedProducts.forEach((product) => {
            const element = productCardRefs.current[product.id];

            if (element) {
                observer.observe(element);
            }
        });

        return () => {
            observer.disconnect();
        };
    }, [sortedProducts]);

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-red-500 text-lg font-semibold">{error}</p>
                </div>
            </div>
        );
    }


    return (
        <div
            className="w-full py-12 px-4 relative overflow-hidden min-h-screen bg-gradient-to-br from-rose-50 via-white to-sky-50"
        >
            <div className="max-w-7xl mx-auto relative z-10">


                {/* Loading State */}
                {loading ? (
                    <div className="flex justify-center items-center min-h-96">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <>
                        {/* Products Grid */}
                        <div className="bg-red-50/80 backdrop-blur-sm rounded-xl p-8 mb-12 shadow-2xl border-4 border-pink-200">
                            <div className="flex justify-end mb-6">
                                <div className="flex items-center gap-3 bg-white/90 px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                                    <label htmlFor="price-sort" className="text-sm font-semibold text-gray-800 whitespace-nowrap">
                                        Sắp xếp theo giá:
                                    </label>
                                    <div className="relative">
                                        <select
                                            id="price-sort"
                                            value={sortByPrice}
                                            onChange={(e) => setSortByPrice(e.target.value as "default" | "asc" | "desc")}
                                            className="appearance-none min-w-44 pl-3 pr-10 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer"
                                        >
                                            <option value="default">Mặc định</option>
                                            <option value="asc">Thấp đến cao</option>
                                            <option value="desc">Cao đến thấp</option>
                                        </select>
                                        <ChevronRight
                                            size={16}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-gray-500 pointer-events-none"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {sortedProducts.map((product) => (
                                    <div
                                        key={product.id}
                                        ref={(node) => {
                                            productCardRefs.current[product.id] = node;
                                        }}
                                        data-product-id={product.id}
                                        className={`group bg-slate-300 rounded-lg shadow-md overflow-hidden h-full flex flex-col transition-all duration-700 ease-out will-change-transform ${
                                            visibleProducts.has(product.id)
                                                ? "opacity-100 translate-y-0"
                                                : "opacity-0 translate-y-10"
                                        } hover:shadow-xl hover:-translate-y-1`}
                                        style={{
                                            transitionDelay: `${Math.min(sortedProducts.findIndex((item) => item.id === product.id), 8) * 80}ms`,
                                        }}
                                    >
                                        {/* Product Image */}
                                        <button
                                            type="button"
                                            onClick={() => navigate(`/product/${product.id}`)}
                                            className="relative overflow-hidden bg-gray-200 h-64 cursor-pointer text-left"
                                            aria-label={`Xem chi tiết sản phẩm ${product.name}`}
                                        >
                                            <img
                                                src={product.thumbnail}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                            />

                                        </button>

                                        {/* Product Info */}
                                        <div className="p-5 flex flex-col flex-1">
                                            {/* Category */}
                                            <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-2">
                                                {product.category.name}
                                            </p>

                                            {/* Product Name */}
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 h-14 group-hover:text-blue-600 transition-colors">
                                                {product.name}
                                            </h3>

                                            {/* Description */}
                                            <p className="text-sm text-gray-600 mb-3 line-clamp-1">
                                                {product.description}
                                            </p>

                                            {/* Brand, Gender, Color */}
                                            <div className="flex justify-between items-center mb-3 text-xs text-gray-500 flex-wrap gap-1">
                                                <span className="font-medium">{product.brand?.toUpperCase() || "N/A"}</span>
                                                <div className="flex gap-1 border-l pl-2 ml-1">
                                                    {product.color && <span className="px-2 py-1 bg-gray-100 rounded">{product.color}</span>}
                                                    <span className="px-2 py-1 bg-gray-100 rounded">{product.gender || "Chưa xác định"}</span>
                                                </div>
                                            </div>

                                            {/* Sizes */}
                                            <div className="mb-4">
                                                <p className="text-xs font-semibold text-gray-700 mb-2">Size:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {product.productSizes.map((ps) => (
                                                        <span
                                                            key={ps.id}
                                                            className={`text-xs px-2 py-1 rounded border transition-colors ${ps.stock > 0
                                                                ? "border-blue-400 text-gray-700 hover:border-blue-500 hover:text-blue-600"
                                                                : "border-gray-200 text-gray-400 line-through"
                                                                }`}
                                                        >
                                                            {ps.size.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Price & Button */}
                                            <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-auto">
                                                <div className="text-2xl font-bold text-blue-600">
                                                    {formatPrice(product.price)}
                                                </div>
                                                <button
                                                    onClick={() => navigate(`/product/${product.id}`)}
                                                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg font-semibold py-2 px-4 rounded-lg transition-colors duration-200 transform hover:scale-105"
                                                >
                                                    Xem Chi Tiết
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-4 mt-12">
                                <button
                                    onClick={onPrevPage}
                                    disabled={currentPage === 0}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft size={20} />
                                    Trang Trước
                                </button>

                                {/* Page Info */}
                                <div className="text-black font-semibold">
                                    Trang <span className="text-blue-600">{currentPage + 1}</span> / {totalPages}
                                </div>

                                <button
                                    onClick={onNextPage}
                                    disabled={currentPage >= totalPages - 1}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Trang Sau
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        )}

                        {/* No Products Message */}
                        {sortedProducts.length === 0 && !loading && (
                            <div className="text-center py-12">
                                <p className="text-gray-500 text-lg">Không có sản phẩm để hiển thị</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
