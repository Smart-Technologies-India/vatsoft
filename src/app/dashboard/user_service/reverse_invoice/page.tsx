"use client";

import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import GetReverseInvoicePurchase, {
	ReverseInvoicePurchaseRow,
} from "@/action/stock/getreverseinvoicepurchase";
import ReversePurchaseAccept from "@/action/stock/reversepurchaseaccept";
import {
	ColumnDef,
	ColumnFiltersState,
	PaginationState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	useReactTable,
	FilterFn,
} from "@tanstack/react-table";
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
import { Button, Input, Select } from "antd";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

const ReverseInvoicePage = () => {
	"use no memo";

	const router = useRouter();

	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [userid, setUserid] = useState<number>(0);
	const [dvatData, setDvatData] = useState<dvat04>();
	const [rows, setRows] = useState<Array<ReverseInvoicePurchaseRow>>([]);
	const [reversingIds, setReversingIds] = useState<number[]>([]);
	const [globalFilter, setGlobalFilter] = useState<string>("");
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 10,
	});

	const loadRows = useCallback(async () => {
		const reversePurchaseResponse = await GetReverseInvoicePurchase();
		if (reversePurchaseResponse.status && reversePurchaseResponse.data) {
			setRows(reversePurchaseResponse.data);
			setPagination((prev) => ({ ...prev, pageIndex: 0 }));
			return;
		}

		setRows([]);
		setPagination((prev) => ({ ...prev, pageIndex: 0 }));
		if (reversePurchaseResponse.message) {
			toast.error(reversePurchaseResponse.message);
		}
	}, []);

	const onReverse = useCallback(async (row: ReverseInvoicePurchaseRow) => {
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
	}, [loadRows, reversingIds, userid]);

	const tradeNameOptions = useMemo(() => {
		const names = Array.from(
			new Set(rows.map((row) => row.seller_tin_number.name_of_dealer).filter(Boolean)),
		).sort((a, b) => a.localeCompare(b));

		return names.map((name) => ({ label: name, value: name }));
	}, [rows]);

	const productOptions = useMemo(() => {
		const names = Array.from(
			new Set(rows.map((row) => row.commodity_master.product_name).filter(Boolean)),
		).sort((a, b) => a.localeCompare(b));

		return names.map((name) => ({ label: name, value: name }));
	}, [rows]);

	const urnFilterFn: FilterFn<ReverseInvoicePurchaseRow> = (row, _, filterValue) => {
		if (!filterValue || filterValue === "all") return true;
		if (filterValue === "with_urn") return Boolean(row.original.urn_number);
		if (filterValue === "without_urn") return !row.original.urn_number;
		return true;
	};

	const columns = useMemo<ColumnDef<ReverseInvoicePurchaseRow>[]>(
		() => [
			{
				id: "sr_no",
				header: "Sr. No.",
				cell: ({ row, table }) =>
					table.getState().pagination.pageIndex *
						table.getState().pagination.pageSize +
					row.index +
					1,
			},
			{
				accessorKey: "invoice_number",
				header: "Invoice No.",
			},
			{
				id: "invoice_date",
				header: "Invoice Date",
				cell: ({ row }) => formateDate(row.original.invoice_date),
			},
			{
				id: "trade_name",
				accessorFn: (row) => row.seller_tin_number.name_of_dealer,
				header: "Trade Name",
			},
			{
				id: "tin_number",
				accessorFn: (row) => row.seller_tin_number.tin_number,
				header: "TIN Number",
			},
			{
				id: "product",
				accessorFn: (row) => row.commodity_master.product_name,
				header: "Product",
			},
			{
				accessorKey: "quantity",
				header: "Quantity",
			},
			{
				id: "taxable_value",
				header: "Taxable Value",
				cell: ({ row }) => parseFloat(row.original.amount).toFixed(2),
			},
			{
				id: "vat_amount",
				header: "VAT Amount",
				cell: ({ row }) => parseFloat(row.original.vatamount).toFixed(2),
			},
			{
				id: "invoice_value",
				header: "Invoice Value",
				cell: ({ row }) =>
					(
						parseFloat(row.original.amount) + parseFloat(row.original.vatamount)
					).toFixed(2),
			},
			{
				id: "urn_number",
				accessorFn: (row) => row.urn_number || "-",
				header: "URN",
				filterFn: urnFilterFn,
			},
			{
				id: "action",
				header: "Action",
				cell: ({ row }) => (
					<Button
						size="small"
						type="primary"
						danger
						loading={reversingIds.includes(row.original.id)}
						onClick={() => onReverse(row.original)}
					>
						Reverse
					</Button>
				),
			},
		],
		[onReverse, reversingIds],
	);

	const table = useReactTable({
		data: rows,
		columns,
		state: {
			globalFilter,
			columnFilters,
			pagination,
		},
		onGlobalFilterChange: setGlobalFilter,
		onColumnFiltersChange: setColumnFilters,
		onPaginationChange: setPagination,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		globalFilterFn: "includesString",
	});

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
	}, [loadRows, router]);

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
					<p className="text-lg font-medium text-gray-900">
						{table.getFilteredRowModel().rows.length}
					</p>
					<p className="text-xs text-gray-500 mt-1">Filtered from {rows.length} total rows</p>
				</div>

				<div className="bg-white rounded shadow-sm border p-3">
					<div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-4">
						<Input
							value={globalFilter}
							onChange={(event) => {
								setGlobalFilter(event.target.value);
								setPagination((prev) => ({ ...prev, pageIndex: 0 }));
							}}
							placeholder="Search invoice, TIN, trade name, product, URN"
						/>
						<Select
							allowClear
							placeholder="Filter Trade Name"
							options={tradeNameOptions}
							onChange={(value) => {
								table.getColumn("trade_name")?.setFilterValue(value || undefined);
								setPagination((prev) => ({ ...prev, pageIndex: 0 }));
							}}
						/>
						<Select
							allowClear
							placeholder="Filter Product"
							options={productOptions}
							onChange={(value) => {
								table.getColumn("product")?.setFilterValue(value || undefined);
								setPagination((prev) => ({ ...prev, pageIndex: 0 }));
							}}
						/>
						<Select
							defaultValue="all"
							options={[
								{ label: "All URN", value: "all" },
								{ label: "With URN", value: "with_urn" },
								{ label: "Without URN", value: "without_urn" },
							]}
							onChange={(value) => {
								table.getColumn("urn_number")?.setFilterValue(value);
								setPagination((prev) => ({ ...prev, pageIndex: 0 }));
							}}
						/>
					</div>

					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								{table.getHeaderGroups().map((headerGroup) => (
									<TableRow key={headerGroup.id} className="bg-gray-50 border-b">
										{headerGroup.headers.map((header) => (
											<TableHead key={header.id} className="text-center p-2 text-xs">
												{header.isPlaceholder
													? null
													: flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
											</TableHead>
										))}
									</TableRow>
								))}
							</TableHeader>
							<TableBody>
								{table.getRowModel().rows.length === 0 ? (
									<TableRow>
										<TableCell colSpan={12} className="text-center py-6 text-sm text-gray-500">
											No accepted purchase rows pending DVAT 30A.
										</TableCell>
									</TableRow>
								) : (
									table.getRowModel().rows.map((row) => (
										<TableRow key={row.id} className="border-b hover:bg-gray-50">
											{row.getVisibleCells().map((cell) => (
												<TableCell key={cell.id} className="text-center p-2 text-xs">
													{flexRender(cell.column.columnDef.cell, cell.getContext())}
												</TableCell>
											))}
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>

					<div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
						<p className="text-xs text-gray-600">
							Showing {table.getRowModel().rows.length} of {table.getFilteredRowModel().rows.length} filtered rows
						</p>
						<div className="flex items-center gap-2">
							<Select
								value={table.getState().pagination.pageSize}
								options={[
									{ label: "10 / page", value: 10 },
									{ label: "20 / page", value: 20 },
									{ label: "50 / page", value: 50 },
									{ label: "100 / page", value: 100 },
								]}
								onChange={(value) => table.setPageSize(Number(value))}
								style={{ width: 120 }}
							/>
							<Button
								onClick={() => table.previousPage()}
								disabled={!table.getCanPreviousPage()}
							>
								Previous
							</Button>
							<span className="text-xs text-gray-700 px-1">
								Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
							</span>
							<Button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
								Next
							</Button>
						</div>
					</div>
				</div>
			</div>
		</main>
	);
};

export default ReverseInvoicePage;
