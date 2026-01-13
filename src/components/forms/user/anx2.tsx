/* eslint-disable react-hooks/exhaustive-deps */
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
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MultiSelect } from "../inputfields/multiselect";
import { OptionValue } from "@/models/main";
import { DateSelect } from "../inputfields/dateselect";
import { toast } from "react-toastify";
import { annexure2 } from "@prisma/client";
import { ApiResponseType } from "@/models/response";
import { Anx2Form, Anx2Schema } from "@/schema/anx2";
import { Button, Checkbox, Popover } from "antd";
import { RabioInput } from "../inputfields/radioinput";
import GetAnx2ById from "@/action/anx2/getanxbyid";
import GetAnx2 from "@/action/anx2/getanx2";
import Anx2Create from "@/action/anx2/addanx2";
import DeleteAnx2 from "@/action/anx2/deleteanx2";
import { encryptURLData, onFormError } from "@/utils/methods";

type Anx2ProviderProps = {
  dvatid: number;
  userid: number;
};
export const Anx2Provider = (props: Anx2ProviderProps) => {
  const methods = useForm<Anx2Form>({
    resolver: valibotResolver(Anx2Schema),
  });

  return (
    <FormProvider {...methods}>
      <Anx1 dvatid={props.dvatid} userid={props.userid} />
    </FormProvider>
  );
};

const Anx1 = (props: Anx2ProviderProps) => {
  const router = useRouter();

  const typeOfPerson: OptionValue[] = [
    { value: "BRANCH_OFFICE", label: "Branch Office" },
    { value: "FACTORY", label: "FACTORY" },
    { value: "GODOWN", label: "GODOWN" },
    { value: "SHOP", label: "SHOP" },
  ];

  const {
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useFormContext<Anx2Form>();

  const [anx1id, setAnxid] = useState<number>(0);

  const onSubmit = async (data: Anx2Form) => {
    const userrespone: ApiResponseType<annexure2 | null> = await Anx2Create({
      dvatId: props.dvatid,
      createdById: props.userid,
      typeOfPerson: data.typeOfPerson,
      name: data.name,
      branchName: data.branchName,
      contact: data.contact,
      buildingName: data.buildingName,
      areaName: data.areaName,
      village: data.village,
      pinCode: data.pinCode,
      dateOfExtablishment: new Date(data.dateOfExtablishment),
      locationOfBusinessPlace: data.locationOfBusinessPlace,
      underStateAct: data.underStateAct,
      underCstAct: data.underCstAct,
    });

    if (userrespone.status) {
      toast.success("Annexure II added successfully");
      reset({});
      await init();
    } else {
      toast.error(userrespone.message);
    }

    reset({});
  };

  const init = async () => {
    const getanx1resposne = await GetAnx2({ dvatid: props.dvatid });

    if (getanx1resposne.status) {
      setAnnexuredata(getanx1resposne.data!);
    } else {
      setAnnexuredata([]);
    }
  };

  const [Annexuredata, setAnnexuredata] = useState<annexure2[]>([]);

  useEffect(() => {
    const init = async () => {
      const getanx2resposne = await GetAnx2({ dvatid: props.dvatid });
      if (getanx2resposne.status && getanx2resposne.data) {
        setAnnexuredata(getanx2resposne.data);
        edit(getanx2resposne.data[0].id);
      }
    };
    init();
  }, [props.dvatid]);

  const edit = async (id: number) => {
    setAnxid(id);
    const data = await GetAnx2ById({ id: id });

    if (data.status && data.data) {
      reset({
        name: data.data.name!,
        typeOfPerson: data.data.typeOfPerson,
        branchName: data.data.branchName!,
        contact: data.data.contact!,
        locationOfBusinessPlace: data.data.locationOfBusinessPlace!,
        buildingName: data.data.branchName!,
        village: data.data.village!,
        areaName: data.data.areaName!,
        pinCode: data.data.pinCode!,
        dateOfExtablishment:
          data.data.dateOfExtablishment!.toLocaleDateString(),
        underCstAct: data.data.underCstAct!,
        underStateAct: data.data.underStateAct!,
      });
    }
  };

  const cancelUpdate = () => {
    setAnxid(0);
    reset({});
  };

  const [deleteOpenId, setDeleteOpenId] = useState<number | null>(null);

  const deleteanx1 = async (id: number) => {
    setDeleteOpenId(null);
    setAnxid(0);

    const resposne = await DeleteAnx2({
      id: id,
    });

    await init();
    if (resposne.data && resposne.status) {
      toast.success("Entry deleted");
    } else {
      toast.error("Something went wrong unable to delete entry.");
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit, onFormError)}>
        <div className="rounded-sm p-4 border border-black mt-6 relative">
          <span className="-translate-y-7 bg-white px-1 -translate-x-2 inline-block absolute text-sm">
            Particulars Of Person Having Interest In the Business
          </span>

          <div className="flex sm:gap-4 mt-1 flex-col sm:flex-row">
            <div className="flex-1">
              <TaxtInput<Anx2Form>
                placeholder="Enter Father's Name"
                name="name"
                required={true}
                title="Name of the Applicant"
              />
            </div>
            <div className="flex-1">
              <MultiSelect<Anx2Form>
                placeholder="Select Type"
                name="typeOfPerson"
                required={true}
                title="Type"
                options={typeOfPerson}
              />
            </div>
          </div>
          <div className="flex sm:gap-4 mt-1 flex-col sm:flex-row">
            <div className="flex-1">
              <TaxtInput<Anx2Form>
                placeholder="Branch Name"
                name="branchName"
                required={true}
                title="Branch Name"
              />
            </div>
            <div className="flex-1">
              <TaxtInput<Anx2Form>
                placeholder="Contact Number"
                name="contact"
                required={true}
                title="Contact Number"
                onlynumber={true}
                maxlength={10}
              />
            </div>
          </div>
        </div>
        <div className="rounded-sm p-4 border border-black mt-6 relative">
          <span className="-translate-y-7 bg-white px-1 -translate-x-2 inline-block absolute text-sm">
            Address
          </span>
          <div className="flex sm:gap-4 mt-1 flex-col sm:flex-row">
            <div className="flex-1">
              <TaxtInput<Anx2Form>
                placeholder="Building Name/ Number"
                name="buildingName"
                required={true}
                title="Building Name/ Number"
              />
            </div>
            <div className="flex-1">
              <TaxtInput<Anx2Form>
                placeholder="Area/ Road/ Locality/ Market"
                name="areaName"
                required={true}
                title="Area/ Road/ Locality/ Market"
              />
            </div>
          </div>
          <div className="flex sm:gap-4 mt-1 flex-col sm:flex-row">
            <div className="flex-1">
              <TaxtInput<Anx2Form>
                placeholder="Village/ Town"
                name="village"
                required={true}
                title="Village/ Town"
              />
            </div>
            <div className="flex-1">
              <TaxtInput<Anx2Form>
                placeholder="Pincode"
                name="pinCode"
                required={true}
                title="Pincode"
                onlynumber={true}
                maxlength={6}
              />
            </div>
          </div>
          <div className="flex sm:gap-4 mt-1 flex-col sm:flex-row">
            <div className="flex-1">
              <DateSelect<Anx2Form>
                placeholder="Date of Establishment"
                name="dateOfExtablishment"
                required={true}
                format={"DD/MM/YYYY"}
                title="Date of Establishment"
              />
            </div>
            <div className="flex-1">
              <RabioInput<Anx2Form>
                name="locationOfBusinessPlace"
                required={true}
                title="Location of Business Place"
                options={[
                  {
                    label: "Within State",
                    value: "WITHIN_STATE",
                  },
                  {
                    label: "Outside State",
                    value: "OUTSIDE_STATE",
                  },
                ]}
              />
            </div>
          </div>
        </div>

        <div className="rounded-sm p-4 border border-black mt-6 relative">
          <span className="-translate-y-7 bg-white px-1 -translate-x-2 inline-block absolute text-sm">
            Registration No. of Branch
          </span>
          <div className="flex sm:gap-4 mt-1 flex-col sm:flex-row">
            <div className="flex-1">
              <TaxtInput<Anx2Form>
                placeholder="Under State Act"
                name="underStateAct"
                required={true}
                title="Under State Act"
              />
            </div>
            <div className="flex-1">
              <TaxtInput<Anx2Form>
                placeholder="Under CST Act, 1958"
                name="underCstAct"
                required={true}
                title="Under CST Act, 1958"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="grow"></div>

          {anx1id == 0 || anx1id == undefined || anx1id == null ? (
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white mt-2 cursor-pointer"
            >
              {isSubmitting ? "Loading...." : "Add"}
            </button>
          ) : (
            <>
              <Button className="w-20 bg-blue-500 hover:bg-blue-600 text-white py-1 text-sm mt-2 h-8 ">
                Update
              </Button>
              <Button
                onClick={cancelUpdate}
                className="w-20  bg-blue-500 hover:bg-blue-600 text-white py-1 text-sm mt-2 h-8 "
              >
                Cancel
              </Button>
            </>
          )}

          <input
            type="reset"
            onClick={() => {
              reset({});
            }}
            value={"Reset"}
            className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white mt-2 cursor-pointer"
          />
        </div>
      </form>

      {Annexuredata.length > 0 && (
        <div className="bg-white mx-auto mt-6">
          <Table>
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead className="w-[100px] p-1 h-8 border">Type</TableHead>
                <TableHead className="w-[200px] p-1 h-8 border">Name</TableHead>
                <TableHead className="w-[60px] p-1 h-8 border">
                  Contact
                </TableHead>
                <TableHead className="w-[160px] p-1 h-8 border">
                  Branch Name
                </TableHead>
                <TableHead className="w-[80px] p-1 h-8 border">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Annexuredata.map((data) => {
                return (
                  <TableRow key={data.id}>
                    <TableCell className="font-medium p-2  border">
                      {data.typeOfPerson}
                    </TableCell>
                    <TableCell className="p-2  border">{data.name}</TableCell>
                    <TableCell className="p-2 border">{data.contact}</TableCell>
                    <TableCell className="p-2 border">
                      {data.branchName}
                    </TableCell>

                    <TableCell className="flex gap-2 p-2 border">
                      <Button onClick={() => edit(data.id)} type="primary">
                        Edit
                      </Button>

                      <Popover
                        content={
                          <>
                            <p>
                              You are sure you want to delete this Annexure I
                              entry.
                            </p>
                            <div className="flex gap-2">
                              <button
                                className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white mt-2 cursor-pointer"
                                onClick={() => deleteanx1(data.id)}
                              >
                                Yes
                              </button>

                              <button
                                className="py-1 rounded-md bg-rose-500 px-4 text-sm text-white mt-2 cursor-pointer"
                                onClick={() => setDeleteOpenId(null)}
                              >
                                No
                              </button>
                            </div>
                          </>
                        }
                        title="Delete"
                        trigger="click"
                        open={deleteOpenId === data.id} // Only open for the selected row
                        onOpenChange={(isOpen) =>
                          setDeleteOpenId(isOpen ? data.id : null)
                        }
                      >
                        <Button>Delete</Button>
                      </Popover>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      <div className="flex gap-2">
        <div className="grow"></div>

        <button
          onClick={(e) => {
            e.preventDefault();
            router.push(`/dashboard/new-registration/${encryptURLData(props.dvatid.toString())}/anx1`);
          }}
          className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white mt-2 cursor-pointer"
        >
          Previous
        </button>

        <button
          onClick={(e) => {
            e.preventDefault();
            if (Annexuredata.length === 0)
              return toast.error("Please add Annexure I");
            router.push(`/dashboard/new-registration/${encryptURLData(props.dvatid.toString())}/anx3`);
          }}
          className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white mt-2 cursor-pointer"
        >
          Next
        </button>
      </div>
    </>
  );
};
