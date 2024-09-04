"use client";
import { RegistrationForm, RegistrationSchema } from "@/schema/registraion";
import {
  FieldErrors,
  FormProvider,
  useForm,
  useFormContext,
} from "react-hook-form";

import { MultiSelect } from "../inputfields/multiselect";
import { DateSelect } from "../inputfields/dateselect";
import { OptionValue } from "@/models/main";
import { TaxtInput } from "../inputfields/textinput";
import { TaxtAreaInput } from "../inputfields/textareainput";
import { YesNoRabioInput } from "../inputfields/yesnoradioinput";
import { valibotResolver } from "@hookform/resolvers/valibot";
import UpdateRegistration from "@/action/registration/updateregistration";
import GetDvat04 from "@/action/register/getdvat04";
import { toast } from "react-toastify";
import { getCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { registration } from "@prisma/client";
import GetFromDvat from "@/action/registration/getfromdvat";
import { formatDateTime, formateDate } from "@/utils/methods";
import UpdateDvatStatus from "@/action/dvat/updatestatus";

type RegistrationProviderPrpos = {
  dvatid: number;
};

export const RegistrationProvider = (props: RegistrationProviderPrpos) => {
  const [registrationdata, setRegistrationData] = useState<registration>();

  useEffect(() => {
    const init = async () => {
      const response = await GetFromDvat({
        id: props.dvatid,
      });
      if (response.status && response.data) {
        setRegistrationData(response.data);
      }
    };
    init();
  }, []);

  const methods = useForm<RegistrationForm>({
    resolver: valibotResolver(RegistrationSchema),
  });

  if (registrationdata?.dept_user_id == 13) {
    return (
      <FormProvider {...methods}>
        <VatNote registrationdata={registrationdata} />
      </FormProvider>
    );
  }

  return (
    <FormProvider {...methods}>
      <Registration dvatid={props.dvatid} />
    </FormProvider>
  );

  // if (registrationdata?.dept_user_id == 15) {
  //   return (
  //     <FormProvider {...methods}>
  //       <Registration dvatid={props.dvatid} />
  //     </FormProvider>
  //   );
  // } else if (registrationdata?.dept_user_id == 13) {
  //   return <VatNote registrationdata={registrationdata} />;
  // } else {
  //   <FormProvider {...methods}>
  //     <Registration dvatid={props.dvatid} />
  //   </FormProvider>;
  // }
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

  useEffect(() => {
    const init = async () => {
      const response = await GetFromDvat({
        id: props.dvatid,
      });
      if (response.status && response.data) {
        reset({
          date_of_visit: formateDate(response.data.date_of_visit!),
          natureOfBusiness: response.data.natureOfBusiness!,

          date_of_purchases: formateDate(
            response.data.date_of_purchases!
          ),
          amount_of_purchases: response.data.amount_of_purchases!,
          date_of_sales: formateDate(response.data.date_of_sales!),
          amount_of_sales: response.data.amount_of_sales!,
          capital_proposed: response.data.capital_proposed!,
          amount_of_stock: response.data.amount_of_stock!,
          books_of_account: response.data.books_of_account!,
          verification_of_originals:
          response.data.verification_of_originals!,
          verification_of_title: response.data.verification_of_title!,
          other_information: response.data.other_information!,
          security_deposit: response.data.security_deposit!,
          security_deposit_amount:
          response.data.security_deposit_amount!,
          security_deposit_date: formateDate(
            response.data.security_deposit_date!
          ),
          date_of_expiry_security_deposit: formateDate(
            response.data.date_of_expiry_security_deposit!
          ),
          bank: response.data.bank!,
          name_of_person: response.data.name_of_person!,
          address: response.data.address!,
          plant_and_machinery: response.data.plant_and_machinery!,
          raw_materials: response.data.raw_materials!,
          packing_materials: response.data.packing_materials!,

          inspector_note: response.data.inspector_note!,
        });
      }
    };
    init();
  }, [props.dvatid, reset]);

  const onSubmit = async (data: RegistrationForm) => {
    const dvat04_response = await GetDvat04({
      id: props.dvatid,
    });

    if (!dvat04_response.status || !dvat04_response.data)
      return toast.error("There is not any dvat form exist with.");

    if (dvat04_response.data.registration.length == 0)
      return toast.error("There is not any regirstion form exist with.");

    if (
      data.inspector_note == null ||
      data.inspector_note == "" ||
      data.inspector_note == undefined
    )
      return toast.error("Inspector Note is required");

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

type VatNoteProps = {
  registrationdata: registration;
};
const VatNote = (props: VatNoteProps) => {
  const id: number = parseInt(getCookie("id") ?? "0");
  const router = useRouter();

  const {
    register,
    reset,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useFormContext<RegistrationForm>();

  useEffect(() => {
    reset({
      date_of_visit: formateDate(props.registrationdata.date_of_visit!),
      natureOfBusiness: props.registrationdata.natureOfBusiness!,

      date_of_purchases: formateDate(props.registrationdata.date_of_purchases!),
      amount_of_purchases: props.registrationdata.amount_of_purchases!,
      date_of_sales: formateDate(props.registrationdata.date_of_sales!),
      amount_of_sales: props.registrationdata.amount_of_sales!,
      capital_proposed: props.registrationdata.capital_proposed!,
      amount_of_stock: props.registrationdata.amount_of_stock!,
      books_of_account: props.registrationdata.books_of_account!,
      verification_of_originals:
        props.registrationdata.verification_of_originals!,
      verification_of_title: props.registrationdata.verification_of_title!,
      other_information: props.registrationdata.other_information!,
      security_deposit: props.registrationdata.security_deposit!,
      security_deposit_amount: props.registrationdata.security_deposit_amount!,
      security_deposit_date: formateDate(
        props.registrationdata.security_deposit_date!
      ),
      date_of_expiry_security_deposit: formateDate(
        props.registrationdata.date_of_expiry_security_deposit!
      ),
      bank: props.registrationdata.bank!,
      name_of_person: props.registrationdata.name_of_person!,
      address: props.registrationdata.address!,
      plant_and_machinery: props.registrationdata.plant_and_machinery!,
      raw_materials: props.registrationdata.raw_materials!,
      packing_materials: props.registrationdata.packing_materials!,

      inspector_note: props.registrationdata.inspector_note!,
    });
  }, [props.registrationdata, reset]);

  const onSubmit = async (data: RegistrationForm) => {
    const dvat04_response = await GetDvat04({
      id: props.registrationdata.dvat04Id,
    });

    if (!data.registration_date) {
      return toast.success("Select Registration Date.");
    }
    if (data.all_doc_upload == undefined || data.all_doc_upload == null) {
      return toast.success("Select is your all documents uploaded or not.");
    }
    if (data.all_appointment == undefined || data.all_appointment == null) {
      return toast.success(
        "Select is your all appointments are closed or not."
      );
    }
    if (data.all_appointment == undefined || data.all_appointment == null) {
      return toast.success("VAt officer comment is required.");
    }

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
      necessary_payments: data.necessary_payments,
      all_appointment: data.all_appointment,
      all_doc_upload: data.all_doc_upload,
      registration_date: new Date(data.registration_date!),

      dept_user_id: 13,
    });

    if (response.status) {
      const resposne = await UpdateDvatStatus({
        id: props.registrationdata.dvat04Id!,
        updatedby: id,
        status: "APPROVED",
      });
      if (resposne.status) {
        toast.success(resposne.message);
      } else {
        toast.error(resposne.message);
      }
    } else {
      toast.error(response.message);
    }
    router.back();

    reset();
  };

  const onError = (error: FieldErrors<RegistrationForm>) => {
    console.log(error);
  };

  const reject = async () => {
    const resposne = await UpdateDvatStatus({
      id: props.registrationdata.dvat04Id!,
      updatedby: id,
      status: "REJECTED",
    });
    if (resposne.status) {
      toast.success(resposne.message);
    } else {
      toast.error(resposne.message);
    }
    router.back();
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
            disable={true}
          />
        </div>
        <div className="flex-1">
          <MultiSelect<RegistrationForm>
            name={"natureOfBusiness"}
            options={natureOfBusiness}
            placeholder="Select the nature of business"
            title="2. Nature of Business"
            required={true}
            disable={true}
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
            disable={true}
          />
        </div>
        <div className="flex-1">
          <TaxtInput<RegistrationForm>
            placeholder="Enter amount of purchases"
            name="amount_of_purchases"
            required={true}
            title="4. Amount of purchases made in (Rs.)"
            onlynumber={true}
            disable={true}
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
            disable={true}
          />
        </div>
        <div className="flex-1">
          <TaxtInput<RegistrationForm>
            placeholder="Enter amount of sales"
            name="amount_of_sales"
            required={true}
            title="6. Amount of Sales made in (Rs.)"
            onlynumber={true}
            disable={true}
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
            disable={true}
          />
        </div>
        <div className="flex-1">
          <TaxtInput<RegistrationForm>
            placeholder="Enter amount of stock"
            name="amount_of_stock"
            required={true}
            title="8. Amount of Stock held at the time of visit (Rs.)"
            onlynumber={true}
            disable={true}
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
            disable={true}
          />
        </div>
        <div className="flex-1">
          <TaxtAreaInput<RegistrationForm>
            placeholder="Enter Verification of originals"
            name="verification_of_originals"
            required={true}
            title="10. Verification of Originals"
            disable={true}
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
            disable={true}
          />
        </div>
        <div className="flex-1">
          <TaxtAreaInput<RegistrationForm>
            placeholder="Enter Other information"
            name="other_information"
            required={true}
            title="12. Other Information"
            disable={true}
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
          disable={true}
        />
        <div className="flex gap-3 mt-3">
          <div className="flex-1">
            <TaxtInput<RegistrationForm>
              placeholder="Enter Capital proposed"
              name="security_deposit_amount"
              required={true}
              title="a). Security deposit Amount"
              onlynumber={true}
              disable={true}
            />
          </div>
          <div className="flex-1">
            <DateSelect<RegistrationForm>
              placeholder="Enter security deposit date"
              name="security_deposit_date"
              required={true}
              title="b). Security desposit date"
              disable={true}
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
              disable={true}
            />
          </div>
          <div className="flex-1">
            <TaxtInput<RegistrationForm>
              placeholder="Enter bank name"
              name="bank"
              required={true}
              title="d). Bank"
              disable={true}
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
            disable={true}
          />
        </div>
        <div className="flex-1">
          <TaxtAreaInput<RegistrationForm>
            placeholder="Enter Plant and machinery"
            name="plant_and_machinery"
            required={true}
            title="15. Plant and Machinery"
            disable={true}
          />
        </div>
      </div>
      <div className="mt-2">
        <TaxtAreaInput<RegistrationForm>
          placeholder="Enter address"
          name="address"
          required={false}
          title="16. Address of the place(s) visited for inspection (If not same as principle Place of Business please specify below)"
          disable={true}
        />
      </div>
      <div className="flex gap-3 mt-3">
        <div className="flex-1">
          <TaxtAreaInput<RegistrationForm>
            placeholder="Enter Raw Materials"
            name="raw_materials"
            required={true}
            title="17. Raw Materials"
            disable={true}
          />
        </div>
        <div className="flex-1">
          <TaxtAreaInput<RegistrationForm>
            placeholder="Enter Packing materials"
            name="packing_materials"
            required={true}
            title="18. Packing Materials"
            disable={true}
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
          disable={true}
        />
      </div>

      <div className="rounded-sm p-4 border border-black mt-8 relative">
        <span className="-translate-y-7 bg-white px-1 -translate-x-2 inline-block absolute text-sm">
          Vat officer
        </span>

        <div className="flex gap-3 mt-3">
          <div className="flex-1">
            <DateSelect<RegistrationForm>
              placeholder="Enter payment Registration Date"
              name="registration_date"
              required={true}
              title="Registration Payment Date"
            />
          </div>
          <div className="flex-1">
            <YesNoRabioInput<RegistrationForm>
              name="necessary_payments"
              required={true}
              title="Necessary payments (Reg. Fees, PT and Security Deposits etc.), if applicable have beeen received?"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-3">
          <div className="flex-1">
            <YesNoRabioInput<RegistrationForm>
              name="all_doc_upload"
              required={true}
              title="All Documents Uploaded?"
            />
          </div>
          <div className="flex-1">
            <YesNoRabioInput<RegistrationForm>
              name="all_appointment"
              required={true}
              title="All Appointments Closed?"
            />
          </div>
        </div>

        <div className="mt-2">
          <TaxtAreaInput<RegistrationForm>
            placeholder="Enter Vat officer Comment"
            name="vat_officer_note"
            required={true}
            title="Vat officer Comment"
            maxlength={2000}
          />
        </div>
      </div>
      <div className="flex gap-4">
        <input
          type="submit"
          value={"Approve"}
          disabled={isSubmitting}
          className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white mt-2"
        />
        <button
          onClick={reject}
          className="py-1 rounded-md bg-rose-500 px-4 text-sm text-white mt-2"
        >
          Reject
        </button>
        <button
          onClick={() => {
            router.back();
          }}
          className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white mt-2"
        >
          Exit
        </button>
      </div>
    </form>
  );
};
