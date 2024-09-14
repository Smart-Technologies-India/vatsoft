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
import { CheckboxChangeEvent } from "antd/es/checkbox";
import dayjs from "dayjs";
import { RabioInput } from "../inputfields/radioinput";
import GetAnx2ById from "@/action/anx2/getanxbyid";
import GetAnx2 from "@/action/anx2/getanx2";
import Anx2Create from "@/action/anx2/addanx2";
import DeleteAnx2 from "@/action/anx2/deleteanx2";

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

  const titleParticulasOfperson: OptionValue[] = [
    { value: "PROPRIETOR", label: "PROPRIETOR" },
    { value: "PARTNER", label: "PARTNER" },
    { value: "DIRECTOR", label: "DIRECTOR" },
    { value: "CHAIRMAN", label: "CHAIRMAN" },
    { value: "MANAGER", label: "MANAGER" },
  ];

  const gender: OptionValue[] = [
    { value: "MALE", label: "MALE" },
    { value: "FEAMLE", label: "FEAMLE" },
  ];

  const {
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useFormContext<Anx2Form>();

  const [anx1id, setAnxid] = useState<number>(0);

  const onSubmit = async (data: Anx2Form) => {
    // const userrespone: ApiResponseType<annexure2 | null> = await Anx2Create({
    //   dvatId: props.dvatid,
    //   createdById: props.userid,
    //   titleParticulasOfperson: data.titleParticulasOfperson,
    //   nameOfPerson: data.nameOfPerson,
    //   dateOfBirth: new Date(data.dateOfBirth),
    //   gender: data.gender,
    //   fatherName: data.fatherName,
    //   panNumber: data.panNumber,
    //   aadharNumber: data.aadharNumber,
    //   designation: data.designation,
    //   eductionQualification: data.eductionQualification,
    //   rbuildingName: data.rbuildingName,
    //   rareaName: data.rareaName,
    //   rvillageName: data.rvillageName,
    //   rpincode: data.rpincode,
    //   pbuildingName: data.pbuildingName,
    //   pareaName: data.pareaName,
    //   pvillageName: data.pvillageName,
    //   ppincode: data.ppincode,
    //   contact: data.contact,
    //   email: data.email,
    // });
    // if (userrespone.status) {
    //   toast.success("Annexure I added successfully");
    //   reset({});
    //   setIsSameAddress(false);
    //   await init();
    // } else {
    //   toast.error(userrespone.message);
    // }

    reset({});
  };

  const onError = (error: FieldErrors<Anx2Form>) => {
    console.log(error);
  };

  const init = async () => {
    const getanx1resposne = await GetAnx2({ dvatid: props.dvatid });

    if (getanx1resposne.status) {
      setAnnexuredata(getanx1resposne.data!);
    } else {
      setAnnexuredata([]);
    }
  };

  useEffect(() => {
    const init = async () => {
      const getanx1resposne = await GetAnx2({ dvatid: props.dvatid });

      if (getanx1resposne.status) {
        setAnnexuredata(getanx1resposne.data!);
      }
    };
    init();
  }, [props.dvatid]);

  const [Annexuredata, setAnnexuredata] = useState<annexure2[]>([]);

  const edit = async (id: number) => {
    setAnxid(id);
    const data = await GetAnx2ById({ id: id });

    if (data.status && data.data) {
      // reset({
      //   titleParticulasOfperson: data.data.titleParticulasOfperson,
      //   nameOfPerson: data.data.nameOfPerson!,
      //   dateOfBirth: data.data.dateOfBirth!.toLocaleString(),
      //   gender: data.data.gender,
      //   fatherName: data.data.fatherName!,
      //   panNumber: data.data.panNumber!,
      //   aadharNumber: data.data.aadharNumber!,
      //   designation: data.data.designation!,
      //   eductionQualification: data.data.eductionQualification!,
      //   rbuildingName: data.data.rbuildingName!,
      //   rareaName: data.data.rareaName!,
      //   rpincode: data.data.rpincode!,
      //   rvillageName: data.data.rvillageName!,
      //   pbuildingName: data.data.pbuildingName!,
      //   pvillageName: data.data.pvillageName!,
      //   ppincode: data.data.ppincode!,
      //   pareaName: data.data.pareaName!,
      //   contact: data.data.contact!,
      //   email: data.data.email!,
      // });
    }
  };

  const cancelUpdate = () => {
    setAnxid(0);
    reset({});
  };

  const [deleteopen, setDeleteOpen] = useState(false);

  const deleteanx1 = async (id: number) => {
    setDeleteOpen(false);
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
      <form onSubmit={handleSubmit(onSubmit, onError)}>
        <div className="rounded-sm p-4 border border-black mt-6 relative">
          <span className="-translate-y-7 bg-white px-1 -translate-x-2 inline-block absolute text-sm">
            Particulars Of Person Having Interest In the Business
          </span>
          <div className="flex gap-4 mt-2">
            <div className="flex-1">
              <MultiSelect<Anx2Form>
                placeholder="Title Particulars of person"
                name="contact"
                required={true}
                title="Title Particulars of person"
                options={titleParticulasOfperson}
              />
            </div>
            <div className="flex-1">
              <TaxtInput<Anx2Form>
                placeholder="Full Name of Person"
                name="contact"
                required={true}
                title="Full Name of Person"
              />
            </div>
          </div>

          <div className="flex gap-4 mt-2">
            <div className="flex-1">
              <DateSelect<Anx2Form>
                placeholder="Date Of Birth"
                name="contact"
                required={true}
                title="Date Of Birth"
                maxdate={dayjs(
                  new Date(
                    new Date().setFullYear(new Date().getFullYear() - 15)
                  )
                )}
              />
            </div>
            <div className="flex-1">
              <RabioInput<Anx2Form>
                name="contact"
                required={true}
                title="Gender"
                options={gender}
              />
            </div>
          </div>

          <div className="flex gap-4 mt-2">
            <div className="flex-1">
              <TaxtInput<Anx2Form>
                placeholder="Enter Father's Name"
                name="contact"
                required={true}
                title="Father's Name"
              />
            </div>
            <div className="flex-1">
              <TaxtInput<Anx2Form>
                placeholder="PAN"
                name="contact"
                required={true}
                title="PAN"
              />
            </div>
          </div>
          <div className="flex gap-4 mt-2">
            <div className="flex-1">
              <TaxtInput<Anx2Form>
                placeholder="Enter Aadhar No."
                name="contact"
                required={true}
                title="Aadhar No."
                onlynumber={true}
              />
            </div>
            <div className="flex-1">
              <TaxtInput<Anx2Form>
                placeholder="Enter Designation"
                name="contact"
                required={true}
                title="Designation"
              />
            </div>
          </div>
          <div className="mt-2">
            <TaxtInput<Anx2Form>
              placeholder="Education Qualification"
              name="contact"
              required={true}
              title="Education Qualification"
            />
          </div>
        </div>
        <div className="rounded-sm p-4 border border-black mt-6 relative">
          <span className="-translate-y-7 bg-white px-1 -translate-x-2 inline-block absolute text-sm">
            Residential Address
          </span>
          <div className="flex gap-4 mt-2">
            <div className="flex-1">
              <TaxtInput<Anx2Form>
                placeholder="Building Name/ Number"
                name="contact"
                required={true}
                title="Building Name/ Number"
              />
            </div>
            <div className="flex-1">
              <TaxtInput<Anx2Form>
                placeholder="Area/ Road/ Locality/ Market"
                name="contact"
                required={true}
                title="Area/ Road/ Locality/ Market"
              />
            </div>
          </div>
          <div className="flex gap-4 mt-2">
            <div className="flex-1">
              <TaxtInput<Anx2Form>
                placeholder="Village/ Town"
                name="contact"
                required={true}
                title="Village/ Town"
              />
            </div>
            <div className="flex-1">
              <TaxtInput<Anx2Form>
                placeholder="Pincode"
                name="contact"
                required={true}
                title="Pincode"
                onlynumber={true}
                maxlength={6}
              />
            </div>
          </div>
        </div>

        <div className="rounded-sm p-4 border border-black mt-6 relative">
          <span className="-translate-y-7 bg-white px-1 -translate-x-2 inline-block absolute text-sm">
            Contact Details
          </span>

          <div className="flex gap-4 mt-2">
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
            <div className="flex-1">
              <TaxtInput<Anx2Form>
                placeholder="Email Id"
                name="areaName"
                required={true}
                title="Email Id"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
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

          <div className="grow"></div>
          <input
            type="reset"
            onClick={() => {
              reset({});
            }}
            value={"Reset"}
            className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white mt-2 cursor-pointer"
          />

          <button
            onClick={(e) => {
              e.preventDefault();
              router.push(`/dashboard/new-registration/${props.dvatid}/dvat2`);
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
              router.push(`/dashboard/new-registration/${props.dvatid}/anx2`);
            }}
            className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white mt-2 cursor-pointer"
          >
            Next
          </button>
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
                                onClick={() => setDeleteOpen(false)}
                              >
                                No
                              </button>
                            </div>
                          </>
                        }
                        title="Delete"
                        trigger="click"
                        open={deleteopen}
                        onOpenChange={(e: boolean) => setDeleteOpen(e)}
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
    </>
  );
};
