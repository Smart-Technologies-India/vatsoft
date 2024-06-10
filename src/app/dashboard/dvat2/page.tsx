"use client";

import { Button } from "@/components/ui/button";
import { FormSteps } from "@/components/formstepts";
import {
  AccountingBasis,
  CommidityPursose,
  FrequencyFilings,
  TypeOfAccount,
  commodity,
  dvat04,
  user,
} from "@prisma/client";
import { useEffect, useRef, useState } from "react";
import GetUser from "@/action/user/getuser";
import { getCookie } from "cookies-next";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import GetDvat from "@/action/user/register/getdvat";
import { safeParse } from "valibot";
import { Dvat2Schema } from "@/schema/dvat2";
import { ApiResponseType } from "@/models/response";
import Dvat2Update from "@/action/user/register/dvat2";
import GetAllCommodity from "@/action/commodity/getcommodity";
import { CommodityData } from "@/models/main";

const Dvat2Page = () => {
  const id: number = parseInt(getCookie("id") ?? "0");

  const router = useRouter();

  const [user, setUser] = useState<user>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmit, setIsSubmit] = useState<boolean>(false);
  const [commodity, setCommodity] = useState<commodity[]>([]);

  const [commodityData, setCommodityData] = useState<CommodityData[]>([]);

  const addCommodity = () => {
    if (selectCom == "0") {
      toast.error("Please Select Commodity");
      return;
    } else if (purpose == undefined || purpose == null) {
      toast.error("Please Select Purpose");
      return;
    } else if (descriptionRef.current!.value == "") {
      toast.error("Please Enter Description");
      return;
    } else {
      const data = [...commodityData];
      const com = commodity.find((c) => c.id == parseInt(selectCom));
      if (com) {
        data.push({
          id: selectCom,
          act: com.act!,
          code: com.code!,
          commodity: com.name,
          purpose: purpose,
          description: descriptionRef.current!.value,
        });
        setCommodityData(data);
      }

      setSelectCom("0");
      setPurpose(undefined);
      descriptionRef.current!.value = "";
    }
  };

  const removeCommodity = (index: number) => {
    const data = [...commodityData];
    data.splice(index, 1);
    setCommodityData(data);
  };

  const [isSaveAddress, setIsSameAddress] = useState<boolean>(false);

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

  const handelSubmit = async () => {
    setIsSubmit(true);

    const result = safeParse(Dvat2Schema, {
      noticeServingBuildingName: noticeServingBuildingNameRef.current!.value,
      noticeServingArea: noticeServingAreaRef.current!.value,
      noticeServingAddress: noticeServingAddressRef.current!.value,
      noticeServingCity: noticeServingCityRef.current!.value,
      noticeServingPincode: noticeServingPincodeRef.current!.value,
      additionalGodown: additionalGodownRef.current!.value,
      additionalFactory: additionalFactoryRef.current!.value,
      additionalShops: additionalShopsRef.current!.value,
      otherPlaceOfBusiness: otherPlaceOfBusinessRef.current!.value,
      accountnumber: accountnumberRef.current!.value,
      typeOfAccount: typeOfAccount,
      bankName: bankNameRef.current!.value,
      ifscCode: ifscCodeRef.current!.value,
      addressOfBank: addressOfBankRef.current!.value,
      ownCapital: ownCapitalRef.current!.value,
      loanFromBank: loanFromBankRef.current!.value,
      loanFromOther: loanFromOtherRef.current!.value,
      plantAndMachinery: plantAndMachineryRef.current!.value,
      landAndBuilding: loanAndBuildingRef.current!.value,
      otherAssetsInvestments: otherassetsAndInvestmentsRef.current!.value,
      accountingBasis: accountingBasis,
      frequencyFilings: frequencyFilings,
    });

    if (result.success) {
      const userrespone: ApiResponseType<dvat04 | null> = await Dvat2Update({
        createdById: id,
        noticeServingBuildingName: result.output.noticeServingBuildingName,
        noticeServingArea: result.output.noticeServingArea,
        noticeServingAddress: result.output.noticeServingAddress,
        noticeServingCity: result.output.noticeServingCity,
        noticeServingPincode: result.output.noticeServingPincode,
        additionalGodown: result.output.additionalGodown,
        additionalFactory: result.output.additionalFactory,
        additionalShops: result.output.additionalShops,
        otherPlaceOfBusiness: result.output.otherPlaceOfBusiness,
        accountnumber: result.output.accountnumber,
        typeOfAccount: result.output.typeOfAccount,
        bankName: result.output.bankName,
        ifscCode: result.output.ifscCode,
        addressOfBank: result.output.addressOfBank,
        ownCapital: result.output.ownCapital,
        loanFromBank: result.output.loanFromBank,
        loanFromOther: result.output.loanFromOther,
        plantAndMachinery: result.output.plantAndMachinery,
        landAndBuilding: result.output.landAndBuilding,
        otherAssetsInvestments: result.output.otherAssetsInvestments,
        accountingBasis: result.output.accountingBasis,
        frequencyFilings: result.output.frequencyFilings,
        CommodityData: commodityData,
      });
      if (userrespone.status) {
        router.push("/dashboard/dvat3");
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

      const user = await GetUser({ id: id });

      if (user.status) {
        setUser(user.data!);
      } else {
        toast.error(user.message);
      }

      const dvatresponse: any = await GetDvat({
        userid: id,
      });

      if (dvatresponse.status) {
        setDvatData(dvatresponse.data!);

        setTimeout(() => {
          noticeServingBuildingNameRef.current!.value =
            dvatresponse.data!.noticeServingBuildingName ?? "";
          noticeServingAreaRef.current!.value =
            dvatresponse.data!.noticeServingArea ?? "";
          noticeServingAddressRef.current!.value =
            dvatresponse.data!.noticeServingAddress ?? "";
          noticeServingCityRef.current!.value =
            dvatresponse.data!.noticeServingCity ?? "";
          noticeServingPincodeRef.current!.value =
            dvatresponse.data!.noticeServingPincode ?? "";
          additionalGodownRef.current!.value =
            dvatresponse.data!.additionalGodown ?? "";
          additionalFactoryRef.current!.value =
            dvatresponse.data!.additionalFactory ?? "";
          additionalShopsRef.current!.value =
            dvatresponse.data!.additionalShops ?? "";
          otherPlaceOfBusinessRef.current!.value =
            dvatresponse.data!.otherPlaceOfBusiness ?? "";
          accountnumberRef.current!.value =
            dvatresponse.data!.accountnumber ?? "";
          bankNameRef.current!.value = dvatresponse.data!.bankName ?? "";
          setTypeOfAccount(dvatresponse.data!.typeOfAccount!);
          ifscCodeRef.current!.value = dvatresponse.data!.ifscCode ?? "";
          addressOfBankRef.current!.value =
            dvatresponse.data!.addressOfBank ?? "";
          ownCapitalRef.current!.value = dvatresponse.data!.ownCapital ?? "";
          loanFromBankRef.current!.value =
            dvatresponse.data!.loanFromBank ?? "";
          loanFromOtherRef.current!.value =
            dvatresponse.data!.loanFromOther ?? "";
          plantAndMachineryRef.current!.value =
            dvatresponse.data!.plantAndMachinery ?? "";
          loanAndBuildingRef.current!.value =
            dvatresponse.data!.landAndBuilding ?? "";
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
  }, [id]);

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
            completedSteps={3}
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
            <div className="text-sm flex gap-1 items-center">
              <Checkbox
                onCheckedChange={(value: boolean) => {
                  setIsSameAddress(value);

                  if (value) {
                    noticeServingBuildingNameRef.current!.value =
                      dvatdata!.buildingNumber ?? "";
                    noticeServingAreaRef.current!.value = dvatdata!.area ?? "";
                    noticeServingAddressRef.current!.value =
                      dvatdata!.address ?? "";
                    noticeServingCityRef.current!.value = dvatdata!.city ?? "";
                    noticeServingPincodeRef.current!.value =
                      dvatdata!.pincode ?? "";
                  }
                }}
              />
              <p>Same as Principle Place Of Business</p>
            </div>

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
                  disabled={isSaveAddress}
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
                  disabled={isSaveAddress}
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
                  disabled={isSaveAddress}
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
                  disabled={isSaveAddress}
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
                disabled={isSaveAddress}
                className="px-2 py-1 focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm resize-none mt-1"
                placeholder="Address"
              />
            </div>
          </div>

          <div className="rounded-sm p-4 border border-black mt-6 relative">
            <span className="-translate-y-7 bg-white px-1 -translate-x-2 inline-block absolute text-sm">
              12 Number of additional places of business within or outside the
              state{" "}
              <span className="text-rose-500">
                (Please Complete annexure II)
              </span>
            </span>
            <div className="flex gap-4 mt-2">
              <div className="flex-1">
                <Label
                  htmlFor="additionalgodown"
                  className="text-sm font-normal"
                >
                  Godown
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  ref={additionalGodownRef}
                  type="text"
                  name="additionalgodown"
                  id="additionalgodown"
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
                  className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                  placeholder="Factory"
                  onChange={handleNumberChange}
                />
              </div>
            </div>
            <div className="flex gap-4 mt-2">
              <div className="flex-1">
                <Label
                  htmlFor="additionalshops"
                  className="text-sm font-normal"
                >
                  Shops
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  ref={additionalShopsRef}
                  type="text"
                  name="additionalshops"
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
                  Other Place of Business{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  ref={otherPlaceOfBusinessRef}
                  type="text"
                  name="otherplaceofbusiness"
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
                className="px-2 py-1 focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm resize-none mt-1"
                placeholder="Address of Bank"
              />
            </div>
          </div>

          <div className="rounded-sm p-4 border border-black mt-6 relative">
            <span className="-translate-y-7 bg-white px-1 -translate-x-2 inline-block absolute text-sm">
              14 Details Of Investment in the business (details should be
              current as on date of application)
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
                  className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                  placeholder="Loan From Other"
                  onChange={handleNumberChange}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="loanfrombank" className="text-sm font-normal">
                  Plant And Machinery (Rs){" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  ref={plantAndMachineryRef}
                  type="text"
                  name="loanfrombank"
                  id="loanfrombank"
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
                  Other assets & Investments (Rs){" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  ref={otherassetsAndInvestmentsRef}
                  type="text"
                  name="assetsinvestments"
                  id="assetsinvestments"
                  className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                  placeholder="Other assets & Investments"
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
                      <SelectItem value={"MANUFACTURED"}>
                        MANUFACTURED
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-2">
              <Label htmlFor="description" className="text-sm font-normal">
                Dealer description of Commodity{" "}
                <span className="text-red-500">*</span>
              </Label>

              <Textarea
                ref={descriptionRef}
                name="description"
                id="description"
                className="px-2 py-1 focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm resize-none mt-1"
                placeholder="Dealer description of Commodity"
              />
            </div>

            {commodityData.length < 5 && (
              <Button
                onClick={addCommodity}
                className="w-20  bg-blue-500 hover:bg-blue-600 text-white py-1 text-sm mt-2 h-8 "
              >
                Add
              </Button>
            )}
            <Table className="mt-2">
              <TableHeader className="bg-gray-100">
                <TableRow>
                  <TableHead className="w-[100px] text-sm font-normal h-8">
                    Act
                  </TableHead>
                  <TableHead className=" text-sm font-normal h-8">
                    Code
                  </TableHead>
                  <TableHead className=" text-sm font-normal h-8">
                    Commodity
                  </TableHead>
                  <TableHead className=" text-sm font-normal h-8">
                    Delear&apos;s description
                  </TableHead>
                  <TableHead className="w-[100px] text-sm font-normal h-8">
                    Action
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
                    <TableCell className="flex gap-2">
                      <Button
                        className="text-white bg-blue-500 hover:bg-blue-600 hover:-translate-y-1 transition-all duration-500 rounded-sm px-2 h-8 text-sm flex items-center gap-2  font-medium py-2"
                        onClick={() => removeCommodity(index)}
                      >
                        Delete
                      </Button>
                    </TableCell>
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
                defaultValue="exempt"
                className="flex gap-2 mt-2"
                id="radio1"
                value={frequencyFilings}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="MONTHLY"
                    id="MONTHLY"
                    onClick={() =>
                      setFrequencyFilings(FrequencyFilings.MONTHLY)
                    }
                  />
                  <Label
                    htmlFor="MONTHLY"
                    className="cursor-pointer text-xs font-normal"
                    onClick={() =>
                      setFrequencyFilings(FrequencyFilings.MONTHLY)
                    }
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

          <div className="flex gap-2">
            <div className="grow"></div>
            <Button
              onClick={() => router.push("/dashboard/dvat1")}
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

export default Dvat2Page;
