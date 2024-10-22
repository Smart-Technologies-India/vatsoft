/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { RegistrationForm, RegistrationSchema } from "@/schema/registraion";
import { FormProvider, useForm, useFormContext } from "react-hook-form";

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
import {
  dvat04,
  Dvat04Commodity,
  DvatStatus,
  registration,
  RegistrationStatus,
  Role,
} from "@prisma/client";
import GetFromDvat from "@/action/registration/getfromdvat";
import { formateDate, onFormError } from "@/utils/methods";
import UpdateDvatStatus from "@/action/dvat/updatestatus";
import { Button } from "antd";
import GetDeptUser from "@/action/user/getdeptuser";

type RegistrationProviderPrpos = {
  dvatid: number;
};

export const RegistrationProvider = (props: RegistrationProviderPrpos) => {
  const [registrationdata, setRegistrationData] = useState<
    (registration & { dvat04: dvat04 }) | null
  >(null);
  const role = getCookie("role");
  const id: number = parseInt(getCookie("id") ?? "0");

  const router = useRouter();

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
  }, [props.dvatid]);

  const methods = useForm<RegistrationForm>({
    resolver: valibotResolver(RegistrationSchema),
  });

  if (registrationdata && registrationdata.dvat04.status == "APPROVED") {
    return (
      <RegistrationPreview
        registrationdata={registrationdata}
        commodity={registrationdata.dvat04.commodity ?? Dvat04Commodity.OTHER}
      />
    );
  }

  if (
    registrationdata &&
    registrationdata.dvat04.status == "PROVISIONAL" &&
    role == Role.INSPECTOR
  ) {
    return (
      <FormProvider {...methods}>
        <Registration dvatid={props.dvatid} />
      </FormProvider>
    );
  }

  if (
    registrationdata &&
    registrationdata.dept_user_id == id &&
    role == Role.VATOFFICER &&
    (registrationdata.dvat04.status == DvatStatus.PENDINGPROCESSING ||
      registrationdata.dvat04.status == DvatStatus.PROVISIONAL)
  ) {
    return (
      <FormProvider {...methods}>
        <VatNote
          registrationdata={registrationdata}
          commodity={registrationdata.dvat04.commodity}
        />
      </FormProvider>
    );
  }

  if (
    registrationdata &&
    registrationdata.dept_user_id == id &&
    role == Role.INSPECTOR
  ) {
    return (
      <FormProvider {...methods}>
        <Registration dvatid={props.dvatid} />
      </FormProvider>
    );
  }

  if (
    registrationdata &&
    registrationdata.dept_user_id == id &&
    role == Role.VATOFFICER
  ) {
    return (
      <div>
        <p className="font-mono bg-rose-500 bg-opacity-10 px-2 py-1 text-rose-500 border-l-2 border-rose-500">
          Note: The Dealer Registration File is with Inspector for physical site
          report.
        </p>
        {/* <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={() => {
              router.back();
            }}
            className="py-1 rounded-md bg-rose-500 px-4 text-sm text-white"
          >
            Back
          </button>
        </div> */}
      </div>
    );
  }

  if (registrationdata) {
    return (
      <FormProvider {...methods}>
        <Registration dvatid={props.dvatid} />
      </FormProvider>
    );
  }
};

const Registration = (props: RegistrationProviderPrpos) => {
  const id: number = parseInt(getCookie("id") ?? "0");
  const router = useRouter();
  const role: Role = getCookie("role") as Role;

  const [dvatdata, setDvatdata] = useState<
    dvat04 & { registration: registration[] }
  >();

  const {
    reset,
    handleSubmit,
    getValues,
    formState: { isSubmitting },
  } = useFormContext<RegistrationForm>();

  useEffect(() => {
    const init = async () => {
      const response = await GetFromDvat({
        id: props.dvatid,
      });
      if (response.status && response.data) {
        reset({
          date_of_visit: response.data.date_of_visit
            ? formateDate(response.data.date_of_visit)
            : undefined,
          natureOfBusiness: response.data.natureOfBusiness!,

          date_of_purchases: response.data.date_of_purchases
            ? formateDate(response.data.date_of_purchases)
            : undefined,
          amount_of_purchases: response.data.amount_of_purchases!,
          date_of_sales: response.data.date_of_sales
            ? formateDate(response.data.date_of_sales)
            : undefined,
          amount_of_sales: response.data.amount_of_sales!,
          capital_proposed: response.data.capital_proposed!,
          amount_of_stock: response.data.amount_of_stock!,
          books_of_account: response.data.books_of_account!,
          verification_of_originals: response.data.verification_of_originals!,
          verification_of_title: response.data.verification_of_title!,
          other_information: response.data.other_information!,
          security_deposit: response.data.security_deposit!,
          security_deposit_amount: response.data.security_deposit_amount!,
          security_deposit_date: response.data.security_deposit_date
            ? formateDate(response.data.security_deposit_date)
            : undefined,
          date_of_expiry_security_deposit: response.data
            .date_of_expiry_security_deposit
            ? formateDate(response.data.date_of_expiry_security_deposit)
            : undefined,
          bank: response.data.bank!,
          name_of_person: response.data.name_of_person!,
          address: response.data.address!,
          plant_and_machinery: response.data.plant_and_machinery!,
          raw_materials: response.data.raw_materials!,
          packing_materials: response.data.packing_materials!,

          inspector_note: response.data.inspector_note!,
        });
      }

      const dvat04_response = await GetDvat04({
        id: props.dvatid,
      });

      if (dvat04_response.status && dvat04_response.data) {
        setDvatdata(dvat04_response.data);
      }
    };
    init();
  }, [props.dvatid, reset]);

  const onSubmit = async (data: RegistrationForm) => {
    if (!dvatdata) return toast.error("There is not any dvat form exist.");
    if (dvatdata.registration.length == 0)
      return toast.error("There is not any regirstion form exist.");

    if (
      data.inspector_note == null ||
      data.inspector_note == "" ||
      data.inspector_note == undefined
    )
      return toast.error("Inspector Note is required");

    const dept_response = await GetDeptUser({
      dept: dvatdata.selectOffice!,
      role: "VATOFFICER",
    });

    if (dept_response.status && dept_response.data) {
      const response = await UpdateRegistration({
        id: dvatdata.registration[0].id,
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
        dept_user_id: dept_response.data.id,
        status: RegistrationStatus.ACTIVE,
        dvatstatus: DvatStatus.PENDINGPROCESSING,
      });

      if (response.status) {
        router.push("/dashboard/register/department-track-application-status");
      } else {
        toast.error(response.message);
      }
    } else {
      toast.error(dept_response.message);
    }
  };

  const by_pass = async () => {
    const { inspector_note } = getValues();
    if (!dvatdata) return toast.error("There is not any dvat form exist.");

    if (dvatdata.registration.length == 0)
      return toast.error("There is not any regirstion form exist with.");

    if (
      inspector_note == null ||
      inspector_note == undefined ||
      inspector_note == ""
    )
      return toast.error("Inspector Note is required.");

    const dept_response = await GetDeptUser({
      dept: dvatdata.selectOffice!,
      role: "VATOFFICER",
    });

    if (dept_response.status && dept_response.data) {
      const response = await UpdateRegistration({
        id: dvatdata.registration[0].id,
        updatedby: id,
        inspector_note: inspector_note,
        dept_user_id: dept_response.data.id,
        status: RegistrationStatus.ACTIVE,
        dvatstatus: DvatStatus.PROVISIONAL,
      });

      if (response.status) {
        router.push("/dashboard/register/department-track-application-status");
      } else {
        toast.error(response.message);
      }
    } else {
      toast.error(dept_response.message);
    }
  };

  const natureOfBusiness: OptionValue[] = [
    { value: "MANUFACTURER", label: "MANUFACTURER" },
    { value: "TRADER", label: "TRADER" },
    { value: "SERVICE", label: "SERVICE" },
    { value: "OTHERS", label: "OTHERS" },
    { value: "WORKS", label: "WORKS" },
  ];

  const commodity: OptionValue[] = [
    { value: "LIQUOR", label: "Liquor" },
    { value: "FUEL", label: "Fuel" },
    { value: "OTHERS", label: "Others" },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit, onFormError)}>
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
              placeholder="Enter Security Deposit Amount"
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
            placeholder="Enter Name of the peoples"
            name="name_of_person"
            required={false}
            title="14. Name of the peoples whom  visited at the time of inspection"
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
      <div className="flex gap-3 mt-3">
        <div className="flex-1">
          <TaxtAreaInput<RegistrationForm>
            placeholder="Enter address"
            name="address"
            required={false}
            title="16. Address of the place(s) visited for inspection (If not same as principle Place of Business please specify below)"
          />
        </div>
        <div className="flex-1">
          <TaxtAreaInput<RegistrationForm>
            placeholder="Enter Raw Materials"
            name="raw_materials"
            required={true}
            title="17. Raw Materials"
          />
        </div>
      </div>

      <div className="flex gap-3 mt-3">
        <div className="flex-1">
          <TaxtInput<RegistrationForm>
            placeholder="Enter Packing materials"
            name="packing_materials"
            required={true}
            title="18. Packing Materials"
          />
        </div>
        <div className="flex-1">
          <MultiSelect<RegistrationForm>
            name={"commodity"}
            options={commodity}
            placeholder="Select the business commodity"
            title="19. Commodity"
            required={true}
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

      <div className="flex gap-2 mt-2">
        {dvatdata && dvatdata.registration[0].dept_user_id == id && (
          <>
            <input
              type="submit"
              value={"Submit"}
              disabled={isSubmitting}
              className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white"
            />
            <button
              type="button"
              onClick={by_pass}
              className="py-1 text-sm px-4 bg-blue-500 text-white rounded-md"
            >
              Provisional
            </button>
          </>
        )}

        {dvatdata &&
          dvatdata.status == DvatStatus.PROVISIONAL &&
          role == Role.INSPECTOR && (
            <input
              type="submit"
              value={"Submit"}
              disabled={isSubmitting}
              className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white"
            />
          )}
        <button
          type="button"
          onClick={() => {
            router.back();
          }}
          className="py-1 rounded-md bg-rose-500 px-4 text-sm text-white"
        >
          Exit
        </button>
      </div>
    </form>
  );
};

type VatNoteProps = {
  commodity: Dvat04Commodity | null;
  registrationdata: registration;
};
const VatNote = (props: VatNoteProps) => {
  const id: number = parseInt(getCookie("id") ?? "0");
  const router = useRouter();

  const [dvatdata, setDvatdata] = useState<
    dvat04 & { registration: registration[] }
  >();

  const {
    reset,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useFormContext<RegistrationForm>();

  useEffect(() => {
    reset({
      date_of_visit: props.registrationdata.date_of_visit
        ? formateDate(props.registrationdata.date_of_visit)
        : undefined,
      natureOfBusiness: props.registrationdata.natureOfBusiness!,

      date_of_purchases: props.registrationdata.date_of_purchases
        ? formateDate(props.registrationdata.date_of_purchases)
        : undefined,
      amount_of_purchases: props.registrationdata.amount_of_purchases!,
      date_of_sales: props.registrationdata.date_of_sales
        ? formateDate(props.registrationdata.date_of_sales)
        : undefined,
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
      security_deposit_date: props.registrationdata.security_deposit_date
        ? formateDate(props.registrationdata.security_deposit_date)
        : undefined,
      date_of_expiry_security_deposit: props.registrationdata
        .date_of_expiry_security_deposit
        ? formateDate(props.registrationdata.date_of_expiry_security_deposit)
        : undefined,
      bank: props.registrationdata.bank!,
      name_of_person: props.registrationdata.name_of_person!,
      address: props.registrationdata.address!,
      plant_and_machinery: props.registrationdata.plant_and_machinery!,
      raw_materials: props.registrationdata.raw_materials!,
      packing_materials: props.registrationdata.packing_materials!,
      inspector_note: props.registrationdata.inspector_note!,
      commodity: props.commodity!,
      vat_officer_note: props.registrationdata.vat_officer_note!,
      registration_date:
        props.registrationdata.registration_date!.toISOString(),
      all_appointment: props.registrationdata.all_appointment!,
      all_doc_upload: props.registrationdata.all_doc_upload!,
      necessary_payments: props.registrationdata.necessary_payments!,
    });

    const init = async () => {
      const dvat04_response = await GetDvat04({
        id: props.registrationdata.dvat04Id,
      });

      if (dvat04_response.status && dvat04_response.data) {
        setDvatdata(dvat04_response.data);
      }
    };
    init();
  }, [props.registrationdata]);

  const onSubmit = async (data: RegistrationForm) => {
    if (!data.registration_date) {
      return toast.error("Select Registration Date.");
    }
    if (data.all_doc_upload == undefined || data.all_doc_upload == null) {
      return toast.error("Select is your all documents uploaded or not.");
    }
    if (data.all_appointment == undefined || data.all_appointment == null) {
      return toast.error("Select is your all appointments are closed or not.");
    }

    if (
      data.vat_officer_note == undefined ||
      data.vat_officer_note == null ||
      data.vat_officer_note == ""
    ) {
      return toast.error("VAT officer comment is required.");
    }

    if (!dvatdata) return toast.error("There is not any dvat form exist.");
    if (dvatdata.registration.length == 0)
      return toast.error("There is not any regirstion form exist.");

    const dept_response = await GetDeptUser({
      role: Role.VATOFFICER,
      dept: dvatdata.selectOffice!,
    });

    if (dept_response.data && dept_response.status) {
      const response = await UpdateRegistration({
        id: dvatdata.registration[0].id,
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
        vat_officer_note: data.vat_officer_note,

        dept_user_id: dept_response.data.id,
        status: RegistrationStatus.ACTIVE,
      });

      if (response.status) {
        const resposne = await UpdateDvatStatus({
          id: props.registrationdata.dvat04Id!,
          updatedby: id,
          status: "APPROVED",
          tinNumber: "26000004000" + dvatdata.id,
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
    } else {
      toast.error(dept_response.message);
    }
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
    { value: "MANUFACTURER", label: "MANUFACTURER" },
    { value: "TRADER", label: "TRADER" },
    { value: "SERVICE", label: "SERVICE" },
    { value: "OTHERS", label: "OTHERS" },
    { value: "WORKS", label: "WORKS" },
  ];

  const commodity: OptionValue[] = [
    { value: "LIQUOR", label: "Liquor" },
    { value: "FUEL", label: "Fuel" },
    { value: "OTHERS", label: "Others" },
  ];

  const send_back = async () => {
    if (!dvatdata) return toast.error("There is not any dvat form exist.");

    if (dvatdata.registration.length == 0)
      return toast.error("There is not any regirstion form exist with.");

    const dept_response = await GetDeptUser({
      role: Role.INSPECTOR,
      dept: dvatdata.selectOffice!,
    });

    if (dept_response.data && dept_response.status) {
      const response = await UpdateRegistration({
        id: dvatdata.registration[0].id,
        updatedby: id,
        dept_user_id: dept_response.data.id,
        status: RegistrationStatus.ACTIVE,
      });

      if (response.status) {
        router.push("/dashboard/register/department-track-application-status");
      } else {
        toast.error(response.message);
      }
    } else {
      toast.error(dept_response.message);
    }
  };
  const bypass = async () => {
    const {
      registration_date,
      necessary_payments,
      all_appointment,
      all_doc_upload,
      vat_officer_note,
    } = getValues();

    if (!registration_date) {
      return toast.error("Select Registration Date.");
    }
    if (all_doc_upload == undefined || all_doc_upload == null) {
      return toast.error("Select is your all documents uploaded or not.");
    }
    if (all_appointment == undefined || all_appointment == null) {
      return toast.error("Select is your all appointments are closed or not.");
    }
    if (
      vat_officer_note == undefined ||
      vat_officer_note == null ||
      vat_officer_note == ""
    ) {
      return toast.error("VAT officer comment is required.");
    }

    if (!dvatdata) return toast.error("There is not any dvat form exist.");
    if (dvatdata.registration.length == 0)
      return toast.error("There is not any regirstion form exist.");

    const response = await UpdateRegistration({
      id: dvatdata.registration[0].id,
      updatedby: id,

      necessary_payments: necessary_payments,
      all_appointment: all_appointment,
      all_doc_upload: all_doc_upload,
      registration_date: new Date(registration_date),
      vat_officer_note: vat_officer_note,

      dept_user_id: 0,
      status: RegistrationStatus.ACTIVE,
    });

    if (response.status) {
      const resposne = await UpdateDvatStatus({
        id: props.registrationdata.dvat04Id!,
        updatedby: id,
        status: "PROVISIONAL",
        tinNumber: "26000004000" + dvatdata.id,
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

  return (
    <form onSubmit={handleSubmit(onSubmit, onFormError)}>
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
              placeholder="Enter Security Deposit Amount"
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
            placeholder="Enter Name of the peoples"
            name="name_of_person"
            required={false}
            title="14. Name of the peoples whom  visited at the time of inspection"
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
      <div className="flex gap-3 mt-3">
        <div className="flex-1">
          <TaxtAreaInput<RegistrationForm>
            placeholder="Enter address"
            name="address"
            required={false}
            title="16. Address of the place(s) visited for inspection (If not same as principle Place of Business please specify below)"
            disable={true}
          />
        </div>
        <div className="flex-1">
          <TaxtAreaInput<RegistrationForm>
            placeholder="Enter Raw Materials"
            name="raw_materials"
            required={true}
            title="17. Raw Materials"
            disable={true}
          />
        </div>
      </div>
      <div className="flex gap-3 mt-3">
        <div className="flex-1">
          <TaxtInput<RegistrationForm>
            placeholder="Enter Packing materials"
            name="packing_materials"
            required={true}
            title="18. Packing Materials"
            disable={true}
          />
        </div>

        <div className="flex-1">
          <MultiSelect<RegistrationForm>
            name={"commodity"}
            options={commodity}
            placeholder="Select the business commodity"
            title="19. Commodity"
            required={true}
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
          VAT officer
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
            placeholder="Enter VAT officer Comment"
            name="vat_officer_note"
            required={true}
            title="VAT officer Comment"
            maxlength={2000}
          />
        </div>
      </div>

      <div className="flex gap-4 mt-2">
        <button
          onClick={send_back}
          type="button"
          className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white"
        >
          Send to Inspector
        </button>
        {dvatdata && dvatdata.status == DvatStatus.PROVISIONAL && (
          <button
            onClick={bypass}
            type="button"
            className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white"
          >
            Bypass
          </button>
        )}

        {dvatdata && dvatdata.status == DvatStatus.PENDINGPROCESSING && (
          <input
            type="submit"
            value={"Approve"}
            disabled={isSubmitting}
            className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white"
          />
        )}

        <button
          onClick={reject}
          type="button"
          className="py-1 rounded-md bg-rose-500 px-4 text-sm text-white"
        >
          Reject
        </button>
        <button
          type="button"
          onClick={() => {
            router.back();
          }}
          className="py-1 rounded-md bg-rose-500 px-4 text-sm text-white"
        >
          Exit
        </button>
      </div>
    </form>
  );
};

type RegistrationPreviewProps = {
  registrationdata: registration;
  commodity: Dvat04Commodity;
};

const RegistrationPreview = (props: RegistrationPreviewProps) => {
  const router = useRouter();

  return (
    <div>
      <div className="rounded-sm p-4 border border-black mt-6 relative">
        <span className="-translate-y-7 bg-white px-1 -translate-x-2 inline-block absolute text-sm">
          Site Report 1
        </span>
        <div className="grid grid-cols-3 gap-2 mt-2">
          <InfoCard
            title="1. Date of Visit"
            description={
              props.registrationdata.date_of_visit
                ? formateDate(props.registrationdata.date_of_visit)
                : ""
            }
          />
          <InfoCard
            title="2. Nature of Business"
            description={props.registrationdata.natureOfBusiness}
          />
          <InfoCard
            title="3. Date of Commencement of Purchases"
            description={
              props.registrationdata.date_of_purchases
                ? formateDate(props.registrationdata.date_of_purchases)
                : ""
            }
          />
          <InfoCard
            title="4. Amount of purchases made in (Rs.)"
            description={props.registrationdata.amount_of_purchases ?? "0.0"}
          />
          <InfoCard
            title="5. Date of Commencement of Sales"
            description={
              props.registrationdata.date_of_sales
                ? formateDate(props.registrationdata.date_of_sales)
                : ""
            }
          />

          <InfoCard
            title="6. Amount of Sales made in (Rs.)"
            description={props.registrationdata.amount_of_sales ?? "0.0"}
          />
          <InfoCard
            title="7. Capital proposed to be invested in (Rs.)"
            description={props.registrationdata.capital_proposed ?? ""}
          />

          <InfoCard
            title="8. Amount of Stock held at the time of visit (Rs.)"
            description={props.registrationdata.amount_of_stock ?? "0.0"}
          />
          <InfoCard
            title="9. Books of Account Maintained"
            description={props.registrationdata.books_of_account ?? ""}
          />
          <InfoCard
            title="10. Verification of Originals"
            description={props.registrationdata.verification_of_originals ?? ""}
          />

          <InfoCard
            title="11. Verification of title of place of business"
            description={props.registrationdata.verification_of_title ?? ""}
          />
          <InfoCard
            title="12. Other Information"
            description={props.registrationdata.other_information ?? ""}
          />
        </div>
      </div>
      <div className="rounded-sm p-4 border border-black mt-6 relative">
        <span className="-translate-y-7 bg-white px-1 -translate-x-2 inline-block absolute text-sm">
          Security
        </span>
        <div className="grid grid-cols-3 gap-2 mt-2">
          <InfoCard
            title="13a) Security Deposit found correct"
            description={props.registrationdata.security_deposit ? "Yes" : "No"}
          />
          <InfoCard
            title="b). Security deposit Amount"
            description={
              props.registrationdata.security_deposit_amount ?? "0.0"
            }
          />

          <InfoCard
            title="c). Security desposit date"
            description={
              props.registrationdata.security_deposit_date
                ? formateDate(props.registrationdata.security_deposit_date)
                : ""
            }
          />
          <InfoCard
            title="d). Date of Expiry of Security Deposit"
            description={
              props.registrationdata.date_of_expiry_security_deposit
                ? formateDate(
                    props.registrationdata.date_of_expiry_security_deposit
                  )
                : ""
            }
          />
          <InfoCard
            title="e). Bank"
            description={props.registrationdata.bank ?? ""}
          />
        </div>
      </div>
      <div className="rounded-sm p-4 border border-black mt-6 relative">
        <span className="-translate-y-7 bg-white px-1 -translate-x-2 inline-block absolute text-sm">
          Site Report 2
        </span>
        <div className="grid grid-cols-3 gap-2 mt-2">
          <InfoCard
            title="15. Name of the peoples whom  visited at the time of inspection"
            description={props.registrationdata.name_of_person ?? ""}
          />
          <InfoCard
            title="15. Plant and Machinery"
            description={props.registrationdata.plant_and_machinery ?? ""}
          />
          <InfoCard
            title="16. Address of the place(s) visited for inspection (If not same as principle Place of Business please specify below)"
            description={props.registrationdata.address ?? ""}
          />
          <InfoCard
            title="17. Raw Materials"
            description={props.registrationdata.raw_materials ?? ""}
          />
          <InfoCard
            title="18. Packing Materials"
            description={props.registrationdata.packing_materials ?? ""}
          />
          <InfoCard title="19. Commodity" description={props.commodity} />
        </div>
      </div>

      <div className="rounded-sm p-4 border border-black mt-6 relative">
        <span className="-translate-y-7 bg-white px-1 -translate-x-2 inline-block absolute text-sm">
          Inspector Note
        </span>
        <InfoCard
          title="Inspector Comments"
          description={props.registrationdata.inspector_note ?? ""}
        />
      </div>

      <div className="rounded-sm p-4 border border-black mt-6 relative">
        <span className="-translate-y-7 bg-white px-1 -translate-x-2 inline-block absolute text-sm">
          VAT officer
        </span>
        <h1 className="text-lg font-semibold text-center mt-4"></h1>
        <div className="grid grid-cols-3 gap-2 mt-2">
          <InfoCard
            title="Registration Payment Date"
            description={
              props.registrationdata.registration_date
                ? formateDate(props.registrationdata.registration_date)
                : ""
            }
          />
          <InfoCard
            title="Necessary payments (Reg. Fees, PT and Security Deposits etc.), if applicable have beeen received?"
            description={
              props.registrationdata.necessary_payments ? "Yes" : "No"
            }
          />

          <InfoCard
            title="All Documents Uploaded?"
            description={props.registrationdata.all_doc_upload ? "Yes" : "No"}
          />
          <InfoCard
            title="All Appointments Closed?"
            description={props.registrationdata.all_appointment ? "Yes" : "No"}
          />
          <InfoCard
            title="VAT officer Comment"
            description={props.registrationdata.vat_officer_note ?? ""}
          />
        </div>
      </div>

      {/* <div className="flex gap-4 mt-2">
        <Button
          type="primary"
          onClick={() => {
            router.back();
          }}
        >
          Back
        </Button>
      </div> */}
    </div>
  );
};

const InfoCard = (args: { title: string; description: string }) => {
  return (
    <div className="rounded-md p-2">
      <p className="text-sm">{args.title}</p>
      <p className="text-sm font-semibold">{args.description}</p>
    </div>
  );
};
