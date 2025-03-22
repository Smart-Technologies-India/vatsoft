import {
  Gender,
  LocationOfBusinessPlace,
  TitleParticulasOfperson,
  TypeOfPerson,
} from "@prisma/client";
import {
  InferInput,
  enum_,
  maxLength,
  minLength,
  object,
  string,
  pipe,
} from "valibot";

const Anx2Schema = object({
  typeOfPerson: enum_(TypeOfPerson, "Type Of Person is required."),
  name: pipe(string(), minLength(1, "Name is required.")),
  branchName: pipe(string(), minLength(1, "Branch Name is required.")),
  contact: pipe(
    string(),
    minLength(1, "Contact is required."),
    maxLength(10, "Contact number should be 10 digits.")
  ),
  buildingName: pipe(string(), minLength(1, "Building Name is required.")),
  areaName: pipe(string(), minLength(1, "Area/Locality Name is required.")),
  village: pipe(string(), minLength(1, "Village is required.")),
  pinCode: pipe(string(), minLength(1, "Pincode is required.")),
  dateOfExtablishment: pipe(
    string(),
    minLength(1, "Date of Extablishment is required.")
  ),
  locationOfBusinessPlace: enum_(
    LocationOfBusinessPlace,
    "Location Of Business Place is required."
  ),
  underStateAct: pipe(string(), minLength(1, "Under State Act is required.")),
  underCstAct: pipe(string(), minLength(1, "Under Cst Act is required.")),
});

type Anx2Form = InferInput<typeof Anx2Schema>;
export { Anx2Schema, type Anx2Form };
