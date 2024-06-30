"use client";

import { Button } from "@/components/ui/button";
import { FormSteps } from "@/components/formstepts";
import {
  Gender,
  TitleParticulasOfperson,
  annexure1,
  user,
} from "@prisma/client";
import { useEffect, useRef, useState } from "react";
import GetUser from "@/action/user/getuser";
import { getCookie } from "cookies-next";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { handleNumberChange } from "@/utils/methods";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Anx1Schema } from "@/schema/anx1";
import { ApiResponseType } from "@/models/response";
import Anx1Create from "@/action/anx1/addanx1";
import GetAnx1User from "@/action/anx1/getanx1";
import GetAnx1ById from "@/action/anx1/getanxbyid";

const Dvat2Page = () => {
  const id: number = parseInt(getCookie("id") ?? "0");

  const [anx1id, setAnxid] = useState<number>(0);

  const router = useRouter();

  const [user, setUser] = useState<user>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmit, setIsSubmit] = useState<boolean>(false);

  const [titleParticulasOfPerson, setTitleParticulasOfPerson] =
    useState<TitleParticulasOfperson>();

  const [Annexuredata, setAnnexuredata] = useState<annexure1[]>([]);
  const [isSameAddress, setIsSameAddress] = useState<boolean>(false);

  const [gender, setGender] = useState<Gender>(Gender.MALE);

  const [dateOfBirth, setdateOfBirth] = useState<Date>();
  const [startDPop, setStartDPop] = useState<boolean>(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const fatherNameRef = useRef<HTMLInputElement>(null);
  const panRef = useRef<HTMLInputElement>(null);
  const aadharRef = useRef<HTMLInputElement>(null);
  const designationRef = useRef<HTMLInputElement>(null);
  const eductionRef = useRef<HTMLInputElement>(null);

  const rBuildingNameRef = useRef<HTMLInputElement>(null);
  const rAreaRef = useRef<HTMLInputElement>(null);
  const rVillageRef = useRef<HTMLInputElement>(null);
  const rPinCodeRef = useRef<HTMLInputElement>(null);

  const pBuildingNameRef = useRef<HTMLInputElement>(null);
  const pAreaRef = useRef<HTMLInputElement>(null);
  const pVillageRef = useRef<HTMLInputElement>(null);
  const pPinCodeRef = useRef<HTMLInputElement>(null);

  const emailRef = useRef<HTMLInputElement>(null);
  const contactRef = useRef<HTMLInputElement>(null);

  const handelSubmit = () => {
    if (Annexuredata.length === 0) return toast.error("Please add Annexure I");
    router.push("/dashboard/new-registration/anx2");
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);

      const user = await GetUser({ id: id });

      if (user.status) {
        setUser(user.data!);
      } else {
        toast.error(user.message);
      }

      const getanx1resposne = await GetAnx1User({ userid: id });

      if (getanx1resposne.status) {
        setAnnexuredata(getanx1resposne.data!);
      }
      setIsLoading(false);
    };
    init();
  }, [id]);

  const createAnx1 = async () => {
    setIsSubmit(true);
    const result = safeParse(Anx1Schema, {
      titleParticulasOfperson: titleParticulasOfPerson,
      nameOfPerson: nameRef.current?.value,
      dateOfBirth: dateOfBirth?.toString(),
      gender: gender,
      fatherName: fatherNameRef.current?.value,
      panNumber: panRef.current?.value,
      aadharNumber: aadharRef.current?.value,
      designation: designationRef.current?.value,
      eductionQualification: eductionRef.current?.value,
      rbuildingName: rBuildingNameRef.current?.value,
      rareaName: rAreaRef.current?.value,
      rvillageName: rVillageRef.current?.value,
      rpincode: rPinCodeRef.current?.value,
      pbuildingName: pBuildingNameRef.current?.value,
      pareaName: pAreaRef.current?.value,
      pvillageName: pVillageRef.current?.value,
      ppincode: pPinCodeRef.current?.value,
      contact: contactRef.current?.value,
      email: emailRef.current?.value,
    });

    if (result.success) {
      const userrespone: ApiResponseType<annexure1 | null> = await Anx1Create({
        createdById: id,
        titleParticulasOfperson: result.output.titleParticulasOfperson,
        nameOfPerson: result.output.nameOfPerson,
        dateOfBirth: new Date(result.output.dateOfBirth),
        gender: result.output.gender,
        fatherName: result.output.fatherName,
        panNumber: result.output.panNumber,
        aadharNumber: result.output.aadharNumber,
        designation: result.output.designation,
        eductionQualification: result.output.eductionQualification,
        rbuildingName: result.output.rbuildingName,
        rareaName: result.output.rareaName,
        rvillageName: result.output.rvillageName,
        rpincode: result.output.rpincode,
        pbuildingName: result.output.pbuildingName,
        pareaName: result.output.pareaName,
        pvillageName: result.output.pvillageName,
        ppincode: result.output.ppincode,
        contact: result.output.contact,
        email: result.output.email,
      });
      if (userrespone.status) {
        toast.success("Annexure I added successfully");
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
    const data = await GetAnx1ById({ id: id });

    if (data.status) {
      setTitleParticulasOfPerson(data.data!.titleParticulasOfperson!);
      nameRef.current!.value = data.data!.nameOfPerson ?? "";
      setdateOfBirth(new Date(data.data!.dateOfBirth!));
      setGender(data.data?.gender!);
      fatherNameRef.current!.value = data.data!.fatherName ?? "";
      panRef.current!.value = data.data!.panNumber ?? "";
      aadharRef.current!.value = data.data!.aadharNumber ?? "";
      designationRef.current!.value = data.data!.designation ?? "";
      eductionRef.current!.value = data.data!.eductionQualification ?? "";
      rBuildingNameRef.current!.value = data.data!.rbuildingName ?? "";
      rAreaRef.current!.value = data.data!.rareaName ?? "";
      rVillageRef.current!.value = data.data!.rvillageName ?? "";
      rPinCodeRef.current!.value = data.data!.rpincode ?? "";
      pBuildingNameRef.current!.value = data.data!.pbuildingName ?? "";
      pAreaRef.current!.value = data.data!.pareaName ?? "";
      pVillageRef.current!.value = data.data!.pvillageName ?? "";
      pPinCodeRef.current!.value = data.data!.ppincode ?? "";
      contactRef.current!.value = data.data!.contact ?? "";
      emailRef.current!.value = data.data!.email ?? "";
    }
  };

  const cancelUpdate = () => {
    setAnxid(0);
    setTitleParticulasOfPerson(undefined);
    nameRef.current!.value = "";
    setdateOfBirth(undefined);
    setGender(Gender.MALE);
    fatherNameRef.current!.value = "";
    panRef.current!.value = "";
    aadharRef.current!.value = "";
    designationRef.current!.value = "";
    eductionRef.current!.value = "";
    rBuildingNameRef.current!.value = "";
    rAreaRef.current!.value = "";
    rVillageRef.current!.value = "";
    rPinCodeRef.current!.value = "";
    pBuildingNameRef.current!.value = "";
    pAreaRef.current!.value = "";
    pVillageRef.current!.value = "";
    pPinCodeRef.current!.value = "";
    contactRef.current!.value = "";
    emailRef.current!.value = "";
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
            completedSteps={5}
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
            <p className="text-lg font-nunito">Annexure I</p>
            <div className="grow"></div>
            <p className="text-sm">
              <span className="text-red-500">*</span> Include mandatory fields
            </p>
          </div>

          <div className="rounded-sm p-4 border border-black mt-6 relative">
            <span className="-translate-y-7 bg-white px-1 -translate-x-2 inline-block absolute text-sm">
              Particulars Of Person Having Interest In the Business
            </span>

            <div className="flex gap-4 items-end mt-2">
              <div className="flex-1">
                <Label htmlFor="deposittype" className="text-sm font-normal">
                  Title Particulars of person{" "}
                  <span className="text-rose-500">*</span>
                </Label>
                <Select
                  defaultValue={titleParticulasOfPerson}
                  onValueChange={(val) => {
                    setTitleParticulasOfPerson(val as TitleParticulasOfperson);
                  }}
                >
                  <SelectTrigger className="focus-visible:ring-transparent mt-1  h-8 px-2 py-1 text-xs rounded-sm">
                    <SelectValue placeholder="Select Title Particulars of person" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    <SelectGroup>
                      <SelectItem value={"PROPRIETOR"}>PROPRIETOR</SelectItem>
                      <SelectItem value={"PARTNER"}>PARTNER</SelectItem>
                      <SelectItem value={"DIRECTOR"}>DIRECTOR</SelectItem>
                      <SelectItem value={"CHAIRMAN"}>CHAIRMAN</SelectItem>
                      <SelectItem value={"MANAGER"}>MANAGER</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label htmlFor="name" className="text-sm font-normal">
                  Full Name of Person <span className="text-red-500">*</span>
                </Label>
                <Input
                  ref={nameRef}
                  type="text"
                  name="name"
                  id="name"
                  className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                  placeholder="Full Name of Person"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-2">
              <div className="flex-1">
                <Label
                  htmlFor="noticeservingcity"
                  className="text-sm font-normal"
                >
                  Date Of Birth
                  <span className="text-red-500">*</span>
                </Label>
                <Popover open={startDPop} onOpenChange={setStartDPop}>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={`w-full justify-start text-left font-normal  h-8 px-2 py-1 text-xs rounded-sm ${
                        !dateOfBirth ?? "text-muted-foreground"
                      }`}
                    >
                      <IcBaselineCalendarMonth className="mr-2 h-4 w-4" />
                      {dateOfBirth ? (
                        format(dateOfBirth, "PPP")
                      ) : (
                        <span>Birth Date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      fromDate={
                        new Date(
                          new Date().setFullYear(new Date().getFullYear() - 14)
                        )
                      }
                      mode="single"
                      selected={dateOfBirth}
                      onSelect={(e) => {
                        setdateOfBirth(e);
                        setStartDPop(false);
                      }}
                      initialFocus
                      // disabled={(date) =>
                      //   date >
                      //   new Date(
                      //     new Date().setFullYear(new Date().getFullYear() - 14)
                      //   )
                      // }
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex-1">
                <Label
                  htmlFor="noticeservingpincode"
                  className="text-sm font-normal"
                >
                  Gender <span className="text-red-500">*</span>
                </Label>
                <RadioGroup
                  defaultValue="exempt"
                  className="flex gap-2 mt-2"
                  id="gender"
                  value={gender}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="MALE"
                      id="MALE"
                      onClick={() => setGender(Gender.MALE)}
                    />
                    <Label
                      htmlFor="MALE"
                      className="cursor-pointer text-xs font-normal"
                      onClick={() => setGender(Gender.MALE)}
                    >
                      MALE
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="FEMALE"
                      id="FEMALE"
                      onClick={() => setGender(Gender.FEAMLE)}
                    />
                    <Label
                      htmlFor="FEMALE"
                      className="cursor-pointer  text-xs font-normal"
                      onClick={() => setGender(Gender.FEAMLE)}
                    >
                      FEMALE
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <div className="flex gap-4 mt-2">
              <div className="flex-1">
                <Label htmlFor="fathername" className="text-sm font-normal">
                  Father&apos;s Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  ref={fatherNameRef}
                  type="text"
                  name="fathername"
                  id="fathername"
                  className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                  placeholder="Father's Name"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="pan" className="text-sm font-normal">
                  PAN <span className="text-red-500">*</span>
                </Label>
                <Input
                  ref={panRef}
                  type="text"
                  name="pan"
                  id="pan"
                  className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                  placeholder="PAN"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-2">
              <div className="flex-1">
                <Label htmlFor="aadhar" className="text-sm font-normal">
                  Aadhar No.
                </Label>
                <Input
                  ref={aadharRef}
                  type="text"
                  name="aadhar"
                  id="aadhar"
                  className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                  placeholder="Aadhar No."
                  onChange={handleNumberChange}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="designation" className="text-sm font-normal">
                  Designation <span className="text-red-500">*</span>
                </Label>
                <Input
                  ref={designationRef}
                  type="text"
                  name="designation"
                  id="designation"
                  className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                  placeholder="Designation"
                />
              </div>
            </div>

            <div className="flex-1">
              <Label htmlFor="education" className="text-sm font-normal">
                Education Qualification <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={eductionRef}
                type="text"
                name="education"
                id="education"
                className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                placeholder="Education Qualification"
              />
            </div>
          </div>

          <div className="rounded-sm p-4 border border-black mt-6 relative">
            <span className="-translate-y-7 bg-white px-1 -translate-x-2 inline-block absolute text-sm">
              Residential Address
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
          </div>

          <div className="rounded-sm p-4 border border-black mt-6 relative">
            <span className="-translate-y-7 bg-white px-1 -translate-x-2 inline-block absolute text-sm">
              Permanent Address
            </span>

            <div className="text-sm flex gap-1 items-center ml-32 -translate-y-7 bg-white absolute px-1 right-2">
              <Checkbox
                onCheckedChange={(value: boolean) => {
                  setIsSameAddress(value);

                  if (value) {
                    pBuildingNameRef.current!.value =
                      rBuildingNameRef.current!.value;
                    pAreaRef.current!.value = rAreaRef.current!.value;
                    pVillageRef.current!.value = rVillageRef.current!.value;
                    pPinCodeRef.current!.value = rPinCodeRef.current!.value;
                  }
                }}
              />
              <p>as above</p>
            </div>

            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="p_buildingname" className="text-sm font-normal">
                  Building Name/ Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  ref={pBuildingNameRef}
                  type="text"
                  name="p_buildingname"
                  id="p_buildingname"
                  className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                  placeholder="Building Name/ Number"
                  disabled={isSameAddress}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="p_area" className="text-sm font-normal">
                  Area/ Road/ Locality/ Market
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  ref={pAreaRef}
                  type="text"
                  name="p_area"
                  id="p_area"
                  className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                  placeholder="Area / Road / Locality / Market"
                  disabled={isSameAddress}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="p_village" className="text-sm font-normal">
                  Village/ Town
                  <span className="text-red-500">*</span>
                </Label>

                <Input
                  ref={pVillageRef}
                  type="text"
                  name="p_village"
                  id="p_village"
                  className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                  placeholder="Village/ Town"
                  disabled={isSameAddress}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="p_pincode" className="text-sm font-normal">
                  Pincode <span className="text-red-500">*</span>
                </Label>
                <Input
                  ref={pPinCodeRef}
                  type="text"
                  name="p_pincode"
                  id="p_pincode"
                  className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                  placeholder="Pincode"
                  disabled={isSameAddress}
                />
              </div>
            </div>
          </div>

          <div className="rounded-sm p-4 border border-black mt-6 relative">
            <span className="-translate-y-7 bg-white px-1 -translate-x-2 inline-block absolute text-sm">
              Contact Details
            </span>

            <div className="flex gap-4">
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
                  onChange={handleNumberChange}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="email" className="text-sm font-normal">
                  Email Id <span className="text-red-500">*</span>
                </Label>
                <Input
                  ref={emailRef}
                  type="text"
                  name="email"
                  id="email"
                  className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                  placeholder="Email Id"
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
              onClick={() => router.push("/dashboard/new-registration/dvat3")}
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
                  <TableHead className="w-[160px]">
                    Is Authorised Signatory
                  </TableHead>
                  <TableHead className="w-[80px]">Action</TableHead>
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
                        {data.isAuthorisedSignatory ? "YES" : "NO"}
                      </TableCell>

                      <TableCell className="flex gap-2">
                        <Button
                          onClick={() => edit(data.id)}
                          className="text-white bg-blue-500 hover:bg-blue-600 hover:-translate-y-1 transition-all duration-500 rounded-sm px-2 h-8 text-sm flex items-center gap-2  font-medium py-2"
                        >
                          Edit
                        </Button>
                        <Button className="text-white bg-blue-500 hover:bg-blue-600 hover:-translate-y-1 transition-all duration-500 rounded-sm px-2 h-8 text-sm flex items-center gap-2  font-medium py-2">
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
