/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { TaxtInput } from "../inputfields/textinput";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { MultiSelect } from "../inputfields/multiselect";
import { OptionValue } from "@/models/main";
import { TaxtAreaInput } from "../inputfields/textareainput";
import { toast } from "react-toastify";
import { onFormError } from "@/utils/methods";
import {
  type ProcessProductRequestForm,
  ProcessProductRequestSchema,
} from "@/schema/processproductrequest";
import CreateCommodityFromRequest from "@/action/product_request/createcommodityfromrequest";
import UpdateProductRequestStatus from "@/action/product_request/updateproductrequeststatus";
import { product_request, commodity_master } from "@prisma/client";
import { Modal, Drawer, Button, Table } from "antd";
import { ExclamationCircleOutlined, SearchOutlined } from "@ant-design/icons";
import SearchProductsByName from "@/action/commoditymaster/searchproductsbyname";
import type { ColumnsType } from "antd/es/table";

type ProcessProductRequestProviderProps = {
  userid: number;
  productRequest: product_request;
  setAddBox: Dispatch<SetStateAction<boolean>>;
  init: () => Promise<void>;
};

export const ProcessProductRequestProvider = (
  props: ProcessProductRequestProviderProps
) => {
  const methods = useForm<ProcessProductRequestForm>({
    resolver: valibotResolver(ProcessProductRequestSchema),
  });

  return (
    <FormProvider {...methods}>
      <ProcessProductRequestForm
        userid={props.userid}
        productRequest={props.productRequest}
        setAddBox={props.setAddBox}
        init={props.init}
      />
    </FormProvider>
  );
};

const ProcessProductRequestForm = (
  props: ProcessProductRequestProviderProps
) => {
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
    watch,
    formState: { isSubmitting },
  } = useFormContext<ProcessProductRequestForm>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [matchingProducts, setMatchingProducts] = useState<commodity_master[]>([]);
  const [isSearchDrawerOpen, setIsSearchDrawerOpen] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const product_name = watch("product_name");

  useEffect(() => {
    reset({
      description: "",
      mrp: "",
      oidc_discount_percent: "",
      oidc_price: "",
      product_name: props.productRequest.product_name,
      product_type: "LIQUOR",
      remark: `Company: ${props.productRequest.company_name}, Pack Type: ${props.productRequest.pack_type}`,
      sale_price: "",
      taxable_at: "",
      crate_size: props.productRequest.crate_size,
    });
    setIsLoading(false);
  }, [props.productRequest]);

  const handleSearchProducts = async () => {
    if (!product_name || product_name.trim().length < 2) {
      toast.error("Please enter at least 2 characters to search");
      return;
    }

    setIsSearching(true);
    setIsSearchDrawerOpen(true);
    
    const response = await SearchProductsByName({
      product_name: product_name.trim(),
    });

    if (response.status && response.data) {
      setMatchingProducts(response.data);
    } else {
      setMatchingProducts([]);
      toast.error(response.message);
    }
    setIsSearching(false);
  };

  const onSubmit = async (data: ProcessProductRequestForm) => {
    const comm_response = await CreateCommodityFromRequest({
      createdById: props.userid,
      description: data.description,
      mrp: data.mrp,
      oidc_discount_percent: data.oidc_discount_percent,
      oidc_price: data.oidc_price,
      product_name: data.product_name,
      product_type: data.product_type,
      remark: data.remark ?? "",
      sale_price: data.sale_price,
      taxable_at: data.taxable_at,
      crate_size: data.crate_size,
      company_name: props.productRequest.company_name,
      pack_type: props.productRequest.pack_type,
    });

    if (comm_response.status) {
      toast.success(comm_response.message);
      // Update product request status to APPROVED
      await UpdateProductRequestStatus({
        id: props.productRequest.id,
        status: "APPROVED",
      });
      await props.init();
      props.setAddBox(false);
    } else {
      toast.error(comm_response.message);
    }
  };

  const handleReject = () => {
    Modal.confirm({
      title: "Reject Product Request",
      icon: <ExclamationCircleOutlined />,
      content: "Are you sure you want to reject this product request?",
      okText: "Yes, Reject",
      okType: "danger",
      cancelText: "Cancel",
      async onOk() {
        const response = await UpdateProductRequestStatus({
          id: props.productRequest.id,
          status: "REJECTED",
        });
        if (response.status) {
          toast.success(response.message);
          await props.init();
          props.setAddBox(false);
        } else {
          toast.error(response.message);
        }
      },
    });
  };

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );

  const productColumns: ColumnsType<commodity_master> = [
    {
      title: "Product Name",
      dataIndex: "product_name",
      key: "product_name",
      width: 250,
    },
    {
      title: "Type",
      dataIndex: "product_type",
      key: "product_type",
      width: 100,
    },
    {
      title: "Crate Size",
      dataIndex: "crate_size",
      key: "crate_size",
      width: 100,
    },
    {
      title: "MRP",
      dataIndex: "mrp",
      key: "mrp",
      width: 100,
      render: (mrp: string) => `₹${mrp}`,
    },
    {
      title: "Sale Price",
      dataIndex: "sale_price",
      key: "sale_price",
      width: 100,
      render: (price: string) => `₹${price}`,
    },
    {
      title: "OIDC Price",
      dataIndex: "oidc_price",
      key: "oidc_price",
      width: 100,
      render: (price: string) => `₹${price}`,
    },
  ];

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit, onFormError)}>
        <div className="mt-2">
          <TaxtInput<ProcessProductRequestForm>
            placeholder="Enter Product Name"
            name="product_name"
            required={true}
            title="Product Name"
          />
          <Button
            type="default"
            icon={<SearchOutlined />}
            onClick={handleSearchProducts}
            className="mt-2 w-full"
            size="small"
          >
            Check Existing Products
          </Button>
        </div>
      <div className="mt-2">
        <MultiSelect<ProcessProductRequestForm>
          placeholder="Select Product Type"
          name="product_type"
          required={true}
          title="Product Type"
          options={product_type}
        />
      </div>
      <div className="mt-2">
        <TaxtInput<ProcessProductRequestForm>
          title="Crate Size"
          required={true}
          name="crate_size"
          placeholder="Enter Crate Size"
          onlynumber={true}
        />
      </div>
      <div className="mt-2">
        <TaxtInput<ProcessProductRequestForm>
          title="MRP"
          required={true}
          name="mrp"
          placeholder="Enter MRP"
          onlynumber={true}
        />
      </div>
      <div className="mt-2">
        <TaxtInput<ProcessProductRequestForm>
          title="Sale Price"
          required={true}
          name="sale_price"
          placeholder="Enter Sale Price"
          onlynumber={true}
        />
      </div>
      <div className="mt-2">
        <TaxtInput<ProcessProductRequestForm>
          title="OIDC Price"
          required={true}
          name="oidc_price"
          placeholder="Enter OIDC Price"
          onlynumber={true}
        />
      </div>
      <div className="mt-2">
        <TaxtInput<ProcessProductRequestForm>
          title="OIDC Discount Percent"
          required={true}
          name="oidc_discount_percent"
          placeholder="Enter OIDC Discount Percent"
          onlynumber={true}
        />
      </div>
      <div className="mt-2">
        <MultiSelect<ProcessProductRequestForm>
          placeholder="Select Taxable At"
          name="taxable_at"
          required={true}
          title="Taxable At"
          options={taxable_at}
        />
      </div>
      <div className="mt-2">
        <TaxtAreaInput<ProcessProductRequestForm>
          title="Description"
          required={true}
          name="description"
          placeholder="Enter Description"
        />
      </div>
      <div className="mt-2">
        <TaxtAreaInput<ProcessProductRequestForm>
          title="Remark"
          required={false}
          name="remark"
          placeholder="Enter Remark"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleReject}
          className="py-1 rounded-md bg-red-500 px-4 text-sm text-white mt-2 cursor-pointer"
        >
          Reject
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            props.setAddBox(false);
          }}
          className="py-1 rounded-md bg-gray-500 px-4 text-sm text-white mt-2 cursor-pointer"
        >
          Close
        </button>
        <input
          type="reset"
          onClick={(e) => {
            e.preventDefault();
            reset({
              description: "",
              mrp: "",
              oidc_discount_percent: "",
              oidc_price: "",
              product_name: props.productRequest.product_name,
              product_type: "LIQUOR",
              remark: `Company: ${props.productRequest.company_name}, Pack Type: ${props.productRequest.pack_type}`,
              sale_price: "",
              taxable_at: "",
              crate_size: props.productRequest.crate_size,
            });
          }}
          value={"Reset"}
          className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white mt-2 cursor-pointer"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="py-1 rounded-md bg-green-500 px-4 text-sm text-white mt-2 cursor-pointer"
        >
          {isSubmitting ? "Loading...." : "Approve & Create"}
        </button>
      </div>
    </form>

    {/* Search Products Drawer */}
    <Drawer
      title="Existing Products"
      placement="right"
      width={800}
      onClose={() => setIsSearchDrawerOpen(false)}
      open={isSearchDrawerOpen}
    >
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Found <strong>{matchingProducts.length}</strong> product(s) matching "{product_name}"
        </p>
        {matchingProducts.length > 0 && (
          <p className="text-sm text-orange-600 mt-2">
            ⚠️ Please review the list below before creating a new product to avoid duplicates.
          </p>
        )}
      </div>
      <Table
        columns={productColumns}
        dataSource={matchingProducts}
        rowKey="id"
        loading={isSearching}
        pagination={{
          pageSize: 10,
          showTotal: (total) => `Total ${total} products`,
        }}
        scroll={{ x: 700 }}
        locale={{
          emptyText: matchingProducts.length === 0 && !isSearching
            ? "No matching products found. You can proceed to create a new one."
            : "Loading...",
        }}
      />
    </Drawer>
  </>
  );
};
