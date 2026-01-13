/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { Pagination, Drawer } from "antd";

import { Button } from "antd";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { HSNCodeMasterProvider } from "@/components/forms/hsncode/hsncode";
import { hsncode } from "@prisma/client";
import GetAllHSNCode from "@/action/hsncode/getallhsncode";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import { useRouter } from "next/navigation";

const SupplierDetails = () => {
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

  // enum SearchOption {
  //   GSP,
  //   SPOC,
  //   EMAIL,
  //   MOBILE,
  // }

  // const [searchOption, setSeachOption] = useState<SearchOption>(
  //   SearchOption.GSP
  // );

  // const onChange = (e: RadioChangeEvent) => {
  //   setSeachOption(e.target.value);
  // };

  // const gspRef = useRef<InputRef>(null);
  // const spocRef = useRef<InputRef>(null);
  // const emailRef = useRef<InputRef>(null);
  // const mobileRef = useRef<InputRef>(null);

  // const gspsearch = async () => {
  //   if (
  //     gspRef.current?.input?.value == undefined ||
  //     gspRef.current?.input?.value == null ||
  //     gspRef.current?.input?.value == ""
  //   ) {
  //     return toast.error("Enter GPS Name");
  //   }
  //   const search_response = await SearchParctitioner({
  //     gsp_name: gspRef.current?.input?.value,
  //     take: 10,
  //     skip: 0,
  //   });
  //   if (search_response.status && search_response.data.result) {
  //     setParctitionerData(search_response.data.result);
  //     setPaginatin({
  //       skip: search_response.data.skip,
  //       take: search_response.data.take,
  //       total: search_response.data.total,
  //     });
  //     setSearch(true);
  //   }
  // };

  // const spocsearch = async () => {
  //   if (
  //     spocRef.current?.input?.value == undefined ||
  //     spocRef.current?.input?.value == null ||
  //     spocRef.current?.input?.value == ""
  //   ) {
  //     return toast.error("Enter Business SPOC Name Name");
  //   }
  //   const search_response = await SearchParctitioner({
  //     business_spoc_name: spocRef.current?.input?.value,
  //     take: 10,
  //     skip: 0,
  //   });
  //   if (search_response.status && search_response.data.result) {
  //     setParctitionerData(search_response.data.result);
  //     setPaginatin({
  //       skip: search_response.data.skip,
  //       take: search_response.data.take,
  //       total: search_response.data.total,
  //     });
  //     setSearch(true);
  //   }
  // };
  // const emailsearch = async () => {
  //   if (
  //     emailRef.current?.input?.value == undefined ||
  //     emailRef.current?.input?.value == null ||
  //     emailRef.current?.input?.value == ""
  //   ) {
  //     return toast.error("Enter Email");
  //   }
  //   const search_response = await SearchParctitioner({
  //     email: emailRef.current?.input?.value,
  //     take: 10,
  //     skip: 0,
  //   });

  //   if (search_response.status && search_response.data.result) {
  //     setParctitionerData(search_response.data.result);
  //     setPaginatin({
  //       skip: search_response.data.skip,
  //       take: search_response.data.take,
  //       total: search_response.data.total,
  //     });
  //     setSearch(true);
  //   }
  // };

  // const mobilesearch = async () => {
  //   if (
  //     mobileRef.current?.input?.value == undefined ||
  //     mobileRef.current?.input?.value == null ||
  //     mobileRef.current?.input?.value == ""
  //   ) {
  //     return toast.error("Enter Mobile Number");
  //   }
  //   const search_response = await SearchParctitioner({
  //     mobile: mobileRef.current?.input?.value,
  //     take: 10,
  //     skip: 0,
  //   });

  //   if (search_response.status && search_response.data.result) {
  //     setParctitionerData(search_response.data.result);
  //     setPaginatin({
  //       skip: search_response.data.skip,
  //       take: search_response.data.take,
  //       total: search_response.data.total,
  //     });
  //     setSearch(true);
  //   }
  // };

  const [HSNCodeData, setHSNCodeData] = useState<hsncode[]>([]);

  const init = async () => {
    setLoading(true);

    const hsncode_respone = await GetAllHSNCode({
      take: 10,
      skip: 0,
    });
    if (hsncode_respone.status && hsncode_respone.data.result) {
      setHSNCodeData(hsncode_respone.data.result);
      setPaginatin({
        skip: hsncode_respone.data.skip,
        take: hsncode_respone.data.take,
        total: hsncode_respone.data.total,
      });
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

      const hsncode_respone = await GetAllHSNCode({
        take: pagination.take,
        skip: pagination.skip,
      });
      if (hsncode_respone.status && hsncode_respone.data.result) {
        setHSNCodeData(hsncode_respone.data.result);
        setPaginatin({
          skip: pagination.skip,
          take: pagination.take,
          total: hsncode_respone.data.total,
        });
      }
      setLoading(false);
    };
    init();
  }, [userid]);

  const onChangePageCount = async (page: number, pagesize: number) => {
    // if (isSearch) {
    //   if (searchOption == SearchOption.GSP) {
    //     if (
    //       gspRef.current?.input?.value == undefined ||
    //       gspRef.current?.input?.value == null ||
    //       gspRef.current?.input?.value == ""
    //     ) {
    //       return toast.error("Enter GPS Name");
    //     }
    //     const search_response = await SearchParctitioner({
    //       gsp_name: gspRef.current?.input?.value,
    //       take: pagesize,
    //       skip: pagesize * (page - 1),
    //     });

    //     if (search_response.status && search_response.data.result) {
    //       setParctitionerData(search_response.data.result);
    //       setPaginatin({
    //         skip: search_response.data.skip,
    //         take: search_response.data.take,
    //         total: search_response.data.total,
    //       });
    //       setSearch(true);
    //     }
    //   } else if (searchOption == SearchOption.SPOC) {
    //     if (
    //       spocRef.current?.input?.value == undefined ||
    //       spocRef.current?.input?.value == null ||
    //       spocRef.current?.input?.value == ""
    //     ) {
    //       return toast.error("Enter Business SPOC Name Name");
    //     }
    //     const search_response = await SearchParctitioner({
    //       business_spoc_name: spocRef.current?.input?.value,
    //       take: pagesize,
    //       skip: pagesize * (page - 1),
    //     });

    //     if (search_response.status && search_response.data.result) {
    //       setParctitionerData(search_response.data.result);
    //       setPaginatin({
    //         skip: search_response.data.skip,
    //         take: search_response.data.take,
    //         total: search_response.data.total,
    //       });
    //       setSearch(true);
    //     }
    //   } else if (searchOption == SearchOption.EMAIL) {
    //     if (
    //       emailRef.current?.input?.value == undefined ||
    //       emailRef.current?.input?.value == null ||
    //       emailRef.current?.input?.value == ""
    //     ) {
    //       return toast.error("Enter Email");
    //     }
    //     const search_response = await SearchParctitioner({
    //       email: emailRef.current?.input?.value,
    //       take: pagesize,
    //       skip: pagesize * (page - 1),
    //     });

    //     if (search_response.status && search_response.data.result) {
    //       setParctitionerData(search_response.data.result);
    //       setPaginatin({
    //         skip: search_response.data.skip,
    //         take: search_response.data.take,
    //         total: search_response.data.total,
    //       });
    //       setSearch(true);
    //     }
    //   } else if (searchOption == SearchOption.MOBILE) {
    //     if (
    //       mobileRef.current?.input?.value == undefined ||
    //       mobileRef.current?.input?.value == null ||
    //       mobileRef.current?.input?.value == ""
    //     ) {
    //       return toast.error("Enter Mobile Number");
    //     }
    //     const search_response = await SearchParctitioner({
    //       mobile: mobileRef.current?.input?.value,
    //       take: pagesize,
    //       skip: pagesize * (page - 1),
    //     });

    //     if (search_response.status && search_response.data.result) {
    //       setParctitionerData(search_response.data.result);
    //       setPaginatin({
    //         skip: search_response.data.skip,
    //         take: search_response.data.take,
    //         total: search_response.data.total,
    //       });
    //       setSearch(true);
    //     }
    //   }
    // } else {
    const hsncode_respone = await GetAllHSNCode({
      take: pagesize,
      skip: pagesize * (page - 1),
    });
    if (hsncode_respone.status && hsncode_respone.data.result) {
      setHSNCodeData(hsncode_respone.data.result);
      setPaginatin({
        skip: hsncode_respone.data.skip,
        take: hsncode_respone.data.take,
        total: hsncode_respone.data.total,
      });
    }
    // }
  };

  const [addBox, setAddBox] = useState<boolean>(false);
  const [hsncodeid, setHsncodeid] = useState<number>();

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );

  return (
    <>
      <Drawer
        placement="right"
        closeIcon={null}
        onClose={() => {
          setAddBox(false);
        }}
        open={addBox}
      >
        <p className="text-lg text-left">
          {hsncodeid ? "Update" : "Add"} Paractitioner
        </p>
        <HSNCodeMasterProvider
          userid={userid}
          id={hsncodeid}
          setAddBox={setAddBox}
          setHSNCodeid={setHsncodeid}
          init={init}
        />
      </Drawer>
      <div className="p-4">
        <div className="bg-white p-2 shadow mt-2">
          <div className="flex gap-2">
            <p className="text-lg font-semibold">HSN Code</p>
            <div className="grow"></div>
            <Button
              size="small"
              type="primary"
              className="bg-blue-500 hover:bg-blue-500 w-14"
              onClick={() => {
                setHsncodeid(undefined);
                setAddBox(true);
              }}
            >
              Add
            </Button>
          </div>

          {/* <div className="p-2 bg-gray-50 mt-2 flex flex-col md:flex-row lg:gap-2 lg:items-center">
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
          </div> */}

          <Table className="border mt-2">
            <TableHeader>
              <TableRow className="bg-gray-100 p-2">
                <TableHead className="border text-center">Id</TableHead>
                <TableHead className="border whitespace-nowrap text-center  p-2">
                  Chapter Head
                </TableHead>
                <TableHead className="border text-center p-2">
                  HSN Code
                </TableHead>
                <TableHead className="border text-center p-2">
                  Tech Description
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {HSNCodeData.map((val: hsncode, index: number) => (
                <TableRow key={index}>
                  <TableCell className="p-2 border text-center">
                    {val.id}
                  </TableCell>
                  <TableCell className="p-2 border whitespace-nowrap text-center">
                    {val.head}
                  </TableCell>
                  <TableCell className="p-2 border text-center">
                    {val.hsncode}
                  </TableCell>
                  <TableCell className="p-2 border text-center">
                    {val.tech_description}
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
