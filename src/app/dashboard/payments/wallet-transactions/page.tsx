"use client";

import { Button, Input, Pagination } from "antd";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { InputRef, RadioChangeEvent } from "antd";
import { Radio, DatePicker, Spin } from "antd";
import { useEffect, useRef, useState } from "react";
const { RangePicker } = DatePicker;
import type { Dayjs } from "dayjs";
import { dvat04 } from "@prisma/client";
import GetUserLiquorWalletTransactions, {
  type UserLiquorWalletTransactionWithRelations,
} from "@/action/liquor/getuserwalletransactions";
import { formateDate } from "@/utils/methods";
import { toast } from "react-toastify";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import { useRouter } from "next/navigation";
import Link from "next/link";

const WalletTransactionsPage = () => {
  const router = useRouter();
  const [userid, setUserid] = useState<number>(0);
  const [isLoading, setLoading] = useState<boolean>(true);
  const [isSearch, setSearch] = useState<boolean>(false);

  const [pagination, setPaginatin] = useState<{
    take: number;
    skip: number;
    total: number;
  }>({
    take: 10,
    skip: 0,
    total: 0,
  });

  enum SearchOption {
    INVOICE_NUMBER,
    DATE,
  }

  const [searchOption, setSeachOption] = useState<SearchOption>(
    SearchOption.INVOICE_NUMBER,
  );

  const onChange = (e: RadioChangeEvent) => {
    setSeachOption(e.target.value);
  };

  const invoiceNumberRef = useRef<InputRef>(null);

  const [searchDate, setSearchDate] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);

  const onChangeDate = (
    dates: [Dayjs | null, Dayjs | null] | null,
    dateStrings: [string, string],
  ) => {
    setSearchDate(dates);
  };

  const [walletTransactionsData, setWalletTransactionsData] = useState<
    UserLiquorWalletTransactionWithRelations[]
  >([]);
  const [dvatdata, setDvatData] = useState<dvat04 | null>(null);

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return Number.isFinite(num) ? num.toFixed(2) : "0.00";
  };

  const init = async () => {
    setLoading(true);

    const dvat = await GetUserDvat04();
    if (dvat.status && dvat.data) {
      setDvatData(dvat.data);
      const history_response = await GetUserLiquorWalletTransactions({
        dvatid: dvat.data.id,
        take: 10,
        skip: 0,
      });
      if (history_response.data?.result) {
        setWalletTransactionsData(history_response.data.result);
        setPaginatin({
          skip: history_response.data.skip,
          take: history_response.data.take,
          total: history_response.data.total,
        });
      }
    }

    setSearch(false);
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
      setUserid(authResponse.data);

      const dvat = await GetUserDvat04();
      if (dvat.status && dvat.data) {
        setDvatData(dvat.data);
        const history_response = await GetUserLiquorWalletTransactions({
          dvatid: dvat.data.id,
          take: 10,
          skip: 0,
        });
        if (history_response.data?.result) {
          setWalletTransactionsData(history_response.data.result);
          setPaginatin({
            skip: history_response.data.skip,
            take: history_response.data.take,
            total: history_response.data.total,
          });
        }
      }

      setLoading(false);
    };
    init();
  }, [userid, router]);

  const invoiceNumberSearch = async () => {
    if (
      invoiceNumberRef.current?.input?.value == undefined ||
      invoiceNumberRef.current?.input?.value == null ||
      invoiceNumberRef.current?.input?.value == ""
    ) {
      return toast.error("Enter invoice number");
    }
    const search_response = await GetUserLiquorWalletTransactions({
      dvatid: dvatdata?.id!,
      invoice_number: invoiceNumberRef.current?.input?.value,
      take: 10,
      skip: 0,
    });
    if (search_response.status && search_response.data?.result) {
      setWalletTransactionsData(search_response.data.result);
      setPaginatin({
        skip: search_response.data.skip,
        take: search_response.data.take,
        total: search_response.data.total,
      });
      setSearch(true);
    }
  };

  const datesearch = async () => {
    if (searchDate == null || searchDate.length <= 1) {
      return toast.error("Select start date and end date");
    }

    const search_response = await GetUserLiquorWalletTransactions({
      dvatid: dvatdata?.id!,
      fromdate: searchDate[0]?.toDate(),
      todate: searchDate[1]?.toDate(),
      take: 10,
      skip: 0,
    });
    if (search_response.status && search_response.data?.result) {
      setWalletTransactionsData(search_response.data.result);
      setPaginatin({
        skip: search_response.data.skip,
        take: search_response.data.take,
        total: search_response.data.total,
      });
      setSearch(true);
    }
  };

  const onChangePageCount = async (page: number, pagesize: number) => {
    if (isSearch) {
      if (searchOption == SearchOption.INVOICE_NUMBER) {
        if (
          invoiceNumberRef.current?.input?.value == undefined ||
          invoiceNumberRef.current?.input?.value == null ||
          invoiceNumberRef.current?.input?.value == ""
        ) {
          return toast.error("Enter invoice number");
        }
        const search_response = await GetUserLiquorWalletTransactions({
          dvatid: dvatdata?.id!,
          invoice_number: invoiceNumberRef.current?.input?.value,
          take: pagesize,
          skip: pagesize * (page - 1),
        });

        if (search_response.status && search_response.data?.result) {
          setWalletTransactionsData(search_response.data.result);
          setPaginatin({
            skip: search_response.data.skip,
            take: search_response.data.take,
            total: search_response.data.total,
          });
          setSearch(true);
        }
      } else if (searchOption == SearchOption.DATE) {
        if (searchDate == null || searchDate.length <= 1) {
          return toast.error("Select start date and end date");
        }

        const search_response = await GetUserLiquorWalletTransactions({
          dvatid: dvatdata?.id!,
          fromdate: searchDate[0]?.toDate(),
          todate: searchDate[1]?.toDate(),
          take: pagesize,
          skip: pagesize * (page - 1),
        });

        if (search_response.status && search_response.data?.result) {
          setWalletTransactionsData(search_response.data.result);
          setPaginatin({
            skip: search_response.data.skip,
            take: search_response.data.take,
            total: search_response.data.total,
          });
          setSearch(true);
        }
      }
    } else {
      const history_response = await GetUserLiquorWalletTransactions({
        dvatid: dvatdata!.id,
        take: pagesize,
        skip: pagesize * (page - 1),
      });
      if (history_response.status && history_response.data?.result) {
        setWalletTransactionsData(history_response.data.result);
        setPaginatin({
          skip: history_response.data.skip,
          take: history_response.data.take,
          total: history_response.data.total,
        });
      }
    }
  };

  if (isLoading) {
    return (
      <main className="p-4 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto flex min-h-56 items-center justify-center">
          <Spin />
        </div>
      </main>
    );
  }

  if (!dvatdata) {
    return null;
  }

  return (
    <main className="p-4 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-gray-900">
              Wallet History
            </h1>
            <Link href="/dashboard/payments/add-liquor-wallet-transaction">
              <Button type="primary" size="large">
                Recharge Wallet
              </Button>
            </Link>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 ">
            <div className="space-y-4 flex">
              <div className="flex gap-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Search by:
                </p>
                <Radio.Group value={searchOption} onChange={onChange}>
                  <Radio value={SearchOption.INVOICE_NUMBER}>
                    Invoice Number
                  </Radio>
                  <Radio value={SearchOption.DATE}>Date Range</Radio>
                </Radio.Group>
              </div>

              {searchOption === SearchOption.INVOICE_NUMBER && (
                <div className="flex gap-2">
                  <Input
                    ref={invoiceNumberRef}
                    placeholder="Enter invoice number"
                    className="flex-1 h-8"
                  />
                  <Button type="primary" onClick={invoiceNumberSearch}>
                    Search
                  </Button>
                  {isSearch && <Button onClick={init}>Clear</Button>}
                </div>
              )}

              {searchOption === SearchOption.DATE && (
                <div className="flex gap-2">
                  <RangePicker
                    value={searchDate}
                    onChange={onChangeDate}
                    className="flex-1 h-8"
                  />
                  <Button type="primary" onClick={datesearch}>
                    Search
                  </Button>
                  {isSearch && <Button onClick={init}>Clear</Button>}
                </div>
              )}
              <div className="grow"></div>
              <div className="bg-linear-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg py-2 px-4 flex gap-4 text-lg justify-center items-center">
                <p className="text-sm text-blue-600 font-medium">
                  Wallet Balance
                </p>
                <p className="text-lg font-bold text-blue-900">
                  ₹ {formatCurrency(dvatdata.wallet || "0")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="text-center p-3 text-xs font-semibold text-gray-700">
                    Sr. No.
                  </TableHead>
                  <TableHead className="text-center p-3 text-xs font-semibold text-gray-700">
                    Invoice Number
                  </TableHead>
                  <TableHead className="text-center p-3 text-xs font-semibold text-gray-700">
                    Transaction Type
                  </TableHead>
                  <TableHead className="text-center p-3 text-xs font-semibold text-gray-700">
                    Seller
                  </TableHead>
                  <TableHead className="text-center p-3 text-xs font-semibold text-gray-700">
                    Amount
                  </TableHead>
                  <TableHead className="text-center p-3 text-xs font-semibold text-gray-700">
                    Date
                  </TableHead>
                  <TableHead className="text-center p-3 text-xs font-semibold text-gray-700">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {walletTransactionsData.length > 0 ? (
                  walletTransactionsData.map((record, index) => (
                    <TableRow
                      key={record.id}
                      className="border-b hover:bg-gray-50"
                    >
                      <TableCell className="text-center p-3 text-sm">
                        {pagination.skip + index + 1}
                      </TableCell>
                      <TableCell className="text-center p-3 text-sm font-medium">
                        {record.invoice_number}
                      </TableCell>
                      <TableCell className="text-center p-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            record.type === "DEBIT"
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {record.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-center p-3 text-sm">
                        {record.seller?.name_of_dealer || "N/A"}
                      </TableCell>
                      <TableCell className="text-center p-3 text-sm font-medium">
                        ₹ {formatCurrency(
                          Math.abs(
                            parseFloat(record.old_wallet || "0") -
                              parseFloat(record.new_wallet || "0")
                          )
                        )}
                      </TableCell>
                      <TableCell className="text-center p-3 text-sm">
                        {formateDate(record.createdAt)}
                      </TableCell>
                      <TableCell className="text-center p-3 text-sm">
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                          {record.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center p-4 text-sm text-gray-500"
                    >
                      No wallet transactions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {walletTransactionsData.length > 0 && (
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-center">
              <Pagination
                current={Math.floor(pagination.skip / pagination.take) + 1}
                pageSize={pagination.take}
                total={pagination.total}
                onChange={onChangePageCount}
                showSizeChanger
                pageSizeOptions={[10, 20, 50, 100]}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default WalletTransactionsPage;
