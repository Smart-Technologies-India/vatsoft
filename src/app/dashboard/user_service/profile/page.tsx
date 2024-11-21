"use client";

import { getCookie } from "cookies-next";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useEffect, useState } from "react";
import { user } from "@prisma/client";
import GetUser from "@/action/user/getuser";
import { toast } from "react-toastify";

const UserRegister = (): JSX.Element => {
  const id: number = parseInt(getCookie("id") ?? "0");

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userdata, setUserData] = useState<user | null>(null);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);

      const user = await GetUser({ id: id });

      if (user.status && user.data) {
        setUserData(user.data);
      } else {
        toast.error(user.message);
      }

      setIsLoading(false);
    };
    init();
  }, [id]);

  if (isLoading) {
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );
  }

  return (
    <>
      <div className="w-full p-4  mt-2">
        <div className="bg-white p-4">
          <Table className="border mt-2">
            <TableBody>
              <TableRow>
                <TableCell className="text-center p-2" colSpan={5}>
                  <p className="text-lg font-nunito">Profile</p>
                </TableCell>
              </TableRow>
              <TableRow className="bg-gray-100">
                <TableCell className="text-left w-[16%] p-2 border">
                  First Name
                </TableCell>
                <TableCell className="text-left p-2 border w-[36%]">
                  {userdata?.firstName ?? ""}
                </TableCell>
                <TableCell className="text-left w-[16%] p-2 border hidden lg:table-cell">
                  Last Name
                </TableCell>
                <TableCell className="text-left p-2 border w-[36%]  hidden lg:table-cell">
                  {userdata?.lastName ?? ""}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-left w-60 p-2 border lg:hidden">
                  Last Name
                </TableCell>
                <TableCell className="text-left p-2 border lg:hidden">
                  {userdata?.lastName ?? ""}
                </TableCell>
              </TableRow>
              <TableRow className="bg-gray-100 lg:bg-transparent">
                <TableCell className="text-left w-[16&] p-2 border">
                  Email
                </TableCell>
                <TableCell className="text-left p-2 border w-[36%]">
                  {userdata?.email ?? ""}
                </TableCell>
                <TableCell className="text-left w-[16%] p-2 border hidden lg:table-cell">
                  Mobile Number
                </TableCell>
                <TableCell className="text-left p-2 border w-[36%] hidden lg:table-cell">
                  {userdata?.mobileOne ?? ""}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-left w-60 p-2 border lg:hidden">
                  Mobile Number
                </TableCell>
                <TableCell className="text-left p-2 border lg:hidden">
                  {userdata?.mobileOne ?? ""}
                </TableCell>
              </TableRow>
              <TableRow className="bg-gray-100">
                <TableCell className="text-left w-[16%] p-2 border">
                  Alternate Number
                </TableCell>
                <TableCell className="text-left p-2 border w-[36%]">
                  {userdata?.mobileTwo ?? ""}
                </TableCell>
                <TableCell className="text-left p-2 border w-[16%] hidden lg:table-cell">
                  Pan Card
                </TableCell>
                <TableCell className="text-left p-2 border w-[36%] hidden lg:table-cell">
                  {userdata?.pan ?? ""}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-left w-60 p-2 border lg:hidden">
                  Pan Card
                </TableCell>
                <TableCell className="text-left p-2 border lg:hidden">
                  {userdata?.pan ?? ""}
                </TableCell>
              </TableRow>
              <TableRow className="bg-gray-100 lg:bg-transparent">
                <TableCell className="text-left w-[16%] p-2 border">
                  Aadhar Card
                </TableCell>
                <TableCell className="text-left p-2 border w-[36%]">
                  {userdata?.aadhar ?? ""}
                </TableCell>
                <TableCell className="text-left w-[16%] p-2 border hidden lg:table-cell">
                  Address
                </TableCell>
                <TableCell className="text-left p-2 border 2-[36%] hidden lg:table-cell">
                  {userdata?.address ?? ""}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-left w-60 p-2 border lg:hidden">
                  Address
                </TableCell>
                <TableCell className="text-left p-2 border lg:hidden">
                  {userdata?.address ?? ""}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
};

export default UserRegister;
