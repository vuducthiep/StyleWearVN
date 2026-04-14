import React, { useCallback, useEffect, useRef, useState } from 'react';
import { buildAuthHeaders, isAuthTokenMissingError } from '../../../services/auth';

type ApiResponse<T> = {
	success: boolean;
	message?: string;
	data?: T;
};

type PageResult<T> = {
	content: T[];
	number: number;
	totalPages: number;
	totalElements: number;
};

type AdminUserSummary = {
	id: number;
	fullName?: string;
};

export interface AdminImportReceipt {
	id: number;
	supplierId: number;
	supplierName?: string;
	createdBy?: number;
	note?: string;
	status?: string;
	totalAmount?: number;
	createdAt?: string;
	updatedAt?: string;
}

interface ImportReceiptTableProps {
	refreshKey?: number;
	onViewDetail?: (receipt: AdminImportReceipt) => void;
}

const STATUS_OPTIONS = [
	{ value: '', label: 'Tất cả trạng thái' },
	{ value: 'COMPLETED', label: 'Hoàn thành' },
	{ value: 'PENDING', label: 'Chờ xử lý' },
	{ value: 'CANCELLED', label: 'Đã hủy' },
];

const ImportReceiptTable: React.FC<ImportReceiptTableProps> = ({ refreshKey = 0, onViewDetail }) => {
	const [receipts, setReceipts] = useState<AdminImportReceipt[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');
	const [page, setPage] = useState(0);
	const [size] = useState(10);
	const [totalPages, setTotalPages] = useState(0);
	const [totalElements, setTotalElements] = useState(0);
	const [creatorNameMap, setCreatorNameMap] = useState<Record<number, string>>({});

	const [supplierInput, setSupplierInput] = useState('');
	const [statusInput, setStatusInput] = useState('');
	const [appliedSupplierId, setAppliedSupplierId] = useState<number | null>(null);
	const [appliedStatus, setAppliedStatus] = useState('');

	const lastEffectFetchKeyRef = useRef<string | null>(null);

	const fetchCreatorNames = useCallback(async (creatorIds: number[]) => {
		if (creatorIds.length === 0) {
			return;
		}

		const missingIds = creatorIds.filter((id) => !creatorNameMap[id]);
		if (missingIds.length === 0) {
			return;
		}

		try {
			const authHeaders = buildAuthHeaders();
			const entries = await Promise.all(
				missingIds.map(async (id) => {
					const res = await fetch(`http://localhost:8080/api/admin/users/${id}`, {
						headers: {
							'Content-Type': 'application/json',
							...authHeaders,
						},
					});

					if (!res.ok) {
						return [id, `ID: ${id}`] as const;
					}

					const data: ApiResponse<AdminUserSummary> = await res.json();
					if (!data.success || !data.data?.fullName) {
						return [id, `ID: ${id}`] as const;
					}

					return [id, data.data.fullName] as const;
				})
			);

			setCreatorNameMap((prev) => {
				const next = { ...prev };
				entries.forEach(([id, name]) => {
					next[id] = name;
				});
				return next;
			});
		} catch (e) {
			console.error('Fetch creator names error:', e);
		}
	}, [creatorNameMap]);

	const fetchImportReceipts = useCallback(async (
		pageIndex = 0,
		supplierId = appliedSupplierId,
		status = appliedStatus,
	) => {
		setIsLoading(true);
		setError('');

		try {
			const query = new URLSearchParams({
				page: String(pageIndex),
				size: String(size),
				sortBy: 'createdAt',
				sortDir: 'desc',
			});

			if (supplierId !== null) {
				query.set('supplierId', String(supplierId));
			}

			if (status.trim()) {
				query.set('status', status.trim());
			}

			const authHeaders = buildAuthHeaders();
			const res = await fetch(`http://localhost:8080/api/admin/import-receipts?${query.toString()}`, {
				headers: {
					'Content-Type': 'application/json',
					...authHeaders,
				},
			});

			if (!res.ok) {
				const text = await res.text();
				const data = text ? JSON.parse(text) : {};
				const message = data.message || `Lỗi tải danh sách phiếu nhập (code ${res.status}).`;
				setError(message);
				return;
			}

			const data: ApiResponse<PageResult<AdminImportReceipt>> = await res.json();
			if (!data.success || !data.data) {
				setError(data.message || 'Lỗi tải danh sách phiếu nhập.');
				return;
			}

			setReceipts(data.data.content || []);
			setTotalPages(data.data.totalPages || 0);
			setTotalElements(data.data.totalElements || 0);

			const creatorIds = (data.data.content || [])
				.map((receipt) => receipt.createdBy)
				.filter((id): id is number => typeof id === 'number');
			fetchCreatorNames(Array.from(new Set(creatorIds)));
		} catch (e) {
			if (isAuthTokenMissingError(e)) {
				setError('Bạn chưa đăng nhập hoặc thiếu token.');
				return;
			}

			console.error('Fetch import receipts error:', e);
			setError('Không thể kết nối máy chủ.');
		} finally {
			setIsLoading(false);
		}
	}, [appliedStatus, appliedSupplierId, fetchCreatorNames, size]);

	useEffect(() => {
		const fetchKey = `${page}-${refreshKey}-${appliedSupplierId ?? 'all'}-${appliedStatus}`;
		if (lastEffectFetchKeyRef.current === fetchKey) {
			return;
		}

		lastEffectFetchKeyRef.current = fetchKey;
		fetchImportReceipts(page, appliedSupplierId, appliedStatus);
	}, [appliedStatus, appliedSupplierId, fetchImportReceipts, page, refreshKey]);

	const handleApplyFilters = () => {
		const trimmedSupplier = supplierInput.trim();
		const parsedSupplierNumber = Number(trimmedSupplier);

		if (trimmedSupplier && (!Number.isInteger(parsedSupplierNumber) || parsedSupplierNumber <= 0)) {
			setError('Mã nhà cung cấp phải là số nguyên dương.');
			return;
		}

		const parsedSupplier = trimmedSupplier ? parsedSupplierNumber : null;

		setError('');
		setAppliedSupplierId(parsedSupplier);
		setAppliedStatus(statusInput);
		setPage(0);
	};

	const handleClearFilters = () => {
		setSupplierInput('');
		setStatusInput('');
		setAppliedSupplierId(null);
		setAppliedStatus('');
		setPage(0);
	};

	const handlePageChange = (nextPage: number) => {
		setPage(nextPage);
	};

	const formatCurrency = (amount?: number) => {
		return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
	};

	const formatDateTime = (date?: string) => {
		if (!date) {
			return '-';
		}

		return new Date(date).toLocaleString('vi-VN');
	};

	const getStatusLabel = (status?: string) => {
		switch (status) {
			case 'COMPLETED':
				return 'Hoàn thành';
			case 'PENDING':
				return 'Chờ xử lý';
			case 'CANCELLED':
				return 'Đã hủy';
			default:
				return status || '-';
		}
	};

	const getStatusStyle = (status?: string) => {
		switch (status) {
			case 'COMPLETED':
				return 'bg-emerald-100 text-emerald-700';
			case 'PENDING':
				return 'bg-amber-100 text-amber-700';
			case 'CANCELLED':
				return 'bg-red-100 text-red-700';
			default:
				return 'bg-slate-100 text-slate-700';
		}
	};

	const getCreatorDisplay = (createdBy?: number) => {
		if (typeof createdBy !== 'number') {
			return '-';
		}

		return creatorNameMap[createdBy] || `ID: ${createdBy}`;
	};

	return (
		<div className="w-full flex-1 bg-white shadow rounded-lg overflow-hidden border border-slate-200">
			<div className="p-4 space-y-3">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<h2 className="text-lg font-semibold text-slate-800">Danh sách phiếu nhập</h2>
					<div className="flex flex-wrap items-center gap-2 justify-end">
						<input
							type="text"
							value={supplierInput}
							onChange={(event) => setSupplierInput(event.target.value)}
							placeholder="Lọc theo mã NCC"
							className="w-40 px-3 py-2 rounded border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
						/>
						<select
							value={statusInput}
							onChange={(event) => setStatusInput(event.target.value)}
							className="px-3 py-2 rounded border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
						>
							{STATUS_OPTIONS.map((option) => (
								<option key={option.value} value={option.value}>{option.label}</option>
							))}
						</select>
						<button
							type="button"
							onClick={handleApplyFilters}
							className="px-4 py-2 rounded bg-slate-800 text-white text-sm font-medium hover:bg-slate-900 transition"
						>
							Áp dụng
						</button>
						<button
							type="button"
							onClick={handleClearFilters}
							className="px-4 py-2 rounded border border-slate-300 text-sm hover:bg-slate-50 transition"
						>
							Xóa lọc
						</button>
						{error && (
							<button
								type="button"
								onClick={() => fetchImportReceipts(page, appliedSupplierId, appliedStatus)}
								className="text-sm px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
							>
								Thử lại
							</button>
						)}
					</div>
				</div>
			</div>

			{isLoading ? (
				<div className="p-4 text-slate-500">Đang tải...</div>
			) : error ? (
				<div className="p-4 text-red-600 text-sm">{error}</div>
			) : receipts.length === 0 ? (
				<div className="p-4 text-slate-500 text-sm">Chưa có phiếu nhập.</div>
			) : (
				<div className="overflow-x-auto w-full">
					<table className="min-w-full w-full text-sm">
						<thead className="bg-slate-50 text-slate-600">
							<tr>
								<th className="px-4 py-2 text-center">Mã phiếu</th>
								<th className="px-4 py-2 text-left">Nhà cung cấp</th>
								<th className="px-4 py-2 text-center">Người tạo</th>
								<th className="px-4 py-2 text-right">Tổng tiền</th>
								<th className="px-4 py-2 text-center">Trạng thái</th>
								<th className="px-4 py-2 text-center">Ngày tạo</th>
								<th className="px-4 py-2 text-center">Thao tác</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100 text-slate-700">
							{receipts.map((receipt) => (
								<tr key={receipt.id} className="hover:bg-slate-50">
									<td className="px-4 py-2 text-center font-medium">#{receipt.id}</td>
									<td className="px-4 py-2">
										<p className="font-medium">{receipt.supplierName || '-'}</p>
										<p className="text-xs text-slate-500">ID NCC: {receipt.supplierId ?? '-'}</p>
									</td>
									<td className="px-4 py-2 text-center">{getCreatorDisplay(receipt.createdBy)}</td>
									<td className="px-4 py-2 text-right font-semibold text-blue-700">{formatCurrency(receipt.totalAmount)}</td>
									<td className="px-4 py-2 text-center">
										<span className={`px-2 py-1 rounded text-xs ${getStatusStyle(receipt.status)}`}>
											{getStatusLabel(receipt.status)}
										</span>
									</td>
									<td className="px-4 py-2 text-center">{formatDateTime(receipt.createdAt)}</td>
									<td className="px-4 py-2 text-center">
										<button
											type="button"
											onClick={() => onViewDetail?.(receipt)}
											className="p-2 rounded border border-slate-200 hover:border-blue-500 hover:text-blue-600 transition"
											title="Xem chi tiết"
										>
											<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
												<path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
												<path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
											</svg>
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{!isLoading && !error && totalPages > 1 && (
				<div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-sm text-slate-700">
					<span>
						Trang {page + 1}/{totalPages} • Tổng {totalElements} phiếu nhập
					</span>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={() => handlePageChange(Math.max(page - 1, 0))}
							disabled={page === 0}
							className="px-3 py-1 rounded border border-slate-300 disabled:opacity-50 hover:bg-slate-50"
						>
							Trước
						</button>
						<button
							type="button"
							onClick={() => handlePageChange(Math.min(page + 1, totalPages - 1))}
							disabled={page >= totalPages - 1}
							className="px-3 py-1 rounded border border-slate-300 disabled:opacity-50 hover:bg-slate-50"
						>
							Sau
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default ImportReceiptTable;
