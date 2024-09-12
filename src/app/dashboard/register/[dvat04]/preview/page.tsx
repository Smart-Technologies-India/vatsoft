"use client";

import { Button } from "@/components/ui/button";
import {
  AccountingBasis,
  CommidityPursose,
  ConstitutionOfBusiness,
  FrequencyFilings,
  Gender,
  NatureOfBusiness,
  SelectOffice,
  TitleParticulasOfperson,
  TypeOfAccount,
  TypeOfRegistration,
  annexure1,
  dvat04,
  user,
  commodity,
  DepositType,
  TypeOfPerson,
  LocationOfBusinessPlace,
  annexure2,
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

import { Textarea } from "@/components/ui/textarea";
import { handleNumberChange } from "@/utils/methods";
import { Checkbox } from "@/components/ui/checkbox";
import GetAnx1ById from "@/action/anx1/getanxbyid";
import GetDvat from "@/action/user/register/getdvat";
import { CommodityData } from "@/models/main";
import GetAllCommodity from "@/action/commodity/getcommodity";
import GetAnx2ById from "@/action/anx2/getanxbyid";
import { Modal } from "antd";
import { customAlphabet } from "nanoid";
import GetDvat04 from "@/action/register/getdvat04";
import AddTempRegNo from "@/action/register/addtempregno";
import GetAnx1 from "@/action/anx1/getanx1";
import GetAnx2 from "@/action/anx2/getanx2";
const nanoid = customAlphabet("1234567890", 12);

const PreviewPage = () => {
  const { dvat04 } = useParams<{ dvat04: string | string[] }>();
  const dvatidString = Array.isArray(dvat04) ? dvat04[0] : dvat04;

  const dvatid: number = parseInt(dvatidString);
  const current_user_id: number = parseInt(getCookie("id") ?? "0");
  const tempregno: string = nanoid();

  const router = useRouter();

  const [pageIndex, setPageIndex] = useState<number>(1);

  const nextPage = () => {
    if (pageIndex < 7) {
      setPageIndex(pageIndex + 1);
    }
  };

  const prevPage = () => {
    if (pageIndex > 1) {
      setPageIndex(pageIndex - 1);
    }
  };

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [open, setOpen] = useState(false);

  const [dvat04Data, setDvat04Data] = useState<dvat04>();

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);

      const dvat04 = await GetDvat04({ id: dvatid });

      if (dvat04.status && dvat04.data) {
        setDvat04Data(dvat04.data);
      }

      setIsLoading(false);
    };
    init();
  }, []);

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );

  return (
    <>
      <main className="min-h-screen bg-[#f6f7fb] w-full py-2 px-6">
        <div className="bg-white shadow p-2 flex justify-between mt-2">
          {[
            "USER",
            "DVAT01",
            "DVAT02",
            "DVAT03",
            "ANNEXURE-1",
            "ANNEXURE-2",
            "ANNEXURE-3",
          ].map((val: string, index: number) => {
            return (
              <div
                onClick={() => setPageIndex(index + 1)}
                key={index}
                className={` px-2 py-1 flex-1 grid place-items-center cursor-pointer ${
                  pageIndex == index + 1
                    ? "bg-[#0c0c32] text-white"
                    : "text-[#0c0c32]"
                }`}
              >
                {val}
              </div>
            );
          })}
        </div>

        <div className="bg-white mx-auto shadow mt-4">
          {pageIndex == 1 && <UserRegister />}
          {pageIndex == 2 && <Dvat1Page />}
          {pageIndex == 3 && <Dvat2Page />}
          {pageIndex == 4 && <Dvat3Page />}
          {pageIndex == 5 && <Anx1Page dvatid={dvatid} />}
          {pageIndex == 6 && <Anx2Page dvatid={dvatid} />}
          {pageIndex == 7 && <Anx3Page dvatid={dvatid} />}
          <div className="flex p-4">
            <div className="grow"></div>

            {pageIndex != 1 && (
              <Button
                onClick={prevPage}
                className="w-20  bg-blue-500 hover:bg-blue-600 text-white py-1 text-sm mt-2 h-8 "
              >
                Previous
              </Button>
            )}
            <div className="w-6"></div>

            {pageIndex < 7 && (
              <Button
                onClick={nextPage}
                className="w-20  bg-blue-500 hover:bg-blue-600 text-white py-1 text-sm mt-2 h-8 "
              >
                Next
              </Button>
            )}

            {pageIndex == 7 && (
              <Button
                onClick={async () => {
                  if (dvat04Data?.status == "NONE") {
                    setOpen(true);
                  } else {
                    router.push("/dashboard");
                  }
                }}
                // onClick={() => router.push("/dashboard")}
                className="w-20  bg-blue-500 hover:bg-blue-600 text-white py-1 text-sm mt-2 h-8 "
              >
                Finish
              </Button>
            )}
          </div>
        </div>
      </main>
      <Modal
        title="Registration Number"
        open={open}
        onOk={async () => {
          setOpen(false);

          const response = await AddTempRegNo({
            tempregno: tempregno,
            id: dvat04Data?.id ?? 0,
            userid: current_user_id,
          });
          if (!response.status && !response.data)
            return toast.error(response.message);

          return router.push("/dashboard");
        }}
        onCancel={() => setOpen(false)}
      >
        <p>Your temporary registration number is: {tempregno}</p>
      </Modal>
    </>
  );
};

export default PreviewPage;

const UserRegister = () => {
  const id: number = parseInt(getCookie("id") ?? "0");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [userdata, setUserData] = useState<user>();

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

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );

  return (
    <>
      <div className="w-full p-4 px-8  mt-2">
        <div className="flex gap-2">
          <p className="text-lg font-nunito">User Registration</p>
          <div className="grow"></div>
        </div>

        <div className="gap-4 mt-1 grid grid-cols-3">
          <div className="">
            <p className="text-xs font-normal text-gray-500">First Name</p>
            <p className="font-semibold text-sm ">
              {userdata?.firstName ?? ""}
            </p>
          </div>
          <div className="">
            <p className="text-xs font-normal text-gray-500">Last Name</p>
            <p className="font-semibold text-sm ">{userdata?.lastName ?? ""}</p>
          </div>
          <div className="">
            <p className="text-xs font-normal text-gray-500">Email</p>
            <p className="font-semibold text-sm ">{userdata?.email ?? ""}</p>
          </div>

          <div className="">
            <p className="text-xs font-normal text-gray-500">Mobile Number</p>
            <p className="font-semibold text-sm ">
              {userdata?.mobileOne ?? ""}
            </p>
          </div>
          <div className="">
            <p className="text-xs font-normal text-gray-500">
              Alternate Number
            </p>
            <p className="font-semibold text-sm ">
              {userdata?.mobileTwo ?? ""}
            </p>
          </div>
          <div className="">
            <p className="text-xs font-normal text-gray-500">Pan Card</p>
            <p className="font-medium text-sm">{userdata?.pan ?? ""}</p>
          </div>

          <div className="">
            <p className="text-xs font-normal text-gray-500">Aadhar Card</p>
            <p className="font-medium text-sm ">{userdata?.aadhar ?? ""}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs font-normal text-gray-500">Address</p>
            <p className="font-medium text-sm ">
              {userdata?.lastName ?? ""}
              Lorem ipsum dolor sit amet consectetur, adipisicing elit. Dolor ex
              magni recusandae quam. Debitis eos itaque ea fugiat eaque sint
              perferendis, ex voluptates a! Molestiae repellat, magni facilis
              sunt explicabo possimus aliquid eos unde? Voluptatem doloremque
              voluptate aut aperiam cumque, similique ea dolore neque minus sit
              tempore cupiditate itaque consequatur est nisi dolor iusto dolorem
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

const Dvat1Page = () => {
  const current_user_id: number = parseInt(getCookie("id") ?? "0");

  enum TrueFalse {
    YES = "YES",
    NO = "NO",
  }

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [dvatData, setDvatData] = useState<dvat04>();

  const nameRef = useRef<HTMLInputElement>(null);
  const tradenameRef = useRef<HTMLInputElement>(null);
  const [natureOfBusiness, setNatureOfBusiness] = useState<NatureOfBusiness>(
    NatureOfBusiness.MANUFACTURING
  );

  const [selectOffice, setSelectOffice] = useState<SelectOffice>(
    SelectOffice.Dadra_Nagar_Haveli
  );

  const [constitutionOfBusiness, setConstitutionOfBusiness] =
    useState<ConstitutionOfBusiness>(ConstitutionOfBusiness.PARTNERSHIP);

  const [typeOfRegistration, setTypeOfRegistration] =
    useState<TypeOfRegistration>(TypeOfRegistration.GST);

  const [isCompositionScheme, setIsCompositionScheme] = useState<TrueFalse>(
    TrueFalse.NO
  );
  const [isAnnualTurnoverCategory, setIsAnnualTurnoverCategory] =
    useState<TrueFalse>(TrueFalse.NO);

  const turnoverLastFinancialYearRef = useRef<HTMLInputElement>(null);
  const turnoverCurrentFinancialYearRef = useRef<HTMLInputElement>(null);

  const [vatLiableDate, setVatLiableDate] = useState<Date>();
  const [startDPop, setStartDPop] = useState<boolean>(false);

  const panRef = useRef<HTMLInputElement>(null);
  const gstRef = useRef<HTMLInputElement>(null);
  const buildingNumberRef = useRef<HTMLInputElement>(null);
  const areaRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLTextAreaElement>(null);
  const cityRef = useRef<HTMLInputElement>(null);
  const pincodeRef = useRef<HTMLInputElement>(null);
  const contact_oneRef = useRef<HTMLInputElement>(null);
  const contact_twoRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const faxNumberRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);

      const dvatdata = await GetDvat({ userid: current_user_id });

      if (dvatdata.status) {
        setTimeout(() => {
          if (nameRef.current) nameRef.current!.value = dvatdata.data!.name!;
          if (tradenameRef.current)
            tradenameRef.current!.value = dvatdata.data!.tradename!;
          setNatureOfBusiness(dvatdata.data!.natureOfBusiness!);
          setConstitutionOfBusiness(dvatdata.data!.constitutionOfBusiness!);
          setSelectOffice(dvatdata.data!.selectOffice!);
          setTypeOfRegistration(dvatdata.data!.typeOfRegistration!);
          setIsCompositionScheme(
            dvatdata.data!.compositionScheme ? TrueFalse.YES : TrueFalse.NO
          );
          setIsAnnualTurnoverCategory(
            dvatdata.data!.annualTurnoverCategory ? TrueFalse.YES : TrueFalse.NO
          );
          if (turnoverLastFinancialYearRef.current)
            turnoverLastFinancialYearRef.current!.value =
              dvatdata.data!.turnoverLastFinancialYear!;
          if (turnoverCurrentFinancialYearRef.current)
            turnoverCurrentFinancialYearRef.current!.value =
              dvatdata.data!.turnoverCurrentFinancialYear!;
          setVatLiableDate(new Date(dvatdata.data!.vatLiableDate!));
          if (panRef.current) panRef.current!.value = dvatdata.data!.pan!;
          if (gstRef.current) gstRef.current!.value = dvatdata.data!.gst!;
          if (buildingNumberRef.current)
            buildingNumberRef.current!.value = dvatdata.data!.buildingNumber!;
          if (areaRef.current) areaRef.current!.value = dvatdata.data!.area!;
          if (addressRef.current)
            addressRef.current!.value = dvatdata.data!.address!;
          if (cityRef.current) cityRef.current!.value = dvatdata.data!.city!;
          if (pincodeRef.current)
            pincodeRef.current!.value = dvatdata.data!.pincode!;
          if (contact_oneRef.current)
            contact_oneRef.current!.value = dvatdata.data!.contact_one!;
          if (contact_twoRef.current)
            contact_twoRef.current!.value = dvatdata.data!.contact_two!;
          if (emailRef.current) emailRef.current!.value = dvatdata.data!.email!;
          if (faxNumberRef.current)
            faxNumberRef.current!.value = dvatdata.data!.faxNumber!;
        }, 1000);
        setDvatData(dvatdata.data!);
      }
      setIsLoading(false);
    };
    init();
  }, [current_user_id]);

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );

  return (
    <>
      <div className="w-full p-4 px-8 mt-2">
        <div className="flex gap-2">
          <p className="text-lg font-nunito">DVAT 04 (1 to 10)</p>
          <div className="grow"></div>
          <p className="text-sm">
            <span className="text-red-500">*</span> Include mandatory fields
          </p>
        </div>

        <div className="flex-1">
          <Label htmlFor="deposittype" className="text-sm font-normal">
            Select Office <span className="text-rose-500">*</span>
          </Label>
          <Select
            disabled={true}
            defaultValue={selectOffice}
            onValueChange={(val) => {
              setSelectOffice(val as SelectOffice);
            }}
          >
            <SelectTrigger className="focus-visible:ring-transparent mt-1  h-8 px-2 py-1 text-xs rounded-sm">
              <SelectValue placeholder="Select Office" />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              <SelectGroup>
                <SelectItem value={"Dadra_Nagar_Haveli"}>
                  Dept. of VAT - DNH
                </SelectItem>
                <SelectItem value={"Branch_Office"}>Branch Office</SelectItem>
                <SelectItem value={"Head_Office"}>Head Office</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-4 mt-2 items-end">
          <div className="flex-1">
            <Label htmlFor="name" className="text-sm font-normal">
              1.Full Name of Applicant Dealer{" "}
              <span className="text-red-500">*</span>
            </Label>
            <Input
              ref={nameRef}
              type="text"
              name="name"
              disabled={true}
              id="name"
              className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
              placeholder="Name"
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="tradename" className="text-sm font-normal">
              2. Trade Name (if any)
            </Label>
            <Input
              ref={tradenameRef}
              type="text"
              name="tradename"
              id="tradename"
              disabled={true}
              className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
              placeholder="Trade Name"
            />
          </div>
        </div>

        <div className="flex gap-4 mt-2 items-end">
          <div className="flex-1">
            <Label htmlFor="deposittype" className="text-sm font-normal">
              3. Nature of Business <span className="text-rose-500">*</span>
            </Label>
            <Select
              disabled={true}
              defaultValue={natureOfBusiness}
              onValueChange={(val) => {
                setNatureOfBusiness(val as NatureOfBusiness);
              }}
            >
              <SelectTrigger className="focus-visible:ring-transparent mt-1  h-8 px-2 py-1 text-xs rounded-sm">
                <SelectValue placeholder="Nature of Business" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectGroup>
                  <SelectItem value={"MANUFACTURING"}>MANUFACTURING</SelectItem>
                  <SelectItem value={"TRADING"}>TRADING</SelectItem>
                  <SelectItem value={"SERVICE"}>SERVICE</SelectItem>
                  <SelectItem value={"OTHER"}>OTHER</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label htmlFor="deposittype" className="text-sm font-normal">
              4. Constitution Of Business{" "}
              <span className="text-rose-500">*</span>
            </Label>
            <Select
              disabled={true}
              defaultValue={constitutionOfBusiness}
              onValueChange={(val) => {
                setConstitutionOfBusiness(val as ConstitutionOfBusiness);
              }}
            >
              <SelectTrigger className="focus-visible:ring-transparent mt-1  h-8 px-2 py-1 text-xs rounded-sm">
                <SelectValue placeholder="Constitution Of Business" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectGroup>
                  <SelectItem value={"PROPRIETORSHIP"}>
                    PROPRIETORSHIP
                  </SelectItem>
                  <SelectItem value={"PARTNERSHIP"}>PARTNERSHIP</SelectItem>
                  <SelectItem value={"LLP"}>LLP</SelectItem>
                  <SelectItem value={"PVT_LTD"}>PVT_LTD</SelectItem>
                  <SelectItem value={"PUBLIC_LTD"}>PUBLIC_LTD</SelectItem>
                  <SelectItem value={"OTHER"}>OTHER</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-4 mt-2  items-end">
          <div className="flex-1">
            <Label htmlFor="deposittype" className="text-sm font-normal">
              5. Type of Registration <span className="text-rose-500">*</span>
            </Label>
            <Select
              disabled={true}
              defaultValue={typeOfRegistration}
              onValueChange={(val) => {
                setTypeOfRegistration(val as TypeOfRegistration);
              }}
            >
              <SelectTrigger className="focus-visible:ring-transparent mt-1 h-8 px-2 py-1 text-xs rounded-sm">
                <SelectValue placeholder="Type of Registration" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectGroup>
                  <SelectItem value={"GST"}>GST</SelectItem>
                  <SelectItem value={"MSME"}>MSME</SelectItem>
                  <SelectItem value={"UDYAM"}>UDYAM</SelectItem>
                  <SelectItem value={"OTHER"}>OTHER</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <Label htmlFor="radio1" className="text-sm font-normal">
              5(a). Opting for composition scheme under section 16(2) for the
              Regulation ? <span className="text-rose-500">*</span>
            </Label>
            <RadioGroup
              disabled={true}
              defaultValue="exempt"
              className="flex gap-2 mt-2"
              id="radio1"
              value={isCompositionScheme}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="YES"
                  id="yes1"
                  onClick={() => setIsCompositionScheme(TrueFalse.YES)}
                />
                <Label
                  htmlFor="yes1"
                  className="cursor-pointer text-xs font-normal"
                  onClick={() => setIsCompositionScheme(TrueFalse.YES)}
                >
                  YES
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="NO"
                  id="no1"
                  onClick={() => setIsCompositionScheme(TrueFalse.NO)}
                />
                <Label
                  htmlFor="no1"
                  className="cursor-pointer  text-xs font-normal"
                  onClick={() => setIsCompositionScheme(TrueFalse.NO)}
                >
                  NO
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <div className="flex gap-4 mt-2 items-end">
          <div className="flex-1">
            <Label htmlFor="radio2" className="text-sm font-normal">
              6. Annual Turnover Category
              <span className="text-rose-500">*</span>
            </Label>
            <RadioGroup
              disabled={true}
              defaultValue="exempt"
              className="flex gap-2 mt-2"
              id="radio2"
              value={isAnnualTurnoverCategory}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="YES"
                  id="yes2"
                  onClick={() => setIsAnnualTurnoverCategory(TrueFalse.YES)}
                />
                <Label
                  htmlFor="yes2"
                  className="cursor-pointer text-xs font-normal"
                  onClick={() => setIsAnnualTurnoverCategory(TrueFalse.YES)}
                >
                  Less then Rs. 5 Lacs
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="NO"
                  id="no2"
                  onClick={() => setIsAnnualTurnoverCategory(TrueFalse.NO)}
                />
                <Label
                  htmlFor="no2"
                  className="cursor-pointer text-xs font-normal"
                  onClick={() => setIsAnnualTurnoverCategory(TrueFalse.NO)}
                >
                  Rs. 5 Lacs or above
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex-1">
            <Label htmlFor="turnoverlast" className="text-sm font-normal">
              6(a). Turnover of the last financial year{" "}
              <span className="text-red-500">*</span>
            </Label>
            <Input
              ref={turnoverLastFinancialYearRef}
              type="text"
              disabled={true}
              name="turnoverlast"
              id="turnoverlast"
              className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
              placeholder="Turnover of the last financial year"
            />
          </div>
        </div>

        <div className="flex gap-4 mt-2 items-end">
          {/* <div className="flex-1">
              <Label htmlFor="numberofpartners" className="text-sm font-normal">
                Number Of Partners <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={numberOfPartnersRef}
                type="text"
                name="numberofpartners"
                id="numberofpartners"
                className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                placeholder="Number Of Partners"
              />
            </div> */}
          <div className="flex-1">
            <Label htmlFor="tradename" className="text-sm font-normal">
              6(b). Expected turnover of the current financial year{" "}
              <span className="text-red-500">*</span>
            </Label>
            <Input
              ref={turnoverCurrentFinancialYearRef}
              type="text"
              disabled={true}
              name="turnovercurrent"
              id="turnovercurrent"
              className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
              placeholder="Turnover of the current financial year"
            />
          </div>

          <div className="grid items-center gap-1.5 w-full flex-1">
            <Label htmlFor="starttime" className="text-sm font-normal">
              7. Date from which liable for registration under Dadra and Nagar
              Haveli Value Added Tax regulation, 2005 (DD/MM/YYYY){" "}
              <span className="text-rose-500">*</span>
            </Label>

            <Popover open={startDPop} onOpenChange={setStartDPop}>
              <PopoverTrigger asChild>
                <Button
                  disabled={true}
                  variant={"outline"}
                  className={`w-full justify-start text-left font-normal  h-8 px-2 py-1 text-xs rounded-sm ${
                    !vatLiableDate ?? "text-muted-foreground"
                  }`}
                >
                  <IcBaselineCalendarMonth className="mr-2 h-4 w-4" />
                  {vatLiableDate ? (
                    format(vatLiableDate, "PPP")
                  ) : (
                    <span>Vat Liable Date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={vatLiableDate}
                  onSelect={(e) => {
                    setVatLiableDate(e);
                    setStartDPop(false);
                  }}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex gap-4 mt-2 items-end">
          <div className="flex-1">
            <Label htmlFor="pan" className="text-sm font-normal">
              8. Pan Number <span className="text-red-500">*</span>
            </Label>
            <Input
              ref={panRef}
              disabled={true}
              type="text"
              name="pan"
              id="pan"
              className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
              placeholder="Pan Number"
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="gst" className="text-sm font-normal">
              9. GST Number <span className="text-red-500">*</span>
            </Label>
            <Input
              ref={gstRef}
              type="text"
              name="gst"
              id="gst"
              disabled={true}
              className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
              placeholder="GST Number"
            />
          </div>
        </div>

        <div className="rounded-sm p-4 border border-black mt-6 relative">
          <span className="-translate-y-7 bg-white px-1 -translate-x-2 inline-block absolute text-sm">
            10 Principle place of Business
          </span>
          <div className="flex gap-4 mt-2 items-end">
            <div className="flex-1">
              <Label htmlFor="building" className="text-sm font-normal">
                Building Number <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={buildingNumberRef}
                type="text"
                name="building"
                disabled={true}
                id="building"
                className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                placeholder="Building Number"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="area" className="text-sm font-normal">
                Area <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={areaRef}
                type="text"
                name="area"
                disabled={true}
                id="area"
                className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                placeholder="Area"
              />
            </div>
          </div>

          <div className="flex gap-4 mt-2 items-end">
            <div className="flex-1">
              <Label htmlFor="city" className="text-sm font-normal">
                City <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={cityRef}
                type="text"
                disabled={true}
                name="city"
                id="city"
                className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                placeholder="City"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="pincode" className="text-sm font-normal">
                Pin Code <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={pincodeRef}
                type="text"
                name="pincode"
                disabled={true}
                id="pincode"
                className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                placeholder="Pin Code"
              />
            </div>
          </div>

          <div className="">
            <Label htmlFor="address" className="text-sm font-normal">
              Address <span className="text-red-500">*</span>
            </Label>

            <Textarea
              ref={addressRef}
              name="address"
              disabled={true}
              id="address"
              className="px-2 py-1 focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm resize-none mt-1"
              placeholder="Address"
            />
          </div>
          <p className="text-xs bg-rose-500 bg-opacity-20 shadow px-2 py-1 rounded-sm mt-2 border-red-500 border-l-4">
            Note: If you have more than one place of
            business/factory/godown/warehourse, fill up form Additional Business
            Places
          </p>
        </div>

        <div className="rounded-sm p-4 border border-black mt-6 relative">
          <span className="-translate-y-7 bg-white px-1 -translate-x-2 inline-block absolute text-sm">
            Contact Details
          </span>

          <div className="flex gap-4 mt-2 items-end">
            <div className="flex-1">
              <Label htmlFor="mobileOne" className="text-sm font-normal">
                Mobile Number <span className="text-red-500">*</span>
              </Label>

              <Input
                ref={contact_oneRef}
                type="text"
                id="mobileOne"
                disabled={true}
                name="mobileOne"
                className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                placeholder="Mobile Number"
                onChange={handleNumberChange}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="mobileTwo" className="text-sm font-normal">
                Alternate Number
              </Label>

              <Input
                ref={contact_twoRef}
                type="text"
                name="mobileTwo"
                id="mobileTwo"
                disabled={true}
                className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                placeholder="Alternate Number"
                onChange={handleNumberChange}
              />
            </div>
          </div>

          <div className="flex gap-4 mt-2 items-end">
            <div className="flex-1">
              <Label htmlFor="email" className="text-sm font-normal">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={emailRef}
                type="text"
                disabled={true}
                name="email"
                id="email"
                className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                placeholder="Email"
              />
            </div>

            <div className="flex-1">
              <Label htmlFor="faxnumber" className="text-sm font-normal">
                Fax Number
              </Label>
              <Input
                ref={faxNumberRef}
                type="text"
                name="faxnumber"
                disabled={true}
                id="faxnumber"
                className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                placeholder="Fax Number"
              />
            </div>
          </div>

          <p className="text-xs bg-rose-500 bg-opacity-20 shadow px-2 py-1 rounded-sm mt-2 border-red-500 border-l-4">
            Note: Please enter details of conteact person in Form Partner
            Details
          </p>
        </div>
      </div>
    </>
  );
};

const Dvat2Page = () => {
  const current_user_id: number = parseInt(getCookie("id") ?? "0");

  const [user, setUser] = useState<user>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [commodity, setCommodity] = useState<commodity[]>([]);

  const [commodityData, setCommodityData] = useState<CommodityData[]>([]);

  const [dvatdata, setDvatData] = useState<dvat04>();

  const noticeServingBuildingNameRef = useRef<HTMLInputElement>(null);
  const noticeServingAreaRef = useRef<HTMLInputElement>(null);
  const noticeServingAddressRef = useRef<HTMLTextAreaElement>(null);
  const noticeServingCityRef = useRef<HTMLInputElement>(null);
  const noticeServingPincodeRef = useRef<HTMLInputElement>(null);
  const additionalGodownRef = useRef<HTMLInputElement>(null);
  const additionalFactoryRef = useRef<HTMLInputElement>(null);
  const additionalShopsRef = useRef<HTMLInputElement>(null);
  const otherPlaceOfBusinessRef = useRef<HTMLInputElement>(null);
  const accountnumberRef = useRef<HTMLInputElement>(null);
  const [typeOfAccount, setTypeOfAccount] = useState<TypeOfAccount>(
    TypeOfAccount.CURRENT
  );
  const bankNameRef = useRef<HTMLInputElement>(null);
  const ifscCodeRef = useRef<HTMLInputElement>(null);
  const addressOfBankRef = useRef<HTMLTextAreaElement>(null);
  const ownCapitalRef = useRef<HTMLInputElement>(null);
  const loanFromBankRef = useRef<HTMLInputElement>(null);
  const loanFromOtherRef = useRef<HTMLInputElement>(null);
  const plantAndMachineryRef = useRef<HTMLInputElement>(null);
  const loanAndBuildingRef = useRef<HTMLInputElement>(null);
  const otherassetsAndInvestmentsRef = useRef<HTMLInputElement>(null);

  const [selectCom, setSelectCom] = useState<string>("0");
  const [purpose, setPurpose] = useState<CommidityPursose>();
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const [accountingBasis, setAccountingBasis] = useState<AccountingBasis>(
    AccountingBasis.CASH
  );

  const [frequencyFilings, setFrequencyFilings] = useState<FrequencyFilings>(
    FrequencyFilings.MONTHLY
  );

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);

      const user = await GetUser({ id: current_user_id });

      if (user.status) {
        setUser(user.data!);
      } else {
        toast.error(user.message);
      }

      const dvatresponse: any = await GetDvat({
        userid: current_user_id,
      });

      if (dvatresponse.status) {
        setDvatData(dvatresponse.data!);

        setTimeout(() => {
          if (noticeServingBuildingNameRef.current)
            noticeServingBuildingNameRef.current!.value =
              dvatresponse.data!.noticeServingBuildingName ?? "";
          if (noticeServingAreaRef.current)
            noticeServingAreaRef.current!.value =
              dvatresponse.data!.noticeServingArea ?? "";
          if (noticeServingAddressRef.current)
            noticeServingAddressRef.current!.value =
              dvatresponse.data!.noticeServingAddress ?? "";
          if (noticeServingCityRef.current)
            noticeServingCityRef.current!.value =
              dvatresponse.data!.noticeServingCity ?? "";
          if (noticeServingPincodeRef.current)
            noticeServingPincodeRef.current!.value =
              dvatresponse.data!.noticeServingPincode ?? "";
          if (additionalGodownRef.current)
            additionalGodownRef.current!.value =
              dvatresponse.data!.additionalGodown ?? "";
          if (additionalFactoryRef.current)
            additionalFactoryRef.current!.value =
              dvatresponse.data!.additionalFactory ?? "";
          if (additionalShopsRef.current)
            additionalShopsRef.current!.value =
              dvatresponse.data!.additionalShops ?? "";
          if (otherPlaceOfBusinessRef.current)
            otherPlaceOfBusinessRef.current!.value =
              dvatresponse.data!.otherPlaceOfBusiness ?? "";
          if (accountnumberRef.current)
            accountnumberRef.current!.value =
              dvatresponse.data!.accountnumber ?? "";
          if (bankNameRef.current)
            bankNameRef.current!.value = dvatresponse.data!.bankName ?? "";
          setTypeOfAccount(dvatresponse.data!.typeOfAccount!);
          if (ifscCodeRef.current)
            ifscCodeRef.current!.value = dvatresponse.data!.ifscCode ?? "";
          if (addressOfBankRef.current)
            addressOfBankRef.current!.value =
              dvatresponse.data!.addressOfBank ?? "";
          if (ownCapitalRef.current)
            ownCapitalRef.current!.value = dvatresponse.data!.ownCapital ?? "";
          if (loanFromBankRef.current)
            loanFromBankRef.current!.value =
              dvatresponse.data!.loanFromBank ?? "";
          if (loanFromOtherRef.current)
            loanFromOtherRef.current!.value =
              dvatresponse.data!.loanFromOther ?? "";
          if (plantAndMachineryRef.current)
            plantAndMachineryRef.current!.value =
              dvatresponse.data!.plantAndMachinery ?? "";
          if (loanAndBuildingRef.current)
            loanAndBuildingRef.current!.value =
              dvatresponse.data!.landAndBuilding ?? "";
          if (otherassetsAndInvestmentsRef.current)
            otherassetsAndInvestmentsRef.current!.value =
              dvatresponse.data!.otherAssetsInvestments ?? "";
          setAccountingBasis(dvatresponse.data!.accountingBasis!);
          setFrequencyFilings(dvatresponse.data!.frequencyFilings!);

          if (dvatresponse.data!.selectComOneId) {
            const commodityone = {
              id: dvatresponse.data!.selectComOneId,
              act: dvatresponse.data!.selectComOne.act,
              code: dvatresponse.data!.selectComOne.code,
              commodity: dvatresponse.data!.selectComOne.name,
              purpose: dvatresponse.data!.purposeOne,
              description: dvatresponse.data!.descriptionOne,
            };
            setCommodityData((prev) => [...prev, commodityone]);
          }

          if (dvatresponse.data!.selectComTwoId) {
            const commoditytwo = {
              id: dvatresponse.data!.selectComTwoId,
              act: dvatresponse.data!.selectComTwo.act,
              code: dvatresponse.data!.selectComTwo.code,
              commodity: dvatresponse.data!.selectComTwo.name,
              purpose: dvatresponse.data!.purposeTwo,
              description: dvatresponse.data!.descriptionTwo,
            };
            setCommodityData((prev) => [...prev, commoditytwo]);
          }

          if (dvatresponse.data!.selectComThreeId) {
            const commoditythree = {
              id: dvatresponse.data!.selectComThreeId,
              act: dvatresponse.data!.selectComThree.act,
              code: dvatresponse.data!.selectComThree.code,
              commodity: dvatresponse.data!.selectComThree.name,
              purpose: dvatresponse.data!.purposeThree,
              description: dvatresponse.data!.descriptionThree,
            };
            setCommodityData((prev) => [...prev, commoditythree]);
          }

          if (dvatresponse.data!.selectComFourId) {
            const commodityfour = {
              id: dvatresponse.data!.selectComFourId,
              act: dvatresponse.data!.selectComFour.act,
              code: dvatresponse.data!.selectComFour.code,
              commodity: dvatresponse.data!.selectComFour.name,
              purpose: dvatresponse.data!.purposeFour,
              description: dvatresponse.data!.descriptionFour,
            };
            setCommodityData((prev) => [...prev, commodityfour]);
          }

          if (dvatresponse.data!.selectComFiveId) {
            const commodityfive = {
              id: dvatresponse.data!.selectComFiveId,
              act: dvatresponse.data!.selectComFive.act,
              code: dvatresponse.data!.selectComFive.code,
              commodity: dvatresponse.data!.selectComFive.name,
              purpose: dvatresponse.data!.purposeFive,
              description: dvatresponse.data!.descriptionFive,
            };
            setCommodityData((prev) => [...prev, commodityfive]);
          }
        }, 1000);
      }

      const commoditylist = await GetAllCommodity({});

      if (commoditylist.status) {
        setCommodity(commoditylist.data!);
      }
      setIsLoading(false);
    };
    init();
  }, [current_user_id]);

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );

  return (
    <>
      <div className="w-full p-4 px-8  mt-2">
        <div className="flex gap-2">
          <p className="text-lg font-nunito">DVAT 04 (11 to 17)</p>
          <div className="grow"></div>
          <p className="text-sm">
            <span className="text-red-500">*</span> Include mandatory fields
          </p>
        </div>

        <div className="rounded-sm p-4 border border-black mt-6 relative">
          <span className="-translate-y-7 bg-white px-1 -translate-x-2 inline-block absolute text-sm">
            11 Address for service of notice (If Diffrent From Principle Place
            of Business)
          </span>

          <div className="flex gap-4 items-end mt-2">
            <div className="flex-1">
              <Label
                htmlFor="noticeservingbuildingname"
                className="text-sm font-normal"
              >
                Building Name
                <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={noticeServingBuildingNameRef}
                type="text"
                disabled={true}
                name="noticeservingbuildingname"
                id="noticeservingbuildingname"
                className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                placeholder="Building Name"
              />
            </div>
            <div className="flex-1">
              <Label
                htmlFor="noticeservingarea"
                className="text-sm font-normal"
              >
                Area <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={noticeServingAreaRef}
                type="text"
                disabled={true}
                name="noticeservingarea"
                id="noticeservingarea"
                className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                placeholder="Area"
              />
            </div>
          </div>

          <div className="flex gap-4 mt-2">
            <div className="flex-1">
              <Label
                htmlFor="noticeservingcity"
                className="text-sm font-normal"
              >
                City
                <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={noticeServingCityRef}
                type="text"
                disabled={true}
                name="noticeservingcity"
                id="noticeservingcity"
                className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                placeholder="City"
              />
            </div>
            <div className="flex-1">
              <Label
                htmlFor="noticeservingpincode"
                className="text-sm font-normal"
              >
                Pincode <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={noticeServingPincodeRef}
                type="text"
                disabled={true}
                name="noticeservingpincode"
                id="noticeservingpincode"
                className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                placeholder="Pincode"
              />
            </div>
          </div>

          <div className="mt-2">
            <Label htmlFor="address" className="text-sm font-normal">
              Address <span className="text-red-500">*</span>
            </Label>

            <Textarea
              ref={noticeServingAddressRef}
              name="address"
              id="address"
              disabled={true}
              className="px-2 py-1 focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm resize-none mt-1"
              placeholder="Address"
            />
          </div>
        </div>

        <div className="rounded-sm p-4 border border-black mt-6 relative">
          <span className="-translate-y-7 bg-white px-1 -translate-x-2 inline-block absolute text-sm">
            12 Number of additional places of business within or outside the
            state{" "}
            <span className="text-rose-500">(Please Complete annexure II)</span>
          </span>
          <div className="flex gap-4 mt-2">
            <div className="flex-1">
              <Label htmlFor="additionalgodown" className="text-sm font-normal">
                Godown
                <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={additionalGodownRef}
                type="text"
                name="additionalgodown"
                id="additionalgodown"
                disabled={true}
                className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                placeholder="Godown"
                onChange={handleNumberChange}
              />
            </div>
            <div className="flex-1">
              <Label
                htmlFor="additionalfactory"
                className="text-sm font-normal"
              >
                Factory <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={additionalFactoryRef}
                type="text"
                name="additionalfactory"
                id="additionalfactory"
                disabled={true}
                className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                placeholder="Factory"
                onChange={handleNumberChange}
              />
            </div>
          </div>
          <div className="flex gap-4 mt-2">
            <div className="flex-1">
              <Label htmlFor="additionalshops" className="text-sm font-normal">
                Shops
                <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={additionalShopsRef}
                type="text"
                name="additionalshops"
                disabled={true}
                id="additionalshops"
                className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                placeholder="Shops"
                onChange={handleNumberChange}
              />
            </div>
            <div className="flex-1">
              <Label
                htmlFor="otherplaceofbusiness"
                className="text-sm font-normal"
              >
                Other Place of Business <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={otherPlaceOfBusinessRef}
                type="text"
                name="otherplaceofbusiness"
                disabled={true}
                id="otherplaceofbusiness"
                className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                placeholder="Other Place of Business"
                onChange={handleNumberChange}
              />
            </div>
          </div>
        </div>

        <div className="rounded-sm p-4 border border-black mt-6 relative">
          <span className="-translate-y-7 bg-white px-1 -translate-x-2 inline-block absolute text-sm">
            13 Details of main Bank Account
          </span>

          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="bankname" className="text-sm font-normal">
                Bank Name <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={bankNameRef}
                type="text"
                name="bankname"
                id="bankname"
                disabled={true}
                className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                placeholder="Bank Name"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="typeofaccount" className="text-sm font-normal">
                Type of Account
                <span className="text-red-500">*</span>
              </Label>
              <Select
                disabled={true}
                defaultValue={typeOfAccount}
                onValueChange={(val) => {
                  setTypeOfAccount(val as TypeOfAccount);
                }}
              >
                <SelectTrigger className="focus-visible:ring-transparent mt-1  h-8 px-2 py-1 text-xs rounded-sm">
                  <SelectValue placeholder="Select Commodity" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectGroup>
                    <SelectItem value={"CURRENT"}>Curretn Account</SelectItem>
                    <SelectItem value={"SAVING"}>Saving Account</SelectItem>
                    <SelectItem value={"OVERDRAFT"}>
                      Overdraft Account
                    </SelectItem>
                    <SelectItem value={"CASH_CREDIT"}>
                      Cash Credit Account
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-4 mt-2">
            <div className="flex-1">
              <Label htmlFor="ifsccode" className="text-sm font-normal">
                IFSC Code
                <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={ifscCodeRef}
                type="text"
                name="ifsccode"
                disabled={true}
                id="ifsccode"
                className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                placeholder="IFSC Code"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="accountnumber" className="text-sm font-normal">
                Account Number <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={accountnumberRef}
                type="text"
                name="accountnumber"
                id="accountnumber"
                disabled={true}
                className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                placeholder="Account Number"
                onChange={handleNumberChange}
              />
            </div>
          </div>

          <div className="mt-2">
            <Label htmlFor="addressofbank" className="text-sm font-normal">
              Address of Bank <span className="text-red-500">*</span>
            </Label>

            <Textarea
              ref={addressOfBankRef}
              name="addressofbank"
              id="addressofbank"
              disabled={true}
              className="px-2 py-1 focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm resize-none mt-1"
              placeholder="Address of Bank"
            />
          </div>
        </div>

        <div className="rounded-sm p-4 border border-black mt-6 relative">
          <span className="-translate-y-7 bg-white px-1 -translate-x-2 inline-block absolute text-sm">
            14 Details Of Investment in the business (details should be current
            as on date of application)
          </span>

          <div className="flex gap-4 mt-2">
            <div className="flex-1">
              <Label htmlFor="owncapital" className="text-sm font-normal">
                Own Capital (Rs)
                <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={ownCapitalRef}
                type="text"
                name="owncapital"
                id="owncapital"
                disabled={true}
                className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                placeholder="Own Capital"
                onChange={handleNumberChange}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="loanfrombank" className="text-sm font-normal">
                Loan From Bank (Rs) <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={loanFromBankRef}
                type="text"
                name="loanfrombank"
                id="loanfrombank"
                disabled={true}
                className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                placeholder="Loan From Bank"
                onChange={handleNumberChange}
              />
            </div>
          </div>
          <div className="flex gap-4 mt-2">
            <div className="flex-1">
              <Label htmlFor="loanfromother" className="text-sm font-normal">
                Loan From Other (Rs)
                <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={loanFromOtherRef}
                type="text"
                name="loanfromother"
                id="loanfromother"
                disabled={true}
                className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                placeholder="Loan From Other"
                onChange={handleNumberChange}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="loanfrombank" className="text-sm font-normal">
                Plant And Machinery (Rs) <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={plantAndMachineryRef}
                type="text"
                name="loanfrombank"
                id="loanfrombank"
                disabled={true}
                className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                placeholder="Plant And Machinery"
                onChange={handleNumberChange}
              />
            </div>
          </div>

          <div className="flex gap-4 mt-2">
            <div className="flex-1">
              <Label htmlFor="landbuilding" className="text-sm font-normal">
                Land & Building (Rs)
                <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={loanAndBuildingRef}
                type="text"
                name="landbuilding"
                id="landbuilding"
                disabled={true}
                className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                placeholder="Land & Building"
                onChange={handleNumberChange}
              />
            </div>
            <div className="flex-1">
              <Label
                htmlFor="assetsinvestments"
                className="text-sm font-normal"
              >
                Other Assets & Investments (Rs){" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={otherassetsAndInvestmentsRef}
                type="text"
                name="assetsinvestments"
                id="assetsinvestments"
                disabled={true}
                className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                placeholder="Other Assets & Investments"
                onChange={handleNumberChange}
              />
            </div>
          </div>
        </div>

        <div className="rounded-sm p-4 border border-black mt-6 relative">
          <span className="-translate-y-7 bg-white px-1 -translate-x-2 inline-block absolute text-sm">
            15 Description of top 5 Items you deal or propose to deal in
          </span>

          <div className="flex gap-4 mt-2">
            <div className="flex-1">
              <Label htmlFor="commodity" className="text-sm font-normal">
                Commodity
                <span className="text-red-500">*</span>
              </Label>
              <Select
                disabled={true}
                onValueChange={(val: string) => {
                  setSelectCom(val);
                }}
              >
                <SelectTrigger className="focus-visible:ring-transparent mt-1  h-8 px-2 py-1 text-xs rounded-sm">
                  <SelectValue placeholder="Select Commodity" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectGroup>
                    {commodity.map((com, index) => (
                      <SelectItem value={com.id.toString()} key={index}>
                        {com.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label htmlFor="purpose" className="text-sm font-normal">
                Purpose <span className="text-red-500">*</span>
              </Label>
              <Select
                disabled={true}
                onValueChange={(val) => {
                  setPurpose(val as CommidityPursose);
                }}
              >
                <SelectTrigger className="focus-visible:ring-transparent mt-1  h-8 px-2 py-1 text-xs rounded-sm">
                  <SelectValue placeholder="Select Purpose" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectGroup>
                    <SelectItem value={"COMMODITY_TRADED"}>
                      COMMODITY TRADED
                    </SelectItem>
                    <SelectItem value={"MANUFACTURED"}>MANUFACTURED</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-2">
            <Label htmlFor="description" className="text-sm font-normal">
              Dealer Description of Commodity{" "}
              <span className="text-red-500">*</span>
            </Label>

            <Textarea
              ref={descriptionRef}
              name="description"
              disabled={true}
              id="description"
              className="px-2 py-1 focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm resize-none mt-1"
              placeholder="Dealer Description of Commodity"
            />
          </div>

          <Table className="mt-2">
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead className="w-[100px] text-sm font-normal h-8">
                  Act
                </TableHead>
                <TableHead className=" text-sm font-normal h-8">Code</TableHead>
                <TableHead className=" text-sm font-normal h-8">
                  Commodity
                </TableHead>
                <TableHead className=" text-sm font-normal h-8">
                  Delear&apos;s description
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commodityData.map((com, index) => (
                <TableRow key={index}>
                  <TableCell className="text-xs">{com.act}</TableCell>
                  <TableCell className="text-xs">{com.code}</TableCell>
                  <TableCell className="text-xs">{com.commodity}</TableCell>
                  <TableCell className="text-xs">{com.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {commodityData.length <= 0 ? (
            <div className="text-sm text-red-500 mt-2">
              No Commodity Added Yet! Add Commodity to Proceed Further!
            </div>
          ) : null}
        </div>

        <div className="flex gap-4 mt-2 items-end">
          <div className="flex-1">
            <Label htmlFor="deposittype" className="text-sm font-normal">
              16. Accounting Basis <span className="text-rose-500">*</span>
            </Label>
            <Select
              disabled={true}
              defaultValue={accountingBasis}
              onValueChange={(val) => {
                setAccountingBasis(val as AccountingBasis);
              }}
            >
              <SelectTrigger className="focus-visible:ring-transparent mt-1  h-8 px-2 py-1 text-xs rounded-sm">
                <SelectValue placeholder="Select Accounting Basis" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectGroup>
                  <SelectItem value={"CASH"}>CASH</SelectItem>
                  <SelectItem value={"ACCRUAL"}>ACCRUAL</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label htmlFor="radio1" className="text-sm font-normal">
              17. Frequency of filing return (to be filled in by the dealer
              whose turnover is less then Rs. 5 crore in the preceeding year)
              <span className="text-rose-500">*</span>
            </Label>
            <RadioGroup
              disabled={true}
              defaultValue="exempt"
              className="flex gap-2 mt-2"
              id="radio1"
              value={frequencyFilings}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="MONTHLY"
                  id="MONTHLY"
                  onClick={() => setFrequencyFilings(FrequencyFilings.MONTHLY)}
                />
                <Label
                  htmlFor="MONTHLY"
                  className="cursor-pointer text-xs font-normal"
                  onClick={() => setFrequencyFilings(FrequencyFilings.MONTHLY)}
                >
                  MONTHLY
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="QUARTERLY"
                  id="QUARTERLY"
                  onClick={() =>
                    setFrequencyFilings(FrequencyFilings.QUARTERLY)
                  }
                />
                <Label
                  htmlFor="QUARTERLY"
                  className="cursor-pointer  text-xs font-normal"
                  onClick={() =>
                    setFrequencyFilings(FrequencyFilings.QUARTERLY)
                  }
                >
                  QUARTERLY
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </div>
    </>
  );
};

const Dvat3Page = () => {
  const current_user_id: number = parseInt(getCookie("id") ?? "0");

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const securityDepositAmountRef = useRef<HTMLInputElement>(null);

  const [dateOfExpiry, setDateOfExpiry] = useState<Date>();
  const [startDPop, setStartDPop] = useState<boolean>(false);

  const [depositType, setDepositType] = useState<DepositType>(
    DepositType.FIXED
  );

  const nameOfBankRef = useRef<HTMLInputElement>(null);
  const branchNameRef = useRef<HTMLInputElement>(null);
  const transactionIdRef = useRef<HTMLInputElement>(null);
  const numberOfOwnersRef = useRef<HTMLInputElement>(null);
  const numberOfManagersRef = useRef<HTMLInputElement>(null);
  const numberOfSignatoryRef = useRef<HTMLInputElement>(null);
  const nameOfManagerRef = useRef<HTMLInputElement>(null);
  const nameOfSignatoryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);

      const user = await GetUser({ id: current_user_id });

      if (user.status) {
        // setUser(user.data!);
      } else {
        toast.error(user.message);
      }

      const dvatdata = await GetDvat({ userid: current_user_id });

      if (dvatdata.status) {
        setTimeout(() => {
          if (transactionIdRef.current)
            transactionIdRef.current!.value =
              dvatdata.data?.transactionId ?? "";
          if (securityDepositAmountRef.current)
            securityDepositAmountRef.current!.value =
              dvatdata.data?.securityDepositAmount ?? "";
          if (nameOfBankRef.current)
            nameOfBankRef.current!.value = dvatdata.data?.nameOfBank ?? "";
          if (branchNameRef.current)
            branchNameRef.current!.value = dvatdata.data?.branchName ?? "";
          setDepositType(dvatdata.data?.depositType ?? DepositType.FIXED);
          setDateOfExpiry(dvatdata.data?.dateOfExpiry ?? new Date());
          if (numberOfOwnersRef.current)
            numberOfOwnersRef.current!.value =
              dvatdata.data?.numberOfOwners?.toString() ?? "";
          if (numberOfManagersRef.current)
            numberOfManagersRef.current!.value =
              dvatdata.data?.numberOfManagers?.toString() ?? "";
          if (numberOfSignatoryRef.current)
            numberOfSignatoryRef.current!.value =
              dvatdata.data?.numberOfSignatory?.toString() ?? "";
          if (nameOfManagerRef.current)
            nameOfManagerRef.current!.value =
              dvatdata.data?.nameOfManager ?? "";
          if (nameOfSignatoryRef.current)
            nameOfSignatoryRef.current!.value =
              dvatdata.data?.nameOfSignatory ?? "";
        }, 1000);
      }

      setIsLoading(false);
    };
    init();
  }, [current_user_id]);

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );

  return (
    <>
      <div className=" w-full p-4 px-8 mt-2">
        <div className="flex gap-2">
          <p className="text-lg font-nunito">DVAT 04 (18 to 23)</p>
          <div className="grow"></div>
          <p className="text-sm">
            <span className="text-red-500">*</span> Include mandatory fields
          </p>
        </div>

        <div className="rounded-sm p-4 border border-black mt-6 relative">
          <span className="-translate-y-7 bg-white px-1 -translate-x-2 inline-block absolute text-sm">
            18 Security
          </span>

          <div className="flex gap-4 mt-2">
            <div className="flex-1">
              <Label htmlFor="transactionid" className="text-sm font-normal">
                Transaction Id <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={transactionIdRef}
                type="text"
                name="transactionid"
                disabled={true}
                id="transactionid"
                className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                placeholder="Transaction Id"
              />
            </div>

            <div className="flex-1">
              <Label
                htmlFor="securitydepositamount"
                className="text-sm font-normal"
              >
                Amount Of Security (Rs)
                <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={securityDepositAmountRef}
                type="text"
                name="securitydepositamount"
                id="securitydepositamount"
                disabled={true}
                className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                placeholder="Security Deposit Amount"
              />
            </div>
          </div>

          <div className="flex gap-4 mt-2">
            <div className="flex-1">
              <Label htmlFor="nameofbank" className="text-sm font-normal">
                Name Of Bank <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={nameOfBankRef}
                type="text"
                name="nameofbank"
                id="nameofbank"
                disabled={true}
                className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                placeholder="Name of Bank"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="branchname" className="text-sm font-normal">
                Branch Name <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={branchNameRef}
                type="text"
                name="branchname"
                id="branchname"
                disabled={true}
                className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                placeholder="Branch Name"
              />
            </div>
          </div>

          <div className="flex gap-4 mt-2">
            <div className="flex-1">
              <Label htmlFor="deposittype" className="text-sm font-normal">
                Type Of Security <span className="text-rose-500">*</span>
              </Label>
              <Select
                disabled={true}
                defaultValue={depositType}
                onValueChange={(val) => {
                  setDepositType(val as DepositType);
                }}
              >
                <SelectTrigger className="focus-visible:ring-transparent mt-1  h-8 px-2 py-1 text-xs rounded-sm">
                  <SelectValue placeholder="Select Deposit Type" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectGroup>
                    <SelectItem value={"FIXED"}>FIXED DEPOSIT</SelectItem>
                    <SelectItem value={"RECURRING"}>
                      RECURRING DEPOSIT
                    </SelectItem>
                    <SelectItem value={"SAVINGS"}>SAVINGS DEPOSIT</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label htmlFor="starttime" className="text-sm font-normal">
                Date Of Expiry Of Security{" "}
                <span className="text-rose-500">*</span>
              </Label>

              <Popover open={startDPop} onOpenChange={setStartDPop}>
                <PopoverTrigger asChild>
                  <Button
                    disabled={true}
                    variant={"outline"}
                    className={`w-full justify-start text-left font-normal  mt-1 h-8 px-2 py-1 text-xs rounded-sm ${
                      !dateOfExpiry ?? "text-muted-foreground"
                    }`}
                  >
                    <IcBaselineCalendarMonth className="mr-2 h-4 w-4" />
                    {dateOfExpiry ? (
                      format(dateOfExpiry, "PPP")
                    ) : (
                      <span>VatLiable Date date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateOfExpiry}
                    onSelect={(e) => {
                      setDateOfExpiry(e);
                      setStartDPop(false);
                    }}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <div className="flex-1 mt-2">
          <Label htmlFor="numbertofowners" className="text-sm font-normal">
            19. Number of person having interest in business{" "}
            <span className="text-red-500">*</span>
          </Label>
          <p className="text-red-500 text-sm">
            (also place complete Annexure I for each such person)
          </p>

          <Input
            ref={numberOfOwnersRef}
            type="text"
            name="numbertofowners"
            id="numbertofowners"
            disabled={true}
            className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
            onChange={handleNumberChange}
          />
        </div>

        <div className="flex gap-4 mt-2">
          <div className="flex-1">
            <Label htmlFor="numbertofmanagers" className="text-sm font-normal">
              20 Number of Managers <span className="text-red-500">*</span>
            </Label>
            <Input
              ref={numberOfManagersRef}
              type="text"
              name="numbertofmanagers"
              id="numbertofmanagers"
              disabled={true}
              className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
              placeholder="Number Of Managers"
              onChange={handleNumberChange}
            />
          </div>

          <div className="flex-1">
            <Label htmlFor="numbertofsignatory" className="text-sm font-normal">
              21. Number of authorised signatory{" "}
              <span className="text-red-500">*</span>
            </Label>
            <Input
              ref={numberOfSignatoryRef}
              type="text"
              name="numbertofsignatory"
              id="numbertofsignatory"
              disabled={true}
              className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
              placeholder="Number Of authorised signatory"
              onChange={handleNumberChange}
            />
          </div>
        </div>
        <div className="flex gap-4 mt-2">
          <div className="flex-1">
            <Label htmlFor="nameofmanager" className="text-sm font-normal">
              22. Name of Manager <span className="text-red-500">*</span>
            </Label>
            <Input
              ref={nameOfManagerRef}
              type="text"
              name="nameofmanager"
              disabled={true}
              id="nameofmanager"
              className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
              placeholder="Name of Manager"
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="nameofsignatory" className="text-sm font-normal">
              23. Name of authorised signatory{" "}
              <span className="text-red-500">
                * (Please Complete Annexure III)
              </span>
            </Label>
            <Input
              ref={nameOfSignatoryRef}
              type="text"
              name="nameofsignatory"
              id="nameofsignatory"
              disabled={true}
              className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
              placeholder="Name of authorised signatory"
            />
          </div>
        </div>
      </div>
    </>
  );
};

interface Anx1PageProps {
  dvatid: number;
}

const Anx1Page = (props: Anx1PageProps) => {
  const current_user_id: number = parseInt(getCookie("id") ?? "0");

  // const [anx1id, setAnxid] = useState<number>(0);

  const [user, setUser] = useState<user>();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [titleParticulasOfPerson, setTitleParticulasOfPerson] =
    useState<TitleParticulasOfperson>();

  const [Annexuredata, setAnnexuredata] = useState<annexure1[]>([]);

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

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);

      const user = await GetUser({ id: current_user_id });

      if (user.status) {
        setUser(user.data!);
      } else {
        toast.error(user.message);
      }

      const getanx1resposne = await GetAnx1({ dvatid: props.dvatid });

      if (getanx1resposne.status) {
        setAnnexuredata(getanx1resposne.data!);
      }
      setIsLoading(false);
    };
    init();
  }, [current_user_id, props.dvatid]);

  const edit = async (id: number) => {
    const data = await GetAnx1ById({ id: id });

    if (data.status) {
      setTitleParticulasOfPerson(data.data!.titleParticulasOfperson!);
      if (nameRef.current)
        nameRef.current!.value = data.data!.nameOfPerson ?? "";
      setdateOfBirth(new Date(data.data!.dateOfBirth!));
      setGender(data.data?.gender!);
      if (fatherNameRef.current)
        fatherNameRef.current!.value = data.data!.fatherName ?? "";
      if (panRef.current) panRef.current!.value = data.data!.panNumber ?? "";
      if (aadharRef.current)
        aadharRef.current!.value = data.data!.aadharNumber ?? "";
      if (designationRef.current)
        designationRef.current!.value = data.data!.designation ?? "";
      if (eductionRef.current)
        eductionRef.current!.value = data.data!.eductionQualification ?? "";
      if (rBuildingNameRef.current)
        rBuildingNameRef.current!.value = data.data!.rbuildingName ?? "";
      if (rAreaRef.current)
        rAreaRef.current!.value = data.data!.rareaName ?? "";
      if (rVillageRef.current)
        rVillageRef.current!.value = data.data!.rvillageName ?? "";
      if (rPinCodeRef.current)
        rPinCodeRef.current!.value = data.data!.rpincode ?? "";
      if (pBuildingNameRef.current)
        pBuildingNameRef.current!.value = data.data!.pbuildingName ?? "";
      if (pAreaRef.current)
        pAreaRef.current!.value = data.data!.pareaName ?? "";
      if (pVillageRef.current)
        pVillageRef.current!.value = data.data!.pvillageName ?? "";
      if (pPinCodeRef.current)
        pPinCodeRef.current!.value = data.data!.ppincode ?? "";
      if (contactRef.current)
        contactRef.current!.value = data.data!.contact ?? "";
      if (emailRef.current) emailRef.current!.value = data.data!.email ?? "";
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
      <div className="w-full p-4 px-8 mt-2">
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
                disabled={true}
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
                disabled={true}
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
                    disabled={true}
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
                    disabled={(date) =>
                      date >
                      new Date(
                        new Date().setFullYear(new Date().getFullYear() - 15)
                      )
                    }
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
                disabled={true}
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
                disabled={true}
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
                disabled={true}
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
                disabled={true}
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
                disabled={true}
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
              disabled={true}
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
                disabled={true}
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
                disabled={true}
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
                disabled={true}
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
                disabled={true}
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
              disabled={true}
              onCheckedChange={(value: boolean) => {
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
                disabled={true}
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
                disabled={true}
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
                disabled={true}
                className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                placeholder="Village/ Town"
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
                disabled={true}
                id="p_pincode"
                className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                placeholder="Pincode"
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
                disabled={true}
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
                disabled={true}
                id="email"
                className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                placeholder="Email Id"
              />
            </div>
          </div>
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
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
};

interface Anx2PageProps {
  dvatid: number;
}

const Anx2Page = (props: Anx2PageProps) => {
  const current_user_id: number = parseInt(getCookie("id") ?? "0");

  const [user, setUser] = useState<user>();
  const [isLoading, setIsLoading] = useState<boolean>(false);

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

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);

      const user = await GetUser({ id: current_user_id });

      if (user.status) {
        setUser(user.data!);
      } else {
        toast.error(user.message);
      }

      const getanx2resposne = await GetAnx2({ dvatid: props.dvatid });

      if (getanx2resposne.status && getanx2resposne.data) {
        setAnnexuredata(getanx2resposne.data);
      }

      setIsLoading(false);
    };
    init();
  }, [current_user_id, props.dvatid]);

  const edit = async (id: number) => {
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

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );

  return (
    <>
      <div className="w-full p-4 px-8 mt-2">
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
                disabled={true}
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
                disabled={true}
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
                disabled={true}
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
                disabled={true}
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
                disabled={true}
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
                disabled={true}
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
                disabled={true}
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
                disabled={true}
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
                    disabled={true}
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
              <Label htmlFor="placeOfBusiness" className="text-sm font-normal">
                Location of Business Place{" "}
                <span className="text-red-500">*</span>
              </Label>
              <RadioGroup
                disabled={true}
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
                      setPlaceOfBusiness(LocationOfBusinessPlace.OUTSIDE_STATE)
                    }
                  />
                  <Label
                    htmlFor="OUTSIDE_STATE"
                    className="cursor-pointer  text-xs font-normal"
                    onClick={() =>
                      setPlaceOfBusiness(LocationOfBusinessPlace.OUTSIDE_STATE)
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
                disabled={true}
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
                disabled={true}
                className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                placeholder="Under CST Act, 1958"
              />
            </div>
          </div>
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
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
};

interface Anx3PageProps {
  dvatid: number;
}

const Anx3Page = (props: Anx3PageProps) => {
  const current_user_id: number = parseInt(getCookie("id") ?? "0");

  const [user, setUser] = useState<user>();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [Annexuredata, setAnnexuredata] = useState<annexure1[]>([]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);

      const user = await GetUser({ id: current_user_id });

      if (user.status) {
        setUser(user.data!);
      } else {
        toast.error(user.message);
      }

      const getanx1resposne = await GetAnx1({ dvatid: props.dvatid });

      if (getanx1resposne.status) {
        setAnnexuredata(getanx1resposne.data!);
      }
      setIsLoading(false);
    };
    init();
  }, [current_user_id, props.dvatid]);

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );

  return (
    <>
      <div className="mx-auto mt-6">
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
                    {data.isAuthorisedSignatory ? "Yes" : "No"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
};
