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
import { composition, dvat04, first_stock, user } from "@prisma/client";
import { getCookie } from "cookies-next";
import { encryptURLData, formateDate } from "@/utils/methods";
import GetUser from "@/action/user/getuser";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GetDvatByOffice from "@/action/return/getdvatbyoffice";
import { Varta } from "next/font/google";

const RegistrationStatus = () => {
  const id: number = parseInt(getCookie("id") ?? "0");

  const router = useRouter();

  const [data, setData] = useState<(dvat04 & { first_stock: first_stock[] })[]>(
    []
  );
  const [user, setUser] = useState<user>();

  //   const [dvat, setDvat] = useState<dvat04>();

  useEffect(() => {
    const init = async () => {
      const userresponse = await GetUser({
        id: id,
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
  }, [id]);

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
              <p className="bg-rose-500 bg-opacity-10 text-rose-500 mt-2 px-2 py-1 border border-rose-500">
                There is no record
              </p>
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
