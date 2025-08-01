"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { InputRef, RadioChangeEvent } from "antd";
import { Radio, Button, Input, Pagination } from "antd";
import { useEffect, useRef, useState } from "react";
import { getCookie } from "cookies-next";
import { dvat04, user } from "@prisma/client";
import { capitalcase, encryptURLData } from "@/utils/methods";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import GetUser from "@/action/user/getuser";
import DealersConsistentlyCompliant from "@/action/report/dealers_consistently_compliance";

interface ResponseType {
  dvat04: dvat04;
  lastfiling: string;
  pending: number;
  isLate: boolean;
}

const AfterDeathLinePage = () => {
  const userid: number = parseFloat(getCookie("id") ?? "0");
  const route = useRouter();
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
    TIN,
    NAME,
  }

  const [searchOption, setSeachOption] = useState<SearchOption>(
    SearchOption.TIN
  );

  const onChange = (e: RadioChangeEvent) => {
    setSeachOption(e.target.value);
  };

  const arnRef = useRef<InputRef>(null);
  const nameRef = useRef<InputRef>(null);

  const [dvatData, setDvatData] = useState<Array<ResponseType>>([]);

  const [user, setUpser] = useState<user | null>(null);

  const init = async () => {
    const userrespone = await GetUser({ id: userid });
    if (userrespone.status && userrespone.data) {
      setUpser(userrespone.data);
      const payment_data = await DealersConsistentlyCompliant({
        dept: userrespone.data.selectOffice!,
        take: 10,
        skip: 0,
      });

      if (payment_data.status && payment_data.data.result) {
        const sortedData = payment_data.data.result.sort(
          (a: ResponseType, b: ResponseType) => b.pending - a.pending
        );
        setPaginatin({
          skip: payment_data.data.skip,
          take: payment_data.data.take,
          total: payment_data.data.total,
        });
        setDvatData(sortedData);
      }
    }

    setSearch(false);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const userrespone = await GetUser({ id: userid });
      if (userrespone.status && userrespone.data) {
        setUpser(userrespone.data);
        const payment_data = await DealersConsistentlyCompliant({
          dept: userrespone.data.selectOffice!,
          take: 10,
          skip: 0,
        });

        if (payment_data.status && payment_data.data.result) {
          const sortedData = payment_data.data.result.sort(
            (a: ResponseType, b: ResponseType) => b.pending - a.pending
          );
          setDvatData(sortedData);
          setPaginatin({
            skip: payment_data.data.skip,
            take: payment_data.data.take,
            total: payment_data.data.total,
          });
        }
      }
      setLoading(false);
    };
    init();
  }, [userid]);

  const arnsearch = async () => {
    if (
      arnRef.current?.input?.value == undefined ||
      arnRef.current?.input?.value == null ||
      arnRef.current?.input?.value == ""
    ) {
      return toast.error("Enter arn number");
    }
    const search_response = await DealersConsistentlyCompliant({
      dept: user!.selectOffice!,
      arnnumber: arnRef.current?.input?.value,
      take: 10,
      skip: 0,
    });
    if (search_response.status && search_response.data.result) {
      setDvatData(search_response.data.result);
      setPaginatin({
        skip: search_response.data.skip,
        take: search_response.data.take,
        total: search_response.data.total,
      });
      setSearch(true);
    }
  };

  const namesearch = async () => {
    if (
      nameRef.current?.input?.value == undefined ||
      nameRef.current?.input?.value == null ||
      nameRef.current?.input?.value == ""
    ) {
      return toast.error("Enter TIN Number");
    }
    const search_response = await DealersConsistentlyCompliant({
      dept: user!.selectOffice!,
      tradename: nameRef.current?.input?.value,
      take: 10,
      skip: 0,
    });
    if (search_response.status && search_response.data.result) {
      setDvatData(search_response.data.result);
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
      if (searchOption == SearchOption.TIN) {
        if (
          arnRef.current?.input?.value == undefined ||
          arnRef.current?.input?.value == null ||
          arnRef.current?.input?.value == ""
        ) {
          return toast.error("Enter arn number");
        }
        const search_response = await DealersConsistentlyCompliant({
          dept: user!.selectOffice!,
          arnnumber: arnRef.current?.input?.value,
          take: pagesize,
          skip: pagesize * (page - 1),
        });

        if (search_response.status && search_response.data.result) {
          setDvatData(search_response.data.result);
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
          return toast.error("Enter TIN Number");
        }
        const search_response = await DealersConsistentlyCompliant({
          dept: user!.selectOffice!,
          tradename: nameRef.current?.input?.value,
          take: pagesize,
          skip: pagesize * (page - 1),
        });

        if (search_response.status && search_response.data.result) {
          setDvatData(search_response.data.result);
          setPaginatin({
            skip: search_response.data.skip,
            take: search_response.data.take,
            total: search_response.data.total,
          });
          setSearch(true);
        }
      }
    } else {
      const payment_data = await DealersConsistentlyCompliant({
        dept: user!.selectOffice!,
        take: pagesize,
        skip: pagesize * (page - 1),
      });
      if (payment_data.status && payment_data.data.result) {
        setDvatData(payment_data.data.result);
        setPaginatin({
          skip: payment_data.data.skip,
          take: payment_data.data.take,
          total: payment_data.data.total,
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
      <div className="p-3 py-2">
        <div className="bg-white p-2 shadow mt-4">
          <div className="bg-blue-500 p-2 text-white flex">
            <p>Dealers Consistently Compliance</p>
            <div className="grow"></div>
          </div>
          <div className="p-2 bg-gray-50 mt-2 flex flex-col md:flex-row lg:gap-2 lg:items-center">
            <Radio.Group
              onChange={onChange}
              value={searchOption}
              disabled={isSearch}
            >
              <Radio value={SearchOption.TIN}>TIN</Radio>
              <Radio value={SearchOption.NAME}>Trade Name</Radio>
            </Radio.Group>
            <div className="h-2"></div>
            {(() => {
              switch (searchOption) {
                case SearchOption.TIN:
                  return (
                    <div className="flex gap-2">
                      <Input
                        className="w-60"
                        ref={arnRef}
                        placeholder={"Enter TIN"}
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

                case SearchOption.NAME:
                  return (
                    <div className="flex gap-2">
                      <Input
                        className="w-60"
                        ref={nameRef}
                        placeholder={"Enter Trade Name"}
                        disabled={isSearch}
                      />

                      {isSearch ? (
                        <Button onClick={init} type="primary">
                          Reset
                        </Button>
                      ) : (
                        <Button onClick={namesearch} type="primary">
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
              <TableRow className="bg-gray-100">
                <TableHead className="whitespace-nowrap text-center border p-2">
                  TIN Number
                </TableHead>
                <TableHead className="whitespace-nowrap text-center border p-2">
                  Trade Name
                </TableHead>
                <TableHead className="whitespace-nowrap text-center border p-2">
                  Composition
                </TableHead>
                <TableHead className="whitespace-nowrap text-center border p-2">
                  Last Filing Period
                </TableHead>
                <TableHead className="whitespace-nowrap text-center border p-2">
                  Returns Filed
                </TableHead>
                <TableHead className="whitespace-nowrap text-center border p-2">
                  View
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dvatData.map((val: ResponseType, index: number) => {
                return (
                  <TableRow key={index}>
                    <TableCell className="border text-center p-2">
                      {val.dvat04.tinNumber}
                    </TableCell>
                    <TableCell className="border text-center p-2">
                      {val.dvat04.tradename}
                    </TableCell>
                    <TableCell className="border text-center p-2">
                      {val.dvat04.compositionScheme ? "COMP" : "REG"}
                    </TableCell>
                    <TableCell className="border text-center p-2">
                      {val.lastfiling}
                    </TableCell>
                    <TableCell className="border text-center p-2">
                      {val.pending}
                    </TableCell>
                    <TableCell className="border text-center p-2">
                      <Button
                        type="primary"
                        onClick={() => {
                          route.push(
                            `/dashboard/returns/department-pending-return/${encryptURLData(
                              val.dvat04.id.toString()
                            )}`
                          );
                        }}
                      >
                        View
                      </Button>
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
        </div>
      </div>
    </>
  );
};

export default AfterDeathLinePage;
