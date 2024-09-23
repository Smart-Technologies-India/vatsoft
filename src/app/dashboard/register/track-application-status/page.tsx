"use client";

import { Button, Input } from "antd";
import { Button as ShButton } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Radio, DatePicker } from "antd";
import { useEffect, useRef, useState } from "react";
const { RangePicker } = DatePicker;
import type { Dayjs } from "dayjs";
import { MaterialSymbolsClose } from "@/components/icons";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { composition, dvat04, user } from "@prisma/client";
import { getCookie } from "cookies-next";
import { formateDate } from "@/utils/methods";
import GetUser from "@/action/user/getuser";
import GetAllUserDvat from "@/action/register/getalluserdvat";
import Link from "next/link";
import GetUserComposition from "@/action/composition/getusercompositon";
import GetUserDvat04 from "@/action/dvat/getuserdvat";

const TrackAppliation = () => {
  const id: number = parseInt(getCookie("id") ?? "0");

  const [data, setData] = useState<any[]>([]);
  const [user, setUser] = useState<user>();
  const [compdata, setCompData] = useState<
    Array<composition & { dept_user: user }>
  >([]);

  useEffect(() => {
    const init = async () => {
      const response = await GetAllUserDvat({
        userid: id,
      });

      if (response.data && response.status) {
        setData(response.data);
      }

      const userresponse = await GetUser({
        id: id,
      });

      if (userresponse.data && userresponse.status) {
        setUser(userresponse.data);
      }

      const dvat = await GetUserDvat04({
        userid: id,
      });
      if (dvat.status && dvat.data) {
        const composition_response = await GetUserComposition({
          dvatid: dvat.data.id,
        });
        if (composition_response.status && composition_response.data) {
          setCompData(composition_response.data);
        }
      }
    };
    init();
  }, [id]);

  // enum SearchOption {
  //   ARN,
  //   SRN_FRN,
  //   SUBMISSION,
  // }
  // const [searchOption, setSeachOption] = useState<SearchOption>(
  //   SearchOption.ARN
  // );

  // const onChange = (e: RadioChangeEvent) => {
  //   setSeachOption(e.target.value);
  // };

  // const arnRef = useRef<InputRef>(null);
  // const srnRef = useRef<InputRef>(null);

  // const [searchDate, setSearchDate] = useState<
  //   [Dayjs | null, Dayjs | null] | null
  // >(null);

  // const onChangeDate = (
  //   dates: [Dayjs | null, Dayjs | null] | null,
  //   dateStrings: [string, string]
  // ) => {
  //   setSearchDate(dates);
  // };

  return (
    <>
      <div className="p-6">
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
          {/* <Radio.Group
            onChange={onChange}
            value={searchOption}
            className="mt-2"
          >
            <Radio value={SearchOption.ARN}>ARN</Radio>
            <Radio value={SearchOption.SRN_FRN}>SRN/FRN</Radio>
            <Radio value={SearchOption.SUBMISSION}>Submission Period</Radio>
          </Radio.Group>
          <div className="mt-2"></div>
          {(() => {
            switch (searchOption) {
              case SearchOption.ARN:
                return (
                  <div className="flex gap-2">
                    <Input
                      className="w-60"
                      ref={arnRef}
                      placeholder={"Enter ARN Number"}
                    />
                    <Button type="primary">Search</Button>
                  </div>
                );
              case SearchOption.SRN_FRN:
                return (
                  <div className="flex gap-2">
                    <Input
                      className="w-60"
                      ref={srnRef}
                      placeholder={"Enter SRN/FRN Number"}
                    />
                    <Button type="primary">Search</Button>
                  </div>
                );
              case SearchOption.SUBMISSION:
                return (
                  <div className="flex gap-2">
                    <RangePicker onChange={onChangeDate} />
                    <Button type="primary">Search</Button>
                  </div>
                );
              default:
                return null;
            }
          })()}{" "}
          <div className="text-blue-400 bg-blue-500 bg-opacity-10 border border-blue-300 mt-2 text-sm p-2 flex gap-2 items-center">
            <p className="flex-1">Search Result Based on Date range</p>
            <MaterialSymbolsClose className="text-xl cursor-pointer" />
          </div> */}
          <Table className="border mt-2">
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead className="whitespace-nowrap border">ARN</TableHead>
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
              {data.map((val: any, index: number) => {
                return (
                  <TableRow key={index}>
                    <TableCell className="text-center border">
                      <Link
                        href={`/dashboard/register/${val.id}/preview?sidebar=no`}
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
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
};

export default TrackAppliation;
