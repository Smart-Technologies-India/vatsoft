"use client";

import { Button, Drawer } from "antd";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";

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
  const [drawerOpen, setDrawerOpen] = useState(false);
    
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

      const dvat = await GetUserDvat04();

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
      <main className="p-3 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm mb-3">
            <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
              <div>
                <h1 className="text-lg font-medium text-gray-900">
                  Track Application Status
                </h1>
              </div>
              <div className="grow"></div>
              <div className="flex flex-wrap gap-2 items-center">
                <Button
                  size="small"
                  type="default"
                  onClick={() => {
                    router.push(
                      "/dashboard/register/track-application-status/openingstock",
                    );
                  }}
                >
                  Opening Stock
                </Button>

                <Button size="small" type="primary" onClick={() => setDrawerOpen(true)}>
                  Info
                </Button>

                <Drawer
                  title="Meaning of status"
                  placement="right"
                  onClose={() => setDrawerOpen(false)}
                  open={drawerOpen}
                  width={720}
                >
                  <Table className="border">
                    <TableBody>
                      <TableRow>
                        <TableCell className="text-left w-60 p-2 text-xs font-medium">
                          Pending for Processing
                        </TableCell>
                        <TableCell className="text-left p-2 text-xs">
                          Application filed successfully. Pending with Tax
                          Officer for Processing.*
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-left w-60 p-2 text-xs font-medium">
                          Pending for Clarification
                        </TableCell>
                        <TableCell className="text-left p-2 text-xs">
                          Notice for seeking clarification issued by
                          officer. File Clarification within 7 working days
                          of date of notice on portal.
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-left w-60 p-2 text-xs font-medium">
                          Clarification filed-Pending for Order
                        </TableCell>
                        <TableCell className="text-left p-2 text-xs">
                          Clarification filed successfully by Applicant.
                          Pending with Tax Officer for Order.*
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-left w-60 p-2 text-xs font-medium">
                          Clarification not filed Pending for Order
                        </TableCell>
                        <TableCell className="text-left p-2 text-xs">
                          Clarification not filed by the Applicant. Pending
                          with Tax Officer for Rejection.*
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-left w-60 p-2 text-xs font-medium">
                          Approved
                        </TableCell>
                        <TableCell className="text-left p-2 text-xs">
                          Application is Approved. Registration ID and
                          possward emailed to Applicant.
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-left w-60 p-2 text-xs font-medium">
                          Rejected
                        </TableCell>
                        <TableCell className="text-left p-2 text-xs">
                          Application is Rejected by tax officer.
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-left w-60 p-2 text-xs font-medium">
                          Withdrawn
                        </TableCell>
                        <TableCell className="text-left p-2 text-xs">
                          Application is withdrawn by the Applicant/Tax
                          payer.
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-left w-60 p-2 text-xs font-medium">
                          Cancelled on Request of Taxpayer
                        </TableCell>
                        <TableCell className="text-left p-2 text-xs">
                          Registration is cancelled on request to taxpayer.
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Drawer>
              </div>
            </div>
          </div>

          {data.length == 0 ? (
            <div className="bg-white rounded shadow-sm border p-3 text-center">
              <p className="text-gray-500 text-sm">There is no record.</p>
            </div>
          ) : (
            <div className="bg-white rounded shadow-sm border p-3">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 border-b">
                      <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                        ARN
                      </TableHead>
                      <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                        Form No.
                      </TableHead>
                      <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                        Form Description
                      </TableHead>
                      <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                        Submission Date
                      </TableHead>
                      <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                        Status
                      </TableHead>
                      <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                        Assigned To
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((val: any, index: number) => {
                      return (
                        <TableRow
                          key={index}
                          className="border-b hover:bg-gray-50"
                        >
                          <TableCell className="text-center p-2 text-xs">
                            <Link
                              href={
                                val?.status == "PENDINGPROCESSING"
                                  ? `/dashboard/register/${encryptURLData(
                                      val.id.toString(),
                                    )}/preview`
                                  : `/dashboard/new-registration/${encryptURLData(
                                      val.id.toString(),
                                    )}/dvat1`
                              }
                              className="text-blue-500 hover:text-blue-700"
                            >
                              {val.tempregistrationnumber}
                            </Link>
                          </TableCell>
                          <TableCell className="text-center p-2 text-xs">
                            VAT-04
                          </TableCell>
                          <TableCell className="text-center p-2 text-xs">
                            Application For new Registration
                          </TableCell>
                          <TableCell className="text-center p-2 text-xs">
                            {formateDate(new Date(val.createdAt))}
                          </TableCell>
                          <TableCell className="text-center p-2 text-xs">
                            {val.status}
                          </TableCell>
                          <TableCell className="text-center p-2 text-xs">
                            {val.registration.length == 0
                              ? "Not Assigned"
                              : `${val.registration[0].dept_user.firstName} -
                                ${val.registration[0].dept_user.lastName}`}
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {compdata.map(
                      (
                        val: composition & { dept_user: user },
                        index: number,
                      ) => {
                        return (
                          <TableRow
                            key={index}
                            className="border-b hover:bg-gray-50"
                          >
                            <TableCell className="text-center p-2 text-xs">
                              <Link
                                href={`/dashboard/register/composition-levy/${val.id}`}
                                className="text-blue-500 hover:text-blue-700"
                              >
                                {val.arn}
                              </Link>
                            </TableCell>
                            <TableCell className="text-center p-2 text-xs">
                              {val.compositionScheme ? "COMP-IN" : "COMP-OUT"}
                            </TableCell>
                            <TableCell className="text-center p-2 text-xs">
                              {val.compositionScheme
                                ? "Migration to composition Scheme"
                                : "Migration to regular scheme"}
                            </TableCell>
                            <TableCell className="text-center p-2 text-xs">
                              {formateDate(new Date(val.createdAt))}
                            </TableCell>
                            <TableCell className="text-center p-2 text-xs">
                              {val.status}
                            </TableCell>
                            <TableCell className="text-center p-2 text-xs">
                              {val.dept_user.firstName ?? ""} -{" "}
                              {val.dept_user.lastName ?? ""}
                            </TableCell>
                          </TableRow>
                        );
                      },
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default TrackAppliation;
