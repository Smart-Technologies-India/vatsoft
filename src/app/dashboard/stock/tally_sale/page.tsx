"use client";

import GetUserTallySale, {
  GroupedTallySale,
} from "@/action/stock/getusertallysale";
import AcceptTallySale from "@/action/stock/accepttallysale";
import GetUserDvat04Anx from "@/action/dvat/getuserdvatanx";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
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
import { Button, Modal, Pagination, Radio, RadioChangeEvent } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";

const TallySalePage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [pagination, setPagination] = useState<{
    take: number;
    skip: number;
    total: number;
  }>({ take: 10, skip: 0, total: 0 });
  const [currentPage, setCurrentPage] = useState(1);

  const [dvatdata, setDvatData] = useState<dvat04>();
  const [allTallySale, setAllTallySale] = useState<Array<GroupedTallySale>>([]);
  const [searchText, setSearchText] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<GroupedTallySale | null>(
    null,
  );
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [quantityCount, setQuantityCount] = useState("pcs");
  const [userid, setUserid] = useState<number>(0);
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  const onChange = ({ target: { value } }: RadioChangeEvent) => {
    setQuantityCount(value);
  };

  const formatIndianCurrency = (value: number | string): string => {
    const numericValue = typeof value === "number" ? value : parseFloat(value);
    const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
    return safeValue.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const showCrates = (quantity: number, crate_size: number): string => {
    const crates = Math.floor(quantity / crate_size);
    const pcs = quantity % crate_size;
    if (crates === 0) return `${pcs} Pcs`;
    if (pcs === 0) return `${crates} Crate`;
    return `${crates} Crate ${pcs} Pcs`;
  };

  const init = async (dvatId?: number, skip = 0, take = 10) => {
    const id = dvatId ?? dvatdata?.id;
    if (!id) return;

    const response = await GetUserTallySale({ skip, take });
    if (response.status && response.data?.result) {
      setAllTallySale(response.data.allData ?? response.data.result);
      setPagination({
        skip: response.data.skip ?? 0,
        take: response.data.take ?? 10,
        total: response.data.total ?? 0,
      });
      setCurrentPage(1);
    }
  };

  const filteredTallySale = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return allTallySale;

    return allTallySale.filter((group) => {
      const invoiceNo = group.invoice_number.toLowerCase();
      const dealer = (
        group.seller_tin_number.name_of_dealer ?? ""
      ).toLowerCase();
      const tin = (group.seller_tin_number.tin_number ?? "").toLowerCase();
      const invoiceDate = formateDate(group.invoice_date).toLowerCase();
      return (
        invoiceNo.includes(query) ||
        dealer.includes(query) ||
        tin.includes(query) ||
        invoiceDate.includes(query)
      );
    });
  }, [allTallySale, searchText]);

  const paginatedTallySale = useMemo(() => {
    const start = (currentPage - 1) * pagination.take;
    return filteredTallySale.slice(start, start + pagination.take);
  }, [filteredTallySale, currentPage, pagination.take]);

  const summary = useMemo(() => {
    const totals = filteredTallySale.reduce(
      (acc, val) => {
        acc.invoiceValue += val.totalInvoiceValue;
        acc.totalTax += val.totalVatAmount;
        acc.taxableValue += val.totalTaxableValue;
        return acc;
      },
      { invoiceValue: 0, totalTax: 0, taxableValue: 0 },
    );

    return {
      totalInvoices: filteredTallySale.length,
      invoiceValue: totals.invoiceValue,
      totalTax: totals.totalTax,
      taxableValue: totals.taxableValue,
    };
  }, [filteredTallySale]);

  const pendingRecords = useMemo(
    () =>
      filteredTallySale.flatMap((group) =>
        group.records.filter((record) => !record.is_converted),
      ),
    [filteredTallySale],
  );

  const pendingRecordCount = pendingRecords.length;

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
      setUserid(authResponse.data);

      const dvat_response = await GetUserDvat04Anx({
        userid: authResponse.data,
      });
      if (dvat_response.status && dvat_response.data) {
        setDvatData(dvat_response.data);
        await init(dvat_response.data.id, 0, 10);
      }

      setIsLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAccept = async () => {
    if (!dvatdata) return;
    if (pendingRecordCount === 0) {
      setIsAcceptModalOpen(false);
      return toast.info("No pending records to accept.");
    }

    setIsAccepting(true);
    const ids = pendingRecords.map((record) => record.id);
    const response = await AcceptTallySale({
      tallyIds: ids,
      dvatid: dvatdata.id,
      createdById: userid,
    });
    setIsAccepting(false);
    setIsAcceptModalOpen(false);

    if (response.status) {
      toast.success(response.message);
      await init(dvatdata.id, 0, pagination.take);
    } else {
      toast.error(response.message);
    }
  };

  const onChangePageCount = (page: number, pagesize: number) => {
    setCurrentPage(page);
    setPagination((prev) => ({
      ...prev,
      take: pagesize,
      skip: pagesize * (page - 1),
    }));
  };

  const downloadReport = () => {
    if (filteredTallySale.length === 0) {
      toast.info("No tally sale records found to export.");
      return;
    }

    const rows = filteredTallySale.map((group, index) => ({
      "S. No.": index + 1,
      Count: group.count,
      "Invoice No.": group.invoice_number,
      "Invoice Date": formateDate(group.invoice_date),
      "Trade Name": group.seller_tin_number.name_of_dealer,
      "TIN Number": group.seller_tin_number.tin_number,
      "Invoice Value": Number(group.totalInvoiceValue.toFixed(2)),
      "VAT Amount": Number(group.totalVatAmount.toFixed(2)),
      "Taxable Value": Number(group.totalTaxableValue.toFixed(2)),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tally Sale");
    const fileDate = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `tallySale_report_${fileDate}.xlsx`);
  };

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );

  return (
    <>
      {/* Accept confirmation modal */}
      <Modal
        title="Accept Tally Sale"
        open={isAcceptModalOpen}
        onOk={handleAccept}
        onCancel={() => {
          setIsAcceptModalOpen(false);
        }}
        confirmLoading={isAccepting}
        okText="Yes, Accept All"
        cancelText="Cancel"
      >
        <p className="text-sm text-slate-600 py-2">
          This will convert <strong>{pendingRecordCount} record(s)</strong> from
          tally sale to daily sale. Stock will be checked and deducted. This
          action cannot be undone.
        </p>
      </Modal>

      {/* Invoice detail modal */}
      <Modal
        title="Invoice Details"
        open={isGroupModalOpen}
        onCancel={() => {
          setIsGroupModalOpen(false);
          setSelectedGroup(null);
        }}
        footer={null}
        width={1200}
      >
        {selectedGroup && (
          <div>
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-xs text-gray-600">Invoice Number</p>
                  <p className="font-semibold">
                    {selectedGroup.invoice_number}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Invoice Date</p>
                  <p className="font-semibold">
                    {formateDate(selectedGroup.invoice_date)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Buyer</p>
                  <p className="font-semibold">
                    {selectedGroup.seller_tin_number.name_of_dealer}
                  </p>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table className="border">
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead className="border text-center text-xs">
                      Sr. No.
                    </TableHead>
                    <TableHead className="border text-center text-xs">
                      Product Name
                    </TableHead>
                    <TableHead className="border text-center text-xs">
                      {/* {quantityCount === "pcs"
                        ? dvatdata?.commodity === "FUEL"
                          ? "Unit"
                          : "Unit"
                        : "Unit"} */}
                      Unit
                    </TableHead>
                    <TableHead className="border text-center text-xs">
                      Invoice Value
                    </TableHead>
                    <TableHead className="border text-center text-xs">
                      Tax Rate
                    </TableHead>
                    <TableHead className="border text-center text-xs">
                      VAT Amount
                    </TableHead>
                    <TableHead className="border text-center text-xs">
                      Taxable Value
                    </TableHead>
                    <TableHead className="border text-center text-xs">
                      URN
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedGroup.records.map((record, idx) => (
                    <TableRow key={idx} className="hover:bg-gray-50">
                      <TableCell className="p-2 border text-center text-xs">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="p-2 border text-left text-xs">
                        {record.commodity_master.product_name}
                      </TableCell>
                      <TableCell className="p-2 border text-center text-xs">
                        {quantityCount === "pcs"
                          ? record.quantity
                          : showCrates(
                              record.quantity,
                              record.commodity_master.crate_size,
                            )}
                      </TableCell>
                      <TableCell className="p-2 border text-center text-xs">
                        ₹
                        {formatIndianCurrency(
                          parseFloat(record.amount) +
                            parseFloat(record.vatamount),
                        )}
                      </TableCell>
                      <TableCell className="p-2 border text-center text-xs">
                        {record.tax_percent}%
                      </TableCell>
                      <TableCell className="p-2 border text-center text-xs">
                        ₹{formatIndianCurrency(record.vatamount)}
                      </TableCell>
                      <TableCell className="p-2 border text-center text-xs">
                        ₹{formatIndianCurrency(record.amount)}
                      </TableCell>
                      <TableCell className="p-2 border text-center text-xs">
                        {record.urn_number ?? "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-xs text-gray-600">Total Taxable Value</p>
                  <p className="font-semibold">
                    ₹{formatIndianCurrency(selectedGroup.totalTaxableValue)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total VAT Amount</p>
                  <p className="font-semibold">
                    ₹{formatIndianCurrency(selectedGroup.totalVatAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Invoice Value</p>
                  <p className="font-semibold">
                    ₹{formatIndianCurrency(selectedGroup.totalInvoiceValue)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <main className="p-3 bg-gray-50">
        <div className="mx-auto">
          {/* Header Card */}
          <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm mb-3">
            <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
              <div>
                <h1 className="text-lg font-medium text-gray-900">
                  Tally Sale Records
                </h1>
              </div>
              <div className="grow" />
              <div className="flex flex-wrap gap-2 items-center">
                <input
                  value={searchText}
                  onChange={(e) => {
                    setSearchText(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search invoice no, trade name, TIN or date"
                  className="h-8 w-72 max-w-full rounded border border-gray-300 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {dvatdata?.commodity !== "FUEL" && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">View:</span>
                    <Radio.Group
                      size="small"
                      onChange={onChange}
                      value={quantityCount}
                      optionType="button"
                    >
                      <Radio.Button value="pcs">Pcs</Radio.Button>
                      <Radio.Button value="crate">Crate</Radio.Button>
                    </Radio.Group>
                  </div>
                )}
                <Button size="small" type="default" onClick={downloadReport}>
                  Download Report
                </Button>
                <Button
                  size="small"
                  type="primary"
                  disabled={pendingRecordCount === 0}
                  onClick={() => setIsAcceptModalOpen(true)}
                >
                  Accept All
                </Button>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Total Invoices</p>
              <p className="text-lg font-medium text-gray-900">
                {summary.totalInvoices}
              </p>
            </div>
            <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Invoice Value</p>
              <p className="text-lg font-medium text-gray-900">
                ₹{formatIndianCurrency(summary.invoiceValue)}
              </p>
            </div>
            <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Total Tax</p>
              <p className="text-lg font-medium text-gray-900">
                ₹{formatIndianCurrency(summary.totalTax)}
              </p>
            </div>
            <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Taxable Value</p>
              <p className="text-lg font-medium text-gray-900">
                ₹{formatIndianCurrency(summary.taxableValue)}
              </p>
            </div>
          </div>

          {filteredTallySale.length > 0 ? (
            <div className="bg-white rounded shadow-sm border p-3">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 border-b">
                      <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                        Count
                      </TableHead>
                      <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                        Invoice No.
                      </TableHead>
                      <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                        Invoice Date
                      </TableHead>
                      <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                        Trade Name
                      </TableHead>
                      <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                        TIN Number
                      </TableHead>
                      <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                        Invoice Value (₹)
                      </TableHead>
                      <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                        VAT Amount
                      </TableHead>
                      <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                        Taxable Value (₹)
                      </TableHead>
                      <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                        Status
                      </TableHead>
                      <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTallySale.map(
                      (group: GroupedTallySale, index: number) => (
                        <TableRow
                          key={index}
                          className="border-b hover:bg-gray-50"
                        >
                          <TableCell className="p-2 text-center text-xs">
                            {group.count > 1 ? (
                              <button
                                onClick={() => {
                                  setSelectedGroup(group);
                                  setIsGroupModalOpen(true);
                                }}
                                className="text-blue-600 hover:text-blue-800 underline"
                              >
                                {group.count} items
                              </button>
                            ) : (
                              <span>{group.count}</span>
                            )}
                          </TableCell>
                          <TableCell className="p-2 text-center text-xs">
                            {group.invoice_number}
                          </TableCell>
                          <TableCell className="p-2 text-center text-xs">
                            {formateDate(group.invoice_date)}
                          </TableCell>
                          <TableCell className="p-2 text-center text-xs">
                            {group.seller_tin_number.name_of_dealer}
                          </TableCell>
                          <TableCell className="p-2 text-center text-xs">
                            {group.seller_tin_number.tin_number}
                          </TableCell>
                          <TableCell className="p-2 text-center text-xs">
                            ₹{formatIndianCurrency(group.totalInvoiceValue)}
                          </TableCell>
                          <TableCell className="p-2 text-center text-xs">
                            ₹{formatIndianCurrency(group.totalVatAmount)}
                          </TableCell>
                          <TableCell className="p-2 text-center text-xs">
                            ₹{formatIndianCurrency(group.totalTaxableValue)}
                          </TableCell>
                          <TableCell className="p-2 text-center text-xs">
                            {group.records.every((r) => r.is_converted) ? (
                              <span className="inline-block px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                                Converted
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">
                                Pending
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="p-2 text-center">
                            <div className="flex gap-1 justify-center">
                              <button
                                onClick={() => {
                                  setSelectedGroup(group);
                                  setIsGroupModalOpen(true);
                                }}
                                className="text-sm bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded"
                              >
                                View
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ),
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="px-3 py-2 border-t bg-gray-50">
                <div className="lg:hidden">
                  <Pagination
                    align="center"
                    current={currentPage}
                    onChange={onChangePageCount}
                    showSizeChanger
                    pageSize={pagination.take}
                    total={filteredTallySale.length}
                    showTotal={(total: number) => `Total ${total} items`}
                  />
                </div>
                <div className="hidden lg:block">
                  <Pagination
                    showQuickJumper
                    align="center"
                    current={currentPage}
                    onChange={onChangePageCount}
                    showSizeChanger
                    pageSize={pagination.take}
                    pageSizeOptions={[2, 5, 10, 20, 25, 50, 100]}
                    total={filteredTallySale.length}
                    responsive
                    showTotal={(total: number, range: number[]) =>
                      `${range[0]}-${range[1]} of ${total} items`
                    }
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded shadow-sm border p-3 text-center">
              <p className="text-gray-500 text-sm">
                No tally sale records found.
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default TallySalePage;
