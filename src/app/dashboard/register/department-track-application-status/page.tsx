/* eslint-disable react-hooks/exhaustive-deps */
"use client";


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
  RadioChangeEvent,
  InputRef,
  Button,
  Input,
  Pagination,
  Select,
  Alert,
  Drawer,
} from "antd";
import { useEffect, useRef, useState } from "react";

import { user } from "@prisma/client";
import { encryptURLData, formateDate } from "@/utils/methods";
import GetUser from "@/action/user/getuser";
import Link from "next/link";
import { toast } from "react-toastify";
import TrackApplilcationStatus from "@/action/new/composition/trackapplicationstatus";
import {
  DvatTrackApplicationStatusType,
  TrackApplilcationStatusType,
} from "@/models/dashboard/regiser/track_application";
import DvatTrackApplicationStatus from "@/action/new/composition/dvattrackapplicationstatus";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import { useRouter } from "next/navigation";

enum DataType {
  DVAT04 = "DVAT04",
  COMPOSITION = "COMPOSITION",
}

interface TableData {
  id: number;
  arn: string;
  tinNumber: string;
  tradeName: string;
  type: DataType;
  description: string;
  submissionDate: string;
  status: string;
  assignedTo: string;
}

const TrackAppliation = () => {
  const router = useRouter();
  const [userid, setUserid] = useState<number>(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

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
    TRADENAME,
  }
  const [searchOption, setSeachOption] = useState<SearchOption>(
    SearchOption.ARN,
  );

  const onChange = (e: RadioChangeEvent) => {
    setSeachOption(e.target.value);
  };

  const [isSearch, setSearch] = useState<boolean>(false);
  const [searchTotal, setSearchTotal] = useState<number>(0);
  const arnRef = useRef<InputRef>(null);
  const tradeNameRef = useRef<InputRef>(null);
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

    const userresponse = await GetUser({
      id: userid,
    });

    if (userresponse.data && userresponse.status) {
      const response = await DvatTrackApplicationStatus({
        dept: userresponse.data.selectOffice!,
        searchArn: arnRef.current?.input?.value,
        take: 10,
        skip: 0,
      });

      if (response.data && response.status && response.data.length > 0) {
        const tableData: TableData[] = response.data.map((val) => ({
          id: val.id,
          arn: val.tempregistrationnumber ?? "",
          tinNumber: val.tinNumber ?? "-",
          tradeName: val.tradename ?? "-",
          type: DataType.DVAT04,
          description: "Application For new Registration",
          submissionDate: formateDate(new Date(val.createdAt)),
          status: val.status,
          assignedTo: `${val.registration[0].dept_user.firstName} - ${val.registration[0].dept_user.lastName}`,
        }));

        setShowData(tableData);
        setSearchTotal(10); // Server should return total count
        setPaginatin({
          take: 10,
          skip: 0,
          total: 10,
        });
        setSearch(true);
      } else {
        toast.error("No record found");
      }
    }
  };

  const typesearch = async () => {
    if (type == null) {
      return toast.error("Select Type.");
    }

    const search_response = data.filter((val) => val.type === type);

    if (search_response.length > 0) {
      setShowData(search_response.slice(0, 10));
      setSearchTotal(search_response.length);
      setPaginatin({
        take: 10,
        skip: 0,
        total: search_response.length,
      });
      setSearch(true);
    } else {
      toast.error("No record found");
    }
  };

  const tradeNameSearch = async () => {
    if (
      tradeNameRef.current?.input?.value == undefined ||
      tradeNameRef.current?.input?.value == null ||
      tradeNameRef.current?.input?.value == ""
    ) {
      return toast.error("Enter trade name");
    }

    const userresponse = await GetUser({
      id: userid,
    });

    if (userresponse.data && userresponse.status) {
      const response = await DvatTrackApplicationStatus({
        dept: userresponse.data.selectOffice!,
        searchTradeName: tradeNameRef.current?.input?.value,
        take: 10,
        skip: 0,
      });

      if (response.data && response.status && response.data.length > 0) {
        const tableData: TableData[] = response.data.map((val) => ({
          id: val.id,
          arn: val.tempregistrationnumber ?? "",
          tinNumber: val.tinNumber ?? "-",
          tradeName: val.tradename ?? "-",
          type: DataType.DVAT04,
          description: "Application For new Registration",
          submissionDate: formateDate(new Date(val.createdAt)),
          status: val.status,
          assignedTo: `${val.registration[0].dept_user.firstName} - ${val.registration[0].dept_user.lastName}`,
        }));

        setShowData(tableData);
        setSearchTotal(10);
        setPaginatin({
          take: 10,
          skip: 0,
          total: 10,
        });
        setSearch(true);
      } else {
        toast.error("No record found");
      }
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

        const userresponse = await GetUser({
          id: userid,
        });

        if (userresponse.data && userresponse.status) {
          const response = await DvatTrackApplicationStatus({
            dept: userresponse.data.selectOffice!,
            searchArn: arnRef.current?.input?.value,
            take: pagesize,
            skip: pagesize * (page - 1),
          });

          if (response.data && response.status) {
            const tableData: TableData[] = response.data.map((val) => ({
              id: val.id,
              arn: val.tempregistrationnumber ?? "",
              tinNumber: val.tinNumber ?? "-",
              tradeName: val.tradename ?? "-",
              type: DataType.DVAT04,
              description: "Application For new Registration",
              submissionDate: formateDate(new Date(val.createdAt)),
              status: val.status,
              assignedTo: `${val.registration[0].dept_user.firstName} - ${val.registration[0].dept_user.lastName}`,
            }));

            setShowData(tableData);
            setPaginatin({
              skip: pagesize * (page - 1),
              take: pagesize,
              total: searchTotal,
            });
          }
        }
      } else if (searchOption == SearchOption.TYPE) {
        const search_response = data.filter((val) => val.type === type);

        if (search_response.length > 0) {
          setShowData(
            search_response.slice(pagesize * (page - 1), pagesize * page),
          );
          setPaginatin({
            skip: pagesize * (page - 1),
            take: pagesize,
            total: search_response.length,
          });
          setSearch(true);
        }
      } else if (searchOption == SearchOption.TRADENAME) {
        if (
          tradeNameRef.current?.input?.value == undefined ||
          tradeNameRef.current?.input?.value == null ||
          tradeNameRef.current?.input?.value == ""
        ) {
          return toast.error("Enter trade name");
        }

        const userresponse = await GetUser({
          id: userid,
        });

        if (userresponse.data && userresponse.status) {
          const response = await DvatTrackApplicationStatus({
            dept: userresponse.data.selectOffice!,
            searchTradeName: tradeNameRef.current?.input?.value,
            take: pagesize,
            skip: pagesize * (page - 1),
          });

          if (response.data && response.status) {
            const tableData: TableData[] = response.data.map((val) => ({
              id: val.id,
              arn: val.tempregistrationnumber ?? "",
              tinNumber: val.tinNumber ?? "-",
              tradeName: val.tradename ?? "-",
              type: DataType.DVAT04,
              description: "Application For new Registration",
              submissionDate: formateDate(new Date(val.createdAt)),
              status: val.status,
              assignedTo: `${val.registration[0].dept_user.firstName} - ${val.registration[0].dept_user.lastName}`,
            }));

            setShowData(tableData);
            setPaginatin({
              skip: pagesize * (page - 1),
              take: pagesize,
              total: searchTotal,
            });
          }
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
    Array<DvatTrackApplicationStatusType>
  >([]);
  const [compdata, setCompData] = useState<Array<TrackApplilcationStatusType>>(
    [],
  );

  const [data, setData] = useState<TableData[]>([]);
  const [showdata, setShowData] = useState<TableData[]>([]);

  const statusSortPriority = (status: string) => {
    if (status === "PENDING" || status === "PENDINGPROCESSING") return 0;
    if (status === "COMPLETED" || status === "APPROVED") return 2;
    return 1;
  };

  const init = async () => {
    const data: TableData[] = [];
    setSearch(false);

    const userresponse = await GetUser({
      id: userid,
    });

    if (userresponse.data && userresponse.status) {
      setUser(userresponse.data);
      const response = await DvatTrackApplicationStatus({
        dept: userresponse.data.selectOffice!,
      });
      if (response.data && response.status) {
        setDvatData(response.data);
        response.data.forEach((val, index) => {
          data.push({
            id: val.id,
            arn: val.tempregistrationnumber ?? "",
            tinNumber: val.dvat04?.tinNumber ?? "-",
            tradeName: val.dvat04?.tradename ?? "-",
            type: DataType.DVAT04,
            description: "Application For new Registration",
            submissionDate: formateDate(new Date(val.createdAt)),
            status: val.status,
            assignedTo: `${val.registration[0].dept_user.firstName} - ${val.registration[0].dept_user.lastName}`,
          });
        });
      }
    }

    const composition_response = await TrackApplilcationStatus({});
    if (composition_response.status && composition_response.data) {
      setCompData(composition_response.data);
      composition_response.data.forEach((val, index) => {
        data.push({
          id: val.id,
          arn: val.arn,
          tinNumber: val.dvat?.tinNumber ?? "-",
          tradeName: val.dvat?.tradename ?? "-",
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

    data.sort(
      (a, b) => statusSortPriority(a.status) - statusSortPriority(b.status),
    );

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
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
      setUserid(authResponse.data);

      const userresponse = await GetUser({
        id: authResponse.data,
      });

      if (userresponse.data && userresponse.status) {
        setUser(userresponse.data);
        const response = await DvatTrackApplicationStatus({
          dept: userresponse.data.selectOffice!,
        });
        if (response.data && response.status) {
          setDvatData(response.data);
          const sortedData = response.data
            .map((val) => ({
              id: val.id,
              arn: val.tempregistrationnumber ?? "",
              tinNumber: val.dvat04?.tinNumber ?? "-",
              tradeName: val.dvat04?.tradename ?? "-",
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
                  : 0,
            );

          data.push(...sortedData);
        }
      }

      const composition_response = await TrackApplilcationStatus({});
      if (composition_response.status && composition_response.data) {
        setCompData(composition_response.data);
        composition_response.data.forEach((val, index) => {
          data.push({
            id: val.id,
            arn: val.arn,
            tinNumber: val.dvat?.tinNumber ?? "-",
            tradeName: val.dvat?.tradename ?? "-",
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

      data.sort((a, b) => {
        const getPriority = (status: string) => {
          if (status === "PENDING" || status === "PENDINGPROCESSING") return 0;
          if (status === "COMPLETED" || status === "APPROVED") return 2;
          return 1;
        };
        return getPriority(a.status) - getPriority(b.status);
      });

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
          <div className="bg-blue-500 p-2 text-white flex justify-between items-center">
            <p>Track Application Status</p>
            <Button
              type="primary"
              onClick={() => setIsDrawerOpen(true)}
            >
              ℹ️ Info
            </Button>
          </div>

          <Drawer
            title="Meaning of status"
            onClose={() => setIsDrawerOpen(false)}
            open={isDrawerOpen}
            width={1000}
          >
            <Table className="border">
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
          </Drawer>

          <div className="p-2 bg-gray-50 mt-2 flex flex-col md:flex-row lg:gap-2 lg:items-center">
            <Radio.Group
              onChange={onChange}
              value={searchOption}
              disabled={isSearch}
            >
              <Radio value={SearchOption.ARN}>ARN</Radio>
              <Radio value={SearchOption.TYPE}>Form Type</Radio>
              <Radio value={SearchOption.TRADENAME}>Trade Name</Radio>
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

                case SearchOption.TRADENAME:
                  return (
                    <div className="flex gap-2">
                      <Input
                        className="w-60"
                        ref={tradeNameRef}
                        placeholder={"Enter Trade Name"}
                        disabled={isSearch}
                      />

                      {isSearch ? (
                        <Button onClick={init} type="primary">
                          Reset
                        </Button>
                      ) : (
                        <Button onClick={tradeNameSearch} type="primary">
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
          {dvatData.length === 0 && compdata.length === 0 ? (
            <Alert
              style={{
                marginTop: "10px",
                padding: "8px",
              }}
              type="error"
              showIcon
              description="There is no record."
            />
          ) : (
            <>
              <Table className="border mt-2">
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead className="whitespace-nowrap border">
                      ARN
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center border">
                      TIN Number
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center border">
                      Trade Name
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
                                val.id.toString(),
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
                          {val.tinNumber}
                        </TableCell>
                        <TableCell className="text-center border">
                          {val.tradeName}
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
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              val.status === "PENDING" ||
                              val.status === "PENDINGPROCESSING"
                                ? "bg-yellow-100 text-yellow-800"
                                : val.status === "COMPLETED" ||
                                    val.status === "APPROVED"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {val.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-center border">
                          {val.assignedTo}
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
