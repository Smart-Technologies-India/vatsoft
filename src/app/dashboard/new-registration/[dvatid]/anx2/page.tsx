"use client";

import { Button } from "@/components/ui/button";
import { FormSteps } from "@/components/formstepts";
import {
  LocationOfBusinessPlace,
  TypeOfPerson,
  annexure2,
  user,
} from "@prisma/client";
import { useEffect, useRef, useState } from "react";
import GetUser from "@/action/user/getuser";
import { getCookie } from "cookies-next";
import { toast } from "react-toastify";
import { useParams, useRouter } from "next/navigation";
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
import { safeParse } from "valibot";
import { Anx2Schema } from "@/schema/anx2";
import { ApiResponseType } from "@/models/response";
import Anx2Create from "@/action/anx2/addanx2";
import GetAnx2ById from "@/action/anx2/getanxbyid";
import GetAnx2 from "@/action/anx2/getanx2";

const Dvat2Page = () => {
  const { dvatid } = useParams<{ dvatid: string | string[] }>();
  const dvat04id = parseInt(Array.isArray(dvatid) ? dvatid[0] : dvatid);

  const current_user_id: number = parseInt(getCookie("id") ?? "0");

  const [anx1id, setAnxid] = useState<number>(0);

  const router = useRouter();

  const [user, setUser] = useState<user>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmit, setIsSubmit] = useState<boolean>(false);

  // enum Type {
  //   BRACH_OFFICE = "BRACH_OFFICE",
  //   FACTORY = "FACTORY",
  //   GODOWN = "GODOWN",
  //   SHOP = "SHOP",
  // }
  // enum PlaceOfBusiness {
  //   WITHIN_STATE = "WITHIN_STATE",
  //   OUTSIDE_STATE = "OUTSIDE_STATE",
  // }

  const [Annexuredata, setAnnexuredata] = useState<annexure2[]>([]);

  const [type, setType] = useState<TypeOfPerson>();

  const [placeOfBusiness, setPlaceOfBusiness] =
    useState<LocationOfBusinessPlace>();

  const [dateofestablishment, setDateofestablishment] = useState<Date>();
  const [startDPop, setStartDPop] = useState<boolean>(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const contactRef = useRef<HTMLInputElement>(null);
  const branchNameRef = useRef<HTMLInputElement>(null);

  const rBuildingNameRef = useRef<HTMLInputElement>(null);
  const rAreaRef = useRef<HTMLInputElement>(null);
  const rVillageRef = useRef<HTMLInputElement>(null);
  const rPinCodeRef = useRef<HTMLInputElement>(null);

  const underStateACTRef = useRef<HTMLInputElement>(null);
  const underCSTACTRef = useRef<HTMLInputElement>(null);

  const handelSubmit = () => {
    if (Annexuredata.length === 0) return toast.error("Please add Annexure II");
    router.push(`/dashboard/new-registration/${dvat04id}/anx3`);
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);

      const user = await GetUser({ id: current_user_id });

      if (user.status) {
        setUser(user.data!);
      } else {
        toast.error(user.message);
      }

      const getanx2resposne = await GetAnx2({ dvatid: dvat04id });

      if (getanx2resposne.status) {
        setAnnexuredata(getanx2resposne.data!);
      }

      setIsLoading(false);
    };
    init();
  }, [current_user_id, dvat04id]);

  const createAnx1 = async () => {
    setIsSubmit(true);
    const result = safeParse(Anx2Schema, {
      typeOfPerson: type,
      name: nameRef.current?.value,
      branchName: branchNameRef.current?.value,
      contact: contactRef.current?.value,
      buildingName: rBuildingNameRef.current?.value,
      areaName: rAreaRef.current?.value,
      village: rVillageRef.current?.value,
      pinCode: rPinCodeRef.current?.value,
      dateOfExtablishment: dateofestablishment?.toString(),
      locationOfBusinessPlace: placeOfBusiness,
      underStateAct: underStateACTRef.current?.value,
      underCstAct: underCSTACTRef.current?.value,
    });

    if (result.success) {
      const userrespone: ApiResponseType<annexure2 | null> = await Anx2Create({
        dvatId: dvat04id,
        createdById: current_user_id,
        typeOfPerson: result.output.typeOfPerson,
        name: result.output.name,
        branchName: result.output.branchName,
        contact: result.output.contact,
        buildingName: result.output.buildingName,
        areaName: result.output.areaName,
        village: result.output.village,
        pinCode: result.output.pinCode,
        dateOfExtablishment: new Date(result.output.dateOfExtablishment),
        locationOfBusinessPlace: result.output.locationOfBusinessPlace,
        underStateAct: result.output.underStateAct,
        underCstAct: result.output.underCstAct,
      });
      if (userrespone.status) {
        toast.success("Annexure II added successfully");
        window.location.reload();
      } else {
        toast.error(userrespone.message);
      }
    } else {
      let errorMessage = "";
      if (result.issues[0].input) {
        errorMessage = result.issues[0].message;
      } else {
        errorMessage = result.issues[0].path![0].key + " is required";
      }
      toast.error(errorMessage);
    }
    setIsSubmit(false);
  };

  const edit = async (id: number) => {
    setAnxid(id);
    const data = await GetAnx2ById({ id: id });

    if (data.status) {
      nameRef.current!.value = data.data!.name!;
      setType(data.data!.typeOfPerson!);
      branchNameRef.current!.value = data.data!.branchName ?? "";
      contactRef.current!.value = data.data!.contact ?? "";
      setPlaceOfBusiness(data.data?.locationOfBusinessPlace!);
      rBuildingNameRef.current!.value = data.data!.buildingName ?? "";
      rAreaRef.current!.value = data.data!.areaName ?? "";
      rVillageRef.current!.value = data.data!.village ?? "";
      rPinCodeRef.current!.value = data.data!.pinCode ?? "";
      setDateofestablishment(new Date(data.data!.dateOfExtablishment!));
      setPlaceOfBusiness(data.data?.locationOfBusinessPlace!);
      underStateACTRef.current!.value = data.data!.underStateAct ?? "";
      underCSTACTRef.current!.value = data.data!.underCstAct ?? "";
    }
  };

  const cancelUpdate = () => {
    setAnxid(0);
    nameRef.current!.value = "";
    setType(undefined);
    branchNameRef.current!.value = "";
    contactRef.current!.value = "";
    setPlaceOfBusiness(undefined);

    rBuildingNameRef.current!.value = "";
    rAreaRef.current!.value = "";
    rVillageRef.current!.value = "";
    rPinCodeRef.current!.value = "";
    setDateofestablishment(undefined);
    setPlaceOfBusiness(undefined);
    underStateACTRef.current!.value = "";
    underCSTACTRef.current!.value = "";
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
            completedSteps={6}
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
        <div className="bg-white w-full p-4 px-8 shadow mt-2">
          <div className="flex gap-2">
            <p className="text-lg font-nunito">Annexure II</p>
            <div className="grow"></div>
            <p className="text-sm">
              <span className="text-red-500">*</span> Include mandatory fields
            </p>
          </div>

          <div className="rounded-sm p-4 border border-black mt-6 relative">
            <span className="-translate-y-7 bg-white px-1 -translate-x-2 inline-block absolute text-sm">
              Details of Additional Places of Business
            </span>

            <div className="flex gap-4 items-end mt-2">
              <div className="flex-1">
                <Label htmlFor="name" className="text-sm font-normal">
                  Name of the Applicant <span className="text-red-500">*</span>
                </Label>
                <Input
                  ref={nameRef}
                  type="text"
                  name="name"
                  id="name"
                  className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                  placeholder="Name of the Applicant"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="deposittype" className="text-sm font-normal">
                  Type <span className="text-rose-500">*</span>
                </Label>
                <Select
                  onValueChange={(val) => {
                    setType(val as TypeOfPerson);
                  }}
                >
                  <SelectTrigger className="focus-visible:ring-transparent mt-1  h-8 px-2 py-1 text-xs rounded-sm">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    <SelectGroup>
                      <SelectItem value={"BRACH_OFFICE"}>
                        Branch Office
                      </SelectItem>
                      <SelectItem value={"FACTORY"}>Factory</SelectItem>
                      <SelectItem value={"GODOWN"}>Gpdown/Warehous</SelectItem>
                      <SelectItem value={"SHOP"}>Shop</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-4 mt-2">
              <div className="flex-1">
                <Label htmlFor="branchname" className="text-sm font-normal">
                  Branch Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  ref={branchNameRef}
                  type="text"
                  name="branchname"
                  id="branchname"
                  className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                  placeholder="Branch Name"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="contact" className="text-sm font-normal">
                  Contact Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  ref={contactRef}
                  type="text"
                  name="contact"
                  id="contact"
                  className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                  placeholder="Contact Number"
                />
              </div>
            </div>
          </div>

          <div className="rounded-sm p-4 border border-black mt-6 relative">
            <span className="-translate-y-7 bg-white px-1 -translate-x-2 inline-block absolute text-sm">
              Address
            </span>

            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="r_buildingname" className="text-sm font-normal">
                  Building Name/ Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  ref={rBuildingNameRef}
                  type="text"
                  name="r_buildingname"
                  id="r_buildingname"
                  className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                  placeholder="Building Name/ Number"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="r_area" className="text-sm font-normal">
                  Area/ Road/ Locality/ Market
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  ref={rAreaRef}
                  type="text"
                  name="r_area"
                  id="r_area"
                  className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                  placeholder="Area / Road / Locality / Market"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="r_village" className="text-sm font-normal">
                  Village/ Town
                  <span className="text-red-500">*</span>
                </Label>

                <Input
                  ref={rVillageRef}
                  type="text"
                  name="r_village"
                  id="r_village"
                  className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                  placeholder="Village/ Town"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="r_pincode" className="text-sm font-normal">
                  Pincode <span className="text-red-500">*</span>
                </Label>
                <Input
                  ref={rPinCodeRef}
                  type="text"
                  name="r_pincode"
                  id="r_pincode"
                  className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                  placeholder="Pincode"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-2">
              <div className="flex-1">
                <Label
                  htmlFor="noticeservingcity"
                  className="text-sm font-normal"
                >
                  Date of Establishment
                  <span className="text-red-500">*</span>
                </Label>
                <Popover open={startDPop} onOpenChange={setStartDPop}>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={`w-full justify-start text-left font-normal  h-8 px-2 py-1 text-xs rounded-sm ${
                        !dateofestablishment ?? "text-muted-foreground"
                      }`}
                    >
                      <IcBaselineCalendarMonth className="mr-2 h-4 w-4" />
                      {dateofestablishment ? (
                        format(dateofestablishment, "PPP")
                      ) : (
                        <span>Date of Establishment</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateofestablishment}
                      onSelect={(e) => {
                        setDateofestablishment(e);
                        setStartDPop(false);
                      }}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex-1">
                <Label
                  htmlFor="placeOfBusiness"
                  className="text-sm font-normal"
                >
                  Location of Business Place{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <RadioGroup
                  className="flex gap-2 mt-2"
                  id="placeOfBusiness"
                  value={placeOfBusiness}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="WITHIN_STATE"
                      id="WITHIN_STATE"
                      onClick={() =>
                        setPlaceOfBusiness(LocationOfBusinessPlace.WITHIN_STATE)
                      }
                    />
                    <Label
                      htmlFor="WITHIN_STATE"
                      className="cursor-pointer text-xs font-normal"
                      onClick={() =>
                        setPlaceOfBusiness(LocationOfBusinessPlace.WITHIN_STATE)
                      }
                    >
                      Within State
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="OUTSIDE_STATE"
                      id="OUTSIDE_STATE"
                      onClick={() =>
                        setPlaceOfBusiness(
                          LocationOfBusinessPlace.OUTSIDE_STATE
                        )
                      }
                    />
                    <Label
                      htmlFor="OUTSIDE_STATE"
                      className="cursor-pointer  text-xs font-normal"
                      onClick={() =>
                        setPlaceOfBusiness(
                          LocationOfBusinessPlace.OUTSIDE_STATE
                        )
                      }
                    >
                      Outside State
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>

          <div className="rounded-sm p-4 border border-black mt-6 relative">
            <span className="-translate-y-7 bg-white px-1 -translate-x-2 inline-block absolute text-sm">
              Registration No. of Branch
            </span>

            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="understate" className="text-sm font-normal">
                  Under State Act <span className="text-red-500">*</span>
                </Label>
                <Input
                  ref={underStateACTRef}
                  type="text"
                  name="understate"
                  id="understate"
                  className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                  placeholder="Under State Act"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="undercst" className="text-sm font-normal">
                  Under CST Act, 1958 <span className="text-red-500">*</span>
                </Label>
                <Input
                  ref={underCSTACTRef}
                  type="text"
                  name="undercst"
                  id="undercst"
                  className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                  placeholder="Under CST Act, 1958"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {anx1id == 0 || anx1id == undefined || anx1id == null ? (
              <Button
                onClick={createAnx1}
                className="w-20  bg-blue-500 hover:bg-blue-600 text-white py-1 text-sm mt-2 h-8 "
              >
                Add
              </Button>
            ) : (
              <>
                <Button className="w-20  bg-blue-500 hover:bg-blue-600 text-white py-1 text-sm mt-2 h-8 ">
                  Update
                </Button>
                <Button
                  onClick={cancelUpdate}
                  className="w-20  bg-blue-500 hover:bg-blue-600 text-white py-1 text-sm mt-2 h-8 "
                >
                  Cancel
                </Button>
              </>
            )}

            <div className="grow"></div>
            <Button
              onClick={() =>
                router.push(
                  `/dashboard/new-registration/${dvat04id}/anx1`
                )
              }
              className="w-20  bg-blue-500 hover:bg-blue-600 text-white py-1 text-sm mt-2 h-8 "
            >
              Previous
            </Button>
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

        {Annexuredata.length > 0 && (
          <div className="bg-white mx-auto shadow mt-6">
            <Table>
              <TableHeader className="bg-gray-100">
                <TableRow>
                  <TableHead className="w-[100px]">Type</TableHead>
                  <TableHead className="w-[200px]">Name</TableHead>
                  <TableHead className="w-[60px]">Contact</TableHead>
                  <TableHead className="w-[120px]">Branch Name</TableHead>
                  <TableHead className="w-[100px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Annexuredata.map((data) => {
                  return (
                    <TableRow key={data.id}>
                      <TableCell>{data.typeOfPerson}</TableCell>
                      <TableCell>{data.name}</TableCell>
                      <TableCell>{data.contact}</TableCell>
                      <TableCell>Yes</TableCell>
                      <TableCell className="flex gap-2">
                        <Button
                          className="text-white bg-blue-500 hover:bg-blue-600 hover:-translate-y-1 transition-all duration-500 rounded-sm px-2 h-8 text-sm flex items-center gap-2  font-medium py-2"
                          onClick={() => edit(data.id)}
                        >
                          Edit
                        </Button>
                        <Button
                          className="text-white bg-blue-500 hover:bg-blue-600 hover:-translate-y-1 transition-all duration-500 rounded-sm px-2 h-8 text-sm flex items-center gap-2  font-medium py-2"
                          onClick={() => {
                            router.push(
                              `/dashboard/new-registration/dvat2/${data.id}`
                            );
                          }}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </>
  );
};

export default Dvat2Page;
