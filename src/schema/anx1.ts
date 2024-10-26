import { validateAadharCard, validatePanCard } from "@/utils/methods";
import { Gender, TitleParticulasOfperson } from "@prisma/client";
import {
  email,
  enum_,
  InferInput,
  maxLength,
  minLength,
  object,
  string,
  pipe,
  check,
} from "valibot";

const Anx1Schema = object({
  titleParticulasOfperson: enum_(
    TitleParticulasOfperson,
    "Title Particulas Of Person is required."
  ),
  nameOfPerson: pipe(
    string("Name of Person is required."),
    minLength(1, "Name of Person is required.")
  ),
  dateOfBirth: pipe(
    string("Date of Birth is required."),
    minLength(1, "Date of Birth is required.")
  ),
  gender: enum_(Gender, "Select your gender."),
  fatherName: pipe(
    string("Father Name is required."),
    minLength(1, "Father Name is required.")
  ),
  panNumber: pipe(
    string("Pan Number is required."),
    minLength(1, "Pan Number is required."),
    check(validatePanCard, "Enter valid pan card number")
  ),
  aadharNumber: pipe(
    string("Aadhar Number is required."),
    minLength(1, "Aadhar Number is required."),
    check(validateAadharCard, "Enter valid aadhar number")
  ),
  designation: pipe(
    string("Designation is required."),
    minLength(1, "Designation is required.")
  ),
  eductionQualification: pipe(
    string("Eduction Qualification is required."),
    minLength(1, "Eduction Qualification is required.")
  ),
  rbuildingName: pipe(
    string("Building Name is required."),
    minLength(1, "Building Name is required.")
  ),
  rareaName: pipe(
    string("Area/Locality Name is required."),
    minLength(1, "Area/Locality Name is required.")
  ),
  rvillageName: pipe(
    string("Village Name is required."),
    minLength(1, "Village Name is required.")
  ),
  rpincode: pipe(
    string("Pincode is required."),
    minLength(1, "Pincode is required.")
  ),
  pbuildingName: pipe(
    string("Building Name is required."),
    minLength(1, "Building Name is required.")
  ),
  pareaName: pipe(
    string("Area/Locality Name is required."),
    minLength(1, "Area/Locality Name is required.")
  ),
  pvillageName: pipe(
    string("Village Name is required."),
    minLength(1, "Village Name is required.")
  ),
  ppincode: pipe(
    string("Pincode is required."),
    minLength(1, "Pincode is required.")
  ),
  contact: pipe(
    string("Contact is required."),
    minLength(1, "Contact is required."),
    maxLength(10, "Contact number should be 10 digits.")
  ),
  email: pipe(
    string("Email is required."),
    minLength(1, "Email is required."),
    email("Invalid email.")
  ),
});

type Anx1Form = InferInput<typeof Anx1Schema>;
export { Anx1Schema, type Anx1Form };
