import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { useToast } from '../../components/ToastProvider';

const API_BASE = 'http://localhost:8080/auth';

interface ResetPasswordResponse {
    success: boolean;
    message: string;
    data: null;
}

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { pushToast } = useToast();

    const routeState = (location.state as { email?: string; resetToken?: string } | null) || {};
    const [email, setEmail] = useState(routeState.email || '');
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        if (!routeState.resetToken) {
            const message = 'Thiếu reset token. Vui lòng xác thực OTP lại.';
            setError(message);
            pushToast(message, 'error');
            return;
        }

        if (newPassword.length < 6) {
            const message = 'Mật khẩu phải có ít nhất 6 ký tự';
            setError(message);
            pushToast(message, 'error');
            return;
        }

        try {
            setLoading(true);
            const { data } = await axios.post<ResetPasswordResponse>(`${API_BASE}/reset-password`, {
                email,
                newPassword,
                resetToken: routeState.resetToken,
            });

            pushToast(data.message || 'Đặt lại mật khẩu thành công', 'success');
            navigate('/login');
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const message = (err.response?.data as { message?: string } | undefined)?.message
                    || 'Không thể đặt lại mật khẩu';
                setError(message);
                pushToast(message, 'error');
                return;
            }

            setError('Có lỗi xảy ra. Vui lòng thử lại.');
            pushToast('Có lỗi xảy ra. Vui lòng thử lại.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-md border border-slate-200 p-6">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Đặt lại mật khẩu</h1>
                <p className="text-sm text-slate-600 mb-6">Nhập mật khẩu mới cho tài khoản của bạn</p>

                {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full rounded-lg border border-slate-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>

                    <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu mới</label>
                        <div className="relative">
                            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                id="newPassword"
                                type={showPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-10 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                placeholder="Ít nhất 6 ký tự"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-blue-600 text-white py-2.5 font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Đang đặt lại mật khẩu...' : 'Reset Password'}
                    </button>
                </form>

                <p className="mt-5 text-sm text-slate-600 text-center">
                    <Link to="/login" className="text-blue-600 hover:underline font-medium">Quay lại đăng nhập</Link>
                </p>
            </div>
        </div>
    );
}
