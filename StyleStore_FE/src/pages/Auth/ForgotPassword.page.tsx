import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mail } from 'lucide-react';
import { useToast } from '../../components/ToastProvider';

const API_BASE = 'http://localhost:8080/auth';

interface ForgotPasswordResponse {
    success: boolean;
    message: string;
    data: null;
}

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const { pushToast } = useToast();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            setLoading(true);
            const { data } = await axios.post<ForgotPasswordResponse>(`${API_BASE}/forgot-password`, {
                email,
            });

            setSuccess(data.message || 'OTP đã được gửi nếu email tồn tại trong hệ thống');
            pushToast(data.message || 'OTP đã được gửi', 'success');

            navigate('/verify-otp', {
                state: { email },
            });
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const message = (err.response?.data as { message?: string } | undefined)?.message
                    || 'Không thể gửi OTP. Vui lòng thử lại.';
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
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Quên mật khẩu</h1>
                <p className="text-sm text-slate-600 mb-6">Nhập email để nhận mã OTP</p>

                {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
                {success && <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">{success}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <div className="relative">
                            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                placeholder="you@example.com"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-blue-600 text-white py-2.5 font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Đang gửi OTP...' : 'Send OTP'}
                    </button>
                </form>

                <p className="mt-5 text-sm text-slate-600 text-center">
                    Nhớ mật khẩu?{' '}
                    <Link to="/login" className="text-blue-600 hover:underline font-medium">Đăng nhập</Link>
                </p>
            </div>
        </div>
    );
}
