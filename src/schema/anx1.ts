import { DepositType, Gender, TitleParticulasOfperson } from "@prisma/client";
import { email, enum_, InferInput, maxLength, minLength, object, string, pipe } from "valibot"

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
  nameOfPerson: pipe(string(), minLength(1, "Name of Person is required.")),
  dateOfBirth: pipe(string(), minLength(1, "Date of Birth is required.")),
  gender: enum_(Gender, "Select your gender."),
  fatherName: pipe(string(), minLength(1, "Father Name is required.")),
  panNumber: pipe(string(), minLength(1, "Pan Number is required.")),
  aadharNumber: pipe(string(), minLength(1, "Aadhar Number is required.")),
  designation: pipe(string(), minLength(1, "Designation is required.")),
  eductionQualification: pipe(string(), minLength(1, "Eduction Qualification is required.") ,),
  rbuildingName: pipe(string(), minLength(1, "Building Name is required.")),
  rareaName: pipe(string(), minLength(1, "Area Name is required.")),
  rvillageName: pipe(string(), minLength(1, "Village Name is required.")),
  rpincode: pipe(string(), minLength(1, "Pincode is required.")),
  pbuildingName: pipe(string(), minLength(1, "Building Name is required.")),
  pareaName: pipe(string(), minLength(1, "Area Name is required.")),
  pvillageName: pipe(string(), minLength(1, "Village Name is required.")),
  ppincode: pipe(string(), minLength(1, "Pincode is required.")),
  contact: pipe(string(), minLength(1, "Contact is required.") , maxLength(10, "Contact number should be 10 digits.") ,),
  email: pipe(string(), minLength(1, "Email is required.") , email("Invalid email.")),
});

type Anx1Form = InferInput<typeof Anx1Schema>;
export { Anx1Schema, type Anx1Form };
