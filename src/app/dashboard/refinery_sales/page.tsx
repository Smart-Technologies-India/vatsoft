"use client";

import GetCurrentDvatRefinerySale, {
	CurrentDvatRefinerySale,
} from "@/action/refinery_sale/getcurrentdvatrefinerysale";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button, Spin } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

const formatDate = (value: Date | string) => {
	return new Intl.DateTimeFormat("en-GB", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	}).format(new Date(value));
};

const formatCurrency = (value: number) => {
	return Number.isFinite(value) ? value.toFixed(2) : "0.00";
};

const getStatusColor = (status: string) => {
	const statusColorMap: Record<string, { bg: string; text: string }> = {
		PAID: { bg: "bg-green-100", text: "text-green-800" },
		VATPAID: { bg: "bg-blue-100", text: "text-blue-800" },
		DISPATCH: { bg: "bg-amber-100", text: "text-amber-800" },
	};
	return statusColorMap[status] || { bg: "bg-gray-100", text: "text-gray-800" };
};

const getStatusRowColor = (status: string) => {
	const statusRowColorMap: Record<string, string> = {
		SALE: "bg-red-50 hover:bg-red-100 border-red-200",
		PAID: "bg-green-50 hover:bg-green-100 border-green-200",
		VATPAID: "bg-blue-50 hover:bg-blue-100 border-blue-200",
		DISPATCH: "bg-amber-50 hover:bg-amber-100 border-amber-200",
	};

	return statusRowColorMap[status] || "hover:bg-gray-50";
};

const RefinerySalesPage = () => {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(true);
	const [sales, setSales] = useState<CurrentDvatRefinerySale[]>([]);

	const loadSales = async () => {
		setIsLoading(true);
		try {
			const response = await GetCurrentDvatRefinerySale();
			if (!response.status || !response.data) {
				setSales([]);
				toast.info(response.message || "No refinery sales found.");
				return;
			}

			setSales(response.data);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		loadSales();
	}, []);

	const totals = useMemo(() => {
		return sales.reduce(
			(acc, sale) => {
				const taxable = Number.parseFloat(sale.amount || "0");
				const vat = Number.parseFloat(sale.vatamount || "0");
				acc.taxableValue += taxable;
				acc.vatAmount += vat;
				acc.invoiceValue += taxable + vat;
				return acc;
			},
			{ taxableValue: 0, vatAmount: 0, invoiceValue: 0 },
		);
	}, [sales]);

	return (
		<main className="p-3 bg-gray-50">
			<div className="max-w-7xl mx-auto space-y-3">
				<div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm">
					<div className="flex items-center justify-between gap-3">
						<h1 className="text-lg font-medium text-gray-900">Refinery Sales</h1>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
					<div className="bg-white p-3 rounded shadow-sm border border-gray-200">
						<p className="text-xs text-gray-600 mb-1">Total Invoices</p>
						<p className="text-lg font-medium text-gray-900">{sales.length}</p>
					</div>
					<div className="bg-white p-3 rounded shadow-sm border border-gray-200">
						<p className="text-xs text-gray-600 mb-1">Total VAT</p>
						<p className="text-lg font-medium text-gray-900">
							{formatCurrency(totals.vatAmount)}
						</p>
					</div>
					<div className="bg-white p-3 rounded shadow-sm border border-gray-200">
						<p className="text-xs text-gray-600 mb-1">Total Invoice Value</p>
						<p className="text-lg font-medium text-gray-900">
							{formatCurrency(totals.invoiceValue)}
						</p>
					</div>
				</div>

				{isLoading ? (
					<div className="bg-white rounded shadow-sm border p-8 flex justify-center">
						<Spin />
					</div>
				) : sales.length > 0 ? (
					<div className="bg-white rounded shadow-sm border p-3">
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow className="bg-gray-50 border-b">
										<TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
											Sr. No.
										</TableHead>
										<TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
											Invoice Number
										</TableHead>
										<TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
											Invoice Date
										</TableHead>
										<TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
											Seller
										</TableHead>
										<TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
											Product
										</TableHead>
										<TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
											Litres
										</TableHead>
										<TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
											Tax Rate
										</TableHead>
										<TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
											VAT Amount
										</TableHead>
										<TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
											Taxable Value
										</TableHead>
										<TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
											Status
										</TableHead>
										<TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
											Action
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{sales.map((sale, index) => {
										const status = sale.refinery_status || "SALE";

										return (
										<TableRow
											key={sale.id}
											className={`border-b ${getStatusRowColor(status)}`}
										>
											<TableCell className="text-center p-2 text-xs">{index + 1}</TableCell>
											<TableCell className="text-center p-2 text-xs">
												{sale.invoice_number}
											</TableCell>
											<TableCell className="text-center p-2 text-xs">
												{formatDate(sale.invoice_date)}
											</TableCell>
											<TableCell className="text-center p-2 text-xs">
												{sale.refinery.tradename || sale.refinery.name || "Refinery"}
											</TableCell>
											<TableCell className="text-center p-2 text-xs">
												{sale.commodity_master.product_name}
											</TableCell>
											<TableCell className="text-center p-2 text-xs">{sale.quantity}</TableCell>
											<TableCell className="text-center p-2 text-xs">{sale.tax_percent}%</TableCell>
											<TableCell className="text-center p-2 text-xs">
												{formatCurrency(Number.parseFloat(sale.vatamount || "0"))}
											</TableCell>
											<TableCell className="text-center p-2 text-xs">
												{formatCurrency(Number.parseFloat(sale.amount || "0"))}
											</TableCell>
											<TableCell className="text-center p-2 text-xs">
												<span
													className={`px-2 py-1 rounded-full text-xs font-medium ${
														getStatusColor(status).bg
													} ${getStatusColor(status).text}`}
												>
													{status}
												</span>
											</TableCell>
											<TableCell className="text-center p-2 text-xs">
												<Button
													size="small"
													onClick={() =>
														router.push(`/dashboard/refinery_sales/view/${sale.id}`)
													}
												>
													View
												</Button>
											</TableCell>
										</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</div>
					</div>
				) : (
					<div className="bg-white rounded shadow-sm border p-12 text-center">
						<p className="text-gray-500">No refinery sales found for current DVAT.</p>
					</div>
				)}
			</div>
		</main>
	);
};

export default RefinerySalesPage;
