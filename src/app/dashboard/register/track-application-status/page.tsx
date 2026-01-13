"use client";

import { Alert, Button, Input } from "antd";
import { Button as ShButton } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";

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
import { encryptURLData, formateDate } from "@/utils/methods";
import GetUser from "@/action/user/getuser";
import GetAllUserDvat from "@/action/register/getalluserdvat";
import Link from "next/link";
import GetUserComposition from "@/action/composition/getusercompositon";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";

const TrackAppliation = () => {
  const [userid, setUserid] = useState<number>(0);

  const router = useRouter();

  const [data, setData] = useState<any[]>([]);
  const [user, setUser] = useState<user>();
  const [compdata, setCompData] = useState<
    Array<composition & { dept_user: user }>
  >([]);

  const [dvat, setDvat] = useState<dvat04>();

  useEffect(() => {
    const init = async () => {
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
      setUserid(authResponse.data);
      const response = await GetAllUserDvat({
        userid: authResponse.data,
      });

      if (response.data && response.status) {
        setData(response.data);
      }

      const userresponse = await GetUser({
        id: authResponse.data,
      });

      if (userresponse.data && userresponse.status) {
        setUser(userresponse.data);
      }

      const dvat = await GetUserDvat04({
        userid: authResponse.data,
      });

      if (dvat.status && dvat.data) {
        setDvat(dvat.data);
        const composition_response = await GetUserComposition({
          dvatid: dvat.data.id,
        });
        if (composition_response.status && composition_response.data) {
          setCompData(composition_response.data);
        }
      }
    };
    init();
  }, [userid]);

  return (
    <>
      <div className="p-3 py-2">
        <div className="bg-white p-2 shadow mt-4">
          <div className="bg-blue-500 p-2 text-white flex">
            <p>Track Application Status</p>
            <div className="grow"></div>

            <button
              onClick={() => {
                router.push(
                  "/dashboard/register/track-application-status/openingstock"
                );
              }}
              className="text-white text-sm mx-6"
            >
              Opening Stock
            </button>

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

          {data.length == 0 ? (
            <>
              <Alert
                style={{
                  marginTop: "10px",
                  padding: "8px",
                }}
                type="error"
                showIcon
                description="There is no record."
              />
            </>
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
                  {data.map((val: any, index: number) => {
                    return (
                      <TableRow key={index}>
                        <TableCell className="text-center border">
                          <Link
                            // href={`/dashboard/new-registration/${encryptURLData(
                            //   val.id.toString()
                            // )}/dvat1`}
                            href={
                              val?.status == "PENDINGPROCESSING"
                                ? `/dashboard/register/${encryptURLData(
                                    val.id.toString()
                                  )}/preview`
                                : `/dashboard/new-registration/${encryptURLData(
                                    val.id.toString()
                                  )}/dvat1`
                            }
                            // href={`/dashboard/register/${encryptURLData(
                            //   val.id.toString()
                            // )}/preview`}
                            className="text-blue-500"
                          >
                            {val.tempregistrationnumber}
                          </Link>
                        </TableCell>
                        <TableCell className="text-center border">
                          VAT-04
                        </TableCell>
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
                          {val.registration.length == 0
                            ? "Not Assigned"
                            : `${val.registration[0].dept_user.firstName} -
                              ${val.registration[0].dept_user.lastName}`}
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
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default TrackAppliation;
