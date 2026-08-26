"use client";
import { Alert, Button, Input, Pagination, Modal, Form, Space } from "antd";
import { EditOutlined } from "@ant-design/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { InputRef, RadioChangeEvent } from "antd";
import { Radio } from "antd";
import { useEffect, useRef, useState } from "react";
import type { Dayjs } from "dayjs";

import { cform, dvat04 } from "@prisma/client";
import { capitalcase, encryptURLData } from "@/utils/methods";
import Link from "next/link";
import { toast } from "react-toastify";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import GetUserCform from "@/action/cform/getusercform";
import {
  GetCFormReturnsEntries,
  UpdateReturnEntryDescription,
} from "@/action/cform/getcformreturns";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import { useRouter } from "next/navigation";

const TrackAppliation = () => {
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
    NAME,
    TIN,
  }
  const [searchOption, setSeachOption] = useState<SearchOption>(
    SearchOption.TIN,
  );

  const onChange = (e: RadioChangeEvent) => {
    setSeachOption(e.target.value);
  };

  const [searchDate, setSearchDate] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);

  const onChangeDate = (
    dates: [Dayjs | null, Dayjs | null] | null,
    dateStrings: [string, string],
  ) => {
    setSearchDate(dates);
  };

  const [cformData, setCformData] = useState<Array<cform>>([]);
  const [dvatdata, setDvatData] = useState<dvat04 | null>(null);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [selectedCForm, setSelectedCForm] = useState<cform | null>(null);
  const [returnsEntries, setReturnsEntries] = useState<any[]>([]);
  const [isLoadingModal, setIsLoadingModal] = useState<boolean>(false);
  const [editingEntries, setEditingEntries] = useState<{ [key: number]: string }>({});
  const [form] = Form.useForm();

  const init = async () => {
    setLoading(true);
    const dvat_response = await GetUserDvat04();

    if (dvat_response.data && dvat_response.status) {
      setDvatData(dvat_response.data);
      const cform_data = await GetUserCform({
        dvatid: dvat_response.data.id,
        take: 10,
        skip: 0,
      });

      if (cform_data.status && cform_data.data.result) {
        setCformData(cform_data.data.result);
        setPaginatin({
          skip: cform_data.data.skip,
          take: cform_data.data.take,
          total: cform_data.data.total,
        });
      }
    }

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
      const dvat_response = await GetUserDvat04();

      if (dvat_response.data && dvat_response.status) {
        setDvatData(dvat_response.data);
        const cform_data = await GetUserCform({
          dvatid: dvat_response.data.id,
          take: 10,
          skip: 0,
        });

        if (cform_data.status && cform_data.data.result) {
          setCformData(cform_data.data.result);
          setPaginatin({
            skip: cform_data.data.skip,
            take: cform_data.data.take,
            total: cform_data.data.total,
          });
        }
      }

      setLoading(false);
    };
    init();
  }, [userid, router]);

  const get_years = (month: string, year: string): string => {
    const monthNames = [
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
    const monthIndex = monthNames.indexOf(capitalcase(month));
    const yearNum = parseInt(year, 10);

    // If the month is between September (index 8) and March (index 2), return year-year+1
    if (monthIndex >= 8) {
      // September to December
      return `${yearNum}-${yearNum + 1}`;
    } else {
      // January to April
      return `${yearNum - 1}-${yearNum}`;
    }
  };

  const get_month = (composition: boolean, month: string): string => {
    if (composition) {
      if (["January", "February", "March"].includes(capitalcase(month))) {
        return "March";
      } else if (["April", "May", "June"].includes(capitalcase(month))) {
        return "June";
      } else if (["July", "August", "September"].includes(capitalcase(month))) {
        return "September";
      } else if (
        ["October", "November", "December"].includes(capitalcase(month))
      ) {
        return "December";
      } else {
        return "March";
      }
    } else {
      return month;
    }
  };

  const tinRef = useRef<InputRef>(null);
  const nameRef = useRef<InputRef>(null);

  const tinsearch = async () => {
    if (!dvatdata) return;
    if (
      tinRef.current?.input?.value == undefined ||
      tinRef.current?.input?.value == null ||
      tinRef.current?.input?.value == ""
    ) {
      return toast.error("Enter Terminal TIN number");
    }
    const search_response = await GetUserCform({
      dvatid: dvatdata.id,
      tin: tinRef.current?.input?.value,
      take: 10,
      skip: 0,
    });
    if (search_response.status && search_response.data.result) {
      setCformData(search_response.data.result);
      setPaginatin({
        skip: search_response.data.skip,
        take: search_response.data.take,
        total: search_response.data.total,
      });
      setSearch(true);
    }
  };

  const namesearch = async () => {
    if (!dvatdata) return;

    if (
      nameRef.current?.input?.value == undefined ||
      nameRef.current?.input?.value == null ||
      nameRef.current?.input?.value == ""
    ) {
      return toast.error("Enter Terminal Name");
    }
    const search_response = await GetUserCform({
      name: nameRef.current?.input?.value,
      dvatid: dvatdata.id,
      take: 10,
      skip: 0,
    });
    if (search_response.status && search_response.data.result) {
      setCformData(search_response.data.result);
      setPaginatin({
        skip: search_response.data.skip,
        take: search_response.data.take,
        total: search_response.data.total,
      });
      setSearch(true);
    }
  };

  const onChangePageCount = async (page: number, pagesize: number) => {
    if (!dvatdata) return;
    if (isSearch) {
      if (searchOption == SearchOption.TIN) {
        if (
          tinRef.current?.input?.value == undefined ||
          tinRef.current?.input?.value == null ||
          tinRef.current?.input?.value == ""
        ) {
          return toast.error("Enter Terminal TIN number");
        }
        const search_response = await GetUserCform({
          dvatid: dvatdata.id,
          tin: tinRef.current?.input?.value,
          take: 10,
          skip: 0,
        });
        if (search_response.status && search_response.data.result) {
          setCformData(search_response.data.result);
          setPaginatin({
            skip: search_response.data.skip,
            take: search_response.data.take,
            total: search_response.data.total,
          });
          setSearch(true);
        }
      } else if (searchOption == SearchOption.NAME) {
        if (
          nameRef.current?.input?.value == undefined ||
          nameRef.current?.input?.value == null ||
          nameRef.current?.input?.value == ""
        ) {
          return toast.error("Enter Terminal Name");
        }
        const search_response = await GetUserCform({
          name: nameRef.current?.input?.value,
          dvatid: dvatdata.id,
          take: 10,
          skip: 0,
        });
        if (search_response.status && search_response.data.result) {
          setCformData(search_response.data.result);
          setPaginatin({
            skip: search_response.data.skip,
            take: search_response.data.take,
            total: search_response.data.total,
          });
          setSearch(true);
        }
      }
    } else {
      const cform_data = await GetUserCform({
        dvatid: dvatdata.id,
        take: pagesize,
        skip: pagesize * (page - 1),
      });

      if (cform_data.status && cform_data.data.result) {
        setCformData(cform_data.data.result);
        setPaginatin({
          skip: cform_data.data.skip,
          take: cform_data.data.take,
          total: cform_data.data.total,
        });
      }
    }
  };

  function getMonthRange(date: Date): string {
    // Calculate the last month
    const lastMonth = new Date(date.getFullYear(), date.getMonth(), 1);

    // Calculate the start month (last month - 2 months)
    const startMonth = new Date(
      lastMonth.getFullYear(),
      lastMonth.getMonth() - 2,
      1,
    );

    // Helper function to format month names and last two digits of year
    const formatMonthYear = (date: Date): string => {
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear().toString().slice(-2); // Get last two digits of year
      return `${month} ${year}`;
    };

    // Format the range
    const start = formatMonthYear(startMonth);
    const end = formatMonthYear(lastMonth);

    return `${start} to ${end}`;
  }

  const handleEditClick = async (cformRow: cform) => {
    setSelectedCForm(cformRow);
    setIsLoadingModal(true);
    setIsModalVisible(true);

    try {
      const response = await GetCFormReturnsEntries(cformRow.id);
      if (response.status && response.data) {
        setReturnsEntries(response.data);
        const initialValues: { [key: number]: string } = {};
        response.data.forEach((entry: any) => {
          initialValues[entry.id] =
            entry.description_of_goods || "";
        });
        setEditingEntries(initialValues);
      } else {
        toast.error(response.message || "Failed to fetch returns entries");
      }
    } catch (error: any) {
      toast.error("Error fetching returns entries");
      console.error(error);
    } finally {
      setIsLoadingModal(false);
    }
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedCForm(null);
    setReturnsEntries([]);
    setEditingEntries({});
  };

  const handleSaveDescription = async (cformReturnsId: number) => {
    const description = editingEntries[cformReturnsId] || "";
    setIsLoadingModal(true);

    try {
      const response = await UpdateReturnEntryDescription(
        cformReturnsId,
        description
      );
      if (response.status) {
        toast.success("Description updated successfully");
        // Update local state
        const updatedEntries = returnsEntries.map((entry: any) =>
          entry.id === cformReturnsId
            ? {
                ...entry,
                description_of_goods: description,
              }
            : entry
        );
        setReturnsEntries(updatedEntries);
      } else {
        toast.error(response.message || "Failed to update description");
      }
    } catch (error: any) {
      toast.error("Error updating description");
      console.error(error);
    } finally {
      setIsLoadingModal(false);
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
      <main className="p-3 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm mb-3">
            <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
              <div>
                <h1 className="text-lg font-medium text-gray-900">
                  Track C-Form
                </h1>
                <p className="text-xs text-gray-500 mt-1">
                  View and track all your C-Form declarations and submissions
                </p>
              </div>
              <div className="grow"></div>
              {isSearch && (
                <Button
                  size="small"
                  type="default"
                  onClick={init}
                >
                  Clear Filter
                </Button>
              )}
            </div>
          </div>

          {cformData.length == 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <Alert
                type="info"
                showIcon
                title="No C-Forms Found"
                description="There are no C-Form declarations available."
              />
            </div>
          )}

          {cformData.length != 0 && (
            <>
              {/* Search and Filter Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-3">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                      Search by:
                    </span>
                    <Radio.Group
                      onChange={onChange}
                      value={searchOption}
                      disabled={isSearch}
                      className="flex gap-4"
                    >
                      <Radio value={SearchOption.TIN}>
                        <span className="text-sm">TIN Number</span>
                      </Radio>
                      <Radio value={SearchOption.NAME}>
                        <span className="text-sm">Terminal Name</span>
                      </Radio>
                    </Radio.Group>
                  </div>

                  <div className="flex gap-2 items-end flex-wrap">
                    {(() => {
                      switch (searchOption) {
                        case SearchOption.TIN:
                          return (
                            <div className="flex gap-2 flex-1 min-w-[250px]">
                              <Input
                                size="small"
                                maxLength={11}
                                ref={tinRef}
                                placeholder="Enter Terminal TIN Number"
                                disabled={isSearch}
                              />
                              {isSearch ? (
                                <Button
                                  size="small"
                                  onClick={init}
                                  type="primary"
                                >
                                  Reset
                                </Button>
                              ) : (
                                <Button
                                  size="small"
                                  onClick={tinsearch}
                                  type="primary"
                                >
                                  Search
                                </Button>
                              )}
                            </div>
                          );

                        case SearchOption.NAME:
                          return (
                            <div className="flex gap-2 flex-1 min-w-[250px]">
                              <Input
                                size="small"
                                ref={nameRef}
                                placeholder="Enter Terminal Name"
                                disabled={isSearch}
                              />
                              {isSearch ? (
                                <Button
                                  size="small"
                                  onClick={init}
                                  type="primary"
                                >
                                  Reset
                                </Button>
                              ) : (
                                <Button
                                  size="small"
                                  onClick={namesearch}
                                  type="primary"
                                >
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
                </div>
              </div>

              {/* Results Table Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-center border border-gray-200 p-3 text-xs font-semibold text-gray-700 whitespace-nowrap">
                          ARN
                        </TableHead>
                        <TableHead className="text-center border border-gray-200 p-3 text-xs font-semibold text-gray-700 whitespace-nowrap">
                          C-Form Type
                        </TableHead>
                        <TableHead className="text-center border border-gray-200 p-3 text-xs font-semibold text-gray-700 whitespace-nowrap">
                          Form Period
                        </TableHead>
                        <TableHead className="text-center border border-gray-200 p-3 text-xs font-semibold text-gray-700 whitespace-nowrap">
                          TIN Number
                        </TableHead>
                        <TableHead className="text-center border border-gray-200 p-3 text-xs font-semibold text-gray-700 whitespace-nowrap">
                          Terminal Name
                        </TableHead>
                        <TableHead className="text-center border border-gray-200 p-3 text-xs font-semibold text-gray-700 whitespace-nowrap">
                          Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cformData.map((val: cform, index: number) => (
                        <TableRow
                          key={index}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <TableCell className="border border-gray-200 text-center p-3 text-xs">
                            <Link
                              href={`/dashboard/cform/${encryptURLData(
                                val.id.toString(),
                              )}`}
                              className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                            >
                              {val.sr_no}
                            </Link>
                          </TableCell>
                          <TableCell className="border border-gray-200 text-center p-3 text-xs text-gray-700">
                            {val.cform_type}
                          </TableCell>
                          <TableCell className="border border-gray-200 text-center p-3 text-xs text-gray-700">
                            {getMonthRange(val.to_period)}
                          </TableCell>
                          <TableCell className="border border-gray-200 text-center p-3 text-xs font-medium text-gray-900">
                            {val.seller_tin_no}
                          </TableCell>
                          <TableCell className="border border-gray-200 text-center p-3 text-xs text-gray-700">
                            {val.seller_name}
                          </TableCell>
                          <TableCell className="border border-gray-200 text-center p-3 text-xs">
                            <Button
                              type="primary"
                              size="small"
                              icon={<EditOutlined />}
                              onClick={() => handleEditClick(val)}
                            >
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination Section */}
                <div className="bg-gray-50 border-t border-gray-200 p-3">
                  <div className="lg:hidden">
                    <Pagination
                      align="center"
                      defaultCurrent={1}
                      onChange={onChangePageCount}
                      showSizeChanger
                      size="small"
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
                      pageSizeOptions={[10, 20, 50, 100]}
                      total={pagination.total}
                      responsive={true}
                      size="small"
                      showTotal={(total: number, range: number[]) =>
                        `${range[0]}-${range[1]} of ${total} items`
                      }
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Edit Returns Entry Modal */}
      <Modal
        title={`Edit Returns Entry Descriptions - ${selectedCForm?.sr_no || ""}`}
        open={isModalVisible}
        onCancel={handleModalClose}
        width={1000}
        footer={[
          <Button key="close" onClick={handleModalClose}>
            Close
          </Button>,
        ]}
        loading={isLoadingModal}
      >
        <div className="mt-4">
          {returnsEntries.length === 0 ? (
            <Alert
              type="info"
              message="No Returns Entries"
              description="There are no returns entries associated with this C-Form."
              showIcon
            />
          ) : (
            <div className="overflow-x-auto">
              {(() => {
                // Check if any row has a description value
                const hasAnyDescription = Object.values(editingEntries).some(
                  (desc: any) => desc && desc.trim() !== ""
                );

                return (
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-2 text-left text-xs font-semibold text-gray-700">
                          Invoice No
                        </th>
                        <th className="border border-gray-300 p-2 text-left text-xs font-semibold text-gray-700">
                          Invoice Date
                        </th>
                        <th className="border border-gray-300 p-2 text-left text-xs font-semibold text-gray-700">
                          URN
                        </th>
                        <th className="border border-gray-300 p-2 text-left text-xs font-semibold text-gray-700">
                          Description of Goods
                        </th>
                        {!hasAnyDescription && (
                          <th className="border border-gray-300 p-2 text-center text-xs font-semibold text-gray-700">
                            Action
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const uniqueInvoices = new Map();
                        returnsEntries.forEach((entry: any) => {
                          const invoiceNo = entry.returns_entry.invoice_number;
                          if (!uniqueInvoices.has(invoiceNo)) {
                            uniqueInvoices.set(invoiceNo, entry);
                          }
                        });
                        return Array.from(uniqueInvoices.values()).map(
                          (entry: any) => (
                            <tr
                              key={entry.id}
                              className="hover:bg-gray-50"
                            >
                              <td className="border border-gray-300 p-2 text-xs text-gray-700">
                                {entry.returns_entry.invoice_number}
                              </td>
                              <td className="border border-gray-300 p-2 text-xs text-gray-700">
                                {new Date(
                                  entry.returns_entry.invoice_date
                                ).toLocaleDateString()}
                              </td>
                              <td className="border border-gray-300 p-2 text-xs text-gray-700">
                                {entry.returns_entry.urn_number}
                              </td>
                              <td className="border border-gray-300 p-2">
                                <input
                                  type="text"
                                  maxLength={17}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  value={
                                    editingEntries[entry.id] || ""
                                  }
                                  onChange={(e) =>
                                    setEditingEntries({
                                      ...editingEntries,
                                      [entry.id]: e.target.value,
                                    })
                                  }
                                  placeholder="Enter description"
                                />
                              </td>
                              {!hasAnyDescription && (
                                <td className="border border-gray-300 p-2 text-center">
                                  <Button
                                    type="primary"
                                    size="small"
                                    onClick={() =>
                                      handleSaveDescription(entry.id)
                                    }
                                    loading={isLoadingModal}
                                  >
                                    Save
                                  </Button>
                                </td>
                              )}
                            </tr>
                          )
                        );
                      })()}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default TrackAppliation;
