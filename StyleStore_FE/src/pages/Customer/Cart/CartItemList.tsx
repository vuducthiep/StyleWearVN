import CartItemRow from "./CartItemRow";

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

interface CartItemListProps {
    items: CartItem[];
    onQuantityChange: (cartItemId: number, newQuantity: number) => void;
    onRemoveItem: (cartItemId: number) => void;
    onClearCart: () => void;
    onProductClick: (productId: number) => void;
}

export default function CartItemList({
    items,
    onQuantityChange,
    onRemoveItem,
    onClearCart,
    onProductClick,
}: CartItemListProps) {
    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 bg-gray-100 p-4 font-semibold text-gray-900 border-b">
                <div className="col-span-5">Sản phẩm</div>
                <div className="col-span-2 text-center">Kích cỡ</div>
                <div className="col-span-2 text-center">Số lượng</div>
                <div className="col-span-2 text-right">Giá</div>
                <div className="col-span-1"></div>
            </div>

            {/* Items */}
            <div className="divide-y">
                {items.map((item) => (
                    <CartItemRow
                        key={item.id}
                        item={item}
                        onQuantityChange={onQuantityChange}
                        onRemove={onRemoveItem}
                        onProductClick={onProductClick}
                    />
                ))}
            </div>

            {/* Clear Cart Button */}
            <div className="p-4 bg-gray-50 border-t">
                <button
                    onClick={onClearCart}
                    className="text-red-600 font-semibold hover:text-red-700 hover:underline"
                >
                    Xóa toàn bộ giỏ hàng
                </button>
            </div>
        </div>
    );
}
