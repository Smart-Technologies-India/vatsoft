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
import { useRouter } from "next/navigation";
import { MultiSelect } from "../inputfields/multiselect";
import { OptionValue } from "@/models/main";
import { toast } from "react-toastify";
import { ToWords } from "to-words";
import { TaxtAreaInput } from "../inputfields/textareainput";
import { Separator } from "@/components/ui/separator";
import { CreateRefundForm, CreateRefundSchema } from "@/schema/refunds";
import CreateRefund from "@/action/refund/createrefund";
import { onFormError } from "@/utils/methods";
import { useEffect, useState } from "react";
import { dvat04 } from "@prisma/client";
import GetUserDvat04 from "@/action/dvat/getuserdvat";

type CreateChallanProviderProps = {
  userid: number;
};
export const CreateRefundProvider = (props: CreateChallanProviderProps) => {
  const methods = useForm<CreateRefundForm>({
    resolver: valibotResolver(CreateRefundSchema),
  });

  return (
    <FormProvider {...methods}>
      <CreateRefundPage userid={props.userid} />
    </FormProvider>
  );
};

const CreateRefundPage = (props: CreateChallanProviderProps) => {
  const router = useRouter();
  const toWords = new ToWords();
  const [dvatdata, setDvatData] = useState<dvat04 | null>(null);
  useEffect(() => {
    const init = async () => {
      const dvat = await GetUserDvat04({
        userid: props.userid,
      });
      if (dvat.status && dvat.data) {
        setDvatData(dvat.data);
      }
    };
    init();
  }, [props.userid]);

  const refundReason: OptionValue[] = [
    {
      value: "Refund of Excess Balance in Electronic Cash Leadger",
      label: "Refund of Excess Balance in Electronic Cash Leadger",
    },
    {
      value:
        "Refund of ITC on Export of Goods & Services without Payment of Tax",
      label:
        "Refund of ITC on Export of Goods & Services without Payment of Tax",
    },
    {
      value:
        "On account of supplies made to SEZ unit/SEZ developer (without payment of tax)",
      label:
        "On account of supplies made to SEZ unit/SEZ developer (without payment of tax)",
    },
    {
      value:
        "Refund on account of ITC accumulated due to Inverted Tax Structure",
      label:
        "Refund on account of ITC accumulated due to Inverted Tax Structure",
    },
    {
      value: "On Account of Refund by Recipient of deemed export",
      label: "On Account of Refund by Recipient of deemed export",
    },
    {
      value:
        "Refund on account of Supplies t SEZ unit/ SEZ Developer (with payment of tax)",
      label:
        "Refund on account of Supplies t SEZ unit/ SEZ Developer (with payment of tax)",
    },
    {
      value: "Export of service with payment of tax",
      label: "Export of service with payment of tax",
    },
    {
      value:
        "Tax paid on an intra-State supply which is subsequently held to be inter-State supply and vice versa",
      label:
        "Tax paid on an intra-State supply which is subsequently held to be inter-State supply and vice versa",
    },
    {
      value: "On account of Refund by Supplider of deemed export",
      label: "On account of Refund by Supplider of deemed export",
    },
    { value: "Any other (specify)", label: "Any other (specify)" },
    { value: "excess payment of tax", label: "excess payment of tax" },
    {
      value:
        "On Account of Assessment/Provisional Assessment/Appeal/Any other order",
      label:
        "On Account of Assessment/Provisional Assessment/Appeal/Any other order",
    },
    {
      value:
        "Refund ofn tax paid on Inward Supplies of goods by canteen store Department (CSD)",
      label:
        "Refund ofn tax paid on Inward Supplies of goods by canteen store Department (CSD)",
    },
  ];

  const {
    reset,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useFormContext<CreateRefundForm>();

  const onSubmit = async (data: CreateRefundForm) => {
    if (dvatdata == null) return toast.error("User Dvat not exist");

    const challan_response = await CreateRefund({
      dvatid: dvatdata.id ?? 0,
      createdby: props.userid,
      latefees: data.latefees.toString(),
      vat: data.vat.toString(),
      interest: data.interest.toString(),
      others: data.others ?? "0",
      reason: data.reason,
      total_tax_amount: getTotalAmount().toString(),
      penalty: data.penalty.toString(),
      remark: data.remark,
      old_grievance_number: data.old_grievance_number ?? undefined,
      oldcpin: data.oldcpin ?? undefined,
    });

    if (challan_response.status) {
      toast.success("Refund request submitted successfully");
      router.back();
    } else {
      toast.error(challan_response.message);
    }

    reset({});
  };

  const getTotalAmount = (): number => {
    const vat = parseFloat(watch("vat"));
    const interest = parseFloat(watch("interest"));
    const latefees = parseFloat(watch("latefees") ?? "0");
    const penalty = parseFloat(watch("penalty"));
    const others = parseFloat(watch("others") ?? "0");

    const total: number =
      (isNaN(vat) ? 0 : vat) +
      (isNaN(interest) ? 0 : interest) +
      (isNaN(latefees) ? 0 : latefees) +
      (isNaN(penalty) ? 0 : penalty) +
      (isNaN(others) ? 0 : others);

    return total;
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit, onFormError)}>
        {/* Basic Information Section */}
        <div className="mb-4">
          <div className="mb-3">
            <h2 className="text-sm font-medium text-gray-900">
              Basic Information
            </h2>
            <p className="text-gray-500 text-xs mt-0.5">
              Provide basic refund details
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs font-medium text-gray-600">Payment Type</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">
                Refund Against ITC
              </p>
            </div>
            <div>
              <TaxtInput<CreateRefundForm>
                name="old_grievance_number"
                required={false}
                numdes={true}
                title="Previous Grievance Number"
                placeholder="Previous Grievance Number"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <div>
              <TaxtInput<CreateRefundForm>
                name="oldcpin"
                required={false}
                numdes={true}
                title="Previous CPIN"
                placeholder="Previous CPIN"
              />
            </div>
            <div>
              <MultiSelect<CreateRefundForm>
                placeholder="Select Reason"
                name="reason"
                required={true}
                title="Reason For Challan"
                options={refundReason}
              />
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Liability Register Section */}
        <div className="mb-4">
          <div className="mb-3">
            <h2 className="text-sm font-medium text-gray-900">
              Electronic Liability Register
            </h2>
            <p className="text-gray-500 text-xs mt-0.5">
              Current liability details
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="whitespace-nowrap w-32 border-r p-2 font-medium text-gray-700"></TableHead>
                  <TableHead className="whitespace-nowrap border-r p-2 font-medium text-gray-700">
                    Tax (&#x20b9;)
                  </TableHead>
                  <TableHead className="whitespace-nowrap border-r p-2 font-medium text-gray-700">
                    Interest (&#x20b9;)
                  </TableHead>
                  <TableHead className="whitespace-nowrap border-r p-2 font-medium text-gray-700">
                    Penalty (&#x20b9;)
                  </TableHead>
                  <TableHead className="whitespace-nowrap border-r p-2 font-medium text-gray-700">
                    Late Fees (&#x20b9;)
                  </TableHead>
                  <TableHead className="whitespace-nowrap border-r p-2 font-medium text-gray-700">
                    Others (&#x20b9;)
                  </TableHead>
                  <TableHead className="whitespace-nowrap p-2 font-medium text-gray-700">
                    Total (&#x20b9;)
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="hover:bg-gray-50">
                  <TableCell className="font-medium p-2 border-r bg-gray-50">
                    VAT Tax
                  </TableCell>
                  <TableCell className="p-2 border-r text-gray-600">
                    0.00
                  </TableCell>
                  <TableCell className="p-2 border-r text-gray-600">
                    0.00
                  </TableCell>
                  <TableCell className="p-2 border-r text-gray-600">
                    0.00
                  </TableCell>
                  <TableCell className="p-2 border-r text-gray-600">
                    0.00
                  </TableCell>
                  <TableCell className="p-2 border-r text-gray-600">
                    0.00
                  </TableCell>
                  <TableCell className="p-2 font-medium text-gray-900">
                    0.00
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Refund Amount Details Section */}
        <div className="mb-4">
          <div className="mb-3">
            <h2 className="text-sm font-medium text-gray-900">
              Refund Amount Details
            </h2>
            <p className="text-gray-500 text-xs mt-0.5">
              Enter the refund amount breakdown
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="whitespace-nowrap w-32 border-r p-2 font-medium text-gray-700"></TableHead>
                  <TableHead className="whitespace-nowrap border-r p-2 font-medium text-gray-700">
                    Tax (&#x20b9;)
                  </TableHead>
                  <TableHead className="whitespace-nowrap border-r p-2 font-medium text-gray-700">
                    Interest (&#x20b9;)
                  </TableHead>
                  <TableHead className="whitespace-nowrap border-r p-2 font-medium text-gray-700">
                    Penalty (&#x20b9;)
                  </TableHead>
                  <TableHead className="whitespace-nowrap border-r p-2 font-medium text-gray-700">
                    Late Fees (&#x20b9;)
                  </TableHead>
                  <TableHead className="whitespace-nowrap border-r p-2 font-medium text-gray-700">
                    Others (&#x20b9;)
                  </TableHead>
                  <TableHead className="whitespace-nowrap p-2 font-medium text-gray-700 w-20">
                    Total (&#x20b9;)
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="hover:bg-gray-50">
                  <TableCell className="font-medium p-2 border-r bg-gray-50">
                    VAT Tax
                  </TableCell>
                  <TableCell className="p-2 border-r">
                    <TaxtInput<CreateRefundForm>
                      name="vat"
                      required={true}
                      numdes={true}
                    />
                  </TableCell>
                  <TableCell className="p-2 border-r">
                    <TaxtInput<CreateRefundForm>
                      name="interest"
                      required={true}
                      numdes={true}
                    />
                  </TableCell>
                  <TableCell className="p-2 border-r">
                    <TaxtInput<CreateRefundForm>
                      name="penalty"
                      numdes={true}
                      required={true}
                    />
                  </TableCell>
                  <TableCell className="p-2 border-r">
                    <TaxtInput<CreateRefundForm>
                      name="latefees"
                      required={true}
                      numdes={true}
                    />
                  </TableCell>
                  <TableCell className="p-2 border-r">
                    <TaxtInput<CreateRefundForm>
                      name="others"
                      required={true}
                      numdes={true}
                    />
                  </TableCell>
                  <TableCell className="p-2 font-medium text-gray-900">
                    {getTotalAmount()}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Remark Section */}
        <div className="mb-4">
          <div className="mb-3">
            <h2 className="text-sm font-medium text-gray-900">
              Additional Information
            </h2>
            <p className="text-gray-500 text-xs mt-0.5">Add remarks or notes</p>
          </div>
          <TaxtAreaInput<CreateRefundForm>
            placeholder="Remark"
            name="remark"
            required={false}
            title="Remark"
          />
        </div>

        <Separator className="my-4" />

        {/* Important Notes Section */}
        <div className="mb-4">
          <div className="mb-3">
            <h2 className="text-sm font-medium text-gray-900">
              Important Information
            </h2>
            <p className="text-gray-500 text-xs mt-0.5">
              Please read carefully before proceeding
            </p>
          </div>
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <p className="text-xs text-blue-900 leading-relaxed">
                <span className="font-semibold">Note:</span> You may view the
                Electronic Liability Register that displays your liabilities/
                dues of Returns and other than Returns. Hence, you may save this
                Refund Application and navigate to the dashboard to settle the
                dues first, or may proceed here to file the application. Please
                note that the recoverable dues shall be deducted from the gross
                amount to be paid from the Return Amount claimed in the refund
                application received, by the Refund Processing officer before
                processing the refund.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
              <p className="text-xs text-amber-900 leading-relaxed">
                <span className="font-semibold">Note:</span> In case you seek to
                change the preference of the bank account which is not appearing
                in the drop down list, please add bank account by filing
                non-core amendment of registration form.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
              <p className="text-xs text-green-900 leading-relaxed">
                <span className="font-semibold">Note:</span> Taxpayers are
                expected to upload supporting documents while filing refund
                application.
              </p>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="reset"
            onClick={(e) => {
              e.preventDefault();
              reset({});
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? "Submitting..." : "Submit Refund"}
          </button>
        </div>
      </form>
    </>
  );
};
