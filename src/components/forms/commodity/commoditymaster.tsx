/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { FormProvider, useForm, useFormContext } from "react-hook-form";

import { TaxtInput } from "../inputfields/textinput";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MultiSelect } from "../inputfields/multiselect";
import { OptionValue } from "@/models/main";

import { TaxtAreaInput } from "../inputfields/textareainput";
import { toast } from "react-toastify";
import { onFormError } from "@/utils/methods";
import {
  CommodityMasterForm,
  CommodityMasterSchema,
} from "@/schema/commoditymaster";
import GetCommodityMaster from "@/action/commoditymaster/getcommoditymaster";
import CreateCommodityMaster from "@/action/commoditymaster/createcommoditymaster";
import { getCookie } from "cookies-next";
import UpdateCommodityMaster from "@/action/commoditymaster/updatecommoditymaster";

type CompositionProviderProps = {
  userid: number;
  id?: number;
  setAddBox: Dispatch<SetStateAction<boolean>>;
  setCommid: Dispatch<SetStateAction<number | undefined>>;
  init: () => Promise<void>;
};
export const CommodityMasterProvider = (props: CompositionProviderProps) => {
  const methods = useForm<CommodityMasterForm>({
    resolver: valibotResolver(CommodityMasterSchema),
  });

  return (
    <FormProvider {...methods}>
      <CommodityMaster
        userid={props.userid}
        id={props.id}
        setAddBox={props.setAddBox}
        setCommid={props.setCommid}
        init={props.init}
      />
    </FormProvider>
  );
};

const CommodityMaster = (props: CompositionProviderProps) => {
  const userid: number = parseFloat(getCookie("id") ?? "0");

  const product_type: OptionValue[] = [
    { value: "LIQUOR", label: "Liquor" },
    { value: "FUEL", label: "Fuel" },
    { value: "OTHER", label: "Other" },
  ];

  const taxable_at: OptionValue[] = [
    0, 1, 2, 4, 5, 6, 12.5, 12.75, 13.5, 15, 20,
  ].map((val: number) => ({ value: `${val}`, label: `${val}%` }));

  const {
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useFormContext<CommodityMasterForm>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    reset({
      description: "",
      mrp: "",
      oidc_discount_percent: "",
      oidc_price: "",
      product_name: "",
      product_type: "OTHER",
      remark: "",
      sale_price: "",
      taxable_at: "",
    });
    const init = async () => {
      if (props.id) {
        const comm = await GetCommodityMaster({
          id: props.id,
        });
        if (comm.status && comm.data) {
          reset({
            description: comm.data.description,
            mrp: comm.data.mrp,
            oidc_discount_percent: comm.data.oidc_discount_percent,
            oidc_price: comm.data.oidc_price,
            product_name: comm.data.product_name,
            product_type: comm.data.product_type!,
            remark: comm.data.remark,
            sale_price: comm.data.sale_price,
            taxable_at: comm.data.taxable_at,
          });
        }
      }
      setIsLoading(false);
    };
    init();
  }, [props.id]);

  const onSubmit = async (data: CommodityMasterForm) => {
    console.log("data ---->");
    if (props.id) {
      const comm_response = await UpdateCommodityMaster({
        id: props.id,
        updatedById: userid,
        description: data.description,
        mrp: data.mrp,
        sale_price: data.sale_price,
        oidc_discount_percent: data.oidc_discount_percent,
        oidc_price: data.oidc_price,
        product_name: data.product_name,
        product_type: data.product_type,
        remark: data.remark ?? "",
        taxable_at: data.taxable_at,
      });
      if (comm_response.status) {
        toast.success(comm_response.message);
      } else {
        toast.error(comm_response.message);
      }
    } else {
      const commm_response = await CreateCommodityMaster({
        createdById: userid,
        description: data.description,
        mrp: data.mrp,
        oidc_discount_percent: data.oidc_discount_percent,
        oidc_price: data.oidc_price,
        product_name: data.product_name,
        product_type: data.product_type,
        remark: data.remark ?? "",
        sale_price: data.sale_price,
        taxable_at: data.taxable_at,
      });
      if (commm_response.status) {
        toast.success(commm_response.message);
      } else {
        toast.error(commm_response.message);
      }
    }
    await props.init();
    props.setAddBox(false);
    props.setCommid(undefined);
  };

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );
  return (
    <form onSubmit={handleSubmit(onSubmit, onFormError)}>
      <div className="mt-2">
        <TaxtInput<CommodityMasterForm>
          placeholder="Enter Product Name"
          name="product_name"
          required={true}
          title="Product Name"
        />
      </div>
      <div className="mt-2">
        <MultiSelect<CommodityMasterForm>
          placeholder="Select Product Type"
          name="product_type"
          required={true}
          title="Product Type"
          options={product_type}
        />
      </div>
      <div className="mt-2">
        <TaxtInput<CommodityMasterForm>
          title="MRP"
          required={true}
          name="mrp"
          placeholder="Enter MRP"
          onlynumber={true}
        />
      </div>
      <div className="mt-2">
        <TaxtInput<CommodityMasterForm>
          title="Sale Price"
          required={true}
          name="sale_price"
          placeholder="Enter Sale Price"
          onlynumber={true}
        />
      </div>
      <div className="mt-2">
        <TaxtInput<CommodityMasterForm>
          title="OIDC Price"
          required={true}
          name="oidc_price"
          placeholder="Enter OIDC Price"
          onlynumber={true}
        />
      </div>
      <div className="mt-2">
        <TaxtInput<CommodityMasterForm>
          title="OIDC Discount Percent"
          required={true}
          name="oidc_discount_percent"
          placeholder="Enter OIDC Discount Percent"
          onlynumber={true}
        />
      </div>
      <div className="mt-2">
        <MultiSelect<CommodityMasterForm>
          placeholder="Select Taxable At"
          name="taxable_at"
          required={true}
          title="Taxable At"
          options={taxable_at}
        />
      </div>
      <div className="mt-2">
        <TaxtAreaInput<CommodityMasterForm>
          title="Description"
          required={true}
          name="description"
          placeholder="Enter Description"
        />
      </div>
      <div className="mt-2">
        <TaxtAreaInput<CommodityMasterForm>
          title="Remark"
          required={false}
          name="remark"
          placeholder="Enter Remark"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="reset"
          onClick={(e) => {
            e.preventDefault();
            props.setAddBox(false);
            props.setCommid(undefined);
          }}
          className="py-1 rounded-md bg-rose-500 px-4 text-sm text-white mt-2 cursor-pointer"
        >
          Close
        </button>
        {props.id ? (
          <></>
        ) : (
          <input
            type="reset"
            onClick={(e) => {
              e.preventDefault();
              reset({
                description: "",
                mrp: "",
                oidc_discount_percent: "",
                oidc_price: "",
                product_name: "",
                product_type: "OTHER",
                remark: "",
                sale_price: "",
                taxable_at: "",
              });
            }}
            value={"Reset"}
            className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white mt-2 cursor-pointer"
          />
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white mt-2 cursor-pointer"
        >
          {isSubmitting ? "Loading...." : props.id ? "Update" : "Submit"}
        </button>
      </div>
    </form>
  );
};
