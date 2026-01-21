"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";

import { dvat04, first_stock, user } from "@prisma/client";
import GetUser from "@/action/user/getuser";
import { useRouter } from "next/navigation";
import GetDvatByOffice from "@/action/return/getdvatbyoffice";
import { toast } from "react-toastify";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";

const RegistrationStatus = () => {
  const [userid, setUserid] = useState<number>(0);

  const router = useRouter();

  const [data, setData] = useState<(dvat04 & { first_stock: first_stock[] })[]>(
    []
  );
  const [user, setUser] = useState<user>();

  useEffect(() => {
    const init = async () => {
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

        const response = await GetDvatByOffice({
          selectOffice: userresponse.data.selectOffice!,
        });

        if (response.data && response.status) {
          // setData(response.data);

          // short data according to this status order
          // 1 - VERIFICATION
          // 2 - PENDINGPROCESSING
          // 3 - APPROVED

          const verification = response.data.filter(
            (val) => val.status == "VERIFICATION"
          );
          const pendingprocessing = response.data.filter(
            (val) => val.status == "PENDINGPROCESSING"
          );
          const approved = response.data.filter(
            (val) => val.status == "APPROVED"
          );

          setData([...verification, ...pendingprocessing, ...approved]);
        }
      }
    };
    init();
  }, [userid]);

  return (
    <>
      <main className="bg-gray-50 min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Dealer Registration Status
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Track dealer registration and stock submission status
                </p>
              </div>
              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg font-medium">
                {data.length} {data.length === 1 ? "Dealer" : "Dealers"}
              </div>
            </div>
          </div>

          {/* Content Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {data.length === 0 ? (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                </div>
                <p className="text-gray-600 font-medium">No Records Found</p>
                <p className="text-sm text-gray-500 mt-1">
                  There are no dealer registrations to display at this time.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="border-0">
                  <TableHeader>
                    <TableRow className="bg-gray-50 border-b">
                      <TableHead className="whitespace-nowrap p-3 font-semibold text-gray-700">
                        TIN No
                      </TableHead>
                      <TableHead className="whitespace-nowrap p-3 font-semibold text-gray-700">
                        Trade Name
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-center p-3 font-semibold text-gray-700">
                        Contact
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-center p-3 font-semibold text-gray-700">
                        DVAT Status
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-center p-3 font-semibold text-gray-700">
                        Stock Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map(
                      (
                        val: dvat04 & { first_stock: first_stock[] },
                        index: number
                      ) => {
                        const getStatusColor = () => {
                          if (val.status === "APPROVED") return "bg-emerald-50";
                          if (val.status === "PENDINGPROCESSING") return "bg-amber-50";
                          return "bg-rose-50";
                        };

                        return (
                          <TableRow
                            key={index}
                            className={`${getStatusColor()} hover:opacity-80 transition-opacity border-b`}
                          >
                            <TableCell className="p-3 text-sm font-medium text-gray-900">
                              {val.tinNumber}
                            </TableCell>
                            <TableCell className="p-3 text-sm text-gray-900">
                              {val.tradename}
                            </TableCell>
                            <TableCell className="p-3 text-center text-sm text-gray-700">
                              {val.contact_one}
                            </TableCell>
                            <TableCell className="p-3 text-center">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                  val.status === "APPROVED"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : val.status === "PENDINGPROCESSING"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-rose-100 text-rose-700"
                                }`}
                              >
                                {val.status === "PENDINGPROCESSING" || val.status === "APPROVED"
                                  ? "SUBMITTED"
                                  : "PENDING"}
                              </span>
                            </TableCell>
                            <TableCell className="p-3 text-center">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                  val.first_stock.length > 0
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-rose-100 text-rose-700"
                                }`}
                              >
                                {val.first_stock.length > 0 ? "SUBMITTED" : "PENDING"}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      }
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default RegistrationStatus;
