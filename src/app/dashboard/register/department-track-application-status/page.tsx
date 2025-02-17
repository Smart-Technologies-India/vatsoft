/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { Button as ShButton } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Radio,
  DatePicker,
  RadioChangeEvent,
  InputRef,
  Button,
  Input,
  Pagination,
  Select,
} from "antd";
import { useEffect, useRef, useState } from "react";
const { RangePicker } = DatePicker;
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { composition, dvat04, registration, user } from "@prisma/client";
import { getCookie } from "cookies-next";
import { encryptURLData, formateDate } from "@/utils/methods";
import GetUser from "@/action/user/getuser";
import Link from "next/link";
import GetUserComposition from "@/action/composition/getusercompositon";
import GetAllDvatByDept from "@/action/register/getdvatbydept";
import { toast } from "react-toastify";

enum DataType {
  DVAT04 = "DVAT04",
  COMPOSITION = "COMPOSITION",
}
interface TableData {
  id: number;
  arn: string;
  type: DataType;
  description: string;
  submissionDate: string;
  status: string;
  assignedTo: string;
}

const TrackAppliation = () => {
  // search section start here
  const id: number = parseInt(getCookie("id") ?? "0");

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
    ARN,
    TYPE,
  }
  const [searchOption, setSeachOption] = useState<SearchOption>(
    SearchOption.ARN
  );

  const onChange = (e: RadioChangeEvent) => {
    setSeachOption(e.target.value);
  };

  const [isSearch, setSearch] = useState<boolean>(false);
  const arnRef = useRef<InputRef>(null);
  const [type, setType] = useState<DataType | null>(null);

  const onFormType = (value: string) => {
    setType(value as DataType);
  };

  const arnsearch = async () => {
    if (
      arnRef.current?.input?.value == undefined ||
      arnRef.current?.input?.value == null ||
      arnRef.current?.input?.value == ""
    ) {
      return toast.error("Enter arn number");
    }
    const search_response = data.filter(
      (val) => val.arn === arnRef.current?.input?.value
    );
    if (search_response.length > 0) {
      setShowData(search_response);
      setPaginatin({
        take: search_response.length,
        skip: 0,
        total: data.length,
      });
      setSearch(true);
    } else {
      toast.error("No record found");
    }
  };

  const typesearch = async () => {
    if (type == null) {
      return toast.error("Select Type.");
    }

    const search_response = data.filter((val) => val.type === type);

    if (search_response.length > 0) {
      setShowData(search_response);
      setPaginatin({
        take: search_response.length,
        skip: 0,
        total: data.length,
      });
      setSearch(true);
    } else {
      toast.error("No record found");
    }
  };

  const onChangePageCount = async (page: number, pagesize: number) => {
    if (isSearch) {
      if (searchOption == SearchOption.ARN) {
        if (
          arnRef.current?.input?.value == undefined ||
          arnRef.current?.input?.value == null ||
          arnRef.current?.input?.value == ""
        ) {
          return toast.error("Enter arn number");
        }

        const search_response = data.filter(
          (val) => val.arn === arnRef.current?.input?.value
        );

        if (search_response.length > 0) {
          setShowData(
            search_response.slice(pagesize * (page - 1), pagesize * page)
          );
          setPaginatin({
            skip: pagesize * (page - 1),
            take: pagesize,
            total: search_response.length,
          });
          setSearch(true);
        }
      } else if (searchOption == SearchOption.TYPE) {
        if (type == null) {
          return toast.error("Select Type.");
        }

        const search_response = data.filter((val) => val.type === type);

        if (search_response.length > 0) {
          setShowData(
            search_response.slice(pagesize * (page - 1), pagesize * page)
          );
          setPaginatin({
            skip: pagesize * (page - 1),
            take: pagesize,
            total: search_response.length,
          });
          setSearch(true);
        }
      }
    } else {
      const payment_data = data.slice(pagesize * (page - 1), pagesize * page);

      setShowData(payment_data);
      setPaginatin({
        skip: pagesize * (page - 1),
        take: pagesize,
        total: data.length,
      });
    }
  };

  // search section end here

  const [user, setUser] = useState<user>();
  const [dvatData, setDvatData] = useState<
    Array<dvat04 & { registration: Array<registration & { dept_user: user }> }>
  >([]);
  const [compdata, setCompData] = useState<
    Array<composition & { dept_user: user }>
  >([]);

  const [data, setData] = useState<TableData[]>([]);
  const [showdata, setShowData] = useState<TableData[]>([]);

  const init = async () => {
    const data: TableData[] = [];

    const userresponse = await GetUser({
      id: id,
    });

    if (userresponse.data && userresponse.status) {
      setUser(userresponse.data);
      const response = await GetAllDvatByDept({
        dept: userresponse.data.selectOffice!,
      });
      if (response.data && response.status) {
        setDvatData(response.data);
        response.data.forEach((val, index) => {
          data.push({
            id: val.id,
            arn: val.tempregistrationnumber ?? "",
            type: DataType.DVAT04,
            description: "Application For new Registration",
            submissionDate: formateDate(new Date(val.createdAt)),
            status: val.status,
            assignedTo: `${val.registration[0].dept_user.firstName} - ${val.registration[0].dept_user.lastName}`,
          });
        });
      }
    }

    const composition_response = await GetUserComposition({});
    if (composition_response.status && composition_response.data) {
      setCompData(composition_response.data);
      composition_response.data.forEach((val, index) => {
        data.push({
          id: val.id,
          arn: val.arn,
          type: DataType.COMPOSITION,
          description: val.compositionScheme
            ? "Migration to composition Scheme"
            : "Migration to regular scheme",
          submissionDate: formateDate(new Date(val.createdAt)),
          status: val.status,
          assignedTo: `${val.dept_user.firstName} - ${val.dept_user.lastName}`,
        });
      });
    }

    setData(data);

    setShowData(data.slice(0, pagination.take));
    setPaginatin({
      skip: 0,
      take: pagination.take,
      total: data.length,
    });
  };

  useEffect(() => {
    const init = async () => {
      const data: TableData[] = [];

      const userresponse = await GetUser({
        id: id,
      });

      if (userresponse.data && userresponse.status) {
        setUser(userresponse.data);
        const response = await GetAllDvatByDept({
          dept: userresponse.data.selectOffice!,
        });
        if (response.data && response.status) {
          setDvatData(response.data);
          const sortedData = response.data
            .map((val) => ({
              id: val.id,
              arn: val.tempregistrationnumber ?? "",
              type: DataType.DVAT04,
              description: "Application For new Registration",
              submissionDate: formateDate(new Date(val.createdAt)),
              status: val.status,
              assignedTo: `${val.registration[0].dept_user.firstName} - ${val.registration[0].dept_user.lastName}`,
            }))
            .sort((a, b) =>
              a.status === "PENDINGPROCESSING"
                ? -1
                : b.status === "PENDINGPROCESSING"
                ? 1
                : 0
            );

          data.push(...sortedData);
          // response.data.forEach((val, index) => {
          //   data.push({
          //     id: val.id,
          //     arn: val.tempregistrationnumber ?? "",
          //     type: DataType.DVAT04,
          //     description: "Application For new Registration",
          //     submissionDate: formateDate(new Date(val.createdAt)),
          //     status: val.status,
          //     assignedTo: `${val.registration[0].dept_user.firstName} - ${val.registration[0].dept_user.lastName}`,
          //   });
          // });
        }
      }

      const composition_response = await GetUserComposition({});
      if (composition_response.status && composition_response.data) {
        setCompData(composition_response.data);
        composition_response.data.forEach((val, index) => {
          data.push({
            id: val.id,
            arn: val.arn,
            type: DataType.COMPOSITION,
            description: val.compositionScheme
              ? "Migration to composition Scheme"
              : "Migration to regular scheme",
            submissionDate: formateDate(new Date(val.createdAt)),
            status: val.status,
            assignedTo: `${val.dept_user.firstName} - ${val.dept_user.lastName}`,
          });
        });
      }

      setData(data);
      setShowData(data.slice(0, pagination.take));
      setPaginatin({
        skip: 0,
        take: pagination.take,
        total: data.length,
      });
    };
    init();
  }, []);

  return (
    <>
      <div className="p-3 py-2">
        <div className="bg-white p-2 shadow mt-4">
          <div className="bg-blue-500 p-2 text-white flex">
            <p>Track Application Status</p>
            <div className="grow"></div>

            <Drawer>
              <DrawerTrigger>Info</DrawerTrigger>
              <DrawerContent>
                <DrawerHeader className="px-0 py-2">
                  <DrawerTitle>
                    <p className="w-5/6 mx-auto">Meaning of status</p>
                  </DrawerTitle>
                </DrawerHeader>
                <Table className="border mt-2 w-5/6 mx-auto">
                  <TableBody>
                    <TableRow>
                      <TableCell className="text-left w-60 p-2">
                        Pending for Processing
                      </TableCell>
                      <TableCell className="text-left p-2">
                        Application filed successfully. Pending with Tax Officer
                        for Processing.*
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-left w-60 p-2">
                        Pending for Clarification
                      </TableCell>
                      <TableCell className="text-left p-2">
                        Notice for seeking clarification issued by officer. File
                        Clarification within 7 working days of date of notice on
                        portal.
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-left w-60 p-2">
                        Clarification filed-Pending for Order
                      </TableCell>
                      <TableCell className="text-left p-2">
                        Clarification filed successfully by Applicant. Pending
                        with Tax Officer for Order.*
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-left w-60 p-2">
                        Clarification not filed Pending for Order
                      </TableCell>
                      <TableCell className="text-left p-2">
                        Clarification not filed by the Applicant. Pending with
                        Tax Officer for Rejection.*
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-left w-60 p-2">
                        Approved
                      </TableCell>
                      <TableCell className="text-left p-2">
                        Application is Approved. Registration ID and possward
                        emailed to Applicant.
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-left w-60 p-2">
                        Rejected
                      </TableCell>
                      <TableCell className="text-left p-2">
                        Application is Rejected by tax officer.
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-left w-60 p-2">
                        Withdrawn
                      </TableCell>
                      <TableCell className="text-left p-2">
                        Application is withdrawn by the Applicant/Tax payer.
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-left w-60 p-2">
                        Cancelled on Request of Taxpayer
                      </TableCell>
                      <TableCell className="text-left p-2">
                        Registration is cancelled on request to taxpayer.
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                <DrawerFooter>
                  <DrawerClose>
                    <ShButton variant="outline">Close</ShButton>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </div>

          <div className="p-2 bg-gray-50 mt-2 flex flex-col md:flex-row lg:gap-2 lg:items-center">
            <Radio.Group
              onChange={onChange}
              value={searchOption}
              disabled={isSearch}
            >
              <Radio value={SearchOption.ARN}>ARN</Radio>
              <Radio value={SearchOption.TYPE}>Form Type</Radio>
            </Radio.Group>

            {(() => {
              switch (searchOption) {
                case SearchOption.ARN:
                  return (
                    <div className="flex gap-2">
                      <Input
                        className="w-60"
                        ref={arnRef}
                        placeholder={"Enter ARN"}
                        disabled={isSearch}
                      />

                      {isSearch ? (
                        <Button onClick={init} type="primary">
                          Reset
                        </Button>
                      ) : (
                        <Button onClick={arnsearch} type="primary">
                          Search
                        </Button>
                      )}
                    </div>
                  );

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
                            value: DataType.DVAT04,
                            label: "DVAT04",
                          },
                          {
                            value: DataType.COMPOSITION,
                            label: "COMPOSITION",
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
                default:
                  return null;
              }
            })()}
          </div>
          {dvatData.length === 0 && compdata.length === 0 ? (
            <p className="bg-rose-500 bg-opacity-10 text-rose-500 mt-2 px-2 py-1 border border-rose-500">
              There is no record
            </p>
          ) : (
            <>
              <Table className="border mt-2">
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead className="whitespace-nowrap border">
                      ARN
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center border">
                      Form No.
                    </TableHead>
                    <TableHead className="text-center border">
                      Form Description
                    </TableHead>
                    <TableHead className="text-center border">
                      Submission Date
                    </TableHead>
                    <TableHead className="text-center border">Status</TableHead>
                    <TableHead className="text-center border">
                      Assigned To
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {showdata.map((val: TableData, index: number) => {
                    return (
                      <TableRow key={index}>
                        <TableCell className="text-center border">
                          {val.type === DataType.DVAT04 ? (
                            <Link
                              href={`/dashboard/register/${encryptURLData(
                                val.id.toString()
                              )}/preview/${encryptURLData(val.id.toString())}`}
                              className="text-blue-500"
                            >
                              {val.arn}
                            </Link>
                          ) : (
                            <Link
                              href={`/dashboard/register/composition-levy/${val.id}`}
                              className="text-blue-500"
                            >
                              {val.arn}
                            </Link>
                          )}
                        </TableCell>
                        <TableCell className="text-center border">
                          {val.type === DataType.DVAT04 ? "VAT-04" : "COMP"}
                        </TableCell>
                        <TableCell className="text-center border">
                          {val.description}
                        </TableCell>
                        <TableCell className="text-center border">
                          {val.submissionDate}
                        </TableCell>
                        <TableCell className="text-center border">
                          {val.status}
                        </TableCell>
                        <TableCell className="text-center border">
                          {val.assignedTo}
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {/* {dvatData.map((val: any, index: number) => {
                return (
                  <TableRow key={index}>
                    <TableCell className="text-center border">
                      <Link
                        href={`/dashboard/register/${encryptURLData(
                          val.id.toString()
                        )}/preview/${encryptURLData(
                          val.createdById.toString()
                        )}`}
                        className="text-blue-500"
                      >
                        {val.tempregistrationnumber}
                      </Link>
                    </TableCell>
                    <TableCell className="text-center border">VAT-04</TableCell>
                    <TableCell className="text-center border">
                      Application For new Registration
                    </TableCell>
                    <TableCell className="text-center border">
                      {formateDate(new Date(val.createdAt))}
                    </TableCell>
                    <TableCell className="text-center border">
                      {val.status}
                    </TableCell>
                    <TableCell className="text-center border">
                      {val.registration[0].dept_user.firstName} -{" "}
                      {val.registration[0].dept_user.lastName}
                    </TableCell>
                  </TableRow>
                );
              })}
              {compdata.map(
                (val: composition & { dept_user: user }, index: number) => {
                  return (
                    <TableRow key={index}>
                      <TableCell className="text-center border">
                        <Link
                          href={`/dashboard/register/composition-levy/${val.id}`}
                          className="text-blue-500"
                        >
                          {val.arn}
                        </Link>
                      </TableCell>
                      <TableCell className="text-center border">
                        {val.compositionScheme ? "COMP-IN" : "COMP-OUT"}
                      </TableCell>
                      <TableCell className="text-center border">
                        {val.compositionScheme
                          ? "Migration to composition Scheme"
                          : "Migration to regular scheme"}
                      </TableCell>
                      <TableCell className="text-center border">
                        {formateDate(new Date(val.createdAt))}
                      </TableCell>
                      <TableCell className="text-center border">
                        {val.status}
                      </TableCell>
                      <TableCell className="text-center border">
                        {val.dept_user.firstName ?? ""} -{" "}
                        {val.dept_user.lastName ?? ""}
                      </TableCell>
                    </TableRow>
                  );
                }
              )} */}
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

export default TrackAppliation;
