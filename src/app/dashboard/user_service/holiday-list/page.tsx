"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Dayjs } from "dayjs";
import { toast } from "react-toastify";
import { DatePicker, Drawer, Pagination } from "antd";

import { Button, InputRef } from "antd";
import { HolidayMasterProvider } from "@/components/forms/holiday/holiday";
import GetAllHoliday from "@/action/holiday/getallholiday";
import { holiday, Role } from "@prisma/client";
import { format } from "date-fns";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import { getCurrentUserRole } from "@/lib/auth";
const { RangePicker } = DatePicker;

const Refund = () => {
  const router = useRouter();
  const [userid, setUserid] = useState<number>(0);
  const [role, setRole] = useState<Role>(Role.USER);

  const [pagination, setPaginatin] = useState<{
    take: number;
    skip: number;
    total: number;
  }>({
    take: 10,
    skip: 0,
    total: 0,
  });

  const [isLoading, setLoading] = useState<boolean>(true);
  const [isSearch, setSearch] = useState<boolean>(false);

  const typeRef = useRef<InputRef>(null);

  const [searchDate, setSearchDate] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);

  const onChangeDate = (
    dates: [Dayjs | null, Dayjs | null] | null,
    dateStrings: [string, string]
  ) => {
    setSearchDate(dates);
  };

  const init = async () => {
    setLoading(true);
    const holiday_resonse = await GetAllHoliday({
      take: 10,
      skip: 0,
    });

    if (holiday_resonse.status && holiday_resonse.data.result) {
      setHoliay(holiday_resonse.data.result);
      setPaginatin({
        skip: holiday_resonse.data.skip,
        take: holiday_resonse.data.take,
        total: holiday_resonse.data.total,
      });
    }
    setSearch(false);

    setLoading(false);
  };

  const typesearch = async () => {
    if (
      typeRef.current?.input?.value == undefined ||
      typeRef.current?.input?.value == null ||
      typeRef.current?.input?.value == ""
    ) {
      return toast.error("Enter type");
    }
    // const search_response = await SearchChallan({
    //   userid: id,
    //   cpin: cpinRef.current?.input?.value,
    // });
    // if (search_response.status && search_response.data) {
    //   setChallanData(search_response.data);
    //   setSearch(true);
    // }
  };

  const datesearch = async () => {
    if (searchDate == null || searchDate.length <= 1) {
      return toast.error("Select state date and end date");
    }
  };

  const [holidaydata, setHoliay] = useState<holiday[]>([]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
      setUserid(authResponse.data);
      const roleResponse = await getCurrentUserRole();
      if (roleResponse != null && roleResponse != undefined) {
        setRole(roleResponse as Role);
      }
      const holiday_resonse = await GetAllHoliday({
        take: 10,
        skip: 0,
      });

      if (holiday_resonse.status && holiday_resonse.data.result) {
        setHoliay(holiday_resonse.data.result);
        setPaginatin({
          skip: holiday_resonse.data.skip,
          take: holiday_resonse.data.take,
          total: holiday_resonse.data.total,
        });
      }
      setLoading(false);
    };
    init();
  }, []);

  const [addBox, setAddBox] = useState<boolean>(false);
  const [holidayid, setHolidayid] = useState<number>();

  const onChangePageCount = async (page: number, pagesize: number) => {
    const holiday_response = await GetAllHoliday({
      take: pagesize,
      skip: pagesize * (page - 1),
    });

    if (holiday_response.status && holiday_response.data.result) {
      setHoliay(holiday_response.data.result);
      setPaginatin({
        skip: holiday_response.data.skip,
        take: holiday_response.data.take,
        total: holiday_response.data.total,
      });
    }
  };

  type GroupedByMonth = {
    month: string;
    data: holiday[];
  };

  function groupByMonth(data: holiday[]): GroupedByMonth[] {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const groupedData = data.reduce(
      (acc: Record<string, GroupedByMonth>, item: holiday) => {
        const monthIndex = item.date.getMonth();
        const monthName = months[monthIndex];

        // Check if the month group already exists, if not create it
        if (!acc[monthName]) {
          acc[monthName] = { month: monthName, data: [] };
        }

        // Add the item to the corresponding month group
        acc[monthName].data.push(item);

        return acc;
      },
      {}
    );

    // Convert the result to an array
    return Object.values(groupedData);
  }

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );

  return (
    <main className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50 to-indigo-50 p-4">
      <Drawer
        placement="right"
        closeIcon={null}
        onClose={() => {
          setAddBox(false);
        }}
        open={addBox}
      >
        <p className="text-lg text-left font-semibold text-gray-900">
          {holidayid ? "Update" : "Add"} Holiday
        </p>
        <HolidayMasterProvider
          userid={userid}
          id={holidayid}
          setAddBox={setAddBox}
          setHolidayid={setHolidayid}
          init={init}
        />
      </Drawer>

      {/* Header Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6">
        <div className="bg-linear-to-r from-blue-500 to-indigo-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-white rounded-full"></div>
              <h1 className="text-2xl font-bold text-white">Holiday List</h1>
            </div>
            {role != Role.USER && (
              <Button
                size="middle"
                type="primary"
                className="bg-white text-blue-600 hover:bg-gray-100"
                onClick={() => {
                  setHolidayid(undefined);
                  setAddBox(true);
                }}
              >
                Add Holiday
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-6">
          <Table className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <TableHeader>
              <TableRow className="bg-linear-to-r from-blue-50 to-indigo-50">
                <TableHead className="whitespace-nowrap border text-center w-1/3 p-3 font-semibold text-gray-900">
                  Date and Day
                </TableHead>
                <TableHead className="whitespace-nowrap border text-center w-1/3 p-3 font-semibold text-gray-900">
                  Description
                </TableHead>
                <TableHead className="whitespace-nowrap border text-center w-1/3 p-3 font-semibold text-gray-900">
                  State/Centre
                </TableHead>
              </TableRow>
            </TableHeader>
              <TableBody>
              {groupByMonth(holidaydata).map(
                (val: GroupedByMonth, index: number) => (
                  <>
                    <TableRow key={index}>
                      <TableCell
                        className="p-3 border bg-linear-to-r from-blue-100 to-indigo-100 px-4 text-left font-bold text-gray-900"
                        colSpan={3}
                      >
                        {val.month}
                      </TableCell>
                    </TableRow>
                    {val.data.map((val: holiday, index: number) => (
                      <TableRow key={index} className="hover:bg-blue-50 transition-colors">
                        <TableCell className="p-3 border text-center text-gray-900">
                          {format(val.date, "dd/LL/uuu, EEEE")}
                        </TableCell>
                        <TableCell className="p-3 border text-center font-medium text-gray-900">
                          {val.descrilption}
                        </TableCell>
                        <TableCell className="p-3 border text-center">
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                            {val.state}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                )
              )}
            </TableBody>
          </Table>
        </div>
        {/* Pagination Section */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
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
        </div>
      </div>
    </main>
  );
};

export default Refund;
