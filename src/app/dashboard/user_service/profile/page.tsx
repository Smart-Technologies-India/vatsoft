"use client";

import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useEffect, useState } from "react";
import { user } from "@prisma/client";
import GetUser from "@/action/user/getuser";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";

const UserRegister = () => {
  const router = useRouter();
  const [userid, setUserid] = useState<number>(0);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userdata, setUserData] = useState<user | null>(null);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
      setUserid(authResponse.data);

      const user = await GetUser({ id: authResponse.data });

      if (user.status && user.data) {
        setUserData(user.data);
      } else {
        toast.error(user.message);
      }

      setIsLoading(false);
    };
    init();
  }, [userid]);

  if (isLoading) {
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50 to-indigo-50 p-4">
        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6">
          <div className="bg-linear-to-r from-blue-500 to-indigo-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-white rounded-full"></div>
              <h1 className="text-2xl font-bold text-white">User Profile</h1>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6">
            <Table className="border border-gray-200 rounded-lg overflow-hidden">
              <TableBody>
                <TableRow className="bg-linear-to-r from-blue-50 to-indigo-50">
                  <TableCell className="text-left w-[16%] p-3 border font-semibold text-gray-900">
                    First Name
                  </TableCell>
                  <TableCell className="text-left p-3 border w-[36%] text-gray-900">
                    {userdata?.firstName ?? ""}
                  </TableCell>
                  <TableCell className="text-left w-[16%] p-3 border hidden lg:table-cell font-semibold text-gray-900">
                    Last Name
                  </TableCell>
                  <TableCell className="text-left p-3 border w-[36%] hidden lg:table-cell text-gray-900">
                    {userdata?.lastName ?? ""}
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-blue-50 transition-colors">
                  <TableCell className="text-left w-60 p-3 border lg:hidden font-semibold text-gray-900">
                    Last Name
                  </TableCell>
                  <TableCell className="text-left p-3 border lg:hidden text-gray-900">
                    {userdata?.lastName ?? ""}
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-blue-50 transition-colors">
                  <TableCell className="text-left w-[16%] p-3 border font-semibold text-gray-900">
                    Email
                  </TableCell>
                  <TableCell className="text-left p-3 border w-[36%] text-gray-900">
                    {userdata?.email ?? ""}
                  </TableCell>
                  <TableCell className="text-left w-[16%] p-3 border hidden lg:table-cell font-semibold text-gray-900">
                    Mobile Number
                  </TableCell>
                  <TableCell className="text-left p-3 border w-[36%] hidden lg:table-cell text-gray-900">
                    {userdata?.mobileOne ?? ""}
                  </TableCell>
                </TableRow>
                <TableRow className="bg-linear-to-r from-blue-50 to-indigo-50">
                  <TableCell className="text-left w-60 p-3 border lg:hidden font-semibold text-gray-900">
                    Mobile Number
                  </TableCell>
                  <TableCell className="text-left p-3 border lg:hidden text-gray-900">
                    {userdata?.mobileOne ?? ""}
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-blue-50 transition-colors">
                  <TableCell className="text-left w-[16%] p-3 border font-semibold text-gray-900">
                    Alternate Number
                  </TableCell>
                  <TableCell className="text-left p-3 border w-[36%] text-gray-900">
                    {userdata?.mobileTwo ?? ""}
                  </TableCell>
                  <TableCell className="text-left p-3 border w-[16%] hidden lg:table-cell font-semibold text-gray-900">
                    Pan Card
                  </TableCell>
                  <TableCell className="text-left p-3 border w-[36%] hidden lg:table-cell text-gray-900">
                    {userdata?.pan ?? ""}
                  </TableCell>
                </TableRow>
                <TableRow className="bg-linear-to-r from-blue-50 to-indigo-50">
                  <TableCell className="text-left w-60 p-3 border lg:hidden font-semibold text-gray-900">
                    Pan Card
                  </TableCell>
                  <TableCell className="text-left p-3 border lg:hidden text-gray-900">
                    {userdata?.pan ?? ""}
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-blue-50 transition-colors">
                  <TableCell className="text-left w-[16%] p-3 border font-semibold text-gray-900">
                    Aadhar Card
                  </TableCell>
                  <TableCell className="text-left p-3 border w-[36%] text-gray-900">
                    {userdata?.aadhar ?? ""}
                  </TableCell>
                  <TableCell className="text-left w-[16%] p-3 border hidden lg:table-cell font-semibold text-gray-900">
                    Address
                  </TableCell>
                  <TableCell className="text-left p-3 border w-[36%] hidden lg:table-cell text-gray-900">
                    {userdata?.address ?? ""}
                  </TableCell>
                </TableRow>
                <TableRow className="bg-linear-to-r from-blue-50 to-indigo-50">
                  <TableCell className="text-left w-60 p-3 border lg:hidden font-semibold text-gray-900">
                    Address
                  </TableCell>
                  <TableCell className="text-left p-3 border lg:hidden text-gray-900">
                    {userdata?.address ?? ""}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </>
  );
};

export default UserRegister;
