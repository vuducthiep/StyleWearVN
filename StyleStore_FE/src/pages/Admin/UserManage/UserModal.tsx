import React, { useEffect, useState } from 'react';
import type { AdminRole, AdminUser } from './UserTable';
import { useToast } from '../../../components/ToastProvider';
import { buildAuthHeaders, isAuthTokenMissingError } from '../../../services/auth';

type ApiResponse<T> = {
	success: boolean;
	message?: string;
	data?: T;
};

interface UserModalProps {
	isOpen: boolean;
	userId: number | null;
	onClose: () => void;
	onSaved?: () => void;
}

interface UserForm {
	fullName: string;
	email: string;
	phoneNumber?: string;
	roleId: number | '';
	status?: string;
}

const normalizeRole = (role: unknown): AdminRole | null => {
	if (!role || typeof role !== 'object') return null;
	const maybeRole = role as { id?: unknown; name?: unknown };
	if (typeof maybeRole.id !== 'number' || typeof maybeRole.name !== 'string') return null;
	return { id: maybeRole.id, name: maybeRole.name };
};

const UserModal: React.FC<UserModalProps> = ({ isOpen, userId, onClose, onSaved }) => {
	const [form, setForm] = useState<UserForm>({ fullName: '', email: '', phoneNumber: '', roleId: '', status: 'ACTIVE' });
	const [roles, setRoles] = useState<AdminRole[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState('');
	const { pushToast } = useToast();

	useEffect(() => {
		if (!isOpen) return;

		const fetchRoles = async () => {
			try {
				const authHeaders = buildAuthHeaders();
				const res = await fetch('http://localhost:8080/api/admin/roles', {
					headers: {
						'Content-Type': 'application/json',
						...authHeaders,
					},
				});

				if (!res.ok) return;
				const data: ApiResponse<AdminRole[]> = await res.json();
				setRoles(data.data || []);
			} catch {
				setRoles([]);
			}
		};

		fetchRoles();
	}, [isOpen]);

	useEffect(() => {
		if (!isOpen || !userId) return;
		const fetchDetail = async () => {
			setIsLoading(true);
			setError('');
			try {
				const authHeaders = buildAuthHeaders();
				const res = await fetch(`http://localhost:8080/api/admin/users/${userId}`, {
					headers: {
						'Content-Type': 'application/json',
						...authHeaders,
					},
				});
				if (!res.ok) {
					const text = await res.text();
					const data = text ? JSON.parse(text) : {};
					const message = data.message || `Không tải được thông tin người dùng (code ${res.status}).`;
					setError(message);
					return;
				}
				const data: ApiResponse<AdminUser> = await res.json();
				if (!data.success) {
					setError(data.message || 'Không tải được thông tin người dùng.');
					return;
				}
				const user = data.data;
				if (!user) {
					setError('Dữ liệu trả về không hợp lệ.');
					return;
				}

				const normalizedRole = normalizeRole(user.role);
				if (normalizedRole) {
					setRoles((prev) => {
						const exists = prev.some((role) => role.id === normalizedRole.id);
						return exists ? prev : [...prev, normalizedRole];
					});
				}

				setForm({
					fullName: user.fullName || '',
					email: user.email || '',
					phoneNumber: user.phoneNumber || '',
					roleId: normalizedRole?.id ?? '',
					status: user.status || 'ACTIVE',
				});
			} catch (e) {
				if (isAuthTokenMissingError(e)) {
					setError('Bạn chưa đăng nhập hoặc thiếu token.');
					return;
				}
				console.error('Fetch user detail error:', e);
				setError('Không thể kết nối máy chủ.');
			} finally {
				setIsLoading(false);
			}
		};
		fetchDetail();
	}, [isOpen, userId]);

	const handleChange = (key: keyof UserForm, value: string) => {
		if (key === 'roleId') {
			const nextRoleId = value ? Number(value) : '';
			setForm((prev) => ({ ...prev, roleId: nextRoleId }));
			return;
		}
		setForm((prev) => ({ ...prev, [key]: value }));
	};

	const handleSave = async () => {
		if (!userId) return;
		setIsSaving(true);
		setError('');
		try {
			const authHeaders = buildAuthHeaders();
			const selectedRole = roles.find((role) => role.id === form.roleId);
			const payload = {
				...form,
				role: selectedRole ? { id: selectedRole.id, name: selectedRole.name } : undefined,
			};
			const res = await fetch(`http://localhost:8080/api/admin/users/${userId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					...authHeaders,
				},
				body: JSON.stringify(payload),
			});
			if (!res.ok) {
				const text = await res.text();
				const data = text ? JSON.parse(text) : {};
				const message = data.message || `Cập nhật thất bại (code ${res.status}).`;
				setError(message);
				return;
			}
			const data: ApiResponse<AdminUser> = await res.json();
			if (!data.success) {
				setError(data.message || 'Cập nhật thất bại.');
				return;
			}
			onSaved?.();
			pushToast('Cập nhật người dùng thành công', 'success');
			onClose();
		} catch (e) {
			if (isAuthTokenMissingError(e)) {
				setError('Bạn chưa đăng nhập hoặc thiếu token.');
				return;
			}
			console.error('Update user error:', e);
			setError('Không thể kết nối máy chủ.');
		} finally {
			setIsSaving(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
			<div className="w-full max-w-lg rounded-xl bg-white shadow-lg border border-slate-200">
				<div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
					<div>
						<h3 className="text-lg font-semibold text-slate-900">Chỉnh sửa người dùng</h3>
						{userId && <p className="text-xs text-slate-500">ID: {userId}</p>}
					</div>
					<button onClick={onClose} className="text-slate-500 hover:text-slate-700">
						✕
					</button>
				</div>

				<div className="px-5 py-4 space-y-4">
					{error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">{error}</div>}
					{isLoading ? (
						<div className="text-sm text-slate-600">Đang tải thông tin người dùng...</div>
					) : (
						<>
							<div className="grid grid-cols-1 gap-4">
								<label className="text-sm text-slate-700">
									Họ tên
									<input
										type="text"
										className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
										value={form.fullName}
										onChange={(e) => handleChange('fullName', e.target.value)}
									/>
								</label>
								<label className="text-sm text-slate-700">
									Email
									<input
										type="email"
										className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
										value={form.email}
										onChange={(e) => handleChange('email', e.target.value)}
									/>
								</label>
								<label className="text-sm text-slate-700">
									SĐT
									<input
										type="text"
										className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
										value={form.phoneNumber || ''}
										onChange={(e) => handleChange('phoneNumber', e.target.value)}
									/>
								</label>
								<div className="grid grid-cols-2 gap-4">
									<label className="text-sm text-slate-700">
										Role
										<select
											className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
											value={form.roleId}
											onChange={(e) => handleChange('roleId', e.target.value)}
										>
											<option value="">Chọn role</option>
											{roles.map((role) => (
												<option key={role.id} value={role.id}>
													{role.name}
												</option>
											))}
										</select>
									</label>
									<label className="text-sm text-slate-700">
										Trạng thái
										<select
											className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
											value={form.status}
											onChange={(e) => handleChange('status', e.target.value)}
										>
											<option value="ACTIVE">ACTIVE</option>
											<option value="INACTIVE">INACTIVE</option>
										</select>
									</label>
								</div>
							</div>
						</>
					)}
				</div>

				<div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-200 bg-slate-50">
					<button
						onClick={onClose}
						className="px-4 py-2 rounded border border-slate-300 text-slate-700 hover:bg-white transition"
						disabled={isSaving}
					>
						Hủy
					</button>
					<button
						onClick={handleSave}
						className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
						disabled={isSaving || isLoading}
					>
						{isSaving ? 'Đang lưu...' : 'Lưu'}
					</button>
				</div>
			</div>
		</div>
	);
};

export default UserModal;