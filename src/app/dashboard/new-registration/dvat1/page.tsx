"use client";

import { Button } from "@/components/ui/button";
import { FormSteps } from "@/components/formstepts";
import { useEffect, useRef, useState } from "react";
import { getCookie } from "cookies-next";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { Label } from "@radix-ui/react-label";
import {
  ConstitutionOfBusiness,
  NatureOfBusiness,
  SelectOffice,
  TypeOfRegistration,
  dvat04,
} from "@prisma/client";
import { handleNumberChange } from "@/utils/methods";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { IcBaselineCalendarMonth } from "@/components/icons";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { safeParse } from "valibot";
import { Dvat1Schema } from "@/schema/dvat1";
import { ApiResponseType } from "@/models/response";
import { toast } from "react-toastify";
import Dvat1CreateUpdate from "@/action/user/register/dvat1";
import GetDvat from "@/action/user/register/getdvat";

const Dvat1Page = () => {
  const id: number = parseInt(getCookie("id") ?? "0");
  const router = useRouter();

  enum TrueFalse {
    YES = "YES",
    NO = "NO",
  }

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmit, setIsSubmit] = useState<boolean>(false);

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

  const handelSubmit = async () => {
    setIsSubmit(true);
    const result = safeParse(Dvat1Schema, {
      name: nameRef.current?.value,
      // tradename: tradenameRef.current?.value,
      natureOfBusiness: natureOfBusiness,
      constitutionOfBusiness: constitutionOfBusiness,
      selectOffice: selectOffice,
      typeOfRegistration: typeOfRegistration,
      compositionScheme: isCompositionScheme === TrueFalse.YES,
      annualTurnoverCategory: isAnnualTurnoverCategory === TrueFalse.YES,
      turnoverLastFinancialYear: turnoverLastFinancialYearRef.current?.value,
      turnoverCurrentFinancialYear:
        turnoverCurrentFinancialYearRef.current?.value,
      vatLiableDate: vatLiableDate?.toISOString(),
      pan: panRef.current?.value,
      gst: gstRef.current?.value,
      buildingNumber: buildingNumberRef.current?.value,
      area: areaRef.current?.value,
      address: addressRef.current?.value,
      city: cityRef.current?.value,
      pincode: pincodeRef.current?.value,
      contact_one: contact_oneRef.current?.value,

      email: emailRef.current?.value,
      faxNumber: faxNumberRef.current?.value,
    });

    if (result.success) {
      const userrespone: ApiResponseType<dvat04 | null> =
        await Dvat1CreateUpdate({
          createdById: id,
          name: result.output.name,
          selectOffice: result.output.selectOffice as SelectOffice,
          tradename:
            tradenameRef.current?.value == ""
              ? undefined
              : tradenameRef.current?.value,
          natureOfBusiness: result.output.natureOfBusiness as NatureOfBusiness,
          constitutionOfBusiness: result.output.constitutionOfBusiness,
          typeOfRegistration: result.output.typeOfRegistration,
          compositionScheme: result.output.compositionScheme,
          annualTurnoverCategory: result.output.annualTurnoverCategory,
          turnoverLastFinancialYear: result.output.turnoverLastFinancialYear,
          turnoverCurrentFinancialYear:
            result.output.turnoverCurrentFinancialYear,
          vatLiableDate: new Date(result.output.vatLiableDate),
          pan: result.output.pan,
          gst: result.output.gst,
          buildingNumber: result.output.buildingNumber,
          area: result.output.area,
          address: result.output.address,
          city: result.output.city,
          pincode: result.output.pincode,
          contact_one: result.output.contact_one,
          contact_two:
            contact_twoRef.current?.value == ""
              ? undefined
              : contact_twoRef.current?.value,
          email: result.output.email,
          // faxNumber: result.output.faxNumber,
          faxNumber:
            faxNumberRef.current?.value == ""
              ? undefined
              : faxNumberRef.current?.value,
        });
      if (userrespone.status) {
        router.push("/dashboard/new-registration/dvat2");
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

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);

      const dvatdata = await GetDvat({ userid: id });

      if (dvatdata.status) {
        setTimeout(() => {
          nameRef.current!.value = dvatdata.data!.name;
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
          turnoverLastFinancialYearRef.current!.value =
            dvatdata.data!.turnoverLastFinancialYear!;
          turnoverCurrentFinancialYearRef.current!.value =
            dvatdata.data!.turnoverCurrentFinancialYear!;
          setVatLiableDate(new Date(dvatdata.data!.vatLiableDate!));
          panRef.current!.value = dvatdata.data!.pan!;
          gstRef.current!.value = dvatdata.data!.gst!;
          buildingNumberRef.current!.value = dvatdata.data!.buildingNumber!;
          areaRef.current!.value = dvatdata.data!.area!;
          addressRef.current!.value = dvatdata.data!.address!;
          cityRef.current!.value = dvatdata.data!.city!;
          pincodeRef.current!.value = dvatdata.data!.pincode!;
          contact_oneRef.current!.value = dvatdata.data!.contact_one!;
          contact_twoRef.current!.value = dvatdata.data!.contact_two!;
          emailRef.current!.value = dvatdata.data!.email!;
          faxNumberRef.current!.value = dvatdata.data!.faxNumber!;
        }, 1000);

        setDvatData(dvatdata.data!);
      }

      setIsLoading(false);
    };
    init();
  }, [id]);

  console.log(dvatData);
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
            completedSteps={2}
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
                    Dept. of VAT - Dadra and Nagar
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
                    <SelectItem value={"MANUFACTURING"}>
                      MANUFACTURING
                    </SelectItem>
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
                name="turnovercurrent"
                id="turnovercurrent"
                className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                placeholder="Turnover of the current financial year"
              />
            </div>

            <div className="grid items-center gap-1.5 w-full flex-1">
              <Label htmlFor="starttime" className="text-sm font-normal">
                7. Date from which liable for registration under Dadra and Nagar
                Haveli Value Added Tax regulatio, 2005 (DD/MM/YYYY){" "}
                <span className="text-rose-500">*</span>
              </Label>

              <Popover open={startDPop} onOpenChange={setStartDPop}>
                <PopoverTrigger asChild>
                  <Button
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
                id="address"
                className="px-2 py-1 focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm resize-none mt-1"
                placeholder="Address"
              />
            </div>
            <p className="text-xs bg-rose-500 bg-opacity-20 shadow px-2 py-1 rounded-sm mt-2 border-red-500 border-l-4">
              Note: If you have more then one place of
              business/factory/godown/warehourse, fill up form Additional
              Business Plaes
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

          <div className="flex gap-2 items-end">
            <div className="grow"></div>

            <Button
              onClick={() =>
                router.push("/dashboard/new-registration/registeruser")
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
      </main>
    </>
  );
};

export default Dvat1Page;
