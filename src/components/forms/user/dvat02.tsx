"use client";
import {
  FieldErrors,
  FormProvider,
  useForm,
  useFormContext,
} from "react-hook-form";

import { TaxtInput } from "../inputfields/textinput";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MultiSelect } from "../inputfields/multiselect";
import { CommodityData, OptionValue } from "@/models/main";
import { YesNoRabioInput } from "../inputfields/yesnoradioinput";

import { DateSelect } from "../inputfields/dateselect";
import { TaxtAreaInput } from "../inputfields/textareainput";
import GetDvat04 from "@/action/register/getdvat04";
import { ApiResponseType } from "@/models/response";
import {
  CommidityPursose,
  commodity,
  dvat04,
  FrequencyFilings,
  NatureOfBusiness,
  SelectOffice,
} from "@prisma/client";
import DvatUpdate from "@/action/user/register/dvat1";
import { toast } from "react-toastify";
import { Dvat2Form, Dvat2Schema } from "@/schema/dvat2";
import { Checkbox } from "antd";
import { CheckboxChangeEvent } from "antd/es/checkbox";
import { RabioInput } from "../inputfields/radioinput";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import GetAllCommodity from "@/action/commodity/getcommodity";
import Dvat2Update from "@/action/user/register/dvat2";
import { onFormError } from "@/utils/methods";

type Dvat01ProviderProps = {
  dvatid: number;
  userid: number;
};
export const Dvat02Provider = (props: Dvat01ProviderProps) => {
  const methods = useForm<Dvat2Form>({
    resolver: valibotResolver(Dvat2Schema),
  });

  return (
    <FormProvider {...methods}>
      <Dvat04 dvatid={props.dvatid} userid={props.userid} />
    </FormProvider>
  );
};

const Dvat04 = (props: Dvat01ProviderProps) => {
  const router = useRouter();
  const [isSaveAddress, setIsSameAddress] = useState<boolean>(false);
  const [dvatdata, setDvatData] = useState<dvat04>();

  const [commodity, setCommodity] = useState<commodity[]>([]);
  const [commodityData, setCommodityData] = useState<CommodityData[]>([]);

  const [selectCom, setSelectCom] = useState<string>("0");
  const [purpose, setPurpose] = useState<CommidityPursose | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

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
      setPurpose(null);
      descriptionRef.current!.value = "";
    }
  };

  const removeCommodity = (index: number) => {
    const data = [...commodityData];
    data.splice(index, 1);
    setCommodityData(data);
  };

  const typeOfAccount: OptionValue[] = [
    { value: "CURRENT", label: "Current Account" },
    { value: "SAVING", label: "Saving Account" },
    { value: "OVERDRAFT", label: "Overdraft Account" },
    { value: "CASH_CREDIT", label: "Cash Credit Account" },
  ];

  const accountingBasis: OptionValue[] = [
    { value: "CASH", label: "CASH" },
    { value: "ACCRUAL", label: "ACCRUAL" },
  ];

  const {
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useFormContext<Dvat2Form>();

  const onSubmit = async (data: Dvat2Form) => {
    if (commodityData.length == 0)
      return toast.error("Enter atleast one commodity");
    const userrespone: ApiResponseType<dvat04 | null> = await Dvat2Update({
      id: props.dvatid,
      updatedby: props.userid,
      noticeServingBuildingName: data.noticeServingBuildingName,
      noticeServingArea: data.noticeServingArea,
      noticeServingAddress: data.noticeServingAddress,
      noticeServingCity: data.noticeServingCity,
      noticeServingPincode: data.noticeServingPincode,
      additionalGodown: data.additionalGodown,
      additionalFactory: data.additionalFactory,
      additionalShops: data.additionalShops,
      otherPlaceOfBusiness: data.otherPlaceOfBusiness,
      accountnumber: data.accountnumber,
      typeOfAccount: data.typeOfAccount,
      bankName: data.bankName,
      ifscCode: data.ifscCode,
      addressOfBank: data.addressOfBank,
      ownCapital: data.ownCapital,
      loanFromBank: data.loanFromBank,
      loanFromOther: data.loanFromOther,
      plantAndMachinery: data.plantAndMachinery,
      landAndBuilding: data.landAndBuilding,
      otherAssetsInvestments: data.otherAssetsInvestments,
      accountingBasis: data.accountingBasis,
      frequencyFilings: data.frequencyFilings,
      CommodityData: commodityData,
    });

    if (userrespone.status) {
      router.push(`/dashboard/new-registration/${props.dvatid}/dvat3`);
    } else {
      toast.error(userrespone.message);
    }

    reset({});
  };

  useEffect(() => {
    const init = async () => {
      setCommodityData([]);
      const commoditylist = await GetAllCommodity({});

      if (commoditylist.status) {
        setCommodity(commoditylist.data!);
      }

      const dvat: any = await GetDvat04({ id: props.dvatid });
      if (dvat.status && dvat.data) {
        setDvatData(dvat.data);

        reset({
          noticeServingAddress: dvat.data!.noticeServingAddress,
          noticeServingArea: dvat.data!.noticeServingArea,
          noticeServingCity: dvat.data!.noticeServingCity,
          noticeServingBuildingName: dvat.data!.noticeServingBuildingName,
          noticeServingPincode: dvat.data!.noticeServingPincode,
          additionalFactory: dvat.data!.additionalFactory,
          additionalGodown: dvat.data!.additionalGodown,
          additionalShops: dvat.data!.additionalShops,
          otherPlaceOfBusiness: dvat.data!.otherPlaceOfBusiness,
          accountnumber: dvat.data!.accountnumber,
          bankName: dvat.data!.bankName,
          typeOfAccount: dvat.data!.typeOfAccount!,
          ifscCode: dvat.data!.ifscCode,
          addressOfBank: dvat.data.addressOfBank,
          ownCapital: dvat.data.ownCapital,
          loanFromBank: dvat.data!.loanFromBank,
          loanFromOther: dvat.data.loanFromOther,
          plantAndMachinery: dvat.data.plantAndMachinery,
          landAndBuilding: dvat.data.landAndBuilding,
          otherAssetsInvestments: dvat.data.otherAssetsInvestments,
          accountingBasis: dvat.data.accountingBasis,
          frequencyFilings: dvat.data.frequencyFilings,
        });

        if (dvat.data.selectComOneId) {
          const commodityone = {
            id: dvat.data!.selectComOneId,
            act: dvat.data!.selectComOne.act,
            code: dvat.data!.selectComOne.code,
            commodity: dvat.data!.selectComOne.name,
            purpose: dvat.data!.purposeOne,
            description: dvat.data!.descriptionOne,
          };
          setCommodityData((prev) => [...prev, commodityone]);
        }

        if (dvat.data!.selectComTwoId) {
          const commoditytwo = {
            id: dvat.data!.selectComTwoId,
            act: dvat.data!.selectComTwo.act,
            code: dvat.data!.selectComTwo.code,
            commodity: dvat.data!.selectComTwo.name,
            purpose: dvat.data!.purposeTwo,
            description: dvat.data!.descriptionTwo,
          };
          setCommodityData((prev) => [...prev, commoditytwo]);
        }

        if (dvat.data!.selectComThreeId) {
          const commoditythree = {
            id: dvat.data!.selectComThreeId,
            act: dvat.data!.selectComThree.act,
            code: dvat.data!.selectComThree.code,
            commodity: dvat.data!.selectComThree.name,
            purpose: dvat.data!.purposeThree,
            description: dvat.data!.descriptionThree,
          };
          setCommodityData((prev) => [...prev, commoditythree]);
        }

        if (dvat.data!.selectComFourId) {
          const commodityfour = {
            id: dvat.data!.selectComFourId,
            act: dvat.data!.selectComFour.act,
            code: dvat.data!.selectComFour.code,
            commodity: dvat.data!.selectComFour.name,
            purpose: dvat.data!.purposeFour,
            description: dvat.data!.descriptionFour,
          };
          setCommodityData((prev) => [...prev, commodityfour]);
        }

        if (dvat.data!.selectComFiveId) {
          const commodityfive = {
            id: dvat.data!.selectComFiveId,
            act: dvat.data!.selectComFive.act,
            code: dvat.data!.selectComFive.code,
            commodity: dvat.data!.selectComFive.name,
            purpose: dvat.data!.purposeFive,
            description: dvat.data!.descriptionFive,
          };
          setCommodityData((prev) => [...prev, commodityfive]);
        }
      }
    };
    init();
  }, [props.dvatid, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit, onFormError)}>
      <div className="rounded-sm p-4 border border-black mt-6 relative">
        <span className="-translate-y-7 bg-white px-1 -translate-x-2 inline-block absolute text-sm">
          11 Address for service of notice (If Different From Principle Place of
          Business)
        </span>
        <div className="text-sm flex gap-1 items-center">
          <Checkbox
            onChange={(value: CheckboxChangeEvent) => {
              setIsSameAddress(value.target.checked);

              if (value && dvatdata) {
                reset({
                  noticeServingBuildingName: dvatdata.buildingNumber!,
                  noticeServingArea: dvatdata.area!,
                  noticeServingCity: dvatdata.city!,
                  noticeServingPincode: dvatdata.pincode!,
                  noticeServingAddress: dvatdata.address!,
                });
              }
            }}
          />
          <p>Same as Principle Place Of Business</p>
        </div>

        <div className="flex gap-4 items-end mt-2">
          <div className="flex-1">
            <TaxtInput<Dvat2Form>
              placeholder="Building Name"
              name="noticeServingBuildingName"
              required={true}
              title="Building Name"
              disable={isSaveAddress}
            />
          </div>
          <div className="flex-1">
            <TaxtInput<Dvat2Form>
              placeholder="Area/Locality"
              name="noticeServingArea"
              required={true}
              title="Area/Locality"
              disable={isSaveAddress}
            />
          </div>
        </div>

        <div className="flex gap-4 mt-2">
          <div className="flex-1">
            <TaxtInput<Dvat2Form>
              placeholder="City"
              name="noticeServingCity"
              required={true}
              title="City"
              disable={isSaveAddress}
            />
          </div>
          <div className="flex-1">
            <TaxtInput<Dvat2Form>
              placeholder="Pincode"
              name="noticeServingPincode"
              required={true}
              title="Pincode"
              disable={isSaveAddress}
              onlynumber={true}
              maxlength={6}
            />
          </div>
        </div>

        <div className="mt-2">
          <TaxtAreaInput<Dvat2Form>
            placeholder="Enter Address"
            name="noticeServingAddress"
            required={true}
            disable={isSaveAddress}
            title="Address"
          />
        </div>
      </div>

      <div className="rounded-sm p-4 border border-black mt-6 relative">
        <span className="-translate-y-7 bg-white px-1 -translate-x-2 inline-block absolute text-sm">
          12 Number of additional places of business within or outside the state{" "}
          <span className="text-rose-500">(Please Complete annexure II)</span>
        </span>
        <div className="flex gap-4 mt-2">
          <div className="flex-1">
            <TaxtInput<Dvat2Form>
              placeholder="Godown"
              name="additionalGodown"
              required={true}
              title="Godown"
              onlynumber={true}
            />
          </div>
          <div className="flex-1">
            <TaxtInput<Dvat2Form>
              placeholder="Factory"
              name="additionalFactory"
              required={true}
              title="Factory"
              onlynumber={true}
            />
          </div>
        </div>
        <div className="flex gap-4 mt-2">
          <div className="flex-1">
            <TaxtInput<Dvat2Form>
              placeholder="Shops"
              name="additionalShops"
              required={true}
              title="Shops"
              onlynumber={true}
            />
          </div>
          <div className="flex-1">
            <TaxtInput<Dvat2Form>
              placeholder="Other Place of Business"
              name="otherPlaceOfBusiness"
              required={true}
              title="Other Place of Business"
              onlynumber={true}
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
            <TaxtInput<Dvat2Form>
              placeholder="Bank Name"
              name="bankName"
              required={true}
              title="Bank Name"
            />
          </div>
          <div className="flex-1">
            <MultiSelect<Dvat2Form>
              name={"typeOfAccount"}
              options={typeOfAccount}
              placeholder="Select Type of Account"
              title="Type of Account"
              required={true}
            />
          </div>
        </div>

        <div className="flex gap-4 mt-2">
          <div className="flex-1">
            <TaxtInput<Dvat2Form>
              placeholder="IFSC Code"
              name="ifscCode"
              required={true}
              title="IFSC Code"
            />
          </div>
          <div className="flex-1">
            <TaxtInput<Dvat2Form>
              placeholder="Account Number"
              name="accountnumber"
              required={true}
              title="Account Number"
              onlynumber={true}
            />
          </div>
        </div>

        <div className="mt-2">
          <TaxtAreaInput<Dvat2Form>
            placeholder="Address of Bank"
            name="addressOfBank"
            required={true}
            title="Address of Bank"
          />
        </div>
      </div>

      <div className="rounded-sm p-4 border border-black mt-6 relative">
        <span className="-translate-y-7 bg-white px-1 -translate-x-2 inline-block absolute text-sm">
          14 Details Of Investment in the business (details should be current as
          on date of application)
        </span>

        <div className="flex gap-4 mt-2">
          <div className="flex-1">
            <TaxtInput<Dvat2Form>
              placeholder="Own Capital"
              name="ownCapital"
              required={true}
              title="Own Capital (Rs)"
            />
          </div>
          <div className="flex-1">
            <TaxtInput<Dvat2Form>
              placeholder="Loan From Bank"
              name="loanFromBank"
              required={true}
              title="Loan From Bank (Rs)"
            />
          </div>
        </div>
        <div className="flex gap-4 mt-2">
          <div className="flex-1">
            <TaxtInput<Dvat2Form>
              placeholder="Loan From Other"
              name="loanFromOther"
              required={true}
              title="Loan From Other (Rs)"
            />
          </div>
          <div className="flex-1">
            <TaxtInput<Dvat2Form>
              placeholder="Plant And Machinery"
              name="plantAndMachinery"
              required={true}
              title="Plant And Machinery (Rs)"
            />
          </div>
        </div>

        <div className="flex gap-4 mt-2">
          <div className="flex-1">
            <TaxtInput<Dvat2Form>
              placeholder="Land & Building"
              name="landAndBuilding"
              required={true}
              title="Land & Building (Rs)"
            />
          </div>
          <div className="flex-1">
            <TaxtInput<Dvat2Form>
              placeholder="Other Assets & Investments"
              name="otherAssetsInvestments"
              required={true}
              title="Other Assets & Investments (Rs)"
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
              value={selectCom}
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
              value={purpose ?? undefined}
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
            id="description"
            className="px-2 py-1 focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm resize-none mt-1"
            placeholder="Dealer Description of Commodity"
          />
        </div>

        {commodityData.length < 5 && (
          <Button
            type="button"
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
              <TableHead className=" text-sm font-normal h-8">Code</TableHead>
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
                <TableCell className="text-xs p-2">{com.act}</TableCell>
                <TableCell className="text-xs p-2">{com.code}</TableCell>
                <TableCell className="text-xs p-2">{com.commodity}</TableCell>
                <TableCell className="text-xs p-2">{com.description}</TableCell>
                <TableCell className="flex gap-2 p-2">
                  <Button
                    type="button"
                    className="text-white bg-blue-500 hover:bg-blue-600 hover:-translate-y-1 transition-all duration-500 rounded-sm px-2 h-8 text-sm flex items-center gap-2  font-medium py-2"
                    onClick={(e) => {
                      e.preventDefault();
                      removeCommodity(index);
                    }}
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
            No Commodity Added Yet! Add Commodity to Proceed Further.
          </div>
        ) : null}
      </div>

      <div className="flex gap-4 mt-2">
        <div className="flex-1">
          <MultiSelect<Dvat2Form>
            name={"accountingBasis"}
            options={accountingBasis}
            placeholder="Select Accounting Basis"
            title="16. Accounting Basis"
            required={true}
          />
        </div>
        <div className="flex-1">
          <RabioInput<Dvat2Form>
            name={"frequencyFilings"}
            title="17. Frequency of filing return"
            extratax={
              <p className="text-xs">
                (to be filled in by the dealer whose turnover is less then Rs. 5
                crore in the preceeding year)
              </p>
            }
            required={true}
            options={[
              {
                label: "MONTHLY",
                value: FrequencyFilings.MONTHLY,
              },
              {
                label: "QUARTERLY",
                value: FrequencyFilings.QUARTERLY,
              },
            ]}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <div className="grow"></div>
        <input
          type="reset"
          onClick={() => {
            reset({});
            setIsSameAddress(false);
          }}
          value={"Reset"}
          className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white mt-2 cursor-pointer"
        />

        <button
          onClick={(e) => {
            e.preventDefault();
            router.push(`/dashboard/new-registration/${props.dvatid}/dvat1`);
          }}
          className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white mt-2 cursor-pointer"
        >
          Previous
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white mt-2 cursor-pointer"
        >
          {isSubmitting ? "Loading...." : "Next"}
        </button>
      </div>
    </form>
  );
};
