/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { MdiDownload } from "@/components/icons";
import { Radio, DatePicker, Select, Pagination } from "antd";

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
import { FormType, order_notice, user } from "@prisma/client";
import { capitalcase, formateDate, generatePDF } from "@/utils/methods";
import Link from "next/link";
import GetUser from "@/action/user/getuser";
import SearchNoticeOrder from "@/action/notice_order/searchordernotice";
const { RangePicker } = DatePicker;

const SupplierDetails = () => {
  const id: number = parseInt(getCookie("id") ?? "0");
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
    TIN,
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
      dept: user?.selectOffice!,
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

  const tinRef = useRef<InputRef>(null);

  const tinsearch = async () => {
    if (
      tinRef.current?.input?.value == undefined ||
      tinRef.current?.input?.value == null ||
      tinRef.current?.input?.value == ""
    ) {
      return toast.error("Enter Tin number");
    }
    const search_response = await SearchNoticeOrder({
      dept: user?.selectOffice!,
      tin: tinRef.current?.input?.value,
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
      return toast.error("Select Type.");
    }

    const search_response = await SearchNoticeOrder({
      dept: user?.selectOffice!,
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
      dept: user?.selectOffice!,
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

  const init = async () => {
    setLoading(true);

    const userrespone = await GetUser({ id: id });
    if (userrespone.status && userrespone.data) {
      setUpser(userrespone.data);

      const notice_response = await SearchNoticeOrder({
        dept: user?.selectOffice!,
        take: pagination.take,
        skip: pagination.skip,
      });
      if (notice_response.status && notice_response.data.result) {
        setNoticeData(notice_response.data.result);
        setPaginatin({
          skip: pagination.skip,
          take: pagination.take,
          total: notice_response.data.total,
        });
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

  const [noticeData, setNoticeData] = useState<order_notice[]>([]);
  const [user, setUpser] = useState<user | null>(null);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const userrespone = await GetUser({ id: id });
      if (userrespone.status && userrespone.data) {
        setUpser(userrespone.data);

        const notice_response = await SearchNoticeOrder({
          dept: user?.selectOffice!,
          take: pagination.take,
          skip: pagination.skip,
        });
        if (notice_response.status && notice_response.data.result) {
          setNoticeData(notice_response.data.result);
          setPaginatin({
            skip: pagination.skip,
            take: pagination.take,
            total: notice_response.data.total,
          });
        }

        setLoading(false);
      }
    };
    init();
  }, [id]);

  const onChangePageCount = async (page: number, pagesize: number) => {
    if (isSearch) {
      if (searchOption == SearchOption.TYPE) {
        if (formtype == null) {
          return toast.error("Select Type.");
        }
        const search_response = await SearchNoticeOrder({
          dept: user?.selectOffice!,

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
          dept: user?.selectOffice!,

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
      } else if (searchOption == SearchOption.TIN) {
        if (
          tinRef.current?.input?.value == undefined ||
          tinRef.current?.input?.value == null ||
          tinRef.current?.input?.value == ""
        ) {
          return toast.error("Enter Tin number");
        }
        const search_response = await SearchNoticeOrder({
          dept: user?.selectOffice!,
          tin: tinRef.current?.input?.value,
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
          dept: user?.selectOffice!,
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
      const search_response = await SearchNoticeOrder({
        dept: user?.selectOffice!,
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
      }
    }
  };
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
      <div className="p-3 py-2">
        <div className="bg-white p-2 shadow mt-4">
          <div className="bg-blue-500 p-2 text-white">
            List of Notices & Orders issued by Authorities
          </div>
          <div className="p-2 bg-gray-50 mt-2 flex gap-2">
            <Radio.Group
              onChange={onChange}
              value={searchOption}
              className="mt-2"
              disabled={isSearch}
            >
              <Radio value={SearchOption.TYPE}>Type</Radio>
              <Radio value={SearchOption.DATE}>Period</Radio>
              <Radio value={SearchOption.TIN}>TIN Number</Radio>
              <Radio value={SearchOption.ORDER}>Notice/Demand Order Id</Radio>
            </Radio.Group>
            {(() => {
              switch (searchOption) {
                case SearchOption.TYPE:
                  return (
                    <div className="flex gap-2">
                      <Select
                        showSearch
                        placeholder="Select Type"
                        optionFilterProp="label"
                        onChange={onFormType}
                        disabled={isSearch}
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

                      <Button
                        onClick={typesearch}
                        type="primary"
                        disabled={isSearch}
                      >
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
                      <RangePicker
                        onChange={onChangeDate}
                        disabled={isSearch}
                      />
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
                case SearchOption.TIN:
                  return (
                    <div className="flex gap-2">
                      <Input
                        className="w-60"
                        ref={tinRef}
                        placeholder={"Enter Tin Number"}
                        disabled={isSearch}
                      />

                      {isSearch ? (
                        <Button onClick={init} type="primary">
                          Reset
                        </Button>
                      ) : (
                        <Button onClick={tinsearch} type="primary">
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
                    <TableHead className="whitespace-nowrap text-center border p-2">
                      Issued By
                    </TableHead>
                    <TableHead className="text-center border p-2">
                      Type
                    </TableHead>
                    <TableHead className="text-center border p-2">
                      Notice/ Order Description
                    </TableHead>
                    <TableHead className="text-center border p-2">
                      Date of Issuance
                    </TableHead>
                    <TableHead className="text-center border p-2">
                      Due Date
                    </TableHead>
                    <TableHead className="text-center border p-2">
                      Amount of Demand
                    </TableHead>
                    <TableHead className="text-center border p-2">
                      Status
                    </TableHead>
                    <TableHead className="text-center border p-2">
                      Download
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {noticeData.map((val: order_notice, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="text-center border p-2">
                        <Link
                          href={getLink(val.form_type, val.id)}
                          className="text-blue-500"
                        >
                          {val.ref_no.toUpperCase()}
                        </Link>
                      </TableCell>
                      <TableCell className="text-center whitespace-nowrap  border p-2">
                        System Generated
                      </TableCell>
                      <TableCell className="text-center border p-2">
                        {capitalcase(val.notice_order_type)}
                      </TableCell>
                      <TableCell className="text-center border p-2">
                        {val.form_type}
                      </TableCell>
                      <TableCell className="text-center whitespace-nowrap border p-2">
                        {formateDate(val.issue_date)}
                      </TableCell>
                      <TableCell className="text-center whitespace-nowrap border p-2">
                        {formateDate(val.due_date)}
                      </TableCell>
                      <TableCell className="text-center border p-2">
                        {val.amount}
                      </TableCell>
                      <TableCell className="text-center border p-2">
                        {capitalcase(val.status)}
                      </TableCell>
                      <TableCell className="text-center text-blue-500 border p-2">
                        <MdiDownload
                          className="cursor-pointer"
                          onClick={async () => {
                            await downloadNoticeOrder(val.form_type, val.id);
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
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
