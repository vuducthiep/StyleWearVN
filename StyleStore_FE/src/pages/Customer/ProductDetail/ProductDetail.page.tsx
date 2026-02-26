import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import Header from "../../../components/Header";
import Comments from "./Comments";
import Footer from '../../../components/Footer';
import ProductDetailContent from "./ProductDetailContent";
import type { ApiResponse, Product } from "./productDetail.types";

// interface CartItem {
//     productId: number;
//     productName: string;
//     price: number;
//     selectedSize: string;
//     quantity: number;
//     thumbnail: string;
// }

export default function ProductDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedSize, setSelectedSize] = useState<number | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [addedToCart, setAddedToCart] = useState(false);

    useEffect(() => {
        if (id) {
            fetchProduct(parseInt(id));
        }
    }, [id]);

    const fetchProduct = async (productId: number) => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:8080/api/user/products/${productId}`);

            if (!response.ok) {
                throw new Error("Không thể lấy dữ liệu sản phẩm");
            }

            const data: ApiResponse = await response.json();
            setProduct(data.data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
            console.error("Error fetching product:", err);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(price);
    };

    const handleAddToCart = async () => {
        if (!selectedSize) {
            alert("Vui lòng chọn size");
            return;
        }

        if (!product) return;

        try {
            // Lấy Size.id từ ProductSize (selectedSize là ProductSize.id)
            const selectedProductSize = product.productSizes.find(ps => ps.id === selectedSize);
            if (!selectedProductSize) {
                throw new Error("Size không hợp lệ");
            }

            const sizeId = selectedProductSize.size.id;

            // Gọi API thêm vào giỏ hàng
            const params = new URLSearchParams({
                productId: product.id.toString(),
                sizeId: sizeId.toString(),
                quantity: quantity.toString(),
            });

            const response = await fetch(
                `http://localhost:8080/api/user/cart/add?${params.toString()}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Lỗi khi thêm vào giỏ hàng");
            }

            setAddedToCart(true);

            // Reset sau 2 giây
            setTimeout(() => {
                setAddedToCart(false);
                setSelectedSize(null);
                setQuantity(1);
            }, 2000);
        } catch (error) {
            alert(error instanceof Error ? error.message : "Có lỗi xảy ra");
            console.error("Error adding to cart:", error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-red-500 text-lg font-semibold mb-4">{error || "Không tìm thấy sản phẩm"}</p>
                    <button
                        onClick={() => navigate("/")}
                        className="text-blue-600 font-semibold hover:underline"
                    >
                        Quay lại trang chủ
                    </button>
                </div>
            </div>
        );
    }

    const availableSizes = product.productSizes.filter(ps => ps.stock > 0);

    return (


        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            < Header />
            <div className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700"
                    >
                        <ChevronLeft size={20} />
                        Quay lại
                    </button>
                </div>
            </div>


            {/* Product Detail */}
            <ProductDetailContent
                product={product}
                availableSizes={availableSizes}
                selectedSize={selectedSize}
                quantity={quantity}
                addedToCart={addedToCart}
                onSelectSize={setSelectedSize}
                onDecreaseQuantity={() => setQuantity(Math.max(1, quantity - 1))}
                onIncreaseQuantity={() => setQuantity(quantity + 1)}
                onAddToCart={handleAddToCart}
                formatPrice={formatPrice}
            />

            {/* cmt */}
            <Comments productId={product.id} />
            <Footer />
        </div>
    );
}
