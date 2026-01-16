/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { TaxtInput } from "../inputfields/textinput";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { MultiSelect } from "../inputfields/multiselect";
import { toast } from "react-toastify";
import { onFormError } from "@/utils/methods";
import { commodity_master, dvat04 } from "@prisma/client";
import AllCommodityMaster from "@/action/commoditymaster/allcommoditymaster";
import GetCommodityMaster from "@/action/commoditymaster/getcommoditymaster";
import {
  CreateFirstStockForm,
  CreateFirstStockSchema,
} from "@/schema/create_first_stock";
import GetUserDvat04FirstStock from "@/action/dvat/getuserdvatfirststock";
import { Checkbox, Radio, RadioChangeEvent, Modal, Form, Input, Select } from "antd";
import { CheckboxChangeEvent } from "antd/es/checkbox";
import GetNilCommodity from "@/action/save_stock/getnilcomodity";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import CreateProductRequest from "@/action/product_request/createproductrequest";
import { ProductRequestForm } from "@/schema/productrequest";

interface StockData {
  id: number | null;
  item: commodity_master;
  quantity: number;
}

type CreateFirstStockProviderProps = {
  setStock: Dispatch<SetStateAction<StockData[]>>;
  stock: StockData[];
  setAddBox: Dispatch<SetStateAction<boolean>>;
};

export const CreateFirstStockProvider = (
  props: CreateFirstStockProviderProps
) => {
  const methods = useForm<CreateFirstStockForm>({
    resolver: valibotResolver(CreateFirstStockSchema),
  });

  return (
    <FormProvider {...methods}>
      <CreateStockData
        setStock={props.setStock}
        stock={props.stock}
        setAddBox={props.setAddBox}
      />
    </FormProvider>
  );
};

const CreateStockData = (props: CreateFirstStockProviderProps) => {
  const {
    reset,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    getValues,
  } = useFormContext<CreateFirstStockForm>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [commodityMaster, setCommodityMaster] = useState<commodity_master[]>(
    []
  );

  const [dvatdata, setDvatdata] = useState<dvat04 | null>(null);

  useEffect(() => {
    reset({
      description_of_goods: undefined,
      quantity: "",
    });
    const init = async () => {
      const userdvat = await GetUserDvat04FirstStock();

      if (userdvat.status && userdvat.data) {
        setDvatdata(userdvat.data);
        const commodity_resposen = await AllCommodityMaster({});
        if (commodity_resposen.status && commodity_resposen.data) {
          if (userdvat.data.commodity == "FUEL") {
            setCommodityMaster(
              commodity_resposen.data.filter(
                (val) => val.product_type == "FUEL"
              )
            );
          } else {
            setCommodityMaster(
              commodity_resposen.data.filter(
                (val) => val.product_type != "FUEL"
              )
            );
          }
        }
      }

      setIsLoading(false);
    };
    init();
  }, []);

  interface GetMonthDateas {
    start: string;
    end: string;
  }

  const [commoditymaster, setCommoditymaster] =
    useState<commodity_master | null>(null);

  const description_of_goods = watch("description_of_goods");
  const quantity = watch("quantity");

  useEffect(() => {
    if (description_of_goods == null || description_of_goods == undefined)
      return;
    const init = async () => {
      const commmaster = await GetCommodityMaster({
        id: parseInt(description_of_goods),
      });
      if (commmaster.status && commmaster.data) {
        setCommoditymaster(commmaster.data);
      }
    };
    init();
  }, [description_of_goods]);

  const onSubmit = async (data: CreateFirstStockForm) => {
    if (isAccept) {
      props.setAddBox(false);
      return;
    }

    if (commoditymaster == null || commoditymaster == undefined) {
      return toast.error("Commodity Master not found.");
    }

    // Check if product already exists in stock
    const existingProductIndex = props.stock.findIndex(
      (item) => item.item.id === commoditymaster.id
    );

    if (existingProductIndex !== -1) {
      // Product exists, show Ant Design confirmation modal
      const newQuantity =
        quantityCount == "pcs"
          ? parseInt(data.quantity)
          : parseInt(data.quantity) * commoditymaster.crate_size;

      Modal.confirm({
        title: "Product Already Exists",
        icon: <ExclamationCircleOutlined />,
        content: (
          <div>
            <p>
              <strong>{commoditymaster.product_name}</strong> already exists in
              the stock list.
            </p>
            <p>Do you want to update the quantity?</p>
            <div className="mt-3 p-3 bg-slate-50 rounded">
              <p className="text-sm">
                <strong>Current Quantity:</strong>{" "}
                {props.stock[existingProductIndex].quantity}
              </p>
              <p className="text-sm">
                <strong>New Quantity:</strong> {newQuantity}
              </p>
            </div>
          </div>
        ),
        okText: "Yes, Update",
        cancelText: "No, Cancel",
        onOk() {
          // Update existing product quantity
          const updatedStock = [...props.stock];
          updatedStock[existingProductIndex] = {
            id: updatedStock[existingProductIndex].id,
            item: commoditymaster,
            quantity: newQuantity,
          };
          props.setStock(updatedStock);
          toast.success("Stock quantity updated successfully!");
          props.setAddBox(false);
        },
        onCancel() {
          // Don't close the drawer so user can modify
        },
      });
      return; // Important: prevent further execution
    }

    // Product doesn't exist, add new entry
    props.setStock([
      ...props.stock,
      {
        id: null,
        item: commoditymaster,
        quantity:
          quantityCount == "pcs"
            ? parseInt(data.quantity)
            : parseInt(data.quantity) * commoditymaster.crate_size,
      },
    ]);

    props.setAddBox(false);
  };

  const addNew = async (data: CreateFirstStockForm) => {
    if (isAccept) {
      props.setAddBox(false);
    } else {
      if (commoditymaster == null || commoditymaster == undefined)
        return toast.error("Commodity Master not found.");
      props.setStock([
        ...props.stock,
        {
          id: null,
          item: commoditymaster,
          quantity:
            quantityCount == "pcs"
              ? parseInt(data.quantity)
              : parseInt(data.quantity) * commoditymaster.crate_size,
        },
      ]);

      const currentValues = getValues();

      reset({
        ...currentValues,
        quantity: "",
        description_of_goods: undefined,
      });
    }
  };

  const [submitType, setSubmitType] = useState<string>("");

  const [quantityCount, setQuantityCount] = useState("pcs");
  const [isAccept, setIsAccept] = useState<boolean>(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productForm] = Form.useForm();

  const onChange = ({ target: { value } }: RadioChangeEvent) => {
    setQuantityCount(value);
  };

  const handleProductRequest = async (values: ProductRequestForm) => {
    try {
      const response = await CreateProductRequest(values);
      if (response.status) {
        toast.success(response.message);
        setIsProductModalOpen(false);
        productForm.resetFields();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Failed to submit product request");
    }
  };

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );

  return (
    <form
      onSubmit={handleSubmit((data) => {
        if (submitType === "submit") {
          onSubmit(data);
        } else if (submitType === "addNew") {
          addNew(data);
        }
      }, onFormError)}
    >
      <div className="mt-2">
        <div className="mt-2">
          <MultiSelect<CreateFirstStockForm>
            placeholder="Select Items details"
            name="description_of_goods"
            required={true}
            title="Items details"
            disable={isAccept}
            options={commodityMaster.map(
              (val: commodity_master, index: number) => ({
                value: val.id.toString(),
                label: val.product_name,
              })
            )}
          />
        </div>
      </div>
      <div className="mt-2">
        <TaxtInput<CreateFirstStockForm>
          title={`Quantity ${
            commoditymaster != null && commoditymaster.product_type == "FUEL"
              ? "in Litre"
              : ""
          }`}
          required={true}
          name="quantity"
          disable={isAccept}
          placeholder="Enter Quantity"
          onlynumber={true}
        />
      </div>
      {commoditymaster != null && commoditymaster.product_type != "FUEL" && (
        <div className="flex mt-2 gap-2 items-center">
          <div className="p-1 rounded grow text-center bg-gray-100">
            {commoditymaster.crate_size}{" "}
            {/* {commoditymaster.product_type == "FUEL" ? "Litre" : "Pcs"}/Crate */}
            Pcs/Crate
          </div>
          <Radio.Group
            size="small"
            onChange={onChange}
            value={quantityCount}
            optionType="button"
          >
            <Radio.Button className="w-20 text-center" value="crate">
              Crate
            </Radio.Button>
            <Radio.Button className="w-20 text-center" value="pcs">
              {/* {commoditymaster.product_type == "FUEL" ? "Litre" : "Pcs"} */}
              Pcs
            </Radio.Button>
          </Radio.Group>
        </div>
      )}

      {props.stock.filter((val) => val.id == 1154).length <= 0 && (
        <div className="flex gap-2 mt-2">
          <Checkbox
            value={isAccept}
            onChange={async (value: CheckboxChangeEvent) => {
              setIsAccept(value.target.checked);

              if (value.target.checked) {
                const nil_commodity = await GetNilCommodity();
                if (nil_commodity.status && nil_commodity.data) {
                  reset({
                    description_of_goods: nil_commodity.data.product_name,
                    quantity: "0",
                  });
                  props.setStock([
                    {
                      id: null,
                      item: nil_commodity.data,
                      quantity: 0,
                    },
                  ]);
                }
              }
            }}
          />
          <p>NIL Stock</p>
        </div>
      )}

      <div className="mt-2 mb-2">
        <button
          type="button"
          onClick={() => setIsProductModalOpen(true)}
          className="text-blue-600 hover:text-blue-800 text-sm underline cursor-pointer bg-transparent border-none"
        >
          Could not find your product? Click here to request
        </button>
      </div>

      <div className="flex gap-2">
        <button
          type="reset"
          onClick={(e) => {
            e.preventDefault();
            props.setAddBox(false);
          }}
          className="py-1 rounded-md bg-rose-500 px-4 text-sm text-white mt-2 cursor-pointer"
        >
          Close
        </button>
        <input
          type="reset"
          onClick={(e) => {
            e.preventDefault();
            reset({
              description_of_goods: undefined,
              quantity: "",
            });
          }}
          value={"Reset"}
          className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white mt-2 cursor-pointer"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          onClick={() => setSubmitType("submit")}
          className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white mt-2 cursor-pointer"
        >
          {isSubmitting ? "Loading...." : "Submit"}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          onClick={() => setSubmitType("addNew")}
          className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white mt-2 cursor-pointer"
        >
          {isSubmitting ? "Loading...." : "Add More"}
        </button>
      </div>

      {/* Product Request Modal */}
      <Modal
        title="Request unlisted Product"
        open={isProductModalOpen}
        onCancel={() => {
          setIsProductModalOpen(false);
          productForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={productForm}
          layout="vertical"
          onFinish={handleProductRequest}
        >
          <Form.Item
            label="Product Name"
            name="product_name"
            rules={[{ required: true, message: "Please enter product name" }]}
          >
            <Input placeholder="Enter product name" />
          </Form.Item>

          <Form.Item
            label="Company Name"
            name="company_name"
            rules={[{ required: true, message: "Please enter company name" }]}
          >
            <Input placeholder="Enter company name" />
          </Form.Item>

          <Form.Item
            label="Pack Type"
            name="pack_type"
            rules={[{ required: true, message: "Please select pack type" }]}
          >
            <Select placeholder="Select pack type">
              <Select.Option value="BOTTLE">Bottle</Select.Option>
              <Select.Option value="CAN">Can</Select.Option>
              <Select.Option value="PET">PET</Select.Option>
              <Select.Option value="TETRAPACK">Tetrapack</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Crate Size"
            name="crate_size"
            rules={[{ required: true, message: "Please enter crate size" }]}
          >
            <Input placeholder="Enter crate size (e.g., 12, 24)" />
          </Form.Item>

          <Form.Item>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsProductModalOpen(false);
                  productForm.resetFields();
                }}
                className="py-1 rounded-md bg-gray-500 px-4 text-sm text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white cursor-pointer"
              >
                Submit Request
              </button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </form>
  );
};
