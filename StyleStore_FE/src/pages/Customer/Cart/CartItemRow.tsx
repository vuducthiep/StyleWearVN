import { Trash2, Plus, Minus } from "lucide-react";

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

interface CartItemRowProps {
    item: CartItem;
    onQuantityChange: (cartItemId: number, newQuantity: number) => void;
    onRemove: (cartItemId: number) => void;
    onProductClick: (productId: number) => void;
}

const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
};

export default function CartItemRow({
    item,
    onQuantityChange,
    onRemove,
    onProductClick,
}: CartItemRowProps) {
    return (
        <div className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 transition">
            {/* Product Info */}
            <div className="col-span-5 flex gap-4">
                <img
                    src={item.product.thumbnail}
                    alt={item.product.name}
                    className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="flex flex-col justify-center">
                    <h3
                        onClick={() => onProductClick(item.product.id)}
                        className="font-semibold text-gray-900 hover:text-blue-600 cursor-pointer"
                    >
                        {item.product.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                        {formatPrice(item.price)}
                    </p>
                </div>
            </div>

            {/* Size */}
            <div className="col-span-2 text-center">
                <span className="bg-gray-200 px-3 py-1 rounded-full font-semibold text-sm">
                    {item.size.name}
                </span>
            </div>

            {/* Quantity Control */}
            <div className="col-span-2 flex justify-center items-center gap-2">
                <button
                    onClick={() =>
                        onQuantityChange(item.id, item.quantity - 1)
                    }
                    disabled={item.quantity === 1}
                    className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    <Minus size={16} />
                </button>
                <span className="w-8 text-center font-semibold">
                    {item.quantity}
                </span>
                <button
                    onClick={() =>
                        onQuantityChange(item.id, item.quantity + 1)
                    }
                    className="p-1 hover:bg-gray-200 rounded transition"
                >
                    <Plus size={16} />
                </button>
            </div>

            {/* Total Price */}
            <div className="col-span-2 text-right">
                <p className="font-bold text-blue-600">
                    {formatPrice(item.price * item.quantity)}
                </p>
            </div>

            {/* Delete Button */}
            <div className="col-span-1 flex justify-end">
                <button
                    onClick={() => onRemove(item.id)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );
}
