/* eslint-disable react-hooks/exhaustive-deps */
"use client";
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
import { parctitioner } from "@prisma/client";
import GetAllParctitioner from "@/action/parctitioner/getallparctitioner";
import SearchParctitioner from "@/action/parctitioner/searchparctitioner";
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
    GSP,
    SPOC,
    EMAIL,
    MOBILE,
  }

  const [searchOption, setSeachOption] = useState<SearchOption>(
    SearchOption.GSP
  );

  const onChange = (e: RadioChangeEvent) => {
    setSeachOption(e.target.value);
  };

  const gspRef = useRef<InputRef>(null);
  const spocRef = useRef<InputRef>(null);
  const emailRef = useRef<InputRef>(null);
  const mobileRef = useRef<InputRef>(null);

  const gspsearch = async () => {
    if (
      gspRef.current?.input?.value == undefined ||
      gspRef.current?.input?.value == null ||
      gspRef.current?.input?.value == ""
    ) {
      return toast.error("Enter GPS Name");
    }
    const search_response = await SearchParctitioner({
      gsp_name: gspRef.current?.input?.value,
      take: 10,
      skip: 0,
    });
    if (search_response.status && search_response.data.result) {
      setParctitionerData(search_response.data.result);
      setPaginatin({
        skip: search_response.data.skip,
        take: search_response.data.take,
        total: search_response.data.total,
      });
      setSearch(true);
    }
  };

  const spocsearch = async () => {
    if (
      spocRef.current?.input?.value == undefined ||
      spocRef.current?.input?.value == null ||
      spocRef.current?.input?.value == ""
    ) {
      return toast.error("Enter Business SPOC Name Name");
    }
    const search_response = await SearchParctitioner({
      business_spoc_name: spocRef.current?.input?.value,
      take: 10,
      skip: 0,
    });
    if (search_response.status && search_response.data.result) {
      setParctitionerData(search_response.data.result);
      setPaginatin({
        skip: search_response.data.skip,
        take: search_response.data.take,
        total: search_response.data.total,
      });
      setSearch(true);
    }
  };
  const emailsearch = async () => {
    if (
      emailRef.current?.input?.value == undefined ||
      emailRef.current?.input?.value == null ||
      emailRef.current?.input?.value == ""
    ) {
      return toast.error("Enter Email");
    }
    const search_response = await SearchParctitioner({
      email: emailRef.current?.input?.value,
      take: 10,
      skip: 0,
    });

    if (search_response.status && search_response.data.result) {
      setParctitionerData(search_response.data.result);
      setPaginatin({
        skip: search_response.data.skip,
        take: search_response.data.take,
        total: search_response.data.total,
      });
      setSearch(true);
    }
  };

  const mobilesearch = async () => {
    if (
      mobileRef.current?.input?.value == undefined ||
      mobileRef.current?.input?.value == null ||
      mobileRef.current?.input?.value == ""
    ) {
      return toast.error("Enter Mobile Number");
    }
    const search_response = await SearchParctitioner({
      mobile: mobileRef.current?.input?.value,
      take: 10,
      skip: 0,
    });

    if (search_response.status && search_response.data.result) {
      setParctitionerData(search_response.data.result);
      setPaginatin({
        skip: search_response.data.skip,
        take: search_response.data.take,
        total: search_response.data.total,
      });
      setSearch(true);
    }
  };

  const [parctitionerData, setParctitionerData] = useState<parctitioner[]>([]);

  const init = async () => {
    setLoading(true);

    const paractitioner_respone = await GetAllParctitioner({
      take: 10,
      skip: 0,
    });
    if (paractitioner_respone.status && paractitioner_respone.data.result) {
      setParctitionerData(paractitioner_respone.data.result);
      setPaginatin({
        skip: paractitioner_respone.data.skip,
        take: paractitioner_respone.data.take,
        total: paractitioner_respone.data.total,
      });
    }
    setSearch(false);
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const paractitioner_respone = await GetAllParctitioner({
        take: pagination.take,
        skip: pagination.skip,
      });
      if (paractitioner_respone.status && paractitioner_respone.data.result) {
        setParctitionerData(paractitioner_respone.data.result);
        setPaginatin({
          skip: pagination.skip,
          take: pagination.take,
          total: paractitioner_respone.data.total,
        });
      }
      setLoading(false);
    };
    init();
  }, [current_user_id]);

  const onChangePageCount = async (page: number, pagesize: number) => {
    if (isSearch) {
      if (searchOption == SearchOption.GSP) {
        if (
          gspRef.current?.input?.value == undefined ||
          gspRef.current?.input?.value == null ||
          gspRef.current?.input?.value == ""
        ) {
          return toast.error("Enter GPS Name");
        }
        const search_response = await SearchParctitioner({
          gsp_name: gspRef.current?.input?.value,
          take: pagesize,
          skip: pagesize * (page - 1),
        });

        if (search_response.status && search_response.data.result) {
          setParctitionerData(search_response.data.result);
          setPaginatin({
            skip: search_response.data.skip,
            take: search_response.data.take,
            total: search_response.data.total,
          });
          setSearch(true);
        }
      } else if (searchOption == SearchOption.SPOC) {
        if (
          spocRef.current?.input?.value == undefined ||
          spocRef.current?.input?.value == null ||
          spocRef.current?.input?.value == ""
        ) {
          return toast.error("Enter Business SPOC Name Name");
        }
        const search_response = await SearchParctitioner({
          business_spoc_name: spocRef.current?.input?.value,
          take: pagesize,
          skip: pagesize * (page - 1),
        });

        if (search_response.status && search_response.data.result) {
          setParctitionerData(search_response.data.result);
          setPaginatin({
            skip: search_response.data.skip,
            take: search_response.data.take,
            total: search_response.data.total,
          });
          setSearch(true);
        }
      } else if (searchOption == SearchOption.EMAIL) {
        if (
          emailRef.current?.input?.value == undefined ||
          emailRef.current?.input?.value == null ||
          emailRef.current?.input?.value == ""
        ) {
          return toast.error("Enter Email");
        }
        const search_response = await SearchParctitioner({
          email: emailRef.current?.input?.value,
          take: pagesize,
          skip: pagesize * (page - 1),
        });

        if (search_response.status && search_response.data.result) {
          setParctitionerData(search_response.data.result);
          setPaginatin({
            skip: search_response.data.skip,
            take: search_response.data.take,
            total: search_response.data.total,
          });
          setSearch(true);
        }
      } else if (searchOption == SearchOption.MOBILE) {
        if (
          mobileRef.current?.input?.value == undefined ||
          mobileRef.current?.input?.value == null ||
          mobileRef.current?.input?.value == ""
        ) {
          return toast.error("Enter Mobile Number");
        }
        const search_response = await SearchParctitioner({
          mobile: mobileRef.current?.input?.value,
          take: pagesize,
          skip: pagesize * (page - 1),
        });

        if (search_response.status && search_response.data.result) {
          setParctitionerData(search_response.data.result);
          setPaginatin({
            skip: search_response.data.skip,
            take: search_response.data.take,
            total: search_response.data.total,
          });
          setSearch(true);
        }
      }
    } else {
      const paractitioner_respone = await GetAllParctitioner({
        take: pagesize,
        skip: pagesize * (page - 1),
      });
      if (paractitioner_respone.status && paractitioner_respone.data.result) {
        setParctitionerData(paractitioner_respone.data.result);
        setPaginatin({
          skip: paractitioner_respone.data.skip,
          take: paractitioner_respone.data.take,
          total: paractitioner_respone.data.total,
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
      <div className="p-4">
        <div className="bg-white p-2 shadow mt-2">
          <div className="bg-blue-500 p-2 text-white">
            VAT Paractitioner
          </div>
          <div className="p-2 bg-gray-50 mt-2 flex flex-col md:flex-row lg:gap-2 lg:items-center">
            <Radio.Group
              onChange={onChange}
              disabled={isSearch}
              className="mt-2"
              value={searchOption}
            >
              <Radio value={SearchOption.GSP}>GSP Name</Radio>
              <Radio value={SearchOption.SPOC}>Business Spoc Name</Radio>
              <Radio value={SearchOption.EMAIL}>Email Id</Radio>
              <Radio value={SearchOption.MOBILE}>Mobile</Radio>
            </Radio.Group>
            <div className="mt-2"></div>
            {(() => {
              switch (searchOption) {
                case SearchOption.GSP:
                  return (
                    <div className="flex gap-2">
                      <Input
                        className="w-60"
                        ref={gspRef}
                        placeholder={"Enter mobile Number"}
                        disabled={isSearch}
                      />

                      {isSearch ? (
                        <Button onClick={init} type="primary">
                          Reset
                        </Button>
                      ) : (
                        <Button onClick={gspsearch} type="primary">
                          Search
                        </Button>
                      )}
                    </div>
                  );
                case SearchOption.SPOC:
                  return (
                    <div className="flex gap-2">
                      <Input
                        className="w-60"
                        ref={spocRef}
                        placeholder={"Enter Business SPOC Nmae"}
                        disabled={isSearch}
                      />

                      {isSearch ? (
                        <Button onClick={init} type="primary">
                          Reset
                        </Button>
                      ) : (
                        <Button onClick={spocsearch} type="primary">
                          Search
                        </Button>
                      )}
                    </div>
                  );
                case SearchOption.EMAIL:
                  return (
                    <div className="flex gap-2">
                      <Input
                        className="w-60"
                        ref={emailRef}
                        placeholder={"Enter Email Address"}
                        disabled={isSearch}
                      />

                      {isSearch ? (
                        <Button onClick={init} type="primary">
                          Reset
                        </Button>
                      ) : (
                        <Button onClick={emailsearch} type="primary">
                          Search
                        </Button>
                      )}
                    </div>
                  );
                case SearchOption.MOBILE:
                  return (
                    <div className="flex gap-2">
                      <Input
                        className="w-60"
                        ref={mobileRef}
                        placeholder={"Enter mobile Number"}
                        disabled={isSearch}
                      />

                      {isSearch ? (
                        <Button onClick={init} type="primary">
                          Reset
                        </Button>
                      ) : (
                        <Button onClick={mobilesearch} type="primary">
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
                <TableHead className="border text-center">Id</TableHead>
                <TableHead className="border whitespace-nowrap text-center  p-2">
                  GSP Name
                </TableHead>
                <TableHead className="border text-center p-2">
                  Business SPOC Name
                </TableHead>
                <TableHead className="border text-center p-2">
                  Email Id
                </TableHead>
                <TableHead className="border text-center p-2">
                  Mobile NO.
                </TableHead>
                <TableHead className="border text-center p-2">
                  Address
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parctitionerData.map((val: parctitioner, index: number) => (
                <TableRow key={index}>
                  <TableCell className="p-2 border text-center">
                    {val.id}
                  </TableCell>
                  <TableCell className="p-2 border whitespace-nowrap text-center">
                    {val.gsp_name}
                  </TableCell>
                  <TableCell className="p-2 border text-center">
                    {val.business_spoc_name}
                  </TableCell>
                  <TableCell className="p-2 border text-center">
                    {val.email}
                  </TableCell>
                  <TableCell className="p-2 border text-center">
                    {val.mobile}
                  </TableCell>
                  <TableCell className="p-2 border whitespace-nowrap text-center">
                    {val.address}
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
        </div>
      </div>
    </>
  );
};

export default SupplierDetails;
