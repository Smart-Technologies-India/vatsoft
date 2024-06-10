"use client";

import { Button } from "@/components/ui/button";
import { FormSteps } from "@/components/formstepts";
import { annexure1, user } from "@prisma/client";
import { useEffect, useRef, useState } from "react";
import GetUser from "@/action/user/getuser";
import { getCookie } from "cookies-next";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { IcBaselineCalendarMonth } from "@/components/icons";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import GetAnx1User from "@/action/anx1/getanx1";
import { Switch } from "@/components/ui/switch";
import { ApiResponseType } from "@/models/response";
import Anx1Update from "@/action/anx1/updateauth";

const Dvat2Page = () => {
  const userid: number = parseInt(getCookie("id") ?? "0");

  const router = useRouter();

  const [user, setUser] = useState<user>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmit, setIsSubmit] = useState<boolean>(false);

  const [Annexuredata, setAnnexuredata] = useState<annexure1[]>([]);

  const handelSubmit = () => {
    router.push("/dashboard/preview");
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);

      const user = await GetUser({ id: userid });

      if (user.status) {
        setUser(user.data!);
      } else {
        toast.error(user.message);
      }

      const getanx1resposne = await GetAnx1User({ userid: userid });

      if (getanx1resposne.status) {
        setAnnexuredata(getanx1resposne.data!);
      }
      setIsLoading(false);
    };
    init();
  }, [userid]);

  const updateAnx1Auth = async (id: number, auth: boolean) => {
    const userrespone: ApiResponseType<annexure1 | null> = await Anx1Update({
      id: id,
      auth: auth,
    });
    if (userrespone.status) {
      toast.success("Annexure I updated successfully");
      const getanx1resposne = await GetAnx1User({ userid: userid });

      if (getanx1resposne.status) {
        setAnnexuredata(getanx1resposne.data!);
      }
    } else {
      toast.error(userrespone.message);
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
      <main className="min-h-screen bg-[#f6f7fb] w-full py-2 px-6">
        <div className="bg-white mx-auto p-4 shadow mt-6">
          <FormSteps
            completedSteps={7}
            labels={[
              "User",
              "DVAT01",
              "DVAT02",
              "DVAT03",
              "ANNEXURE-1",
              "ANNEXURE-2",
              "ANNEXURE-3",
              "Preview",
            ]}
          ></FormSteps>
        </div>

        <div className="bg-white mx-auto shadow mt-6">
          <Table>
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead className="w-[100px]">Type</TableHead>
                <TableHead className="w-[200px]">Name</TableHead>
                <TableHead className="w-[60px]">Contact</TableHead>
                <TableHead className="w-[160px]">
                  Is Authorised Signatory
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Annexuredata.map((data) => {
                return (
                  <TableRow key={data.id}>
                    <TableCell className="font-medium">
                      {data.titleParticulasOfperson}
                    </TableCell>
                    <TableCell>{data.nameOfPerson}</TableCell>
                    <TableCell>{data.contact}</TableCell>
                    <TableCell>
                      <Switch
                        onCheckedChange={(e: boolean) => {
                          updateAnx1Auth(data.id, e);
                        }}
                        checked={data.isAuthorisedSignatory}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <div className="p-4 flex">
            <div className="grow"></div>
            {isSubmit ? (
              <Button
                disabled={true}
                className="w-20  bg-blue-500 hover:bg-blue-600 text-white py-1 text-sm mt-2 h-8 "
              >
                Loading...
              </Button>
            ) : (
              <Button
                onClick={handelSubmit}
                className="w-20  bg-blue-500 hover:bg-blue-600 text-white py-1 text-sm mt-2 h-8 "
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default Dvat2Page;
