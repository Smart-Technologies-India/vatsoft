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
import { Alert } from "antd";

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
      <div className="p-3 py-2">
        <div className="bg-white p-2 shadow mt-4">
          <div className="bg-blue-500 p-2 text-white flex">
            <p>Dealer Registration Status</p>
            <div className="grow"></div>
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
                description=" There is no record"
              />
            </>
          ) : (
            <>
              <Table className="border mt-2">
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead className="whitespace-nowrap border">
                      TIN No
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center border">
                      Trade Name
                    </TableHead>
                    <TableHead className="text-center border">
                      Contact
                    </TableHead>
                    <TableHead className="text-center border">
                      DVAT Submit
                    </TableHead>
                    <TableHead className="text-center border">
                      Stock Submit
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map(
                    (
                      val: dvat04 & { first_stock: first_stock[] },
                      index: number
                    ) => {
                      return (
                        <TableRow
                          key={index}
                          className={`bg-opacity-20 ${
                            val.status == "PENDINGPROCESSING"
                              ? "bg-orange-500"
                              : val.status == "APPROVED"
                              ? "bg-green-500"
                              : "bg-rose-500"
                          }`}
                        >
                          <TableCell className="text-center border">
                            {val.tinNumber}
                          </TableCell>
                          <TableCell className="text-left border">
                            {val.tradename}
                          </TableCell>
                          <TableCell className="text-center border">
                            {val.contact_one}
                          </TableCell>
                          <TableCell className="text-center border">
                            {val.status == "PENDINGPROCESSING"
                              ? "SUBMITTED"
                              : val.status == "APPROVED"
                              ? "SUBMITTED"
                              : "PENDING"}
                          </TableCell>
                          <TableCell className="text-center border">
                            {val.first_stock.length > 0
                              ? "SUBMITTED"
                              : "PENDING"}
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

export default RegistrationStatus;
