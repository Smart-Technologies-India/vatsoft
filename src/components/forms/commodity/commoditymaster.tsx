/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { FormProvider, useForm, useFormContext } from "react-hook-form";

import { TaxtInput } from "../inputfields/textinput";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MultiSelect } from "../inputfields/multiselect";
import { OptionValue } from "@/models/main";
import { Radio } from "antd";

import { TaxtAreaInput } from "../inputfields/textareainput";
import { toast } from "react-toastify";
import { onFormError } from "@/utils/methods";
import {
  CommodityMasterForm,
  CommodityMasterSchema,
} from "@/schema/commoditymaster";
import GetCommodityMaster from "@/action/commoditymaster/getcommoditymaster";
import CreateCommodityMaster from "@/action/commoditymaster/createcommoditymaster";
import UpdateCommodityMaster from "@/action/commoditymaster/updatecommoditymaster";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";

type CompositionProviderProps = {
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
        id={props.id}
        setAddBox={props.setAddBox}
        setCommid={props.setCommid}
        init={props.init}
      />
    </FormProvider>
  );
};

const CommodityMaster = (props: CompositionProviderProps) => {
  const router = useRouter();
  const [userid, setUserid] = useState<number>(0);
  const [marketType, setMarketType] = useState<string>("LOCAL");

  const pack_type: OptionValue[] = [
    { value: "BOTTLE", label: "BOTTLE" },
    { value: "CAN", label: "CAN" },
    { value: "PET", label: "PET" },
    { value: "TETRAPACK", label: "TETRAPACK" },
    { value: "POUCH", label: "POUCH" },
  ];

  const {
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useFormContext<CommodityMasterForm>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const crateSize = watch("crate_size");

  useEffect(() => {
    reset({
      product_name: "",
      market_type: "LOCAL",
      mrp: "",
      crate_size: "",
      pack_type: "BOTTLE",
      pack_size: "",
    });
    const init = async () => {
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
      setUserid(authResponse.data);
      if (props.id) {
        const comm = await GetCommodityMaster({
          id: props.id,
        });
        if (comm.status && comm.data) {
          const marketTypeValue = (comm.data as any).market_type || "LOCAL";
          setMarketType(marketTypeValue);
          reset({
            product_name: comm.data.product_name,
            market_type: marketTypeValue,
            mrp: comm.data.mrp,
            crate_size: String(comm.data.crate_size),
            pack_type: comm.data.pack_type || "BOTTLE",
            pack_size: comm.data.pack_size || "",
          });
        }
      }
      setIsLoading(false);
    };
    init();
  }, [props.id]);

  const onSubmit = async (data: CommodityMasterForm) => {
    // Calculate MRP based on market type
    let calculatedMrp = data.mrp;
    if (data.market_type === "EXPORT") {
      calculatedMrp = String(parseInt(data.crate_size) * 30);
    }

    // Auto-fill fields with default values
    const autoFilledData = {
      ...data,
      mrp: calculatedMrp,
      product_type: "LIQUOR",
      sale_price: calculatedMrp,
      oidc_price: calculatedMrp,
      oidc_discount_percent: "0",
      taxable_at: "20",
      description: data.product_name,
      remark: "EXCISE DAMAN",
    };

    if (props.id) {
      const comm_response = await UpdateCommodityMaster({
        id: props.id,
        description: autoFilledData.description,
        mrp: autoFilledData.mrp,
        sale_price: autoFilledData.sale_price,
        oidc_discount_percent: autoFilledData.oidc_discount_percent,
        oidc_price: autoFilledData.oidc_price,
        product_name: autoFilledData.product_name,
        product_type: autoFilledData.product_type,
        remark: autoFilledData.remark,
        taxable_at: autoFilledData.taxable_at,
        market_type: data.market_type,
        crate_size: parseInt(data.crate_size),
        pack_type: data.pack_type,
        pack_size: data.pack_size,
      });
      if (comm_response.status) {
        toast.success(comm_response.message);
      } else {
        toast.error(comm_response.message);
      }
    } else {
      const commm_response = await CreateCommodityMaster({
        createdById: userid,
        description: autoFilledData.description,
        mrp: autoFilledData.mrp,
        oidc_discount_percent: autoFilledData.oidc_discount_percent,
        oidc_price: autoFilledData.oidc_price,
        product_name: autoFilledData.product_name,
        product_type: autoFilledData.product_type,
        remark: autoFilledData.remark,
        sale_price: autoFilledData.sale_price,
        taxable_at: autoFilledData.taxable_at,
        market_type: data.market_type,
        crate_size: parseInt(data.crate_size),
        pack_type: data.pack_type,
        pack_size: data.pack_size,
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
      
      <div className="mt-4 mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Market Type <span className="text-red-500">*</span>
        </label>
        <Radio.Group
          value={marketType}
          onChange={(e) => {
            const newValue = e.target.value;
            setMarketType(newValue);
            setValue("market_type", newValue);
          }}
          className="flex gap-4"
        >
          <Radio value="LOCAL">Local</Radio>
          <Radio value="EXPORT">Export</Radio>
        </Radio.Group>
      </div>

      {marketType === "LOCAL" && (
        <div className="mt-2">
          <TaxtInput<CommodityMasterForm>
            title="MRP/Crate"
            required={true}
            name="mrp"
            placeholder="Enter MRP/Crate"
            onlynumber={true}
          />
        </div>
      )}

      {marketType === "EXPORT" && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-gray-700">
            <strong>No MRP</strong>
          </p>
          {crateSize && (
            <p className="text-sm text-blue-600 font-semibold mt-1">
              MRP = {crateSize} × 30 = {parseInt(crateSize) * 30}
            </p>
          )}
        </div>
      )}

      <div className="mt-2">
        <TaxtInput<CommodityMasterForm>
          title="Pcs/Crate"
          required={true}
          name="crate_size"
          placeholder="Enter Pcs/Crate"
          onlynumber={true}
        />
      </div>
      <div className="mt-2">
        <MultiSelect<CommodityMasterForm>
          placeholder="Select Pack Type"
          name="pack_type"
          required={true}
          title="Pack Type"
          options={pack_type}
        />
      </div>
      <div className="mt-2">
        <TaxtInput<CommodityMasterForm>
          title="Pack Size"
          required={true}
          name="pack_size"
          placeholder="Enter Pack Size"
          onlynumber={true}
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
                product_name: "",
                mrp: "",
                crate_size: "",
                pack_type: "BOTTLE",
                pack_size: "",
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
          {props.id ? "Update" : "Create"}
        </button>
      </div>
    </form>
  );
};
