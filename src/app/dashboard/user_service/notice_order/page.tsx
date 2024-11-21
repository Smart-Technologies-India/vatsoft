/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { MdiDownload } from "@/components/icons";
import { Radio, DatePicker, Pagination, Select } from "antd";

import { Button, Input, InputRef, RadioChangeEvent } from "antd";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useRef, useState } from "react";
import { getCookie } from "cookies-next";
import { Dayjs } from "dayjs";
import { toast } from "react-toastify";
import { FormType, order_notice } from "@prisma/client";
import GetUserNotice from "@/action/notice_order/getusernotice";
import {
  capitalcase,
  encryptURLData,
  formateDate,
  generatePDF,
} from "@/utils/methods";
import Link from "next/link";
import SearchNoticeOrder from "@/action/notice_order/searchordernotice";
const { RangePicker } = DatePicker;

const SupplierDetails = () => {
  const current_user_id: number = parseInt(getCookie("id") ?? "0");
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
    TYPE,
    DATE,
    ORDER,
  }

  const [searchOption, setSeachOption] = useState<SearchOption>(
    SearchOption.TYPE
  );

  const onChange = (e: RadioChangeEvent) => {
    setSeachOption(e.target.value);
  };

  const [searchDate, setSearchDate] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);

  const onChangeDate = (
    dates: [Dayjs | null, Dayjs | null] | null,
    dateStrings: [string, string]
  ) => {
    setSearchDate(dates);
  };

  const [formtype, setFormtype] = useState<FormType | null>(null);

  const onFormType = (value: string) => {
    setFormtype(value as FormType);
  };

  const orderRef = useRef<InputRef>(null);

  const ordersearch = async () => {
    if (
      orderRef.current?.input?.value == undefined ||
      orderRef.current?.input?.value == null ||
      orderRef.current?.input?.value == ""
    ) {
      return toast.error("Enter Notice/Order id number");
    }
    const search_response = await SearchNoticeOrder({
      userid: current_user_id,
      order: orderRef.current?.input?.value,
      take: 10,
      skip: 0,
    });
    if (search_response.status && search_response.data.result) {
      setNoticeData(search_response.data.result);
      setPaginatin({
        skip: search_response.data.skip,
        take: search_response.data.take,
        total: search_response.data.total,
      });
      setSearch(true);
    }
  };

  const typesearch = async () => {
    if (formtype == null) {
      return toast.error("Select From Type.");
    }

    const search_response = await SearchNoticeOrder({
      userid: current_user_id,
      form_type: formtype,
      take: 10,
      skip: 0,
    });

    if (search_response.status && search_response.data.result) {
      setNoticeData(search_response.data.result);
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

    const search_response = await SearchNoticeOrder({
      userid: current_user_id,
      fromdate: searchDate[0]?.toDate(),
      todate: searchDate[1]?.toDate(),
      take: 10,
      skip: 0,
    });
    if (search_response.status && search_response.data.result) {
      setNoticeData(search_response.data.result);
      setPaginatin({
        skip: search_response.data.skip,
        take: search_response.data.take,
        total: search_response.data.total,
      });
      setSearch(true);
    }
  };

  const [noticeData, setNoticeData] = useState<order_notice[]>([]);

  const init = async () => {
    setLoading(true);

    const notice_respone = await GetUserNotice({
      userid: current_user_id,
      take: 10,
      skip: 0,
    });
    if (notice_respone.status && notice_respone.data.result) {
      setNoticeData(notice_respone.data.result);
      setPaginatin({
        skip: notice_respone.data.skip,
        take: notice_respone.data.take,
        total: notice_respone.data.total,
      });
    }
    setSearch(false);
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const notice_respone = await GetUserNotice({
        userid: current_user_id,
        take: pagination.take,
        skip: pagination.skip,
      });
      if (notice_respone.status && notice_respone.data.result) {
        setNoticeData(notice_respone.data.result);
        setPaginatin({
          skip: pagination.skip,
          take: pagination.take,
          total: notice_respone.data.total,
        });
      }
      setLoading(false);
    };
    init();
  }, [current_user_id]);
  const getLink = (type: FormType, id: number): string => {
    switch (type) {
      case FormType.DVAT10:
        return `/dashboard/returns/dvat10?id=${encryptURLData(id.toString())}`;
      case FormType.DVAT24:
        return `/dashboard/returns/dvat24?id=${encryptURLData(id.toString())}`;
      case FormType.DVAT24A:
        return `/dashboard/returns/dvat24a?id=${encryptURLData(id.toString())}`;
      default:
        return `/dashboard/returns/dvat10?id=${encryptURLData(id.toString())}`;
    }
  };

  const onChangePageCount = async (page: number, pagesize: number) => {
    if (isSearch) {
      if (searchOption == SearchOption.TYPE) {
        if (formtype == null) {
          return toast.error("Select Type.");
        }
        const search_response = await SearchNoticeOrder({
          userid: current_user_id,
          form_type: formtype,
          take: pagesize,
          skip: pagesize * (page - 1),
        });

        if (search_response.status && search_response.data.result) {
          setNoticeData(search_response.data.result);
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

        const search_response = await SearchNoticeOrder({
          userid: current_user_id,
          fromdate: searchDate[0]?.toDate(),
          todate: searchDate[1]?.toDate(),
          take: pagesize,
          skip: pagesize * (page - 1),
        });

        if (search_response.status && search_response.data.result) {
          setNoticeData(search_response.data.result);
          setPaginatin({
            skip: search_response.data.skip,
            take: search_response.data.take,
            total: search_response.data.total,
          });
          setSearch(true);
        }
      } else if (searchOption == SearchOption.ORDER) {
        if (
          orderRef.current?.input?.value == undefined ||
          orderRef.current?.input?.value == null ||
          orderRef.current?.input?.value == ""
        ) {
          return toast.error("Enter Notice/Order id number");
        }
        const search_response = await SearchNoticeOrder({
          userid: current_user_id,
          order: orderRef.current?.input?.value,
          take: pagesize,
          skip: pagesize * (page - 1),
        });

        if (search_response.status && search_response.data.result) {
          setNoticeData(search_response.data.result);
          setPaginatin({
            skip: search_response.data.skip,
            take: search_response.data.take,
            total: search_response.data.total,
          });
          setSearch(true);
        }
      }
    } else {
      const notice_respone = await GetUserNotice({
        userid: current_user_id,
        take: pagesize,
        skip: pagesize * (page - 1),
      });
      if (notice_respone.status && notice_respone.data.result) {
        setNoticeData(notice_respone.data.result);
        setPaginatin({
          skip: notice_respone.data.skip,
          take: notice_respone.data.take,
          total: notice_respone.data.total,
        });
      }
    }
  };

  const downloadNoticeOrder = async (type: FormType, id: number) => {
    switch (type) {
      case FormType.DVAT10:
        await generatePDF(`/dashboard/returns/dvat10?id=${id}&sidebar=no`);
        break;
      case FormType.DVAT24:
        await generatePDF(`/dashboard/returns/dvat24?id=${id}&sidebar=no`);
        break;
      case FormType.DVAT24A:
        await generatePDF(`/dashboard/returns/dvat24a?id=${id}&sidebar=no`);
        break;
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
      <div className="p-4">
        <div className="bg-white p-2 shadow mt-2">
          <div className="bg-blue-500 p-2 text-white">
            List of Notices & Orders issued by Authorities
          </div>
          <div className="p-2 bg-gray-50 mt-2 flex flex-col md:flex-row lg:gap-2 lg:items-center">
            <Radio.Group
              onChange={onChange}
              disabled={isSearch}
              className="mt-2"
              value={searchOption}
            >
              <Radio value={SearchOption.TYPE}>Type</Radio>
              <Radio value={SearchOption.DATE}>Period</Radio>
              <Radio value={SearchOption.ORDER}>Notice/Demand Order Id</Radio>
            </Radio.Group>
            <div className="mt-2"></div>
            {(() => {
              switch (searchOption) {
                case SearchOption.TYPE:
                  return (
                    <div className="flex gap-2">
                      <Select
                        disabled={isSearch}
                        showSearch
                        placeholder="Select Type"
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

                      {isSearch ? (
                        <Button onClick={init} type="primary">
                          Reset
                        </Button>
                      ) : (
                        <Button onClick={typesearch} type="primary">
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
                case SearchOption.ORDER:
                  return (
                    <div className="flex gap-2">
                      <Input
                        className="w-60"
                        ref={orderRef}
                        placeholder={"Enter Notice/Demand Order Id"}
                        disabled={isSearch}
                      />

                      {isSearch ? (
                        <Button onClick={init} type="primary">
                          Reset
                        </Button>
                      ) : (
                        <Button onClick={ordersearch} type="primary">
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

          <Table className="border mt-2">
            <TableHeader>
              <TableRow className="bg-gray-100 p-2">
                <TableHead className="border text-center">
                  Notice/Demand
                  <br /> Order Id
                </TableHead>
                <TableHead className="border whitespace-nowrap text-center  p-2">
                  Issued By
                </TableHead>
                <TableHead className="border text-center p-2">Type</TableHead>
                <TableHead className="border text-center p-2">
                  Notice/ Order Description
                </TableHead>
                <TableHead className="border text-center p-2">
                  Date of Issuance
                </TableHead>
                <TableHead className="border text-center p-2">
                  Due Date
                </TableHead>
                <TableHead className="border text-center p-2">
                  Amount of Demand
                </TableHead>
                <TableHead className="border text-center p-2">Status</TableHead>
                <TableHead className="border text-center p-2">
                  Download
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {noticeData.map((val: order_notice, index: number) => (
                <TableRow key={index}>
                  <TableCell className="p-2 border text-center">
                    <Link
                      href={getLink(val.form_type, val.id)}
                      className="text-blue-500"
                    >
                      {val.ref_no.toUpperCase()}
                    </Link>
                  </TableCell>
                  <TableCell className="p-2 border whitespace-nowrap text-center">
                    System Generated
                  </TableCell>
                  <TableCell className="p-2 border text-center">
                    {capitalcase(val.notice_order_type)}
                  </TableCell>
                  <TableCell className="p-2 border text-center">
                    {val.form_type}
                  </TableCell>
                  <TableCell className="p-2 border text-center">
                    {formateDate(val.issue_date)}
                  </TableCell>
                  <TableCell className="p-2 border whitespace-nowrap text-center">
                    {formateDate(val.due_date)}
                  </TableCell>
                  <TableCell className="p-2 border text-center">
                    {val.amount}
                  </TableCell>
                  <TableCell className="p-2 border text-center">
                    {capitalcase(val.status)}
                  </TableCell>
                  <TableCell className="p-2 border text-center text-blue-500">
                    {val.status == "PAID" && (
                      <MdiDownload
                        className="cursor-pointer"
                        onClick={async () => {
                          await downloadNoticeOrder(val.form_type, val.id);
                        }}
                      />
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
