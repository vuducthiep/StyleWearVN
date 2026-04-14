import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, Menu, X } from 'lucide-react';
import {
    AppstoreOutlined,
    DashboardOutlined,
    InboxOutlined,
    LogoutOutlined,
    MessageOutlined,
    ShopOutlined,
    ShoppingCartOutlined,
    ShoppingOutlined,
    TagsOutlined,
    UserOutlined,
} from '@ant-design/icons';
import logo from '../../assets/Logo.jpg';

interface SidebarItem {
    label: string;
    path: string;
    icon: React.ReactNode;
}

const Sidebar: React.FC = () => {
    const [isOpen, setIsOpen] = useState(true);
    const [isProductGroupOpen, setIsProductGroupOpen] = useState(true);
    const [isImportGroupOpen, setIsImportGroupOpen] = useState(true);
    const location = useLocation();

    const menuItems: SidebarItem[] = [
        { label: 'Tổng quan', path: '/admin/dashboard', icon: <DashboardOutlined /> },
        { label: 'Quản lý người dùng', path: '/admin/user-manager', icon: <UserOutlined /> },
        { label: 'Quản lý đơn hàng', path: '/admin/order-manager', icon: <ShoppingCartOutlined /> },
        { label: 'Hỗ trợ khách hàng', path: '/admin/support-chat', icon: <MessageOutlined /> },
    ];

    const productSubmenuItems: SidebarItem[] = [
        { label: 'Quản lý sản phẩm', path: '/admin/product-manager', icon: <ShoppingOutlined /> },
        { label: 'Quản lý danh mục', path: '/admin/category-manager', icon: <AppstoreOutlined /> },
        { label: 'Quản lý khuyến mãi', path: '/admin/promotion-manager', icon: <TagsOutlined /> },
    ];

    const importSubmenuItems: SidebarItem[] = [
        { label: 'Quản lý nhà cung cấp', path: '/admin/supplier-manager', icon: <ShopOutlined /> },
        { label: 'Quản lý phiếu nhập', path: '/admin/import-receipt-manager', icon: <InboxOutlined /> },
    ];

    const isActive = (path: string) => location.pathname === path;
    const isProductGroupActive = productSubmenuItems.some((item) => isActive(item.path));
    const isImportGroupActive = importSubmenuItems.some((item) => isActive(item.path));

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed top-4 left-4 z-50 lg:hidden bg-blue-600 text-white p-2 rounded-lg"
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <div
                className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-gray-900 to-gray-950 text-white transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'} lg:w-64 z-40 flex flex-col`}
            >
                <div className="flex items-center justify-center py-6 border-b border-gray-700 shrink-0">
                    {isOpen ? (
                        <div className="text-center">
                            <img src={logo} alt="StyleStore" className="mx-auto mb-2 h-24 w-24 rounded-full shadow-md" />
                            <p className="text-lg text-gray-400 mt-1">Trang quản trị</p>
                        </div>
                    ) : (
                        <img src={logo} alt="SS" className="hidden lg:block h-10 w-10 rounded-full shadow-md" />
                    )}
                </div>

                <nav className="mt-4 px-3 space-y-2 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${isActive(item.path) ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-300 hover:bg-gray-800'}`}
                        >
                            <span className="text-base">{item.icon}</span>
                            {isOpen && <span className="font-medium text-sm">{item.label}</span>}
                        </Link>
                    ))}

                    <div className="space-y-2">
                        <button
                            type="button"
                            onClick={() => setIsProductGroupOpen((prev) => !prev)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${isProductGroupActive ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-300 hover:bg-gray-800'}`}
                        >
                            <span className="text-base"><ShoppingOutlined /></span>
                            {isOpen && <span className="font-medium text-sm flex-1 text-left">Quản lý sản phẩm</span>}
                            {isOpen && (isProductGroupOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
                        </button>

                        <div
                            className={`ml-4 space-y-2 border-l border-gray-700 pl-3 overflow-hidden transform-gpu transition-all duration-300 ease-out ${isOpen && isProductGroupOpen ? 'max-h-48 opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-1 pointer-events-none'}`}
                        >
                            <div className="space-y-2 py-1">
                                {productSubmenuItems.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${isActive(item.path) ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-300 hover:bg-gray-800'}`}
                                    >
                                        <span className="text-base">{item.icon}</span>
                                        <span className="font-medium text-sm">{item.label}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <button
                            type="button"
                            onClick={() => setIsImportGroupOpen((prev) => !prev)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${isImportGroupActive ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-300 hover:bg-gray-800'}`}
                        >
                            <span className="text-base"><InboxOutlined /></span>
                            {isOpen && <span className="font-medium text-sm flex-1 text-left">Quản lý nhập hàng</span>}
                            {isOpen && (isImportGroupOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
                        </button>

                        <div
                            className={`ml-4 space-y-2 border-l border-gray-700 pl-3 overflow-hidden transform-gpu transition-all duration-300 ease-out ${isOpen && isImportGroupOpen ? 'max-h-40 opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-1 pointer-events-none'}`}
                        >
                            <div className="space-y-2 py-1">
                                {importSubmenuItems.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${isActive(item.path) ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-300 hover:bg-gray-800'}`}
                                    >
                                        <span className="text-base">{item.icon}</span>
                                        <span className="font-medium text-sm">{item.label}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </nav>

                <div className="px-3 py-4 border-t border-gray-800 shrink-0">
                    <button
                        onClick={() => {
                            localStorage.removeItem('token');
                            window.location.href = '/login';
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-red-700 hover:bg-red-800 transition-all duration-200 ${!isOpen ? 'justify-center' : ''}`}
                    >
                        <LogoutOutlined className="text-base" />
                        {isOpen && <span className="font-medium text-sm">Đăng xuất</span>}
                    </button>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
