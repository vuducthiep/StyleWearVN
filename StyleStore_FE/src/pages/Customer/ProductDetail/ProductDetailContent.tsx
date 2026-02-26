import { ShoppingCart, Check } from "lucide-react";
import type { Product, ProductSize } from "./productDetail.types";

type ProductDetailContentProps = {
    product: Product;
    availableSizes: ProductSize[];
    selectedSize: number | null;
    quantity: number;
    addedToCart: boolean;
    onSelectSize: (productSizeId: number) => void;
    onDecreaseQuantity: () => void;
    onIncreaseQuantity: () => void;
    onAddToCart: () => void;
    formatPrice: (price: number) => string;
};

export default function ProductDetailContent({
    product,
    availableSizes,
    selectedSize,
    quantity,
    addedToCart,
    onSelectSize,
    onDecreaseQuantity,
    onIncreaseQuantity,
    onAddToCart,
    formatPrice,
}: ProductDetailContentProps) {
    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex items-center justify-center">
                    <div className="relative w-full aspect-square bg-gray-200 rounded-lg overflow-hidden">
                        <img
                            src={product.thumbnail}
                            alt={product.name}
                            className="w-full h-full object-cover"
                        />
                        {product.status === "ACTIVE" && (
                            <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full font-semibold">
                                Có sẵn
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col justify-center">
                    <p className="text-sm text-blue-600 font-semibold uppercase tracking-wide mb-2">
                        {product.category.name}
                    </p>

                    <h1 className="text-2xl font-bold text-gray-900 mb-4">{product.name}</h1>

                    <div className="flex gap-4 mb-6">
                        <div>
                            <p className="text-xs text-gray-600 uppercase">Thương hiệu</p>
                            <p className="text-base font-semibold text-gray-900">{product.brand?.toUpperCase() || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-600 uppercase">Giới tính</p>
                            <p className="text-base font-semibold text-gray-900">{product.gender}</p>
                        </div>
                    </div>

                    <p className="text-gray-700 text-base mb-6">{product.description}</p>

                    <div className="text-3xl font-bold text-blue-600 mb-8">
                        {formatPrice(product.price)}
                    </div>

                    <div className="mb-8">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">Chọn Size</h3>
                        {availableSizes.length > 0 ? (
                            <div className="flex flex-wrap gap-3">
                                {availableSizes.map((ps) => (
                                    <button
                                        key={ps.id}
                                        onClick={() => onSelectSize(ps.id)}
                                        className={`px-6 py-3 rounded-lg font-semibold transition-all ${selectedSize === ps.id
                                            ? "bg-blue-600 text-white scale-105"
                                            : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                                            }`}
                                    >
                                        {ps.size.name} ({ps.stock})
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-red-500 font-semibold">Sản phẩm này hiện không có size khả dụng</p>
                        )}
                    </div>

                    <div className="mb-8">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">Số lượng</h3>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={onDecreaseQuantity}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold"
                            >
                                −
                            </button>
                            <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                            <button
                                onClick={onIncreaseQuantity}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={onAddToCart}
                        disabled={availableSizes.length === 0 || addedToCart}
                        className={`w-full py-4 rounded-lg font-bold text-base transition-all flex items-center justify-center gap-2 ${addedToCart
                            ? "bg-green-500 text-white"
                            : availableSizes.length === 0
                                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700 text-white hover:scale-105"
                            }`}
                    >
                        {addedToCart ? (
                            <>
                                <Check size={20} />
                                Đã thêm vào giỏ
                            </>
                        ) : (
                            <>
                                <ShoppingCart size={20} />
                                Thêm vào giỏ hàng
                            </>
                        )}
                    </button>

                </div>
            </div>
        </div>
    );
}