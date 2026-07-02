"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import GetUserRefinerySale from "@/action/refinery_sale/getuserrefinerysale";
import ChangeRefinerySales from "@/action/refinery_sale/changevatpaidrefinerysales";

import GetRefinerySwitchOptions, {
  CurrentRefineryProfile,
  RefinerySwitchOption,
} from "@/action/refinery/getrefineryswitchoptions";
import { toast } from "react-toastify";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Modal, Select } from "antd";
import { commodity_master, tin_number_master } from "@prisma/client";

type VatpaidRefineryInvoice = {
  invoice_number: string;
  invoice_date: Date;
  buyer: tin_number_master;
  items: Array<{
    id: number;
    commodity_master: commodity_master;
    quantity: number;
    amount_unit: string;
  }>;
};

type UserRefinerySaleRow = {
  id: number;
  invoice_number: string;
  invoice_date: Date;
  refinery_status: string;
  seller_tin_numberId: number;
  quantity: number;
  amount_unit: string;
  commodity_master: commodity_master;
  seller_tin_number: tin_number_master;
};

const RefineryDashboard = () => {
  "use no memo";

  const router = useRouter();
  const [invoices, setInvoices] = useState<VatpaidRefineryInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refineryOptions, setRefineryOptions] = useState<
    RefinerySwitchOption[]
  >([]);
  const [currentCompany, setCurrentCompany] = useState("");
  const [currentRefineryId, setCurrentRefineryId] = useState<number | null>(
    null,
  );
  const [currentRefinery, setCurrentRefinery] =
    useState<CurrentRefineryProfile | null>(null);
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<VatpaidRefineryInvoice | null>(
    null,
  );
  const [modalSelectedRefineryId, setModalSelectedRefineryId] = useState<
    number | null
  >(null);
  const [isApplyingSwitch, setIsApplyingSwitch] = useState(false);

  const mapSalesToInvoices = (rows: UserRefinerySaleRow[]) => {
    const vatpaidRows = rows.filter((row) => row.refinery_status === "VATPAID");
    const grouped = new Map<string, VatpaidRefineryInvoice>();

    for (const row of vatpaidRows) {
      const key = `${row.invoice_number}_${row.seller_tin_numberId}`;
      const existing = grouped.get(key);

      const item = {
        id: row.id,
        commodity_master: row.commodity_master,
        quantity: row.quantity,
        amount_unit: row.amount_unit,
      };

      if (!existing) {
        grouped.set(key, {
          invoice_number: row.invoice_number,
          invoice_date: row.invoice_date,
          buyer: row.seller_tin_number,
          items: [item],
        });
      } else {
        existing.items.push(item);
      }
    }

    return Array.from(grouped.values());
  };

  const columns: ColumnDef<VatpaidRefineryInvoice>[] = [
    {
      id: "invoice",
      header: "Invoice",
      cell: ({ row }) => (
        <div className="text-xs leading-5">
          <div className="font-medium text-gray-900">
            {row.original.invoice_number}
          </div>
          <div className="text-gray-500">
            {new Date(row.original.invoice_date).toLocaleDateString("en-GB")}
          </div>
        </div>
      ),
    },
    {
      id: "buyer",
      header: "Buyer",
      cell: ({ row }) => (
        <div className="text-xs leading-5 text-gray-700">
          <div className="font-medium">{row.original.buyer.tin_number}</div>
          <div>{row.original.buyer.name_of_dealer}</div>
          {row.original.buyer.state ? (
            <div className="text-gray-500">{row.original.buyer.state}</div>
          ) : null}
        </div>
      ),
    },
    {
      id: "items",
      header: "Items",
      cell: ({ row }) => (
        <div className="text-xs text-gray-700 leading-5">
          {row.original.items.map((item) => (
            <div key={item.id}>
              {item.commodity_master.product_name} -{" "}
              {item.quantity.toLocaleString("en-IN")} {item.amount_unit}
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "changeRefinery",
      header: "Change Refinery",
      cell: ({ row }) => {
        const invoice = row.original;

        return (
          <div className="min-w-55">
            <button
              type="button"
              onClick={() => openSwitchModal(invoice)}
              className="text-[11px] text-blue-700 border border-blue-200 hover:border-blue-400 rounded px-2 py-1"
            >
              Change Refinery
            </button>
          </div>
        );
      },
    },
    {
      id: "action",
      header: "Action",
      cell: ({ row }) => (
        <button
          onClick={() =>
            router.push(
              `/dashboard/refinery/sale/dispatch/${row.original.items[0].id}`,
            )
          }
          className="text-sm text-blue-600 border border-gray-200 hover:border-blue-400 rounded px-4 py-1"
        >
          View
        </button>
      ),
    },
  ];

  const table = useReactTable({
    data: invoices,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    const res = await GetUserRefinerySale();
    if (res.status && res.data) {
      setInvoices(mapSalesToInvoices(res.data as UserRefinerySaleRow[]));
    } else {
      setInvoices([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const loadInitial = async () => {
      const optionsRes = await GetRefinerySwitchOptions();

      if (!optionsRes.status || !optionsRes.data) {
        setLoading(false);
        return;
      }

      setRefineryOptions(optionsRes.data.options);
      setCurrentCompany(optionsRes.data.currentCompany);
      setCurrentRefineryId(optionsRes.data.currentRefineryId);
      setCurrentRefinery(optionsRes.data.currentRefinery);

      await loadInvoices();
    };

    loadInitial();
  }, [loadInvoices]);

  function openSwitchModal(invoice: VatpaidRefineryInvoice) {
    setActiveInvoice(invoice);
    setModalSelectedRefineryId(null);
    setIsSwitchModalOpen(true);
  }

  async function handleApplyRefineryForRecord() {
    if (!activeInvoice) return;
    const refineryId = modalSelectedRefineryId;

    if (!refineryId) return;

    if (currentRefineryId && refineryId === currentRefineryId) {
      toast.info("Selected refinery is already the current refinery.");
      return;
    }

    setIsApplyingSwitch(true);

    const results = await Promise.all(
      activeInvoice.items.map((item) =>
        ChangeRefinerySales({
          refineryId,
          refinerysaleId: item.id,
        }),
      ),
    );

    const failed = results.find((result) => !result.status);
    if (failed) {
      toast.error(failed.message || "Unable to switch refinery for record.");
      setIsApplyingSwitch(false);
      return;
    }

    await loadInvoices();

    toast.success("Refinery changed for this record.");
    setIsApplyingSwitch(false);
    setIsSwitchModalOpen(false);
    setModalSelectedRefineryId(null);
    setActiveInvoice(null);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <span className="text-sm text-gray-400">Loading...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mt-4 mx-4">
      <div className="mb-4 rounded-lg border border-sky-200 bg-sky-50 p-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-sky-800">
            Current Refinery
          </h3>
          {/* <span className="text-xs text-sky-700">
            Refinery ID: {currentRefinery?.id ?? "-"}
          </span> */}
        </div>

        <div className="grid grid-cols-1 gap-2 text-xs text-sky-900 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <span className="font-medium">TIN Number:</span>{" "}
            {currentRefinery?.tinNumber || "-"}
          </div>
          <div>
            <span className="font-medium">Trade Name:</span>{" "}
            {currentRefinery?.tradeName || "-"}
          </div>
          <div>
            <span className="font-medium">Legal Name:</span>{" "}
            {currentRefinery?.legalName || "-"}
          </div>
          <div>
            <span className="font-medium">Company:</span>{" "}
            {currentRefinery?.company || "-"}
          </div>
          <div>
            <span className="font-medium">Contact :</span>{" "}
            {currentRefinery?.contactOne || "-"}
          </div>
          {/* <div>
            <span className="font-medium">PAN:</span> {currentRefinery?.pan || "-"}
          </div>
          <div>
            <span className="font-medium">GST:</span> {currentRefinery?.gst || "-"}
          </div>
          <div>
            <span className="font-medium">Email:</span> {currentRefinery?.email || "-"}
          </div>
          <div>
            <span className="font-medium">Contact 2:</span>{" "}
            {currentRefinery?.contactTwo || "-"}
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <span className="font-medium">Address:</span>{" "}
            {currentRefinery
              ? `${currentRefinery.address || "-"}, ${currentRefinery.city || "-"}, ${currentRefinery.pincode || "-"}`
              : "-"}
          </div> */}
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-800 text-sm">Dispatch</h2>
        <span className="text-xs text-gray-400 border border-gray-200 rounded px-2 py-0.5">
          {invoices.length} {invoices.length === 1 ? "period" : "periods"}
        </span>
      </div>

      {invoices.length === 0 ? (
        <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-500 text-center">
          No dispatch records found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-gray-50">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="text-xs font-semibold text-gray-600"
                    >
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
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="align-top">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-xs">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Modal
        title="Change Refinery"
        open={isSwitchModalOpen}
        onCancel={() => {
          setIsSwitchModalOpen(false);
          setModalSelectedRefineryId(null);
          setActiveInvoice(null);
        }}
        onOk={handleApplyRefineryForRecord}
        okText={isApplyingSwitch ? "Applying..." : "Apply"}
        okButtonProps={{
          disabled:
            !modalSelectedRefineryId ||
            isApplyingSwitch ||
            (currentRefineryId !== null &&
              modalSelectedRefineryId === currentRefineryId),
        }}
        cancelButtonProps={{ disabled: isApplyingSwitch }}
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Showing same company refineries: <b>{currentCompany || "-"}</b>
          </p>

          {refineryOptions.length === 0 ? (
            <p className="text-sm text-gray-500">
              No other refinery available in the same company.
            </p>
          ) : (
            <Select
              className="w-full"
              placeholder="Select refinery"
              value={modalSelectedRefineryId ?? undefined}
              onChange={(value) => setModalSelectedRefineryId(Number(value))}
              options={refineryOptions.map((option) => ({
                value: option.id,
                label:
                  option.id === currentRefineryId
                    ? `${option.tinNumber} - ${option.name} (Current)`
                    : `${option.tinNumber} - ${option.name}`,
              }))}
            />
          )}
        </div>
      </Modal>
    </div>
  );
};

export default RefineryDashboard;
