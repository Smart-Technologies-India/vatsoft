import {
  Gender,
  LocationOfBusinessPlace,
  TitleParticulasOfperson,
  TypeOfPerson,
} from "@prisma/client";
import {
  Input,
  email,
  enum_,
  maxLength,
  minLength,
  object,
  string,
} from "valibot";

const Anx2Schema = object({
  typeOfPerson: enum_(TypeOfPerson, "Type Of Person is required."),
  name: string([minLength(1, "Name is required.")]),
  branchName: string([minLength(1, "Branch Name is required.")]),
  contact: string([
    minLength(1, "Contact is required."),
    maxLength(10, "Contact number should be 10 digits."),
  ]),
  buildingName: string([minLength(1, "Building Name is required.")]),
  areaName: string([minLength(1, "Area Name is required.")]),
  village: string([minLength(1, "Village is required.")]),
  pinCode: string([minLength(1, "Pincode is required.")]),
  dateOfExtablishment: string([
    minLength(1, "Date of Extablishment is required."),
  ]),
  locationOfBusinessPlace: enum_(
    LocationOfBusinessPlace,
    "Location Of Business Place is required."
  ),
  underStateAct: string([minLength(1, "Under State Act is required.")]),
  underCstAct: string([minLength(1, "Under Cst Act is required.")]),
});

type Anx2Form = Input<typeof Anx2Schema>;
export { Anx2Schema, type Anx2Form };
