type PaymentMethod = "COD" | "MOMO" | "ZALOPAY";

interface Promotion {
    id: number;
    code: string;
    name: string;
}

interface Size {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    price: number;
    thumbnail: string;
    material?: string;
}

interface CartItem {
    id: number;
    product: Product;
    size: Size;
    quantity: number;
    price: number;
}

interface OrderSummaryProps {
    cart: {
        id: number;
        cartItems: CartItem[];
        totalPrice: number;
    };
    selectedPromotion: Promotion | null;
    discountAmount: number;
    finalAmount: number;
    paymentMethod: PaymentMethod;
    onPaymentMethodChange: (method: PaymentMethod) => void;
    onCheckout: () => void;
    onContinueShopping: () => void;
    isSubmitting: boolean;
}

const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
};

export default function OrderSummary({
    cart,
    selectedPromotion,
    discountAmount,
    finalAmount,
    paymentMethod,
    onPaymentMethodChange,
    onCheckout,
    onContinueShopping,
    isSubmitting,
}: OrderSummaryProps) {
    return (
        <div className="bg-white rounded-lg shadow p-6 sticky top-20">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
                Tóm tắt đơn hàng
            </h2>

            <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-700">
                    <span>Tổng sản phẩm:</span>
                    <span className="font-semibold">
                        {cart.cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                </div>
                <div className="flex justify-between text-gray-700">
                    <span>Tổng tiền:</span>
                    <span className="font-semibold">
                        {formatPrice(cart.totalPrice)}
                    </span>
                </div>
                <div className="flex justify-between text-gray-700">
                    <span>Phí vận chuyển:</span>
                    <span className="font-semibold text-green-600">Miễn phí</span>
                </div>
                <div className="flex justify-between text-gray-700">
                    <span>Khuyến mãi:</span>
                    <span className="font-semibold text-red-500">
                        {selectedPromotion ? `-${formatPrice(discountAmount)} (${selectedPromotion.code})` : "-"}
                    </span>
                </div>
            </div>

            <div className="border-t pt-4 mb-6">
                <div className="flex justify-between">
                    <span className="text-lg font-bold text-gray-900">
                        Thành tiền:
                    </span>
                    <span className="text-2xl font-bold text-blue-600">
                        {formatPrice(finalAmount)}
                    </span>
                </div>
            </div>

            <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                    Phương thức thanh toán
                </h3>
                <div className="space-y-3">
                    <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition" style={{ borderColor: paymentMethod === "COD" ? "#2563eb" : "#e5e7eb" }}>
                        <input
                            type="radio"
                            name="paymentMethod"
                            value="COD"
                            checked={paymentMethod === "COD"}
                            onChange={(e) => onPaymentMethodChange(e.target.value as PaymentMethod)}
                            className="mt-1 w-4 h-4 cursor-pointer"
                        />
                        <div>
                            <p className="font-semibold text-gray-900">COD (Thanh toán khi nhận hàng)</p>
                            <p className="text-sm text-gray-600">Thanh toán tiền mặt hoặc chuyển khoản khi đơn được giao.</p>
                        </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition" style={{ borderColor: paymentMethod === "MOMO" ? "#2563eb" : "#e5e7eb" }}>
                        <input
                            type="radio"
                            name="paymentMethod"
                            value="MOMO"
                            checked={paymentMethod === "MOMO"}
                            onChange={(e) => onPaymentMethodChange(e.target.value as PaymentMethod)}
                            className="mt-1 w-4 h-4 cursor-pointer"
                        />
                        <div>
                            <p className="font-semibold text-gray-900">Thanh toán qua Momo</p>
                            <p className="text-sm text-gray-600">Quét mã hoặc mở ứng dụng Momo để hoàn tất thanh toán.</p>
                        </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition" style={{ borderColor: paymentMethod === "ZALOPAY" ? "#2563eb" : "#e5e7eb" }}>
                        <input
                            type="radio"
                            name="paymentMethod"
                            value="ZALOPAY"
                            checked={paymentMethod === "ZALOPAY"}
                            onChange={(e) => onPaymentMethodChange(e.target.value as PaymentMethod)}
                            className="mt-1 w-4 h-4 cursor-pointer"
                        />
                        <div>
                            <p className="font-semibold text-gray-900">Thanh toán qua ZaloPay</p>
                            <p className="text-sm text-gray-600">Sử dụng ZaloPay để thanh toán nhanh chóng và an toàn.</p>
                        </div>
                    </label>
                </div>
            </div>

            <button
                onClick={onCheckout}
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition mb-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {isSubmitting ? "Đang xử lý..." : "Thanh toán"}
            </button>
            <button
                onClick={onContinueShopping}
                className="w-full bg-gray-200 text-gray-900 font-semibold py-3 rounded-lg hover:bg-gray-300 transition"
            >
                Tiếp tục mua sắm
            </button>
        </div>
    );
}
