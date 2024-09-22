"use client";
import {
  FieldErrors,
  FormProvider,
  useForm,
  useFormContext,
} from "react-hook-form";

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
import { Button } from "antd";
import CreateRefund from "@/action/refund/createrefund";
import { onFormError } from "@/utils/methods";

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
    const challan_response = await CreateRefund({
      userid: props.userid,
      cess: data.cess.toString(),
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
      reset({});
      router.back();
    } else {
      toast.error(challan_response.message);
    }

    reset({});
  };

  const getTotalAmount = (): number => {
    const vat = parseFloat(watch("vat"));
    const interest = parseFloat(watch("interest"));
    const cess = parseFloat(watch("cess"));
    const penalty = parseFloat(watch("penalty"));
    const others = parseFloat(watch("others") ?? "0");

    const total: number =
      (isNaN(vat) ? 0 : vat) +
      (isNaN(interest) ? 0 : interest) +
      (isNaN(cess) ? 0 : cess) +
      (isNaN(penalty) ? 0 : penalty) +
      (isNaN(others) ? 0 : others);

    return total;
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit, onFormError)}>
        <div className="flex gap-4 mt-1">
          <div className="flex-1">
            <p className="text-sm font-normal">Payment Type</p>
            <p className="text-sm font-medium">Refund Against ITC</p>
          </div>
          <div className="flex-1">
            <TaxtInput<CreateRefundForm>
              name="old_grievance_number"
              required={false}
              numdes={true}
              title="Previous Grievance Number"
              placeholder="Previous Grievance Number"
            />
          </div>
        </div>

        <div className="flex gap-4 mt-1">
          <div className="flex-1">
            <TaxtInput<CreateRefundForm>
              name="oldcpin"
              required={false}
              numdes={true}
              title="Previous CPIN"
              placeholder="Previous CPIN"
            />
          </div>
          <div className="flex-1">
            <MultiSelect<CreateRefundForm>
              placeholder="Select Reason"
              name="reason"
              required={true}
              title="Reason For Challan"
              options={refundReason}
            />
          </div>
        </div>

        <p className="text-left text-black text-lg mt-2">
          Refund Amount Details
        </p>
        <Table className="border mt-2">
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead className="whitespace-nowrap w-32 border p-2"></TableHead>
              <TableHead className="whitespace-nowrap border p-2">
                Tax (&#x20b9;)
              </TableHead>
              <TableHead className="whitespace-nowrap border p-2">
                Interest (&#x20b9;)
              </TableHead>
              <TableHead className="whitespace-nowrap border p-2">
                Penalty (&#x20b9;)
              </TableHead>
              <TableHead className="whitespace-nowrap border p-2">
                CESS (&#x20b9;)
              </TableHead>
              <TableHead className="whitespace-nowrap border p-2">
                Others (&#x20b9;)
              </TableHead>
              <TableHead className="whitespace-nowrap border p-1">
                Total (&#x20b9;)
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium p-2 border">Vat Tax</TableCell>
              <TableCell className="p-2 border">0.00</TableCell>
              <TableCell className="p-2 border">0.00</TableCell>
              <TableCell className="p-2 border">0.00</TableCell>
              <TableCell className="p-2 border">0.00</TableCell>
              <TableCell className="p-2 border">0.00</TableCell>
              <TableCell className="p-2 border">0.00</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <p className="text-left text-black text-lg mt-2">
          Refund Amount Details
        </p>
        <Table className="border mt-2">
          <TableHeader>
            <TableRow className="bg-gray-100 p-1">
              <TableHead className="whitespace-nowrap w-32 border p-1"></TableHead>
              <TableHead className="whitespace-nowrap border p-1">
                Tax (&#x20b9;)
              </TableHead>
              <TableHead className="whitespace-nowrap border p-1">
                Interest (&#x20b9;)
              </TableHead>
              <TableHead className="whitespace-nowrap border p-1">
                Penalty (&#x20b9;)
              </TableHead>

              <TableHead className="whitespace-nowrap border p-1">
                CESS (&#x20b9;)
              </TableHead>
              <TableHead className="whitespace-nowrap border p-1">
                Others (&#x20b9;)
              </TableHead>
              <TableHead className="whitespace-nowrap border p-1 w-20">
                Total (&#x20b9;)
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium p-2 border">Vat Tax</TableCell>
              <TableCell className="p-2 border">
                <TaxtInput<CreateRefundForm>
                  name="vat"
                  required={true}
                  numdes={true}
                />
              </TableCell>
              <TableCell className="p-2 border">
                <TaxtInput<CreateRefundForm>
                  name="interest"
                  required={true}
                  numdes={true}
                />
              </TableCell>
              <TableCell className="p-2 border">
                <TaxtInput<CreateRefundForm>
                  name="penalty"
                  numdes={true}
                  required={true}
                />
              </TableCell>

              <TableCell className="p-2 border">
                <TaxtInput<CreateRefundForm>
                  name="cess"
                  required={true}
                  numdes={true}
                />
              </TableCell>
              <TableCell className="p-2 border">
                <TaxtInput<CreateRefundForm>
                  name="others"
                  required={true}
                  numdes={true}
                />
              </TableCell>
              <TableCell className="p-2 border">{getTotalAmount()}</TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <div className="flex-1">
          <TaxtAreaInput<CreateRefundForm>
            placeholder="Remark"
            name="remark"
            required={false}
            title="Remark"
          />
        </div>

        <p className="text-xs border p-2 bg-[#e2e2e2] mt-2">
          Note: You may view the Electronic Liability Register that displays
          your liabilities/ dues of Returns and other than Returns. Hence, you
          may save this Refund Application and navigate to the dashboard to
          settle the dues first, or may proceed here to file the application.
          Please note that the recoverable dues shall be deducted from the gross
          amount to be paid from the Return Amount claimed in the refund
          application received, by the Refund Processing officer before
          processing the refund.
        </p>
        <Separator />
        <p className="text-left text-black text-lg mt-2">
          Upload Supporting Documents
        </p>
        <p className="text-xs border p-2 bg-[#e2e2e2]">
          Note: In case you seek to change the preference of the bank account
          wnich is not appearing in the drop down list, please add bank account
          by filing non-core amendment of registration form.
        </p>
        <p className="text-xs border p-2 bg-[#e2e2e2] mt-2">
          Note: Taxpayers are expected to upload supporting documents while
          filing refund application.
        </p>

        <div className="w-full flex gap-2 mt-2">
          <div className="grow"></div>
          <Button
            onClick={(e) => {
              e.preventDefault();
              router.back();
            }}
          >
            Back
          </Button>
          <input
            type="reset"
            onClick={(e) => {
              e.preventDefault();
              reset({});
            }}
            value={"Reset"}
            className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white cursor-pointer"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white cursor-pointer"
          >
            {isSubmitting ? "Loading...." : "Submit"}
          </button>
        </div>
      </form>
    </>
  );
};
