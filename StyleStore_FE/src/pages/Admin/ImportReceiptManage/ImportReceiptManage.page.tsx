import React, { useState } from 'react';
import ImportReceiptTable, { type AdminImportReceipt } from './ImportReceiptTable';
import ImportReceiptDetailModal from './ImportReceiptDetailModal';

const ImportReceiptManage: React.FC = () => {
	const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
	const [selectedReceiptId, setSelectedReceiptId] = useState<number | null>(null);

	const handleViewDetail = (receipt: AdminImportReceipt) => {
		setSelectedReceiptId(receipt.id);
	};

	const handleCloseDetailModal = () => {
		setSelectedReceiptId(null);
	};

	return (
		<div className="p-6 w-full">
			<div className="mb-4 flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-slate-800">Quản lý phiếu nhập</h1>
					<p className="text-slate-500 text-sm">Xem danh sách phiếu nhập và theo dõi trạng thái nhập kho.</p>
				</div>
				<button
					type="button"
					onClick={() => setIsImportDialogOpen(true)}
					className="px-4 py-2 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
				>
					+ Nhập sản phẩm
				</button>
			</div>

			<ImportReceiptTable onViewDetail={handleViewDetail} />

			{isImportDialogOpen && (
				<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
					<div className="w-full max-w-md rounded-xl bg-white shadow-xl border border-slate-200">
						<div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
							<h3 className="text-lg font-semibold text-slate-800">Nhập sản phẩm</h3>
							<button
								type="button"
								onClick={() => setIsImportDialogOpen(false)}
								className="text-slate-400 hover:text-slate-600"
								aria-label="Đóng"
							>
								<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
									<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
						<div className="px-5 py-4 text-sm text-slate-600">
							Form nhập phiếu đang được hoàn thiện. Bạn có thể theo dõi danh sách phiếu nhập bên dưới.
						</div>
						<div className="px-5 py-4 border-t border-slate-100 flex justify-end">
							<button
								type="button"
								onClick={() => setIsImportDialogOpen(false)}
								className="px-4 py-2 rounded bg-slate-700 text-white text-sm font-medium hover:bg-slate-800"
							>
								Đóng
							</button>
						</div>
					</div>
				</div>
			)}

			<ImportReceiptDetailModal
				isOpen={selectedReceiptId !== null}
				receiptId={selectedReceiptId}
				onClose={handleCloseDetailModal}
			/>
		</div>
	);
};

export default ImportReceiptManage;
