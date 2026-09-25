"use client";
import DeletePurchase from "@/action/stock/deletepurchase";
import GetUserDailyPurchase from "@/action/stock/getuserdailypurchase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formateDate } from "@/utils/methods";
import { Button, Modal } from "antd";
import { useMemo, useState } from "react";
import { toast } from "react-toastify";

interface BulkDeleteRow {
  id: number;
  invoice_number: string;
  invoice_date: Date;
  trade_name: string;
  tin_number: string;
  product_name: string;
  quantity: number;
  invoice_value: number;
}

interface PurchaseBulkDeleteProps {
  dvatid: number | undefined;
  pagination: {
    take: number;
    skip: number;
    total: number;
  };
  onDeleteComplete: () => void;
}

// Indian number formatting function (e.g., 344234 -> 3,44,234)
const formatIndianNumber = (num: number): string => {
  if (!Number.isFinite(num)) return "0";
  const numStr = Math.floor(num).toString();
  if (numStr.length <= 3) return numStr;

  const lastThree = numStr.slice(-3);
  const remaining = numStr.slice(0, -3);
  const withCommas = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${withCommas},${lastThree}`;
};

export function PurchaseBulkDelete({
  dvatid,
  pagination,
  onDeleteComplete,
}: PurchaseBulkDeleteProps) {
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] =
    useState<boolean>(false);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] =
    useState<boolean>(false);
  const [isBulkDeleteLoading, setIsBulkDeleteLoading] =
    useState<boolean>(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);
  const [bulkDeleteRows, setBulkDeleteRows] = useState<BulkDeleteRow[]>([]);
  const [selectedBulkDeleteIds, setSelectedBulkDeleteIds] = useState<number[]>(
    [],
  );

  // Grouped data for TanStack Table
  const groupedBulkDeleteRows = useMemo(() => {
    // Group by tin_number, invoice_date, invoice_number
    const groups: Record<
      string,
      { groupKey: string; groupLabel: string; rows: BulkDeleteRow[] }
    > = {};
    for (const row of bulkDeleteRows) {
      const groupKey = [
        row.tin_number,
        row.invoice_date.toString(),
        row.invoice_number,
      ].join("|");
      if (!groups[groupKey]) {
        groups[groupKey] = {
          groupKey,
          groupLabel: `TIN: ${row.tin_number} | Date: ${formateDate(row.invoice_date)} | Invoice: ${row.invoice_number}`,
          rows: [],
        };
      }
      groups[groupKey].rows.push(row);
    }
    return Object.values(groups);
  }, [bulkDeleteRows]);

  const delete_purchase_entries = async (ids: number[]) => {
    if (ids.length === 0) {
      toast.error("No purchase record selected to delete.");
      return;
    }

    let successCount = 0;
    let failedCount = 0;
    let error = "";

    for (const id of ids) {
      const response = await DeletePurchase({
        id,
      });

      if (response.data && response.status) {
        successCount += 1;
      } else {
        failedCount += 1;
        error = response.message || "Unknown error";
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} purchase record(s) deleted successfully.`);
    }
    if (failedCount > 0) {
      toast.error(
        `${failedCount} purchase record(s) could not be deleted. Error: ${error}`,
      );
    }
  };

  const openBulkDeleteModal = async () => {
    if (!dvatid) {
      toast.error("DVAT not found.");
      return;
    }

    setIsBulkDeleteLoading(true);
    setSelectedBulkDeleteIds([]);

    try {
      const purchaseResponse = await GetUserDailyPurchase({
        dvatid,
        skip: 0,
        take: Math.max(pagination.total, 10000),
      });

      if (!purchaseResponse.status || !purchaseResponse.data.result) {
        toast.error("Unable to load purchase entries for bulk delete.");
        return;
      }

      const rows = purchaseResponse.data.result.flatMap((group) =>
        group.records
          .filter((record) => !record.is_accept)
          .map((record) => ({
            id: record.id,
            invoice_number: group.invoice_number,
            invoice_date: group.invoice_date,
            trade_name: group.seller_tin_number.name_of_dealer,
            tin_number: group.seller_tin_number.tin_number,
            product_name: record.commodity_master.product_name,
            quantity: record.quantity,
            invoice_value:
              parseFloat(record.amount) + parseFloat(record.vatamount),
          })),
      );

      setBulkDeleteRows(rows);
      setIsBulkDeleteModalOpen(true);

      if (rows.length === 0) {
        toast.info("No non-accepted purchase items found.");
      }
    } catch {
      toast.error("Unable to load purchase entries for bulk delete.");
    } finally {
      setIsBulkDeleteLoading(false);
    }
  };

  const toggleBulkDeleteSelection = (id: number, checked: boolean) => {
    setSelectedBulkDeleteIds((prev) => {
      if (checked) {
        if (prev.includes(id)) return prev;
        return [...prev, id];
      }

      return prev.filter((val) => val !== id);
    });
  };

  const toggleBulkDeleteSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBulkDeleteIds(bulkDeleteRows.map((row) => row.id));
      return;
    }

    setSelectedBulkDeleteIds([]);
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedBulkDeleteIds.length === 0) {
      toast.error("Select at least one purchase item to delete.");
      return;
    }
    setIsBulkDeleting(true);
    await delete_purchase_entries(selectedBulkDeleteIds);
    setIsBulkDeleting(false);
    setIsBulkDeleteConfirmOpen(false);
    setIsBulkDeleteModalOpen(false);
    setSelectedBulkDeleteIds([]);
    setBulkDeleteRows([]);
    onDeleteComplete();
  };

  return (
    <>
      <Button
        size="small"
        block
        type="default"
        loading={isBulkDeleteLoading}
        onClick={() => {
          openBulkDeleteModal();
        }}
      >
        Bulk Delete
      </Button>

      <Modal
        title="Bulk Delete Purchase Items"
        open={isBulkDeleteModalOpen}
        width={1200}
        onCancel={() => {
          setIsBulkDeleteModalOpen(false);
          setSelectedBulkDeleteIds([]);
          setBulkDeleteRows([]);
        }}
        footer={null}
      >
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={
                bulkDeleteRows.length > 0 &&
                selectedBulkDeleteIds.length === bulkDeleteRows.length
              }
              onChange={(event) =>
                toggleBulkDeleteSelectAll(event.target.checked)
              }
              disabled={bulkDeleteRows.length === 0}
            />
            Select All
          </label>
          <span className="text-xs text-gray-600">
            Selected: {selectedBulkDeleteIds.length} / {bulkDeleteRows.length}
          </span>
        </div>

        <div className="max-h-[60vh] overflow-auto border rounded">
          {/* TanStack Table for grouped selection */}
          {groupedBulkDeleteRows.length === 0 ? (
            <div className="text-center text-sm py-4">
              No non-accepted purchase items available.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="border text-center text-xs">
                    Pick
                  </TableHead>
                  <TableHead className="border text-center text-xs">
                    Invoice No.
                  </TableHead>
                  <TableHead className="border text-center text-xs">
                    Invoice Date
                  </TableHead>
                  <TableHead className="border text-center text-xs">
                    Trade Name
                  </TableHead>
                  <TableHead className="border text-center text-xs">
                    TIN Number
                  </TableHead>
                  <TableHead className="border text-center text-xs">
                    Product
                  </TableHead>
                  <TableHead className="border text-center text-xs">
                    Quantity
                  </TableHead>
                  <TableHead className="border text-center text-xs">
                    Invoice Value
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedBulkDeleteRows.map((group) => {
                  const allSelected = group.rows.every((row) =>
                    selectedBulkDeleteIds.includes(row.id),
                  );
                  const someSelected = group.rows.some((row) =>
                    selectedBulkDeleteIds.includes(row.id),
                  );
                  return [
                    <TableRow
                      key={`group-${group.groupKey}`}
                      className="bg-blue-50"
                    >
                      <TableCell className="border text-center text-xs">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={(el) => {
                            if (el)
                              el.indeterminate = !allSelected && someSelected;
                          }}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            if (checked) {
                              // Add all group row ids
                              setSelectedBulkDeleteIds((prev) => [
                                ...prev,
                                ...group.rows
                                  .map((r) => r.id)
                                  .filter((id) => !prev.includes(id)),
                              ]);
                            } else {
                              // Remove all group row ids
                              setSelectedBulkDeleteIds((prev) =>
                                prev.filter(
                                  (id) => !group.rows.some((r) => r.id === id),
                                ),
                              );
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell
                        colSpan={7}
                        className="border text-xs font-semibold"
                      >
                        {group.groupLabel}
                      </TableCell>
                    </TableRow>,
                    ...group.rows.map((row) => (
                      <TableRow key={row.id} className="hover:bg-gray-50">
                        <TableCell className="border text-center text-xs text-gray-400">
                          —
                        </TableCell>
                        <TableCell className="border text-center text-xs">
                          {row.invoice_number}
                        </TableCell>
                        <TableCell className="border text-center text-xs">
                          {formateDate(row.invoice_date)}
                        </TableCell>
                        <TableCell className="border text-center text-xs">
                          {row.trade_name}
                        </TableCell>
                        <TableCell className="border text-center text-xs">
                          {row.tin_number}
                        </TableCell>
                        <TableCell className="border text-center text-xs">
                          {row.product_name}
                        </TableCell>
                        <TableCell className="border text-center text-xs">
                          {row.quantity}
                        </TableCell>
                        <TableCell className="border text-center text-xs">
                          {formatIndianNumber(row.invoice_value)}
                        </TableCell>
                      </TableRow>
                    )),
                  ];
                })}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="mt-3 flex gap-2">
          <div className="grow"></div>
          <Button
            onClick={() => {
              setIsBulkDeleteModalOpen(false);
              setSelectedBulkDeleteIds([]);
              setBulkDeleteRows([]);
            }}
          >
            Close
          </Button>
          <Button
            danger
            type="primary"
            disabled={selectedBulkDeleteIds.length === 0}
            onClick={() => setIsBulkDeleteConfirmOpen(true)}
          >
            Delete Selected
          </Button>
        </div>
      </Modal>

      <Modal
        title="Confirm Bulk Delete"
        open={isBulkDeleteConfirmOpen}
        onCancel={() => setIsBulkDeleteConfirmOpen(false)}
        onOk={handleConfirmBulkDelete}
        okText="Delete Permanently"
        okButtonProps={{ danger: true, loading: isBulkDeleting }}
      >
        <p className="text-sm text-gray-700">
          You are about to delete {selectedBulkDeleteIds.length} purchase
          item(s).
        </p>
      </Modal>
    </>
  );
}
