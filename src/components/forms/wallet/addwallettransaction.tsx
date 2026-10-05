"use client";

import { FormProvider, useForm, useFormContext } from "react-hook-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TaxtInput } from "../inputfields/textinput";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { ToWords } from "to-words";
import { capitalcase, encryptURLData, onFormError } from "@/utils/methods";
import { TaxtAreaInput } from "../inputfields/textareainput";
import { Separator } from "@/components/ui/separator";
import AddWalletTransaction from "@/action/wallet/addwallettransaction";
import { dvat04 } from "@prisma/client";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import * as v from "valibot";

const AddWalletTransactionSchema = v.object({
  amount: v.pipe(
    v.string(),
    v.minLength(1, "Amount is required"),
    v.regex(/^\d+(\.\d{1,2})?$/, "Amount must be a valid number"),
  ),
  remark: v.optional(v.string()),
});

type AddWalletTransactionForm = v.InferInput<
  typeof AddWalletTransactionSchema
>;

type AddWalletTransactionProviderProps = {
  userid: number;
};

export const AddWalletTransactionProvider = (
  props: AddWalletTransactionProviderProps,
) => {
  const methods = useForm<AddWalletTransactionForm>({
    resolver: valibotResolver(AddWalletTransactionSchema),
    defaultValues: {
      amount: "",
      remark: "",
    },
  });

  return (
    <FormProvider {...methods}>
      <AddWalletTransactionPage userid={props.userid} />
    </FormProvider>
  );
};

const AddWalletTransactionPage = (props: AddWalletTransactionProviderProps) => {
  const router = useRouter();
  const toWords = new ToWords({
    localeCode: "en-IN",
  });

  const [dvatdata, setDvatData] = useState<dvat04 | null>(null);

  const {
    reset,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = useFormContext<AddWalletTransactionForm>();

  useEffect(() => {
    const loadData = async () => {
      const dvatResponse = await GetUserDvat04();
      if (!dvatResponse.status || !dvatResponse.data) {
        toast.error(dvatResponse.message);
        return;
      }

      setDvatData(dvatResponse.data);
    };

    loadData();

    reset({
      amount: "",
      remark: "",
    });
  }, [reset]);

  const onSubmit = async (data: AddWalletTransactionForm) => {
    if (dvatdata == null) {
      return toast.error("DVAT profile not found.");
    }

    const amountNum = parseFloat(data.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return toast.error("Amount must be greater than 0.");
    }

    const transaction_response = await AddWalletTransaction({
      amount: amountNum,
      remark: data.remark,
    });

    if (transaction_response.status && transaction_response.data) {
      toast.success(transaction_response.message);
      reset({ amount: "", remark: "" });
      router.push(
        `/dashboard/payments/saved-challan/${encryptURLData(transaction_response.data.challanId.toString())}`,
      );
    } else {
      toast.error(transaction_response.message);
    }
  };

  const getTotalAmount = (): number => {
    const amount = parseFloat(watch("amount"));
    return isNaN(amount) ? 0 : amount;
  };

  return (
    <>
      <div className="py-1 text-sm font-medium border-y-2 border-gray-300 mt-4">
        Details Of Taxpayer
      </div>
      <div className="p-1 bg-gray-50 grid grid-cols-4 gap-6 justify-between px-4">
        <div>
          <p className="text-sm">User TIN Number</p>
          <p className="text-sm font-medium">{dvatdata?.tinNumber}</p>
        </div>
        <div>
          <p className="text-sm">Name</p>
          <p className="text-sm font-medium">{dvatdata?.tradename}</p>
        </div>
        <div>
          <p className="text-sm">Email</p>
          <p className="text-sm font-medium">{dvatdata?.email}</p>
        </div>
        <div>
          <p className="text-sm">Mobile</p>
          <p className="text-sm font-medium">{dvatdata?.contact_one}</p>
        </div>
        <div>
          <p className="text-sm">Address</p>
          <p className="text-sm font-medium">{dvatdata?.address}</p>
        </div>
        <div>
          <p className="text-sm">Current Wallet Amount</p>
          <p className="text-sm font-medium text-blue-600">
            ₹ {parseFloat(dvatdata?.wallet || "0").toFixed(2)}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onFormError)}>
        <div className="p-2 bg-gray-50 mt-2 flex gap-4 items-end">
          <div className="w-72">
            <p className="text-sm font-normal">Transaction Type</p>
            <p className="text-sm font-medium text-green-600">CREDIT</p>
          </div>
          <div>
            <p className="text-sm font-normal">Date</p>
            <p className="text-sm font-medium">
              {new Date().toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <Table className="border mt-2">
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead className="whitespace-nowrap text-center px-2 border">
                  Payment Description
                </TableHead>
                <TableHead className="whitespace-nowrap text-center px-2 w-60 border">
                  Amount (₹)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="text-left p-2 border">
                  Wallet Credit / Top-up Amount
                </TableCell>
                <TableCell className="text-center p-2 border">
                  <TaxtInput<AddWalletTransactionForm>
                    name="amount"
                    required={true}
                    numdes={true}
                    placeholder="0.00"
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-left p-2 border">
                  Total Amount:
                </TableCell>
                <TableCell className="text-left p-2 border font-semibold">
                  ₹ {getTotalAmount().toFixed(2)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-left p-2 border">
                  Total amount paid (in words): Rupees
                </TableCell>
                <TableCell className="text-left p-2 border">
                  {capitalcase(toWords.convert(getTotalAmount()))}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <div className="w-96 shrink-0 p-2">
            <p className="text-center text-xl font-semibold">
              Wallet Top-up Challan
            </p>
            <p className="mt-2 text-sm">
              Add amount to your wallet account for smooth VAT payment
              processing.
            </p>
            <p className="mt-3 text-sm">
              This challan will be created for your wallet top-up request.
              After payment, the amount will be credited to your wallet.
            </p>
            <p className="mt-3 text-sm">
              Credited: Consolidated Fund of India
            </p>
            <p className="mt-3 text-sm">
              Head: 0040, Value Added Tax Receipt - Wallet Top-up
            </p>
            <Separator />
            <div className="mt-2"></div>

            <TaxtAreaInput<AddWalletTransactionForm>
              name="remark"
              title="Remark (Optional)"
              required={false}
              placeholder="Enter additional remarks or notes"
            />
            <div className="w-full flex gap-2 mt-2">
              <div className="grow"></div>
              <input
                type="reset"
                onClick={(e) => {
                  e.preventDefault();
                  reset({ amount: "", remark: "" });
                }}
                value={"Reset"}
                className="py-1 rounded-md bg-gray-500 px-4 text-sm text-white cursor-pointer hover:bg-gray-600"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white cursor-pointer hover:bg-blue-600 disabled:opacity-50"
              >
                {isSubmitting ? "Loading...." : "Generate Challan"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </>
  );
};
