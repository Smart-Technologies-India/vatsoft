"use client";

import GetCurrentDvatCreditDebitNotes, {
  CurrentDvatCreditDebitNote,
} from "@/action/creditdebitnote/getcurrentdvatcreditdebitnotes";
import DeleteCreditDebitNote from "@/action/creditdebitnote/deletecreditdebitnote";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button, Spin, Modal, Tabs } from "antd";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import AddCreditDebitNote from "@/components/creditdebitnote/addcreditdebitnote";

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
    ACTIVE: { bg: "bg-green-100", text: "text-green-800" },
    INACTIVE: { bg: "bg-gray-100", text: "text-gray-800" },
  };
  return statusColorMap[status] || { bg: "bg-gray-100", text: "text-gray-800" };
};

const CreditDebitNotePage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState<CurrentDvatCreditDebitNote[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"credit" | "debit" | "goods-return">("credit");
  const [deleteModalState, setDeleteModalState] = useState<{
    open: boolean;
    noteId: number | null;
    isDeleting: boolean;
  }>({
    open: false,
    noteId: null,
    isDeleting: false,
  });

  const loadNotes = async () => {
    setIsLoading(true);
    try {
      const response = await GetCurrentDvatCreditDebitNotes();
      if (!response.status || !response.data) {
        setNotes([]);
        toast.info(response.message || "No credit/debit notes found.");
        return;
      }

      setNotes(response.data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModalState.noteId) return;

    const deleteNoteId = deleteModalState.noteId;

    setDeleteModalState((prev) => ({ ...prev, isDeleting: true }));

    try {
      const response = await DeleteCreditDebitNote({
        id: deleteNoteId,
      });

      if (response.status) {
        setDeleteModalState({
          open: false,
          noteId: null,
          isDeleting: false,
        });

        toast.success(response.message || "Credit/Debit note deleted successfully.");
        await loadNotes();
      } else {
        toast.error(response.message || "Failed to delete credit/debit note.");
        setDeleteModalState((prev) => ({ ...prev, isDeleting: false }));
      }
    } catch (error) {
      toast.error("An error occurred while deleting credit/debit note.");
      setDeleteModalState((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  const openDeleteModal = (noteId: number) => {
    setDeleteModalState({
      open: true,
      noteId,
      isDeleting: false,
    });
  };

  const closeDeleteModal = () => {
    setDeleteModalState({
      open: false,
      noteId: null,
      isDeleting: false,
    });
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const creditNotes = useMemo(() => {
    return notes.filter((note) => note.is_credit && !note.is_goods_returned);
  }, [notes]);

  const debitNotes = useMemo(() => {
    return notes.filter((note) => !note.is_credit && !note.is_goods_returned);
  }, [notes]);

  const goodsReturnNotes = useMemo(() => {
    return notes.filter((note) => note.is_goods_returned);
  }, [notes]);

  const totals = useMemo(() => {
    return notes.reduce(
      (acc, note) => {
        const taxable = Number.parseFloat(note.amount || "0");
        const vat = Number.parseFloat(note.vatamount || "0");
        acc.taxableValue += taxable;
        acc.vatAmount += vat;
        acc.invoiceValue += taxable + vat;
        return acc;
      },
      { taxableValue: 0, vatAmount: 0, invoiceValue: 0 },
    );
  }, [notes]);

  const openDrawer = (mode: "credit" | "debit" | "goods-return") => {
    setDrawerMode(mode);
    setIsDrawerOpen(true);
  };

  const renderTable = (tableNotes: CurrentDvatCreditDebitNote[]) => {
    if (isLoading) {
      return (
        <div className="bg-white rounded shadow-sm border p-8 flex justify-center">
          <Spin />
        </div>
      );
    }

    if (tableNotes.length === 0) {
      return (
        <div className="bg-white p-12 text-center">
          <p className="text-gray-500">
            No notes found for current DVAT.
          </p>
        </div>
      );
    }

    return (
      <div className="bg-white">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 border-b">
                <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                  Sr. No.
                </TableHead>
                <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                  Original Invoice No
                </TableHead>
                <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                  Invoice Date
                </TableHead>
                <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                  CDN Number
                </TableHead>
                <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                  CDN Date
                </TableHead>
                <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                  Product
                </TableHead>
                <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                  Quantity
                </TableHead>
                <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                  Tax %
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
                {/* <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                  Action
                </TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableNotes.map((note, index) => {
                return (
                  <TableRow key={note.id} className="border-b hover:bg-gray-50">
                    <TableCell className="text-center p-2 text-xs">
                      {index + 1}
                    </TableCell>
                    <TableCell className="text-center p-2 text-xs">
                      {note.invoice_number}
                    </TableCell>
                    <TableCell className="text-center p-2 text-xs">
                      {formatDate(note.invoice_date)}
                    </TableCell>
                    <TableCell className="text-center p-2 text-xs">
                      {note.creditnote_no}
                    </TableCell>
                    <TableCell className="text-center p-2 text-xs">
                      {formatDate(note.creditnote_date)}
                    </TableCell>
                    <TableCell className="text-center p-2 text-xs">
                      {note.commodity_master.product_name}
                    </TableCell>
                    <TableCell className="text-center p-2 text-xs">
                      {note.quantity}
                    </TableCell>
                    <TableCell className="text-center p-2 text-xs">
                      {note.tax_percent}%
                    </TableCell>
                    <TableCell className="text-center p-2 text-xs">
                      {formatCurrency(Number.parseFloat(note.vatamount || "0"))}
                    </TableCell>
                    <TableCell className="text-center p-2 text-xs">
                      {formatCurrency(Number.parseFloat(note.amount || "0"))}
                    </TableCell>
                    <TableCell className="text-center p-2 text-xs">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          getStatusColor(note.status).bg
                        } ${getStatusColor(note.status).text}`}
                      >
                        {note.status}
                      </span>
                    </TableCell>
                    {/* <TableCell className="text-center p-2 text-xs">
                      <div className="flex gap-1 justify-center">
                        <Button
                          size="small"
                          danger
                          onClick={() => openDeleteModal(note.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell> */}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  return (
    <main className="p-3 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-3">
        <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-lg font-medium text-gray-900">
              Credit/Debit Notes
            </h1>
            <div className="grow"></div>
            <div className="flex gap-2">
              <Button
                type="primary"
                onClick={() => openDrawer("credit")}
              >
                Add Credit Note
              </Button>
              <Button
                onClick={() => openDrawer("debit")}
              >
                Add Debit Note
              </Button>
              <Button
                onClick={() => openDrawer("goods-return")}
              >
                Goods Return
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Total Notes</p>
            <p className="text-lg font-medium text-gray-900">
              {notes.length}
            </p>
          </div>
          <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Total VAT Amount</p>
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

        <AddCreditDebitNote
          open={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onCreated={loadNotes}
          mode={drawerMode}
        />

        <div className="bg-white rounded shadow-sm border px-4">
          <Tabs
            items={[
              {
                key: "1",
                label: `Credit Notes (${creditNotes.length})`,
                children: renderTable(creditNotes),
              },
              {
                key: "2",
                label: `Debit Notes (${debitNotes.length})`,
                children: renderTable(debitNotes),
              },
              {
                key: "3",
                label: `Goods Return (${goodsReturnNotes.length})`,
                children: renderTable(goodsReturnNotes),
              },
            ]}
          />
        </div>

        <Modal
          title="Delete Credit/Debit Note"
          open={deleteModalState.open}
          onCancel={closeDeleteModal}
          okText="Delete"
          cancelText="Cancel"
          okButtonProps={{ danger: true, loading: deleteModalState.isDeleting }}
          onOk={handleDeleteConfirm}
        >
          <p>
            Are you sure you want to delete this credit/debit note? This action cannot be undone.
          </p>
        </Modal>
      </div>
    </main>
  );
};

export default CreditDebitNotePage;
