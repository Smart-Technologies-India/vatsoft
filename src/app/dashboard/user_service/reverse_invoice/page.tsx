"use client";

import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import GetReverseInvoicePurchase, {
	ReverseInvoicePurchaseRow,
} from "@/action/stock/getreverseinvoicepurchase";
import ReversePurchaseAccept from "@/action/stock/reversepurchaseaccept";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { formateDate } from "@/utils/methods";
import { dvat04 } from "@prisma/client";
import { Button } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const ReverseInvoicePage = () => {
	const router = useRouter();

	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [userid, setUserid] = useState<number>(0);
	const [dvatData, setDvatData] = useState<dvat04>();
	const [rows, setRows] = useState<Array<ReverseInvoicePurchaseRow>>([]);
	const [reversingIds, setReversingIds] = useState<number[]>([]);

	const loadRows = async () => {
		const reversePurchaseResponse = await GetReverseInvoicePurchase();
		if (reversePurchaseResponse.status && reversePurchaseResponse.data) {
			setRows(reversePurchaseResponse.data);
			return;
		}

		setRows([]);
		if (reversePurchaseResponse.message) {
			toast.error(reversePurchaseResponse.message);
		}
	};

	const onReverse = async (row: ReverseInvoicePurchaseRow) => {
		if (reversingIds.includes(row.id)) return;

		setReversingIds((prev) => [...prev, row.id]);
		const response = await ReversePurchaseAccept({
			purchaseId: row.id,
			updatedById: userid,
		});

		if (response.status) {
			toast.success(response.message);
			await loadRows();
		} else {
			toast.error(response.message);
		}

		setReversingIds((prev) => prev.filter((id) => id !== row.id));
	};

	useEffect(() => {
		const init = async () => {
			setIsLoading(true);

			const authResponse = await getAuthenticatedUserId();
			if (!authResponse.status || !authResponse.data) {
				toast.error(authResponse.message);
				router.push("/");
				return;
			}
			setUserid(authResponse.data);

			const dvatResponse = await GetUserDvat04();
			if (dvatResponse.status && dvatResponse.data) {
				setDvatData(dvatResponse.data);
			}

			await loadRows();

			setIsLoading(false);
		};

		init();
	}, [router]);

	if (isLoading) {
		return (
			<div className="h-screen w-full grid place-items-center text-2xl text-gray-600 bg-gray-100">
				Loading...
			</div>
		);
	}

	return (
		<main className="p-3 bg-gray-50">
			<div className="max-w-7xl mx-auto">
				<div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm mb-3">
					<h1 className="text-lg font-medium text-gray-900">Reverse Invoice</h1>
					<p className="text-xs text-gray-600 mt-1">
						Showing accepted purchase entries not yet included in DVAT 30A.
					</p>
					<p className="text-xs text-gray-500 mt-1">
						Dealer: {dvatData?.tradename ?? dvatData?.name ?? "-"} | TIN: {dvatData?.tinNumber ?? "-"}
					</p>
				</div>

				<div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm mb-3">
					<p className="text-xs text-gray-600">Total Rows</p>
					<p className="text-lg font-medium text-gray-900">{rows.length}</p>
				</div>

				<div className="bg-white rounded shadow-sm border p-3">
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow className="bg-gray-50 border-b">
									<TableHead className="text-center p-2 text-xs">Sr. No.</TableHead>
									<TableHead className="text-center p-2 text-xs">Invoice No.</TableHead>
									<TableHead className="text-center p-2 text-xs">Invoice Date</TableHead>
									<TableHead className="text-center p-2 text-xs">Trade Name</TableHead>
									<TableHead className="text-center p-2 text-xs">TIN Number</TableHead>
									<TableHead className="text-center p-2 text-xs">Product</TableHead>
									<TableHead className="text-center p-2 text-xs">Quantity</TableHead>
									<TableHead className="text-center p-2 text-xs">Taxable Value</TableHead>
									<TableHead className="text-center p-2 text-xs">VAT Amount</TableHead>
									<TableHead className="text-center p-2 text-xs">Invoice Value</TableHead>
									<TableHead className="text-center p-2 text-xs">URN</TableHead>
									<TableHead className="text-center p-2 text-xs">Action</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{rows.length === 0 ? (
									<TableRow>
										<TableCell colSpan={12} className="text-center py-6 text-sm text-gray-500">
											No accepted purchase rows pending DVAT 30A.
										</TableCell>
									</TableRow>
								) : (
									rows.map((row, index) => {
										const invoiceValue =
											parseFloat(row.amount) + parseFloat(row.vatamount);

										return (
											<TableRow key={row.id} className="border-b hover:bg-gray-50">
												<TableCell className="text-center p-2 text-xs">{index + 1}</TableCell>
												<TableCell className="text-center p-2 text-xs">{row.invoice_number}</TableCell>
												<TableCell className="text-center p-2 text-xs">{formateDate(row.invoice_date)}</TableCell>
												<TableCell className="text-center p-2 text-xs">
													{row.seller_tin_number.name_of_dealer}
												</TableCell>
												<TableCell className="text-center p-2 text-xs">
													{row.seller_tin_number.tin_number}
												</TableCell>
												<TableCell className="text-center p-2 text-xs">
													{row.commodity_master.product_name}
												</TableCell>
												<TableCell className="text-center p-2 text-xs">{row.quantity}</TableCell>
												<TableCell className="text-center p-2 text-xs">{parseFloat(row.amount).toFixed(2)}</TableCell>
												<TableCell className="text-center p-2 text-xs">{parseFloat(row.vatamount).toFixed(2)}</TableCell>
												<TableCell className="text-center p-2 text-xs">{invoiceValue.toFixed(2)}</TableCell>
												<TableCell className="text-center p-2 text-xs">{row.urn_number || "-"}</TableCell>
												<TableCell className="text-center p-2 text-xs">
													<Button
														size="small"
														type="primary"
														danger
														loading={reversingIds.includes(row.id)}
														onClick={() => onReverse(row)}
													>
														Reverse
													</Button>
												</TableCell>
											</TableRow>
										);
									})
								)}
							</TableBody>
						</Table>
					</div>
				</div>
			</div>
		</main>
	);
};

export default ReverseInvoicePage;
