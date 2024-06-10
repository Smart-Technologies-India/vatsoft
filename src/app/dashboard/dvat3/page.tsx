"use client";
import { Button } from "@/components/ui/button";
import { FormSteps } from "@/components/formstepts";
import { DepositType, dvat04 } from "@prisma/client";
import { useEffect, useRef, useState } from "react";
import GetUser from "@/action/user/getuser";
import { getCookie } from "cookies-next";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { IcBaselineCalendarMonth } from "@/components/icons";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { handleNumberChange } from "@/utils/methods";
import { ApiResponseType } from "@/models/response";
import { safeParse } from "valibot";
import { Dvat3Schema } from "@/schema/dvat3";
import Dvat3CreateUpdate from "@/action/user/register/dvat3";
import GetDvat from "@/action/user/register/getdvat";

const Dvat3Page = () => {
  const id: number = parseInt(getCookie("id") ?? "0");

  const router = useRouter();

  const [dvatData, setDvatData] = useState<dvat04>();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmit, setIsSubmit] = useState<boolean>(false);

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

  const handelSubmit = async () => {
    setIsSubmit(true);
    const result = safeParse(Dvat3Schema, {
      securityDepositAmount: securityDepositAmountRef.current?.value,
      depositType: depositType,
      dateOfExpiry: dateOfExpiry?.toString(),
      nameOfBank: nameOfBankRef.current?.value,
      branchName: branchNameRef.current?.value,
      transactionId: transactionIdRef.current?.value,
      numberOfOwners: parseInt(numberOfOwnersRef.current?.value ?? "0"),
      nmberOfManagers: parseInt(numberOfManagersRef.current?.value ?? "0"),
      numberOfSignatory: parseInt(numberOfSignatoryRef.current?.value ?? "0"),
      nameOfManager: nameOfManagerRef.current?.value,
      nameOfSignatory: nameOfSignatoryRef.current?.value,
    });

    if (result.success) {
      const userrespone: ApiResponseType<dvat04 | null> =
        await Dvat3CreateUpdate({
          createdById: id,
          securityDepositAmount: result.output.securityDepositAmount,
          depositType: result.output.depositType,
          dateOfExpiry: new Date(result.output.dateOfExpiry),
          nameOfBank: result.output.nameOfBank,
          branchName: result.output.branchName,
          transactionId: result.output.transactionId,
          numberOfOwners: result.output.numberOfOwners,
          nmberOfManagers: result.output.nmberOfManagers,
          numberOfSignatory: result.output.numberOfSignatory,
          nameOfManager: result.output.nameOfManager,
          nameOfSignatory: result.output.nameOfSignatory,
        });
      if (userrespone.status) {
        router.push("/dashboard/anx1");
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
        // setUser(user.data!);
      } else {
        toast.error(user.message);
      }

      const dvatdata = await GetDvat({ userid: id });

      if (dvatdata.status) {
        console.log(dvatdata.data);
        setTimeout(() => {
          console.log(dvatdata.data?.transactionId);
          transactionIdRef.current!.value = dvatdata.data?.transactionId ?? "";
          securityDepositAmountRef.current!.value =
            dvatdata.data?.securityDepositAmount ?? "";
          nameOfBankRef.current!.value = dvatdata.data?.nameOfBank ?? "";
          branchNameRef.current!.value = dvatdata.data?.branchName ?? "";
          setDepositType(dvatdata.data?.depositType ?? DepositType.FIXED);
          setDateOfExpiry(dvatdata.data?.dateOfExpiry ?? new Date());
          numberOfOwnersRef.current!.value =
            dvatdata.data?.numberOfOwners?.toString() ?? "";
          numberOfManagersRef.current!.value =
            dvatdata.data?.nmberOfManagers?.toString() ?? "";
          numberOfSignatoryRef.current!.value =
            dvatdata.data?.numberOfSignatory?.toString() ?? "";
          nameOfManagerRef.current!.value = dvatdata.data?.nameOfManager ?? "";
          nameOfSignatoryRef.current!.value =
            dvatdata.data?.nameOfSignatory ?? "";
        }, 1000);
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
            completedSteps={4}
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
              className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
              onChange={handleNumberChange}
            />
          </div>

          <div className="flex gap-4 mt-2">
            <div className="flex-1">
              <Label
                htmlFor="numbertofmanagers"
                className="text-sm font-normal"
              >
                20 Number of Managers <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={numberOfManagersRef}
                type="text"
                name="numbertofmanagers"
                id="numbertofmanagers"
                className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                placeholder="Number Of Managers"
                onChange={handleNumberChange}
              />
            </div>

            <div className="flex-1">
              <Label
                htmlFor="numbertofsignatory"
                className="text-sm font-normal"
              >
                21. Number of authorised signatory{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={numberOfSignatoryRef}
                type="text"
                name="numbertofsignatory"
                id="numbertofsignatory"
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
                className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                placeholder="Name of authorised signatory"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <div className="grow"></div>
            <Button
              onClick={() => router.push("/dashboard/dvat2")}
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

export default Dvat3Page;
