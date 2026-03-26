import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import logo from '../../assets/Logo.jpg';

interface LoginFormData {
    email: string;
    password: string;
}

interface ApiResponse {
    message?: string;
    accessToken?: string;
    userId?: number;
    fullName?: string;
    email?: string;
    role?: string;
}

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<LoginFormData>({
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:8080/api/v1/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const raw = await response.text();
            const data: ApiResponse = raw ? JSON.parse(raw) : {} as ApiResponse;

            if (!response.ok) {
                // 401/403 thường do sai email hoặc mật khẩu hoặc bị chặn bảo mật
                const fallbackMsg = response.status === 401 || response.status === 403
                    ? 'Email hoặc mật khẩu không đúng.'
                    : 'Đăng nhập thất bại. Vui lòng thử lại.';
                setError(data?.message || fallbackMsg);
                return;
            }

            // Save token & user info
            if (data.accessToken) {
                localStorage.setItem('token', data.accessToken);
                localStorage.setItem('user', JSON.stringify({
                    id: data.userId,
                    email: data.email,
                    fullName: data.fullName,
                    role: data.role,
                }));
            }

            const role = data.role ?? '';
            if (role === 'ADMIN') {
                navigate('/admin/dashboard');
            } else {
                navigate('/');
            }
        } catch (err) {
            setError('Lỗi kết nối. Vui lòng kiểm tra lại đường dẫn API.');
            console.error('Login error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignUpClick = () => {
        navigate('/signup');
    };

    const handleForgotPasswordClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        navigate('/forgot-password');
    };

    const handleGoogleLogin = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Google login clicked!');
        window.location.href = 'http://localhost:8080/oauth2/authorization/google';
    };

    return (
        <div className="relative flex items-center justify-center min-h-screen w-screen overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden="true">
                <div className="absolute -top-24 -left-10 h-64 w-64 rounded-full bg-blue-500 blur-3xl" />
                <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-indigo-500 blur-3xl" />
            </div>
            <div className="w-full max-w-md px-4">
                {/* Card */}
                <div className="relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent" aria-hidden="true" />
                    <div className="relative p-8">
                        {/* Header */}
                        <div className="text-center mb-6 flex flex-col items-center gap-2">
                            <div className="p-[3px] bg-gradient-to-br from-blue-500 via-cyan-400 to-indigo-600 rounded-full shadow-lg">
                                <div className="rounded-full bg-white p-2">
                                    <img src={logo} alt="StyleStore" className="mx-auto h-20 w-20 rounded-full shadow-md" />
                                </div>
                            </div>
                            <h1 className="text-2xl font-semibold text-slate-900">StyleStore</h1>
                            <p className="text-slate-200">Đăng nhập để tiếp tục mua sắm</p>
                        </div>

                        {/* Error Alert */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-700 text-sm">{error}</p>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Email Field */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-200 mb-2">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                                    <input
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="you@example.com"
                                        required
                                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-white/30 bg-white/10 text-white placeholder-white/60 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-slate-200 mb-2">
                                    Mật khẩu
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        required
                                        className="w-full pl-10 pr-12 py-3 rounded-lg border border-white/30 bg-white/10 text-white placeholder-white/60 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-200"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            {/* Remember Me & Forgot Password */}
                            <div className="flex items-center justify-between">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 text-cyan-400 bg-white/10 border-white/30 rounded focus:ring-2 focus:ring-cyan-400 cursor-pointer"
                                    />
                                    <span className="ml-2 text-sm text-slate-100">Nhớ mật khẩu</span>
                                </label>
                                <a
                                    href="#"
                                    onClick={handleForgotPasswordClick}
                                    className="text-sm text-cyan-200 hover:text-white font-medium underline decoration-dotted"
                                >
                                    Quên mật khẩu?
                                </a>
                            </div>

                            {/* Login Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 px-4 py-3 text-white font-semibold shadow-lg transition hover:scale-[1.01] hover:shadow-xl disabled:opacity-70 disabled:hover:scale-100"
                            >
                                <span className="absolute inset-0 bg-white/10 blur opacity-0 transition group-hover:opacity-100" aria-hidden="true" />
                                {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="my-6 flex items-center">
                            <div className="flex-1 border-t border-white/20"></div>
                            <span className="px-3 text-slate-200 text-sm">Hoặc</span>
                            <div className="flex-1 border-t border-white/20"></div>
                        </div>

                        {/* Social Login */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                className="flex items-center justify-center py-2 px-4 border border-white/30 rounded-lg bg-white/5 hover:bg-white/10 text-slate-100 transition"
                            >
                                <span className="text-lg">f</span>
                                <span className="ml-2 text-sm font-medium">Facebook</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                className="flex items-center justify-center py-2 px-4 border border-white/30 rounded-lg bg-white/5 hover:bg-white/10 text-slate-100 transition hover:cursor-pointer"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                <span className="ml-2 text-sm font-medium">Google</span>
                            </button>
                        </div>

                        {/* Sign Up Link */}
                        <p className="text-center mt-6 text-slate-100">
                            Chưa có tài khoản?{' '}
                            <button
                                onClick={handleSignUpClick}
                                className="font-semibold text-cyan-200 hover:text-white underline decoration-dotted"
                            >
                                Đăng ký ngay
                            </button>
                        </p>
                    </div>
                </div>


            </div>
        </div>
    );
};

export default Login;
