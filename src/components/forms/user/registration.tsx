"use client";
import { RegistrationForm, RegistrationSchema } from "@/schema/registraion";
import {
  FieldErrors,
  FormProvider,
  useForm,
  useFormContext,
} from "react-hook-form";

import { Label } from "@/components/ui/label";
import { MultiSelect } from "../inputfields/multiselect";
import { DateSelect } from "../inputfields/dateselect";
import { OptionValue } from "@/models/main";
import { TaxtInput } from "../inputfields/textinput";
import { TaxtAreaInput } from "../inputfields/textareainput";
import { YesNoRabioInput } from "../inputfields/yesnoradioinput";
import { valibotResolver } from "@hookform/resolvers/valibot";
import UpdateRegistration from "@/action/register/updateregistration";
import GetDvat04 from "@/action/register/getdvat04";
import { toast } from "react-toastify";
import { getCookie } from "cookies-next";
import { useRouter } from "next/navigation";

type RegistrationProviderPrpos = {
  dvatid: number;
};

export const RegistrationProvider = (props: RegistrationProviderPrpos) => {
  const methods = useForm<RegistrationForm>({
    resolver: valibotResolver(RegistrationSchema),
  });

  return (
    <FormProvider {...methods}>
      <Registration dvatid={props.dvatid} />
    </FormProvider>
  );
};

const Registration = (props: RegistrationProviderPrpos) => {
  const id: number = parseInt(getCookie("id") ?? "0");
  const router = useRouter();

  const {
    register,
    reset,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useFormContext<RegistrationForm>();

  const onSubmit = async (data: RegistrationForm) => {
    const dvat04_response = await GetDvat04({
      id: props.dvatid,
    });

    if (!dvat04_response.status || !dvat04_response.data)
      return toast.success("There is not any dvat form exist with.");

    if (dvat04_response.data.registration.length == 0)
      return toast.success("There is not any regirstion form exist with.");

    const response = await UpdateRegistration({
      id: dvat04_response.data.registration[0].id,
      updatedby: id,
      inspector_note: data.inspector_note,
      date_of_visit: new Date(data.date_of_visit),
      natureOfBusiness: data.natureOfBusiness,
      date_of_purchases: new Date(data.date_of_purchases),
      amount_of_purchases: data.amount_of_purchases,
      date_of_sales: new Date(data.date_of_sales),
      amount_of_sales: data.amount_of_sales,
      capital_proposed: data.capital_proposed,
      amount_of_stock: data.amount_of_stock,
      books_of_account: data.books_of_account,
      verification_of_originals: data.verification_of_originals,
      verification_of_title: data.verification_of_title,
      other_information: data.other_information,
      security_deposit: data.security_deposit,
      security_deposit_amount: data.security_deposit_amount,
      security_deposit_date: new Date(data.security_deposit_date),
      date_of_expiry_security_deposit: new Date(
        data.date_of_expiry_security_deposit
      ),
      bank: data.bank,
      name_of_person: data.name_of_person,
      address: data.address,
      plant_and_machinery: data.plant_and_machinery,
      raw_materials: data.raw_materials,
      packing_materials: data.packing_materials,
      dept_user_id: 13,
    });

    if (response.status) {
      router.push("/dashboard/register/department-track-application-status");
    } else {
      toast.error(response.message);
    }
    console.log(data);

    // toast.success(response.message);
    reset();
  };

  const onError = (error: FieldErrors<RegistrationForm>) => {
    console.log(error);
  };

  const natureOfBusiness: OptionValue[] = [
    { value: "MANUFACTURING", label: "MANUFACTURING" },
    { value: "TRADING", label: "TRADING" },
    { value: "SERVICE", label: "SERVICE" },
    { value: "OTHER", label: "OTHER" },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)}>
      <div className="flex gap-3">
        <div className="flex-1">
          <DateSelect<RegistrationForm>
            name={"date_of_visit"}
            placeholder="Select the date of visit"
            title="1. Date of Visit"
            required={true}
          />
        </div>
        <div className="flex-1">
          <MultiSelect<RegistrationForm>
            name={"natureOfBusiness"}
            options={natureOfBusiness}
            placeholder="Select the nature of business"
            title="2. Nature of Business"
            required={true}
          />
        </div>
      </div>

      <div className="flex gap-3 mt-3">
        <div className="flex-1">
          <DateSelect<RegistrationForm>
            name={"date_of_purchases"}
            title="3. Date of Commencement of Purchases"
            placeholder="Select the date of purchases"
            required={true}
          />
        </div>
        <div className="flex-1">
          <TaxtInput<RegistrationForm>
            placeholder="Enter amount of purchases"
            name="amount_of_purchases"
            required={true}
            title="4. Amount of purchases made in (Rs.)"
            onlynumber={true}
          />
        </div>
      </div>
      <div className="flex gap-3 mt-3">
        <div className="flex-1">
          <DateSelect<RegistrationForm>
            name={"date_of_sales"}
            placeholder="Select the date of sales"
            required={true}
            title="5. Date of Commencement of Sales"
          />
        </div>
        <div className="flex-1">
          <TaxtInput<RegistrationForm>
            placeholder="Enter amount of sales"
            name="amount_of_sales"
            required={true}
            title="6. Amount of Sales made in (Rs.)"
            onlynumber={true}
          />
        </div>
      </div>
      <div className="flex gap-3 mt-3">
        <div className="flex-1">
          <TaxtInput<RegistrationForm>
            placeholder="Enter Capital proposed"
            name="capital_proposed"
            required={true}
            title="7. Capital proposed to be invested in (Rs.)"
            onlynumber={true}
          />
        </div>
        <div className="flex-1">
          <TaxtInput<RegistrationForm>
            placeholder="Enter amount of stock"
            name="amount_of_stock"
            required={true}
            title="8. Amount of Stock held at the time of visit (Rs.)"
            onlynumber={true}
          />
        </div>
      </div>
      <div className="flex gap-3 mt-3">
        <div className="flex-1">
          <TaxtAreaInput<RegistrationForm>
            placeholder="Enter Books of Account"
            name="books_of_account"
            required={true}
            title="9. Books of Account Maintained"
          />
        </div>
        <div className="flex-1">
          <TaxtAreaInput<RegistrationForm>
            placeholder="Enter Verification of originals"
            name="verification_of_originals"
            required={true}
            title="10. Verification of Originals"
          />
        </div>
      </div>
      <div className="flex gap-3 mt-3">
        <div className="flex-1">
          <TaxtAreaInput<RegistrationForm>
            placeholder="Enter Verification of title"
            name="verification_of_title"
            required={true}
            title="11. Verification of title of place of business"
          />
        </div>
        <div className="flex-1">
          <TaxtAreaInput<RegistrationForm>
            placeholder="Enter Other information"
            name="other_information"
            required={true}
            title="12. Other Information"
          />
        </div>
      </div>
      <div className="rounded-sm p-4 border border-black mt-6 relative">
        <span className="-translate-y-7 bg-white px-1 -translate-x-2 inline-block absolute text-sm">
          13 Security
        </span>
        <YesNoRabioInput<RegistrationForm>
          title="Security Deposit found correct"
          required={true}
          name="security_deposit"
        />
        <div className="flex gap-3 mt-3">
          <div className="flex-1">
            <TaxtInput<RegistrationForm>
              placeholder="Enter Capital proposed"
              name="security_deposit_amount"
              required={true}
              title="a). Security deposit Amount"
              onlynumber={true}
            />
          </div>
          <div className="flex-1">
            <DateSelect<RegistrationForm>
              placeholder="Enter security deposit date"
              name="security_deposit_date"
              required={true}
              title="b). Security desposit date"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-3">
          <div className="flex-1">
            <DateSelect<RegistrationForm>
              placeholder="Enter date of expiry"
              name="date_of_expiry_security_deposit"
              required={true}
              title="c). Date of Expiry of Security Deposit"
            />
          </div>
          <div className="flex-1">
            <TaxtInput<RegistrationForm>
              placeholder="Enter bank name"
              name="bank"
              required={true}
              title="d). Bank"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-3">
        <div className="flex-1">
          <TaxtAreaInput<RegistrationForm>
            placeholder="Enter address"
            name="name_of_person"
            required={false}
            title="15. Name of the peoples whom  visited at the time of inspection"
          />
        </div>
        <div className="flex-1">
          <TaxtAreaInput<RegistrationForm>
            placeholder="Enter Plant and machinery"
            name="plant_and_machinery"
            required={true}
            title="15. Plant and Machinery"
          />
        </div>
      </div>
      <div className="mt-2">
        <TaxtAreaInput<RegistrationForm>
          placeholder="Enter address"
          name="address"
          required={false}
          title="16. Address of the place(s) visited for inspection (If not same as principle Place of Business please specify below)"
        />
      </div>
      <div className="flex gap-3 mt-3">
        <div className="flex-1">
          <TaxtAreaInput<RegistrationForm>
            placeholder="Enter Raw Materials"
            name="raw_materials"
            required={true}
            title="17. Raw Materials"
          />
        </div>
        <div className="flex-1">
          <TaxtAreaInput<RegistrationForm>
            placeholder="Enter Packing materials"
            name="packing_materials"
            required={true}
            title="18. Packing Materials"
          />
        </div>
      </div>
      <div className="mt-2">
        <TaxtAreaInput<RegistrationForm>
          placeholder="Enter Inspector Comments"
          name="inspector_note"
          required={true}
          title="Inspector Comments"
          maxlength={2000}
        />
      </div>
      <input
        type="submit"
        value={"Submit"}
        disabled={isSubmitting}
        className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white mt-2"
      />
    </form>
  );
};
