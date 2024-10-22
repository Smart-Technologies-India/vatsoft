/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import {
  GgInfo,
  MaterialSymbolsClose,
  MdiDownload,
  TablerRefresh,
} from "@/components/icons";
import { Radio, DatePicker, Select } from "antd";

import { Button, Input, InputRef, RadioChangeEvent } from "antd";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useActionState,
  useEffect,
  useOptimistic,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { getCookie } from "cookies-next";
import { Dayjs } from "dayjs";
import { toast } from "react-toastify";
import { FormType, order_notice, user } from "@prisma/client";
// import GetAllNotice from "@/action/notice_order/getallnotice";
import { capitalcase, formateDate } from "@/utils/methods";
import Link from "next/link";
import GetDeptNotice from "@/action/notice_order/getdeptnotice";
import GetUser from "@/action/user/getuser";
import SearchNoticeOrder from "@/action/notice_order/searchordernotice";
const { RangePicker } = DatePicker;

const SupplierDetails = () => {
  const router = useRouter();

  const id: number = parseInt(getCookie("id") ?? "0");
  const [isLoading, setLoading] = useState<boolean>(true);
  const [isSearch, setSearch] = useState<boolean>(false);

  enum SearchOption {
    TYPE,
    DATE,
  }

  const [searchOption, setSeachOption] = useState<SearchOption>(
    SearchOption.TYPE
  );

  const onChange = (e: RadioChangeEvent) => {
    setSeachOption(e.target.value);
  };

  // const typeRef = useRef<InputRef>(null);

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

    const userrespone = await GetUser({ id: id });
    if (userrespone.status && userrespone.data) {
      setUpser(userrespone.data);

      const notice_respone = await GetDeptNotice({
        dept: user?.selectOffice!,
      });

      if (notice_respone.status && notice_respone.data) {
        setNoticeData(notice_respone.data);
      }
      setLoading(false);
    }
    setSearch(false);
    setLoading(false);
  };

  const [formtype, setFormtype] = useState<FormType | null>(null);

  const onFormType = (value: string) => {
    setFormtype(value as FormType);
  };

  const typesearch = async () => {
    if (formtype == null) {
      return toast.error("Select From Type.");
    }
    const search_response = await SearchNoticeOrder({
      dept: user?.selectOffice!,
      form_type: formtype,
    });
    if (search_response.status && search_response.data) {
      setNoticeData(search_response.data);
      setSearch(true);
    }
  };

  const datesearch = async () => {
    if (searchDate == null || searchDate.length <= 1) {
      return toast.error("Select state date and end date");
    }

    const search_response = await SearchNoticeOrder({
      fromdate: searchDate[0]?.toDate(),
      todate: searchDate[1]?.toDate(),
      dept: user?.selectOffice!,
    });
    if (search_response.status && search_response.data) {
      setNoticeData(search_response.data);
      setSearch(true);
    }
  };

  const [noticeData, setNoticeData] = useState<order_notice[]>([]);
  const [user, setUpser] = useState<user | null>(null);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const userrespone = await GetUser({ id: id });
      if (userrespone.status && userrespone.data) {
        setUpser(userrespone.data);

        const notice_respone = await GetDeptNotice({
          dept: user?.selectOffice!,
        });

        if (notice_respone.status && notice_respone.data) {
          setNoticeData(notice_respone.data);
        }
        setLoading(false);
      }
    };
    init();
  }, [id]);
  const getLink = (type: FormType, id: number): string => {
    switch (type) {
      case FormType.DVAT10:
        return `/dashboard/returns/dvat10?id=${id}`;
      case FormType.DVAT24:
        return `/dashboard/returns/dvat24?id=${id}`;
      case FormType.DVAT24A:
        return `/dashboard/returns/dvat24a?id=${id}`;
      default:
        return `/dashboard/returns/dvat10?id=${id}`;
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
      <div className="p-6">
        <div className="bg-white p-2 shadow mt-4">
          <div className="bg-blue-500 p-2 text-white">Notices and Orders</div>
          <div className="p-2 bg-gray-50 mt-2">
            <Radio.Group
              onChange={onChange}
              value={searchOption}
              className="mt-2"
            >
              <Radio value={SearchOption.TYPE}>Type</Radio>
              <Radio value={SearchOption.DATE}>Period</Radio>
            </Radio.Group>
            <div className="mt-2"></div>
            {(() => {
              switch (searchOption) {
                case SearchOption.TYPE:
                  return (
                    <div className="flex gap-2">
                      <Select
                        showSearch
                        placeholder="Select From Type"
                        optionFilterProp="label"
                        onChange={onFormType}
                        options={[
                          {
                            value: FormType.DVAT10,
                            label: "DVAT 10",
                          },
                          {
                            value: FormType.DVAT24,
                            label: "DVAT24",
                          },
                          {
                            value: FormType.DVAT24A,
                            label: "DVAT 24A",
                          },
                        ]}
                      />

                      <Button onClick={typesearch} type="primary">
                        Search
                      </Button>
                      {isSearch && (
                        <Button onClick={init} type="primary">
                          Reset
                        </Button>
                      )}
                    </div>
                  );

                case SearchOption.DATE:
                  return (
                    <div className="flex gap-2">
                      <RangePicker onChange={onChangeDate} />
                      <Button type="primary" onClick={datesearch}>
                        Search
                      </Button>
                      {isSearch && (
                        <Button onClick={init} type="primary">
                          Reset
                        </Button>
                      )}
                    </div>
                  );
                default:
                  return null;
              }
            })()}
          </div>
          <p className="text-sm mt-2">
            List of Notices & Orders issued by Authorities
          </p>
          {noticeData.length == 0 ? (
            <>
              <div className="text-rose-400 bg-rose-500 bg-opacity-10 border border-rose-300 mt-2 text-sm p-2 flex gap-2 items-center">
                <p className="flex-1">There is no Notice and Order.</p>
              </div>
            </>
          ) : (
            <>
              <Table className="border mt-2">
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead className="">Notice/Demand Order Id</TableHead>
                    <TableHead className="whitespace-nowrap text-center">
                      Issued By
                    </TableHead>
                    <TableHead className="text-center">Type</TableHead>
                    <TableHead className="text-center">
                      Notice/ Order Description
                    </TableHead>
                    <TableHead className="text-center">
                      Date of Issuance
                    </TableHead>
                    <TableHead className="text-center">Due Date</TableHead>
                    <TableHead className="text-center">
                      Amount of Demand
                    </TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Download</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {noticeData.map((val: order_notice, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="text-center">
                        <Link
                          href={getLink(val.form_type, val.id)}
                          className="text-blue-500"
                        >
                          {val.ref_no.toUpperCase()}
                        </Link>
                      </TableCell>
                      <TableCell className="text-center">
                        System Generated
                      </TableCell>
                      <TableCell className="text-center">
                        {capitalcase(val.notice_order_type)}
                      </TableCell>
                      <TableCell className="text-center">
                        {val.form_type}
                      </TableCell>
                      <TableCell className="text-center">
                        {formateDate(val.issue_date)}
                      </TableCell>
                      <TableCell className="text-center">
                        {formateDate(val.due_date)}
                      </TableCell>
                      <TableCell className="text-center">
                        {val.amount}
                      </TableCell>
                      <TableCell className="text-center">
                        {" "}
                        {capitalcase(val.status)}
                      </TableCell>
                      <TableCell className="text-center text-blue-500">
                        <MdiDownload />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
          {/* <div className="flex mt-2 gap-2">
            <div className="grow"></div>
            <Button
              onClick={(e) => {
                e.preventDefault();
                router.back();
              }}
              type="default"
            >
              Back
            </Button>
          </div> */}
        </div>
      </div>
    </>
  );
};

export default SupplierDetails;
