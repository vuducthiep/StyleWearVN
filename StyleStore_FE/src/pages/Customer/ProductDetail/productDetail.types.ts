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
    price: number;
    thumbnail: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    category: Category;
    productSizes: ProductSize[];
}

export interface ApiResponse {
    success: boolean;
    message: string;
    data: Product;
}