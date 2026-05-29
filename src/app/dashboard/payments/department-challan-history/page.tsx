"use client";

import { Alert, Button, Input, Modal, Pagination } from "antd";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { InputRef, RadioChangeEvent } from "antd";
import { Radio, DatePicker } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
const { RangePicker } = DatePicker;
import type { Dayjs } from "dayjs";
import { user } from "@prisma/client";
import { formateDate } from "@/utils/methods";
import { toast } from "react-toastify";
import GetDeptChallan, {
  type DepartmentChallanWithRelations,
} from "@/action/challan/getdeptchallan";
import GetUser from "@/action/user/getuser";
import GetReturn01 from "@/action/return/getreturn";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import { useRouter } from "next/navigation";
import SearchChallan, {
  type SearchChallanWithRelations,
} from "@/action/challan/searchchallan";
import GetDeptChallanSummary from "@/action/challan/getdeptchallansummary";
// import GetAllChallan from "@/action/challan/getallchallan";

type GroupedChallan = DepartmentChallanWithRelations | SearchChallanWithRelations;

type ChallanGroup = {
  key: string;
  returnId: number | null;
  challans: GroupedChallan[];
  dvat: GroupedChallan["dvat"];
  returnInfo: GroupedChallan["returns_01"];
  totalAmount: number;
};

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatINR = (value: number) => inrFormatter.format(value);

const ChallanHistory = () => {
  const router = useRouter();
  const [id, setId] = useState<number>(0);
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
    CPIN,
    TIN_TRADE,
    DATE,
  }

  const [searchOption, setSeachOption] = useState<SearchOption>(
    SearchOption.CPIN
  );

  const onChange = (e: RadioChangeEvent) => {
    setSeachOption(e.target.value);
  };

  const cpinRef = useRef<InputRef>(null);
  const tinTradeRef = useRef<InputRef>(null);

  const [searchDate, setSearchDate] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);

  const onChangeDate = (
    dates: [Dayjs | null, Dayjs | null] | null,
    dateStrings: [string, string]
  ) => {
    setSearchDate(dates);
  };

  const [challanData, setChallanData] = useState<GroupedChallan[]>([]);

  const [user, setUpser] = useState<user | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<ChallanGroup | null>(null);
  const [isBreakupModalOpen, setIsBreakupModalOpen] = useState(false);
  const [paymentSummary, setPaymentSummary] = useState({
    today: 0,
    last7Days: 0,
    last15Days: 0,
    last30Days: 0,
  });
  const [returnDetailsMap, setReturnDetailsMap] = useState<
    Record<number, GroupedChallan["returns_01"]>
  >({});

  const parseAmount = (value: string | null | undefined) =>
    Number.parseFloat(value ?? "0") || 0;

  const getReturnPeriodLabel = (group: ChallanGroup) => {
    const returnInfo =
      (group.returnId != null ? returnDetailsMap[group.returnId] : null) ??
      group.returnInfo;

    if (!returnInfo) return "-";

    const period = returnInfo.month ?? returnInfo.quarter ?? "-";
    return `${period} ${returnInfo.year}`;
  };

  const groupedChallanData = useMemo(() => {
    const groups = new Map<string, ChallanGroup>();

    challanData.forEach((item) => {
      const key = item.returnid != null ? `return-${item.returnid}` : `challan-${item.id}`;
      const existing = groups.get(key);

      if (existing) {
        existing.challans.push(item);
        existing.totalAmount += parseAmount(item.total_tax_amount);
        return;
      }

      groups.set(key, {
        key,
        returnId: item.returnid ?? null,
        challans: [item],
        dvat: item.dvat,
        returnInfo: item.returns_01,
        totalAmount: parseAmount(item.total_tax_amount),
      });
    });

    return Array.from(groups.values());
  }, [challanData]);

  const getLatestTransactionDate = (group: ChallanGroup) => {
    const latestTransactionDate = group.challans.reduce<Date | null>(
      (latest, challan) => {
        if (!challan.transaction_date) {
          return latest;
        }

        const transactionDate = new Date(challan.transaction_date);
        if (Number.isNaN(transactionDate.getTime())) {
          return latest;
        }

        if (!latest || transactionDate > latest) {
          return transactionDate;
        }

        return latest;
      },
      null,
    );

    return latestTransactionDate ? formateDate(latestTransactionDate) : "-";
  };

  useEffect(() => {
    const loadReturnDetails = async () => {
      const uniqueReturnIds = Array.from(
        new Set(
          challanData
            .map((item) => item.returnid)
            .filter((value): value is number => value != null),
        ),
      );

      if (uniqueReturnIds.length === 0) {
        setReturnDetailsMap({});
        return;
      }

      const resolvedEntries = await Promise.all(
        uniqueReturnIds.map(async (returnId) => {
          const response = await GetReturn01({ id: returnId });
          if (response.status && response.data) {
            return [returnId, response.data] as const;
          }

          return null;
        }),
      );

      const nextMap = Object.fromEntries(
        resolvedEntries.filter((entry): entry is readonly [number, NonNullable<typeof entry>[1]] => entry !== null),
      ) as Record<number, GroupedChallan["returns_01"]>;

      setReturnDetailsMap(nextMap);
    };

    loadReturnDetails();
  }, [challanData]);

  useEffect(() => {
    const loadSummary = async () => {
      if (!user?.selectOffice) {
        setPaymentSummary({
          today: 0,
          last7Days: 0,
          last15Days: 0,
          last30Days: 0,
        });
        return;
      }

      const summaryResponse = await GetDeptChallanSummary({
        dept: user.selectOffice,
      });

      if (summaryResponse.status && summaryResponse.data) {
        setPaymentSummary(summaryResponse.data);
      }
    };

    loadSummary();
  }, [user?.selectOffice]);

  const init = async () => {
    setLoading(true);

    const userrespone = await GetUser({ id: id });
    if (userrespone.status && userrespone.data) {
      setUpser(userrespone.data);

      const challan_resposne = await GetDeptChallan({
        dept: userrespone.data.selectOffice!,
        paymentstatus: "PAID",
        take: 10,
        skip: 0,
      });
      if (challan_resposne.data && challan_resposne.data.result) {
        setChallanData(challan_resposne.data.result);
        setPaginatin({
          skip: challan_resposne.data.skip,
          take: challan_resposne.data.take,
          total: challan_resposne.data.total,
        });
      }
      setSearch(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
      setId(authResponse.data);
      const userrespone = await GetUser({ id: authResponse.data });
      if (userrespone.status && userrespone.data) {
        setUpser(userrespone.data);
        const challan_resposne = await GetDeptChallan({
          dept: userrespone.data.selectOffice!,
          paymentstatus: "PAID",
          take: 10,
          skip: 0,
        });

        if (challan_resposne.data && challan_resposne.data.result) {
          setChallanData(challan_resposne.data.result);
          setPaginatin({
            skip: challan_resposne.data.skip,
            take: challan_resposne.data.take,
            total: challan_resposne.data.total,
          });
        }
      }
      setLoading(false);
    };
    init();
  }, [id, router]);

  const cpinsearch = async () => {
    if (
      cpinRef.current?.input?.value == undefined ||
      cpinRef.current?.input?.value == null ||
      cpinRef.current?.input?.value == ""
    ) {
      return toast.error("Enter cpin");
    }
    const search_response = await SearchChallan({
      cpin: cpinRef.current?.input?.value,
      dept: user?.selectOffice!,
      paymentstatus: "PAID",
      take: 10,
      skip: 0,
    });
    if (search_response.status && search_response.data.result) {
      setChallanData(search_response.data.result);
      setPaginatin({
        skip: search_response.data.skip,
        take: search_response.data.take,
        total: search_response.data.total,
      });
      setSearch(true);
    }
  };

  const tinTradeSearch = async () => {
    if (
      tinTradeRef.current?.input?.value == undefined ||
      tinTradeRef.current?.input?.value == null ||
      tinTradeRef.current?.input?.value == ""
    ) {
      return toast.error("Enter TIN number or trade name");
    }

    const search_response = await SearchChallan({
      searchText: tinTradeRef.current?.input?.value,
      dept: user?.selectOffice!,
      paymentstatus: "PAID",
      take: 10,
      skip: 0,
    });

    if (search_response.status && search_response.data.result) {
      setChallanData(search_response.data.result);
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
      return toast.error("Select state date and end date");
    }

    const search_response = await SearchChallan({
      fromdate: searchDate[0]?.toDate(),
      todate: searchDate[1]?.toDate(),
      dept: user?.selectOffice!,
      paymentstatus: "PAID",
      take: 10,
      skip: 0,
    });
    if (search_response.status && search_response.data.result) {
      setChallanData(search_response.data.result);
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
      if (searchOption == SearchOption.CPIN) {
        if (
          cpinRef.current?.input?.value == undefined ||
          cpinRef.current?.input?.value == null ||
          cpinRef.current?.input?.value == ""
        ) {
          return toast.error("Enter cpin");
        }
        const search_response = await SearchChallan({
          cpin: cpinRef.current?.input?.value,
          dept: user?.selectOffice!,
          paymentstatus: "PAID",
          take: pagesize,
          skip: pagesize * (page - 1),
        });

        if (search_response.status && search_response.data.result) {
          setChallanData(search_response.data.result);
          setPaginatin({
            skip: search_response.data.skip,
            take: search_response.data.take,
            total: search_response.data.total,
          });
          setSearch(true);
        }
      } else if (searchOption == SearchOption.TIN_TRADE) {
        if (
          tinTradeRef.current?.input?.value == undefined ||
          tinTradeRef.current?.input?.value == null ||
          tinTradeRef.current?.input?.value == ""
        ) {
          return toast.error("Enter TIN number or trade name");
        }

        const search_response = await SearchChallan({
          searchText: tinTradeRef.current?.input?.value,
          dept: user?.selectOffice!,
          paymentstatus: "PAID",
          take: pagesize,
          skip: pagesize * (page - 1),
        });

        if (search_response.status && search_response.data.result) {
          setChallanData(search_response.data.result);
          setPaginatin({
            skip: search_response.data.skip,
            take: search_response.data.take,
            total: search_response.data.total,
          });
          setSearch(true);
        }
      } else if (searchOption == SearchOption.DATE) {
        if (searchDate == null || searchDate.length <= 1) {
          return toast.error("Select state date and end date");
        }

        const search_response = await SearchChallan({
          fromdate: searchDate[0]?.toDate(),
          todate: searchDate[1]?.toDate(),
          dept: user?.selectOffice!,
          paymentstatus: "PAID",
          take: pagesize,
          skip: pagesize * (page - 1),
        });

        if (search_response.status && search_response.data.result) {
          setChallanData(search_response.data.result);
          setPaginatin({
            skip: search_response.data.skip,
            take: search_response.data.take,
            total: search_response.data.total,
          });
          setSearch(true);
        }
      }
    } else {
      const challan_resposne = await GetDeptChallan({
        dept: user!.selectOffice!,
        paymentstatus: "PAID",
        take: pagesize,
        skip: pagesize * (page - 1),
      });
      if (challan_resposne.status && challan_resposne.data.result) {
        setChallanData(challan_resposne.data.result);
        setPaginatin({
          skip: challan_resposne.data.skip,
          take: challan_resposne.data.take,
          total: challan_resposne.data.total,
        });
      }
    }
  };

  const handleOpenBreakup = (group: ChallanGroup) => {
    setSelectedGroup(group);
    setIsBreakupModalOpen(true);
  };

  const summaryTotals = selectedGroup
    ? selectedGroup.challans.reduce(
        (acc, item) => ({
          vat: acc.vat + parseAmount(item.vat),
          interest: acc.interest + parseAmount(item.interest),
          penalty: acc.penalty + parseAmount(item.penalty),
          latefees: acc.latefees + parseAmount(item.latefees),
          others: acc.others + parseAmount(item.others),
          total: acc.total + parseAmount(item.total_tax_amount),
        }),
        { vat: 0, interest: 0, penalty: 0, latefees: 0, others: 0, total: 0 },
      )
    : null;

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );

  return (
    <>
      <div className="p-2">
        <div className="bg-white p-2 shadow mt-4">
          <div className="bg-blue-500 p-2 text-white">Challan History</div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 p-2">
            <div className="rounded border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs text-blue-600 font-medium">Today</p>
              <p className="text-2xl font-bold text-blue-900 mt-2">
                {formatINR(paymentSummary.today)}
              </p>
            </div>
            <div className="rounded border border-green-200 bg-green-50 p-4">
              <p className="text-xs text-green-600 font-medium">Last 7 Days</p>
              <p className="text-2xl font-bold text-green-900 mt-2">
                {formatINR(paymentSummary.last7Days)}
              </p>
            </div>
            <div className="rounded border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs text-amber-600 font-medium">Last 15 Days</p>
              <p className="text-2xl font-bold text-amber-900 mt-2">
                {formatINR(paymentSummary.last15Days)}
              </p>
            </div>
            <div className="rounded border border-purple-200 bg-purple-50 p-4">
              <p className="text-xs text-purple-600 font-medium">Last 30 Days</p>
              <p className="text-2xl font-bold text-purple-900 mt-2">
                {formatINR(paymentSummary.last30Days)}
              </p>
            </div>
          </div>

          <div className="p-2 bg-gray-50 mt-2 flex flex-col md:flex-row lg:gap-2 lg:items-center">
            <Radio.Group
              onChange={onChange}
              value={searchOption}
              className="mt-2"
              disabled={isSearch}
            >
              <Radio value={SearchOption.CPIN}>CPIN</Radio>
              <Radio value={SearchOption.TIN_TRADE}>TIN / Trade Name</Radio>
              <Radio value={SearchOption.DATE}>DATE</Radio>
            </Radio.Group>
            <div className="mt-2"></div>
            {(() => {
              switch (searchOption) {
                case SearchOption.CPIN:
                  return (
                    <div className="flex gap-2">
                      <Input
                        className="w-60"
                        ref={cpinRef}
                        placeholder={"Enter CPIN"}
                        disabled={isSearch}
                      />

                      {isSearch ? (
                        <Button onClick={init} type="primary">
                          Reset
                        </Button>
                      ) : (
                        <Button onClick={cpinsearch} type="primary">
                          Search
                        </Button>
                      )}
                    </div>
                  );

                case SearchOption.TIN_TRADE:
                  return (
                    <div className="flex gap-2">
                      <Input
                        className="w-60"
                        ref={tinTradeRef}
                        placeholder={"Enter TIN Number or Trade Name"}
                        disabled={isSearch}
                      />

                      {isSearch ? (
                        <Button onClick={init} type="primary">
                          Reset
                        </Button>
                      ) : (
                        <Button onClick={tinTradeSearch} type="primary">
                          Search
                        </Button>
                      )}
                    </div>
                  );

                case SearchOption.DATE:
                  return (
                    <div className="flex gap-2">
                      <RangePicker
                        onChange={onChangeDate}
                        disabled={isSearch}
                      />

                      {isSearch ? (
                        <Button onClick={init} type="primary">
                          Reset
                        </Button>
                      ) : (
                        <Button type="primary" onClick={datesearch}>
                          Search
                        </Button>
                      )}
                    </div>
                  );
                default:
                  return null;
              }
            })()}
          </div>

          {challanData.length == 0 && (
            <Alert
              style={{
                marginTop: "10px",
                padding: "8px",
              }}
              type="error"
              showIcon
              description="There is no challan."
            />
          )}

          {challanData.length > 0 && (
            <>
              <Table className="border mt-2">
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead className="whitespace-nowrap text-center px-2">
                      TIN Number
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center px-2">
                      Trade Name
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center w-36 px-2">
                      Return Period
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center px-2">
                      Payments
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center px-2">
                      Total Amount
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center px-2">
                      Last Transaction Date
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center px-2">
                      View
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedChallanData.map((group: ChallanGroup) => (
                    <TableRow key={group.key}>
                      <TableCell className="text-center p-2">
                        {group.dvat.tinNumber}
                      </TableCell>
                      <TableCell className="text-center p-2">
                        {group.dvat.tradename ?? "-"}
                      </TableCell>
                      <TableCell className="text-center p-2">
                        {getReturnPeriodLabel(group)}
                      </TableCell>
                      <TableCell className="text-center p-2">
                        {group.challans.length}
                      </TableCell>
                      <TableCell className="text-center p-2">
                        {formatINR(group.totalAmount)}
                      </TableCell>
                      <TableCell className="text-center p-2">
                        {getLatestTransactionDate(group)}
                      </TableCell>
                      <TableCell className="text-center p-2">
                        <Button
                          type="primary"
                          size="small"
                          onClick={() => handleOpenBreakup(group)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-2"></div>
              <div className="lg:hidden">
                <Pagination
                  align="center"
                  defaultCurrent={1}
                  onChange={onChangePageCount}
                  showSizeChanger
                  total={pagination.total}
                  showTotal={(total: number) => `Total ${total} items`}
                />
              </div>
              <div className="hidden lg:block">
                <Pagination
                  showQuickJumper
                  align="center"
                  defaultCurrent={1}
                  onChange={onChangePageCount}
                  showSizeChanger
                  pageSizeOptions={[2, 5, 10, 20, 25, 50, 100]}
                  total={pagination.total}
                  responsive={true}
                  showTotal={(total: number, range: number[]) =>
                    `${range[0]}-${range[1]} of ${total} items`
                  }
                />
              </div>
            </>
          )}
        </div>
      </div>

      <Modal
        title="Payment Breakup"
        open={isBreakupModalOpen}
        onCancel={() => {
          setIsBreakupModalOpen(false);
          setSelectedGroup(null);
        }}
        footer={null}
        width={1100}
      >
        {selectedGroup && summaryTotals && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded border p-3">
                <p className="text-xs text-gray-500">TIN Number</p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedGroup.dvat.tinNumber}
                </p>
              </div>
              <div className="rounded border p-3">
                <p className="text-xs text-gray-500">Trade Name</p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedGroup.dvat.tradename ?? "-"}
                </p>
              </div>
              <div className="rounded border p-3">
                <p className="text-xs text-gray-500">Return Period</p>
                <p className="text-sm font-medium text-gray-900">
                  {getReturnPeriodLabel(selectedGroup)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
              <div className="rounded border bg-gray-50 p-3">
                <p className="text-xs text-gray-500">VAT</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatINR(summaryTotals.vat)}
                </p>
              </div>
              <div className="rounded border bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Interest</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatINR(summaryTotals.interest)}
                </p>
              </div>
              <div className="rounded border bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Penalty</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatINR(summaryTotals.penalty)}
                </p>
              </div>
              <div className="rounded border bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Late Fees</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatINR(summaryTotals.latefees)}
                </p>
              </div>
              <div className="rounded border bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Others</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatINR(summaryTotals.others)}
                </p>
              </div>
              <div className="rounded border border-blue-200 bg-blue-50 p-3">
                <p className="text-xs text-blue-600">Grand Total</p>
                <p className="text-sm font-semibold text-blue-900">
                  {formatINR(summaryTotals.total)}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead className="text-center px-2">CPIN</TableHead>
                    <TableHead className="text-center px-2">Reason</TableHead>
                    <TableHead className="text-center px-2">Payment Mode</TableHead>
                    <TableHead className="text-center px-2">Status</TableHead>
                    <TableHead className="text-center px-2">VAT</TableHead>
                    <TableHead className="text-center px-2">Interest</TableHead>
                    <TableHead className="text-center px-2">Penalty</TableHead>
                    <TableHead className="text-center px-2">Late Fees</TableHead>
                    <TableHead className="text-center px-2">Others</TableHead>
                    <TableHead className="text-center px-2">Total</TableHead>
                    <TableHead className="text-center px-2">Deposit Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedGroup.challans.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-center p-2">{item.cpin}</TableCell>
                      <TableCell className="text-center p-2">{item.reason}</TableCell>
                      <TableCell className="text-center p-2">
                        {item.paymentmode ?? "-"}
                      </TableCell>
                      <TableCell className="text-center p-2">
                        {item.paymentstatus}
                      </TableCell>
                      <TableCell className="text-center p-2">
                        {formatINR(parseAmount(item.vat))}
                      </TableCell>
                      <TableCell className="text-center p-2">
                        {formatINR(parseAmount(item.interest))}
                      </TableCell>
                      <TableCell className="text-center p-2">
                        {formatINR(parseAmount(item.penalty))}
                      </TableCell>
                      <TableCell className="text-center p-2">
                        {formatINR(parseAmount(item.latefees))}
                      </TableCell>
                      <TableCell className="text-center p-2">
                        {formatINR(parseAmount(item.others))}
                      </TableCell>
                      <TableCell className="text-center p-2">
                        {formatINR(parseAmount(item.total_tax_amount))}
                      </TableCell>
                      <TableCell className="text-center p-2">
                        {item.transaction_date
                          ? formateDate(new Date(item.transaction_date))
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default ChallanHistory;
