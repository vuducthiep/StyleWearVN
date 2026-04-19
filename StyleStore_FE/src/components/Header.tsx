import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, History, LogOut, User, LogIn, Sparkles } from 'lucide-react';
import logo from '../assets/Logo.jpg';

interface UserState {
    isLoggedIn: boolean;
    name: string;
}

export const Header = () => {
    const [searchQuery, setSearchQuery] = useState('');

    // Lấy thông tin user từ localStorage chỉ một lần lúc mount
    const [user, setUser] = useState<UserState>(() => {
        const token = localStorage.getItem('token') || localStorage.getItem('token');
        const userInfo = localStorage.getItem('user') || localStorage.getItem('userInfo');

        if (token && userInfo) {
            try {
                const parsedUser = JSON.parse(userInfo);
                return {
                    isLoggedIn: true,
                    name:
                        parsedUser.fullName ||
                        parsedUser.name ||
                        parsedUser.email ||
                        'User',
                };
            } catch {
                return {
                    isLoggedIn: true,
                    name: 'User',
                };
            }
        }

        return { isLoggedIn: false, name: '' };
    });
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Đóng menu khi click bên ngoài
    useEffect(() => {
        if (!userMenuOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [userMenuOpen]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
            setSearchQuery('');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userId');

        setUser({ isLoggedIn: false, name: '' });
        setUserMenuOpen(false);
        navigate('/login');
    };

    const handleProfileClick = () => {
        setUserMenuOpen(false);
        navigate('/profile');
    };

    return (
        <header className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-md sticky top-0 z-50 border-b border-slate-700">
            <div className="max-w-7xl mx-auto px-1 py-1 text-slate-100">
                <div className="flex items-center justify-between gap-8">
                    {/* Logo */}
                    <div
                        onClick={() => navigate('/')}
                        className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                    >
                        <img src={logo} alt="StyleStore Logo" className="h-16 w-16 rounded-full object-cover border border-slate-700" />
                    </div>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="flex-1 max-w-md">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Tìm kiếm sản phẩm..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg bg-slate-800/70 border border-slate-600 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                            />
                            <button
                                type="submit"
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-300 hover:text-purple-300 transition-colors"
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                            </button>
                        </div>
                    </form>

                    {/* Right Actions */}
                    <div className="flex items-center gap-6">
                        {/* Cart Button */}
                        <button
                            onClick={() => navigate('/cart')}
                            className="flex items-center gap-2 text-slate-100 hover:text-purple-200 transition-colors relative group"
                            title="Giỏ hàng"
                        >
                            <ShoppingCart className="w-6 h-6" />
                            <span className="text-sm font-medium hidden sm:inline">Giỏ hàng</span>

                        </button>

                        {/* Purchase History Button */}
                        <button
                            onClick={() => navigate('/orders')}
                            className="flex items-center gap-2 text-slate-100 hover:text-purple-200 transition-colors"
                            title="Lịch sử mua hàng"
                        >
                            <History className="w-6 h-6" />
                            <span className="text-sm font-medium hidden sm:inline">Lịch sử đơn hàng</span>
                        </button>

                        <button
                            onClick={() => navigate('/ai-consultant')}
                            className="flex items-center gap-2 text-slate-100 hover:text-orange-200 transition-colors"
                            title="AI tư vấn sản phẩm"
                        >
                            <Sparkles className="w-6 h-6" />
                            <span className="text-sm font-medium hidden sm:inline">AI tư vấn</span>
                        </button>

                        {/* Auth Section */}
                        {user.isLoggedIn ? (
                            <div className="relative" ref={userMenuRef}>
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center gap-2 text-slate-100 hover:text-purple-200 transition-colors p-2 rounded-lg hover:bg-slate-800/60"
                                    title="Tài khoản"
                                >
                                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white flex-shrink-0">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <span className="text-sm font-medium hidden sm:inline truncate max-w-[120px]">
                                        {user.name}
                                    </span>
                                </button>

                                {/* Dropdown Menu */}
                                {userMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-slate-900 rounded-lg shadow-lg border border-slate-700 overflow-hidden">
                                        {/* User Info Section */}
                                        <div className="px-4 py-3 border-b border-slate-700 bg-slate-800">
                                            <p className="text-sm font-semibold text-slate-100">{user.name}</p>
                                            <p className="text-xs text-slate-400 mt-1">Tài khoản của tôi</p>
                                        </div>

                                        {/* Menu Items */}
                                        <div className="py-2">
                                            <button
                                                onClick={handleProfileClick}
                                                className="w-full px-4 py-2 text-left text-sm text-slate-100 hover:bg-slate-800 hover:text-purple-200 transition-colors flex items-center gap-2"
                                            >
                                                <User className="w-4 h-4" />
                                                Thông tin cá nhân
                                            </button>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full px-4 py-2 text-left text-sm text-red-300 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Đăng xuất
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => navigate('/login')}
                                    className="flex items-center gap-2 px-4 py-2 text-slate-100 border border-slate-500 rounded-lg transition-colors hover:border-purple-400 hover:text-purple-200"
                                >
                                    <LogIn className="w-4 h-4" />
                                    <span className="text-sm font-medium">Đăng nhập</span>
                                </button>
                                <button
                                    onClick={() => navigate('/signup')}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                                >
                                    Đăng ký
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
