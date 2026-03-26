import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mail, ShieldCheck } from 'lucide-react';
import { useToast } from '../../components/ToastProvider';

const API_BASE = 'http://localhost:8080/auth';
const RESEND_SECONDS = 60;

interface VerifyOtpResponse {
    success: boolean;
    message: string;
    data: {
        resetToken: string;
    };
}

interface ForgotPasswordResponse {
    success: boolean;
    message: string;
    data: null;
}

export default function VerifyOtpPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { pushToast } = useToast();

    const [email, setEmail] = useState<string>((location.state as { email?: string } | null)?.email || '');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState(RESEND_SECONDS);

    useEffect(() => {
        if (countdown <= 0) return;
        const timer = window.setInterval(() => {
            setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => window.clearInterval(timer);
    }, [countdown]);

    const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        try {
            setLoading(true);
            const { data } = await axios.post<VerifyOtpResponse>(`${API_BASE}/verify-otp`, {
                email,
                otp,
            });

            pushToast(data.message || 'Xác thực OTP thành công', 'success');
            navigate('/reset-password', {
                state: {
                    email,
                    resetToken: data.data.resetToken,
                },
            });
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const message = (err.response?.data as { message?: string } | undefined)?.message
                    || 'OTP không hợp lệ hoặc đã hết hạn';
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

    const handleResend = async () => {
        setError('');

        try {
            setResendLoading(true);
            const { data } = await axios.post<ForgotPasswordResponse>(`${API_BASE}/forgot-password`, { email });
            setCountdown(RESEND_SECONDS);
            pushToast(data.message || 'OTP đã được gửi lại', 'success');
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const message = (err.response?.data as { message?: string } | undefined)?.message
                    || 'Không thể gửi lại OTP';
                setError(message);
                pushToast(message, 'error');
                return;
            }

            setError('Có lỗi xảy ra. Vui lòng thử lại.');
            pushToast('Có lỗi xảy ra. Vui lòng thử lại.', 'error');
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-md border border-slate-200 p-6">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Xác thực OTP</h1>
                <p className="text-sm text-slate-600 mb-6">Nhập email và mã OTP đã nhận</p>

                {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}

                <form onSubmit={handleVerify} className="space-y-4">
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
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="otp" className="block text-sm font-medium text-slate-700 mb-1">OTP</label>
                        <div className="relative">
                            <ShieldCheck size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                id="otp"
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                required
                                className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 tracking-[0.2em] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                placeholder="000000"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-blue-600 text-white py-2.5 font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Đang xác thực...' : 'Verify OTP'}
                    </button>
                </form>

                <div className="mt-4 text-center text-sm">
                    {countdown > 0 ? (
                        <p className="text-slate-500">Gửi lại OTP sau {countdown}s</p>
                    ) : (
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={resendLoading}
                            className="text-blue-600 hover:underline font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {resendLoading ? 'Đang gửi lại...' : 'Resend OTP'}
                        </button>
                    )}
                </div>

                <p className="mt-5 text-sm text-slate-600 text-center">
                    <Link to="/forgot-password" className="text-blue-600 hover:underline font-medium">Quay lại bước nhập email</Link>
                </p>
            </div>
        </div>
    );
}
