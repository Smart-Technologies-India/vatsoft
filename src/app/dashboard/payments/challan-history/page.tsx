"use client";

import { Alert, Button, Input, Pagination } from "antd";
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
import { useEffect, useRef, useState } from "react";
const { RangePicker } = DatePicker;
import type { Dayjs } from "dayjs";
import { dvat04 } from "@prisma/client";
import GetUserChallan, {
  type UserChallanWithReturn,
} from "@/action/challan/getuserchallan";
import UpdateChallanStatus from "@/action/challan/updatechallanstatus";
import { encryptURLData, formateDate } from "@/utils/methods";
import Link from "next/link";
import { toast } from "react-toastify";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import { useRouter } from "next/navigation";

const ChallanHistory = () => {
  const router = useRouter();
  const [userid, setUserid] = useState<number>(0);
  const [isLoading, setLoading] = useState<boolean>(true);
  const [isSearch, setSearch] = useState<boolean>(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const successGatewayStatus = ["Successful", "Success", "Shipped"];

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
    DATE,
  }

  const [searchOption, setSeachOption] = useState<SearchOption>(
    SearchOption.CPIN,
  );

  const onChange = (e: RadioChangeEvent) => {
    setSeachOption(e.target.value);
  };

  const cpinRef = useRef<InputRef>(null);

  const [searchDate, setSearchDate] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);

  const onChangeDate = (
    dates: [Dayjs | null, Dayjs | null] | null,
    dateStrings: [string, string],
  ) => {
    setSearchDate(dates);
  };

  const [challanData, setChallanData] = useState<UserChallanWithReturn[]>([]);
  const [dvatdata, setDvatData] = useState<dvat04 | null>(null);

  const getReturnPeriodLabel = (row: UserChallanWithReturn) => {
    const period = row.returns_01?.month ?? row.returns_01?.quarter;
    const year = row.returns_01?.year;

    if (!period || !year) {
      return "-";
    }

    return `${period} - ${year}`;
  };

  const init = async () => {
    setLoading(true);

    const dvat = await GetUserDvat04();
    if (dvat.status && dvat.data) {
      const challan_resposne = await GetUserChallan({
        dvatid: dvat.data.id,
        take: 10,
        skip: 0,
        excludeCreatedExpired: true,
      });
      if (challan_resposne.data?.result) {
        setChallanData(challan_resposne.data.result);
        setPaginatin({
          skip: challan_resposne.data.skip,
          take: challan_resposne.data.take,
          total: challan_resposne.data.total,
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
        const challan_resposne = await GetUserChallan({
          dvatid: dvat.data.id,
          take: 10,
          skip: 0,
          excludeCreatedExpired: true,
        });
        if (challan_resposne.data?.result) {
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
  }, [userid]);

  const cpinsearch = async () => {
    if (
      cpinRef.current?.input?.value == undefined ||
      cpinRef.current?.input?.value == null ||
      cpinRef.current?.input?.value == ""
    ) {
      return toast.error("Enter cpin");
    }
    const search_response = await GetUserChallan({
      dvatid: dvatdata?.id!,
      cpin: cpinRef.current?.input?.value,
      take: 10,
      skip: 0,
      excludeCreatedExpired: true,
    });
    if (search_response.status && search_response.data?.result) {
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

    const search_response = await GetUserChallan({
      dvatid: dvatdata?.id!,
      fromdate: searchDate[0]?.toDate(),
      todate: searchDate[1]?.toDate(),
      take: 10,
      skip: 0,
      excludeCreatedExpired: true,
    });
    if (search_response.status && search_response.data?.result) {
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
        const search_response = await GetUserChallan({
          dvatid: dvatdata?.id!,
          cpin: cpinRef.current?.input?.value,
          take: pagesize,
          skip: pagesize * (page - 1),
          excludeCreatedExpired: true,
        });

        if (search_response.status && search_response.data?.result) {
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

        const search_response = await GetUserChallan({
          dvatid: dvatdata?.id!,
          fromdate: searchDate[0]?.toDate(),
          todate: searchDate[1]?.toDate(),
          take: pagesize,
          skip: pagesize * (page - 1),
          excludeCreatedExpired: true,
        });

        if (search_response.status && search_response.data?.result) {
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
      const challan_resposne = await GetUserChallan({
        dvatid: dvatdata!.id,
        take: pagesize,
        skip: pagesize * (page - 1),
        excludeCreatedExpired: true,
      });
      if (challan_resposne.status && challan_resposne.data?.result) {
        setChallanData(challan_resposne.data.result);
        setPaginatin({
          skip: challan_resposne.data.skip,
          take: challan_resposne.data.take,
          total: challan_resposne.data.total,
        });
      }
    }
  };

  const isCreatedAndNotExpired = (challan: UserChallanWithReturn) => {
    if (challan.paymentstatus !== "CREATED") {
      return false;
    }

    const expiry = new Date(challan.expire_date).getTime();
    return Number.isFinite(expiry) && expiry >= Date.now();
  };

  const visibleChallanData = challanData;

  const fetchOrderStatus = async (orderNo: string) => {
    const query = new URLSearchParams();
    query.set("order_no", orderNo);

    return fetch(`/orderstatus?${query.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
  };

  const handleVerifyStatus = async (challan: UserChallanWithReturn) => {
    if (!challan.order_id) {
      toast.error("Order ID is missing for this challan.");
      return;
    }

    if (!isCreatedAndNotExpired(challan)) {
      toast.error("Only non-expired CREATED challans can be verified.");
      return;
    }

    setProcessingId(challan.id);
    try {
      const response = await fetchOrderStatus(challan.order_id);
      const data = await response.json();

      if (!response.ok || !data?.success) {
        toast.error(data?.message || "Unable to check payment status.");
        return;
      }

      const apiData = data?.data;
      const apiStatusGroup = apiData?.status_group;
      const isApiSuccess = apiStatusGroup === "success";
      const isAlreadySuccess =
        challan.order_status && successGatewayStatus.includes(challan.order_status);

      if (isApiSuccess && !isAlreadySuccess) {
        const updateResponse = await UpdateChallanStatus({
          challanId: challan.id,
          orderStatus: apiData?.order_status,
          statusGroup: apiData?.status_group,
          orderStatusDateTime: apiData?.order_status_date_time,
          bankRefNo: apiData?.order_bank_ref_no,
          cardName: apiData?.order_card_name,
          paymentMode: apiData?.order_option_type,
          statusCode: apiData?.status_code,
          statusMessage: "Completed Successfully",
          responseCode: apiData?.response_code,
          failureMessage: apiData?.error_desc,
          tracking_id: apiData?.reference_no,
          orderFeeFlat: apiData?.order_fee_flat,
          orderTax: apiData?.order_tax,
        });

        if (updateResponse.status) {
          toast.success("Challan updated with payment success status");
          await init();
        } else {
          toast.warning(updateResponse.message);
        }
      }

      toast.success(
        `Status checked: ${apiData?.order_status || "Fetched successfully"}`,
      );
    } catch (error) {
      toast.error("Something went wrong while checking payment status.");
    } finally {
      setProcessingId(null);
    }
  };

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
          <div className="p-2 bg-gray-50 mt-2 flex flex-col md:flex-row lg:gap-2 lg:items-center">
            <Radio.Group
              onChange={onChange}
              value={searchOption}
              className="mt-2"
              disabled={isSearch}
            >
              <Radio value={SearchOption.CPIN}>CPIN</Radio>
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

          {visibleChallanData.length == 0 && (
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

          {visibleChallanData.length > 0 && (
            <>
              <Table className="border mt-2">
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead className="whitespace-nowrap text-center px-2">
                      CPIN
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center w-36  px-2">
                      Transaction Date
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center  px-2">
                      Amount
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center  px-2">
                      Mode
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center  px-2">
                      Challan Reason
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center  px-2">
                      Return Period
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center  px-2">
                      Deposit Status
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center  px-2">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleChallanData.map((val: UserChallanWithReturn, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="text-center p-2">
                        <Link
                          className="text-blue-500"
                          href={`/dashboard/payments/saved-challan/${encryptURLData(
                            val.id.toString(),
                          )}`}
                        >
                          {val.cpin}
                        </Link>
                      </TableCell>
                      <TableCell className="text-center p-2">
                        {val.transaction_date
                          ? formateDate(new Date(val.transaction_date))
                          : "-"}
                      </TableCell>
                      <TableCell className="text-center p-2">
                        {val.total_tax_amount}
                      </TableCell>
                      <TableCell className="text-center p-2">
                        {val.paymentmode ?? "-"}
                      </TableCell>
                      <TableCell className="text-center p-2">
                        {val.reason}
                      </TableCell>
                      <TableCell className="text-center p-2">
                        {getReturnPeriodLabel(val)}
                      </TableCell>
                      <TableCell className="text-center p-2">
                        {val.paymentstatus}
                      </TableCell>
                      <TableCell className="text-center p-2">
                        {isCreatedAndNotExpired(val) ? (
                          <Button
                            size="small"
                            onClick={() => handleVerifyStatus(val)}
                            loading={processingId === val.id}
                          >
                            Verify
                          </Button>
                        ) : (
                          "-"
                        )}
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
    </>
  );
};

export default ChallanHistory;
