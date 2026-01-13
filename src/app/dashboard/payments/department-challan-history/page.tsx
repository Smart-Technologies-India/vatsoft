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
import { challan, user } from "@prisma/client";
import { encryptURLData, formateDate } from "@/utils/methods";
import { toast } from "react-toastify";
import SearchChallan from "@/action/challan/searchchallan";
import GetDeptChallan from "@/action/challan/getdeptchallan";
import GetUser from "@/action/user/getuser";
import Link from "next/link";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import { useRouter } from "next/navigation";
// import GetAllChallan from "@/action/challan/getallchallan";

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
    DATE,
  }

  const [searchOption, setSeachOption] = useState<SearchOption>(
    SearchOption.CPIN
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
    dateStrings: [string, string]
  ) => {
    setSearchDate(dates);
  };

  const [challanData, setChallanData] = useState<challan[]>([]);

  const [user, setUpser] = useState<user | null>(null);

  const init = async () => {
    setLoading(true);

    const userrespone = await GetUser({ id: id });
    if (userrespone.status && userrespone.data) {
      setUpser(userrespone.data);

      const challan_resposne = await GetDeptChallan({
        dept: userrespone.data.selectOffice!,
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
  }, [id]);

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
                      CPIN
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center w-36  px-2">
                      Created On
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
                      Expire Date
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center  px-2">
                      Deposit Date
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center  px-2">
                      Deposit Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {challanData.map((val: challan, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="text-center p-2">
                        {val.challanstatus == "PAID" ? (
                          <Link
                            className="text-blue-500"
                            href={`/dashboard/payments/saved-challan/${encryptURLData(
                              val.id.toString()
                            )}`}
                          >
                            {val.cpin}
                          </Link>
                        ) : (
                          val.cpin
                        )}
                      </TableCell>
                      <TableCell className="text-center p-2">
                        {formateDate(new Date(val.createdAt))}
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
                        {formateDate(new Date(val.expire_date))}
                      </TableCell>
                      <TableCell className="text-center p-2">
                        {val.transaction_date
                          ? formateDate(new Date(val.transaction_date))
                          : "-"}
                      </TableCell>
                      <TableCell className="text-center p-2">
                        {val.challanstatus}
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
