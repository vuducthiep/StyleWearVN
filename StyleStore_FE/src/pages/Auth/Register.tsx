import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, Eye, EyeOff, ShieldCheck, X } from 'lucide-react';
import logo from '../../assets/Logo.jpg';

interface RegisterFormData {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    phoneNumber: string;
}

interface ApiResponse {
    message?: string;
    success?: boolean;
}

const Register: React.FC = () => {
    const API_BASE = 'http://localhost:8080/api/v1/auth';
    const navigate = useNavigate();
    const [formData, setFormData] = useState<RegisterFormData>({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phoneNumber: '',
    });
    const [otp, setOtp] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [otpCooldown, setOtpCooldown] = useState(0);
    const [otpSentTo, setOtpSentTo] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (otpCooldown <= 0) {
            return;
        }

        const timer = window.setInterval(() => {
            setOtpCooldown(prev => {
                if (prev <= 1) {
                    window.clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => window.clearInterval(timer);
    }, [otpCooldown]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
        setError('');
    };

    const validateForm = (): boolean => {
        if (!formData.fullName.trim()) {
            setError('Vui lòng nhập họ tên');
            return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            setError('Email không hợp lệ');
            return false;
        }
        if (formData.password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự');
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return false;
        }
        return true;
    };

    const handleSendOtp = async () => {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            setError('Vui lòng nhập email hợp lệ trước khi gửi OTP');
            return;
        }
        if (otpCooldown > 0) {
            return;
        }

        setIsSendingOtp(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch(`${API_BASE}/send-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email,
                }),
            });

            let data: ApiResponse = {};
            const responseText = await response.text();
            if (responseText) {
                try {
                    data = JSON.parse(responseText) as ApiResponse;
                } catch {
                    data = {};
                }
            }

            if (!response.ok) {
                setError(data.message || 'Không thể gửi OTP. Vui lòng thử lại.');
                return;
            }

            setOtpSentTo(formData.email.trim());
            setOtpCooldown(60);
            setSuccess(data.message || 'OTP đã được gửi tới email của bạn.');
        } catch (err) {
            setError('Lỗi kết nối khi gửi OTP. Vui lòng thử lại.');
            console.error('Send OTP error:', err);
        } finally {
            setIsSendingOtp(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setError('');
        setSuccess('');
        setOtp('');
        setOtpCooldown(0);
        setOtpSentTo('');
        setShowOtpModal(true);
    };

    const handleConfirmOtp = async () => {
        if (!/^\d{6}$/.test(otp)) {
            setError('OTP phải gồm đúng 6 chữ số');
            return;
        }

        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch(`${API_BASE}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fullName: formData.fullName,
                    email: formData.email,
                    otp,
                    password: formData.password,
                    phoneNumber: formData.phoneNumber || null,
                    gender: 'OTHER',
                }),
            });

            let data: ApiResponse = {};
            const responseText = await response.text();
            if (responseText) {
                try {
                    data = JSON.parse(responseText) as ApiResponse;
                } catch {
                    data = {};
                }
            }

            if (!response.ok) {
                setError(data.message || 'Đăng ký thất bại. Vui lòng thử lại.');
                return;
            }

            setSuccess(data.message || 'Đăng ký thành công! Vui lòng đăng nhập.');
            setShowOtpModal(false);
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setError('Lỗi kết nối. Vui lòng kiểm tra lại đường dẫn API.');
            console.error('Register error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const closeOtpModal = () => {
        if (isLoading || isSendingOtp) {
            return;
        }
        setShowOtpModal(false);
    };

    const handleLoginClick = () => {
        navigate('/login');
    };

    return (
        <div className="relative flex items-center justify-center min-h-screen w-screen overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden="true">
                <div className="absolute -top-24 -left-10 h-64 w-64 rounded-full bg-blue-500 blur-3xl" />
                <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-indigo-500 blur-3xl" />
            </div>
            <div className="w-full max-w-2xl px-4 py-10">
                <div className="relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent" aria-hidden="true" />
                    <div className="relative p-8">
                        <div className="text-center mb-6 flex flex-col items-center gap-2">
                            <div className="p-[3px] bg-gradient-to-br from-blue-500 via-cyan-400 to-indigo-600 rounded-full shadow-lg">
                                <div className="rounded-full bg-white p-2">
                                    <img src={logo} alt="StyleStore" className="mx-auto h-20 w-20 rounded-full shadow-md" />
                                </div>
                            </div>
                            <h1 className="text-2xl font-semibold text-slate-900">StyleStore</h1>
                            <p className="text-slate-200">Tạo tài khoản mới và bắt đầu hành trình mua sắm</p>
                        </div>

                        {/* Error Alert */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-700 text-sm">{error}</p>
                            </div>
                        )}

                        {/* Success Alert */}
                        {success && (
                            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-green-700 text-sm">{success}</p>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Full Name Field */}
                            <div>
                                <label htmlFor="fullName" className="block text-sm font-medium text-slate-200 mb-1">
                                    Họ và tên
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 text-gray-400" size={20} />
                                    <input
                                        id="fullName"
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        placeholder="Nguyễn Văn A"
                                        required
                                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-white/30 bg-white/10 text-white placeholder-white/60 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
                                    />
                                </div>
                            </div>

                            {/* Email Field */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-200 mb-1">
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

                            <div>
                                <label htmlFor="phoneNumber" className="block text-sm font-medium text-slate-200 mb-1">
                                    Số điện thoại (không bắt buộc)
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 text-gray-400" size={20} />
                                    <input
                                        id="phoneNumber"
                                        type="tel"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        placeholder="0912345678"
                                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-white/30 bg-white/10 text-white placeholder-white/60 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-slate-200 mb-1">
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
                                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-200 mb-1">
                                    Xác nhận mật khẩu
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                                    <input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        required
                                        className="w-full pl-10 pr-12 py-3 rounded-lg border border-white/30 bg-white/10 text-white placeholder-white/60 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                    >
                                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <label className="flex items-start">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-cyan-400 bg-white/10 border-white/30 rounded focus:ring-2 focus:ring-cyan-400 cursor-pointer mt-1"
                                    required
                                />
                                <span className="ml-2 text-sm text-slate-100">
                                    Tôi đồng ý với{' '}
                                    <a href="#" className="text-blue-600 hover:text-blue-700">
                                        điều khoản dịch vụ
                                    </a>{' '}
                                    và{' '}
                                    <a href="#" className="text-blue-600 hover:text-blue-700">
                                        chính sách bảo mật
                                    </a>
                                </span>
                            </label>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 px-4 py-3 text-white font-semibold shadow-lg transition hover:scale-[1.01] hover:shadow-xl disabled:opacity-70 disabled:hover:scale-100"
                            >
                                <span className="absolute inset-0 bg-white/10 blur opacity-0 transition group-hover:opacity-100" aria-hidden="true" />
                                {'Đăng ký'}
                            </button>
                        </form>

                        <p className="text-center mt-6 text-slate-100">
                            Đã có tài khoản?{' '}
                            <button
                                onClick={handleLoginClick}
                                className="font-semibold text-cyan-200 hover:text-white underline decoration-dotted"
                            >
                                Đăng nhập ngay
                            </button>
                        </p>
                    </div>
                </div>
            </div>

            {showOtpModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
                    <div className="w-full max-w-md rounded-2xl border border-white/20 bg-slate-900/95 p-6 shadow-2xl backdrop-blur">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-white">Xác thực OTP</h2>
                            <button
                                type="button"
                                onClick={closeOtpModal}
                                disabled={isLoading || isSendingOtp}
                                className="text-slate-300 hover:text-white disabled:opacity-50"
                                aria-label="Đóng"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <p className="mb-4 text-sm text-slate-200">
                            Nhấn <span className="font-semibold">Gửi OTP</span> để nhận mã xác thực tại email <span className="font-semibold">{formData.email}</span>.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="modalOtp" className="mb-1 block text-sm font-medium text-slate-200">
                                    Mã OTP
                                </label>
                                <div className="relative">
                                    <ShieldCheck className="absolute left-3 top-3 text-gray-400" size={20} />
                                    <input
                                        id="modalOtp"
                                        type="text"
                                        value={otp}
                                        onChange={e => {
                                            setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                                            setError('');
                                        }}
                                        inputMode="numeric"
                                        maxLength={6}
                                        placeholder="Nhập 6 chữ số"
                                        className="w-full rounded-lg border border-white/30 bg-white/10 py-3 pl-10 pr-4 text-white placeholder-white/60 shadow-sm transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-400"
                                    />
                                </div>
                                {otpSentTo && <p className="mt-2 text-xs text-cyan-200">OTP đã gửi tới: {otpSentTo}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={handleSendOtp}
                                    disabled={isSendingOtp || otpCooldown > 0 || isLoading}
                                    className="rounded-lg bg-cyan-600 px-4 py-3 font-medium text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isSendingOtp ? 'Đang gửi...' : otpCooldown > 0 ? `Gửi lại (${otpCooldown}s)` : 'Gửi OTP'}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleConfirmOtp}
                                    disabled={isLoading}
                                    className="rounded-lg bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 px-4 py-3 font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isLoading ? 'Đang xác nhận...' : 'Xác nhận'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Register;
