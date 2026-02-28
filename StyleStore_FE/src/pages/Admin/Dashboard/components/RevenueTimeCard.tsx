import { useEffect, useState } from 'react';
import { Button, Card, DatePicker, Radio, message } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import type { Workbook, Cell } from 'exceljs';
import { getAuthToken } from '../../../../services/auth';

interface StatsResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

interface ProductSalesItem {
    productId: number;
    productName: string;
    quantitySold: number;
}

interface RevenueWithProductsData {
    revenue: number;
    soldProducts: ProductSalesItem[];
}

interface RevenueGroup {
    period: string | number;
    revenue: number;
    products: ProductSalesItem[];
}

const REVENUE_FORMATTER = new Intl.NumberFormat('vi-VN');
const REPORT_START_YEAR = 2024;

const RevenueTimeCard = () => {
    const [revenueMode, setRevenueMode] = useState<'day' | 'month' | 'year'>('day');
    const [revenueDate, setRevenueDate] = useState<Dayjs | null>(dayjs());
    const [revenueMonth, setRevenueMonth] = useState<Dayjs | null>(dayjs());
    const [revenueYear, setRevenueYear] = useState<Dayjs | null>(dayjs());
    const [revenueValue, setRevenueValue] = useState<number | null>(null);
    const [soldProducts, setSoldProducts] = useState<ProductSalesItem[]>([]);
    const [revenueLoading, setRevenueLoading] = useState(false);
    const [revenueError, setRevenueError] = useState<string | null>(null);
    const [exportLoading, setExportLoading] = useState(false);

    const fetchRevenueData = async (url: string, headers: Record<string, string>) => {
        const response = await fetch(url, { headers });
        if (!response.ok) {
            throw new Error(`Failed to fetch revenue: ${response.status}`);
        }

        const payload = (await response.json()) as StatsResponse<RevenueWithProductsData>;
        return payload.data ?? { revenue: 0, soldProducts: [] };
    };

    const appendWorksheetFromGroups = (
        workbook: Workbook,
        sheetName: string,
        periodLabel: string,
        groups: RevenueGroup[],
    ) => {
        const worksheet = workbook.addWorksheet(sheetName);

        worksheet.columns = [
            { header: periodLabel, key: 'period', width: 14 },
            { header: 'Doanh thu', key: 'revenue', width: 16 },
            { header: 'Sản phẩm', key: 'product', width: 58 },
            { header: 'Số lượng', key: 'quantity', width: 10 },
        ];

        const thinBorder = {
            top: { style: 'thin' as const },
            left: { style: 'thin' as const },
            bottom: { style: 'thin' as const },
            right: { style: 'thin' as const },
        };

        const headerRow = worksheet.getRow(1);
        headerRow.height = 24;
        headerRow.eachCell((cell: Cell) => {
            cell.font = { bold: true, size: 12 };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.border = thinBorder;
        });

        let rowIndex = 2;
        for (const group of groups) {
            const validProducts = group.products.filter((item) => (item.quantitySold ?? 0) > 0);
            const products = validProducts.length > 0 ? validProducts : [{ productId: 0, productName: '', quantitySold: 0 }];

            const startRow = rowIndex;
            for (let index = 0; index < products.length; index += 1) {
                const product = products[index];

                const periodCell = worksheet.getCell(rowIndex, 1);
                periodCell.value = index === 0 ? group.period : '';
                periodCell.alignment = { horizontal: 'center', vertical: 'middle' };
                periodCell.border = thinBorder;

                const revenueCell = worksheet.getCell(rowIndex, 2);
                revenueCell.value = index === 0 ? group.revenue : '';
                if (index === 0) {
                    revenueCell.numFmt = '#,##0';
                }
                revenueCell.alignment = { horizontal: 'center', vertical: 'middle' };
                revenueCell.border = thinBorder;

                const productCell = worksheet.getCell(rowIndex, 3);
                productCell.value = product.productName;
                productCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
                productCell.border = thinBorder;

                const quantityCell = worksheet.getCell(rowIndex, 4);
                quantityCell.value = product.quantitySold ?? 0;
                quantityCell.numFmt = '#,##0';
                quantityCell.alignment = { horizontal: 'center', vertical: 'middle' };
                quantityCell.border = thinBorder;

                rowIndex += 1;
            }

            const endRow = rowIndex - 1;
            if (endRow > startRow) {
                worksheet.mergeCells(startRow, 1, endRow, 1);
                worksheet.mergeCells(startRow, 2, endRow, 2);
            }

            worksheet.getCell(startRow, 1).alignment = { horizontal: 'center', vertical: 'middle' };
            worksheet.getCell(startRow, 2).alignment = { horizontal: 'center', vertical: 'middle' };
        }
    };

    const handleExportReport = async () => {
        try {
            setExportLoading(true);

            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found. Please log in again.');
            }

            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            };

            const targetYear = revenueYear?.year() ?? dayjs().year();
            const currentYear = dayjs().year();
            const yearStart = Math.min(REPORT_START_YEAR, currentYear);

            const dayGroups: RevenueGroup[] = [];
            const startOfYear = dayjs(`${targetYear}-01-01`);
            const endOfYear = dayjs(`${targetYear}-12-31`);

            for (let cursor = startOfYear; cursor.isBefore(endOfYear) || cursor.isSame(endOfYear, 'day'); cursor = cursor.add(1, 'day')) {
                const data = await fetchRevenueData(
                    `http://localhost:8080/api/admin/stats/revenue/by-date?date=${cursor.format('YYYY-MM-DD')}`,
                    headers,
                );

                if ((data.revenue ?? 0) <= 0) {
                    continue;
                }

                dayGroups.push({
                    period: cursor.format('DD/MM/YYYY'),
                    revenue: data.revenue ?? 0,
                    products: data.soldProducts ?? [],
                });
            }

            const monthGroups: RevenueGroup[] = [];
            for (let month = 1; month <= 12; month += 1) {
                const data = await fetchRevenueData(
                    `http://localhost:8080/api/admin/stats/revenue/by-month?year=${targetYear}&month=${month}`,
                    headers,
                );

                if ((data.revenue ?? 0) <= 0) {
                    continue;
                }

                monthGroups.push({
                    period: `${String(month).padStart(2, '0')}/${targetYear}`,
                    revenue: data.revenue ?? 0,
                    products: data.soldProducts ?? [],
                });
            }

            const yearGroups: RevenueGroup[] = [];
            for (let year = yearStart; year <= currentYear; year += 1) {
                const data = await fetchRevenueData(
                    `http://localhost:8080/api/admin/stats/revenue/by-year?year=${year}`,
                    headers,
                );

                if ((data.revenue ?? 0) <= 0) {
                    continue;
                }

                yearGroups.push({
                    period: year,
                    revenue: data.revenue ?? 0,
                    products: data.soldProducts ?? [],
                });
            }

            const ExcelJS = await import('exceljs');
            const workbook = new ExcelJS.Workbook();

            appendWorksheetFromGroups(workbook, 'Theo Ngày', 'Ngày', dayGroups);
            appendWorksheetFromGroups(workbook, 'Theo Tháng', 'Tháng', monthGroups);
            appendWorksheetFromGroups(workbook, 'Theo Năm', 'Năm', yearGroups);

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob(
                [buffer],
                { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
            );

            const fileUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = fileUrl;
            link.download = `bao-cao-doanh-thu-${targetYear}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(fileUrl);
            message.success('Xuất báo cáo thành công');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Xuất báo cáo thất bại';
            message.error(errorMessage);
        } finally {
            setExportLoading(false);
        }
    };

    useEffect(() => {
        const fetchRevenue = async () => {
            try {
                setRevenueLoading(true);
                setRevenueError(null);

                const token = getAuthToken();
                if (!token) {
                    throw new Error('No authentication token found. Please log in again.');
                }

                const headers = {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                };

                let url = '';
                if (revenueMode === 'day') {
                    if (!revenueDate) return;
                    url = `http://localhost:8080/api/admin/stats/revenue/by-date?date=${revenueDate.format('YYYY-MM-DD')}`;
                }

                if (revenueMode === 'month') {
                    if (!revenueMonth) return;
                    url = `http://localhost:8080/api/admin/stats/revenue/by-month?year=${revenueMonth.year()}&month=${revenueMonth.month() + 1}`;
                }

                if (revenueMode === 'year') {
                    if (!revenueYear) return;
                    url = `http://localhost:8080/api/admin/stats/revenue/by-year?year=${revenueYear.year()}`;
                }

                const revenueData = await fetchRevenueData(url, headers);
                setRevenueValue(revenueData.revenue ?? 0);
                setSoldProducts(revenueData.soldProducts ?? []);
            } catch (err) {
                setRevenueError(err instanceof Error ? err.message : 'An error occurred');
                setRevenueValue(null);
                setSoldProducts([]);
            } finally {
                setRevenueLoading(false);
            }
        };

        fetchRevenue();
    }, [revenueMode, revenueDate, revenueMonth, revenueYear]);

    return (
        <Card title="Doanh Thu Theo Thời Gian" className="shadow-lg">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <Radio.Group
                    value={revenueMode}
                    onChange={(event) => setRevenueMode(event.target.value)}
                >
                    <Radio.Button value="day">Ngày</Radio.Button>
                    <Radio.Button value="month">Tháng</Radio.Button>
                    <Radio.Button value="year">Năm</Radio.Button>
                </Radio.Group>

                <div className="flex flex-wrap items-center gap-3">
                    {revenueMode === 'day' && (
                        <DatePicker
                            value={revenueDate}
                            onChange={setRevenueDate}
                            format="DD/MM/YYYY"
                        />
                    )}

                    {revenueMode === 'month' && (
                        <DatePicker
                            picker="month"
                            value={revenueMonth}
                            onChange={setRevenueMonth}
                            format="MM/YYYY"
                        />
                    )}

                    {revenueMode === 'year' && (
                        <DatePicker
                            picker="year"
                            value={revenueYear}
                            onChange={setRevenueYear}
                            format="YYYY"
                        />
                    )}

                    <Button
                        type="primary"
                        onClick={handleExportReport}
                        loading={exportLoading}
                    >
                        In báo cáo
                    </Button>
                </div>
            </div>

            <div className="mt-6 flex flex-col gap-2">
                <div className="text-sm text-gray-500">Doanh thu</div>
                <div className="text-3xl font-semibold text-emerald-600">
                    {revenueLoading && <span>Đang tải...</span>}
                    {!revenueLoading && revenueError && <span className="text-red-600">{revenueError}</span>}
                    {!revenueLoading && !revenueError && (
                        <span>{REVENUE_FORMATTER.format(revenueValue ?? 0)} VND</span>
                    )}
                </div>
            </div>

            {!revenueLoading && !revenueError && (
                <div className="mt-6">
                    <div className="mb-2 text-sm text-gray-500">Sản phẩm đã bán</div>

                    {soldProducts.length === 0 ? (
                        <div className="text-sm text-gray-500">Không có sản phẩm bán ra trong khoảng thời gian này.</div>
                    ) : (
                        <div className="max-h-64 overflow-auto rounded-md border border-gray-100">
                            {soldProducts.map((item) => (
                                <div
                                    key={item.productId}
                                    className="flex items-center justify-between border-b border-gray-100 px-3 py-2 text-sm last:border-b-0"
                                >
                                    <span className="pr-3 text-gray-700">{item.productName}</span>
                                    <span className="font-medium text-gray-900">
                                        {REVENUE_FORMATTER.format(item.quantitySold)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
};

export default RevenueTimeCard;
