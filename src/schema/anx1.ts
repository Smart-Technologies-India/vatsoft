import { DepositType, Gender, TitleParticulasOfperson } from "@prisma/client";
import {
  Input,
  email,
  enum_,
  maxLength,
  minLength,
  object,
  string,
} from "valibot";

// titleParticulasOfperson TitleParticulasOfperson @default(PROPRIETOR)
// nameOfPerson            String?
// dateOfBirth             DateTime?
// gender                  Gender                  @default(MALE)
// fatherName              String?
// panNumber               String?
// aadharNumber            String?
// designation             String?
// eductionQualification   String?
// rbuildingName           String?
// rareaName               String?
// rvillageName            String?
// rpincode                String?
// pbuildingName           String?
// pareaName               String?
// pvillageName            String?
// ppincode                String?
// contact                 String?
// email                   String?

const Anx1Schema = object({
  titleParticulasOfperson: enum_(
    TitleParticulasOfperson,
    "Title Particulas Of Person is required."
  ),
  nameOfPerson: string([minLength(1, "Name of Person is required.")]),
  dateOfBirth: string([minLength(1, "Date of Birth is required.")]),
  gender: enum_(Gender, "Select your gender."),
  fatherName: string([minLength(1, "Father Name is required.")]),
  panNumber: string([minLength(1, "Pan Number is required.")]),
  aadharNumber: string([minLength(1, "Aadhar Number is required.")]),
  designation: string([minLength(1, "Designation is required.")]),
  eductionQualification: string([
    minLength(1, "Eduction Qualification is required."),
  ]),
  rbuildingName: string([minLength(1, "Building Name is required.")]),
  rareaName: string([minLength(1, "Area Name is required.")]),
  rvillageName: string([minLength(1, "Village Name is required.")]),
  rpincode: string([minLength(1, "Pincode is required.")]),
  pbuildingName: string([minLength(1, "Building Name is required.")]),
  pareaName: string([minLength(1, "Area Name is required.")]),
  pvillageName: string([minLength(1, "Village Name is required.")]),
  ppincode: string([minLength(1, "Pincode is required.")]),
  contact: string([
    minLength(1, "Contact is required."),
    maxLength(10, "Contact number should be 10 digits."),
  ]),
  email: string([minLength(1, "Email is required."), email("Invalid email.")]),
});

type Anx1Form = Input<typeof Anx1Schema>;
export { Anx1Schema, type Anx1Form };
