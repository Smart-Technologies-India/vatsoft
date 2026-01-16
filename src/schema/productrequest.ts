import * as v from "valibot";

export const ProductRequestSchema = v.object({
  product_name: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, "Product name is required"),
    v.maxLength(500, "Product name must be less than 500 characters")
  ),
  company_name: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, "Company name is required"),
    v.maxLength(500, "Company name must be less than 500 characters")
  ),
  pack_type: v.union(
    [
      v.literal("BOTTLE"),
      v.literal("CAN"),
      v.literal("PET"),
      v.literal("TETRAPACK"),
    ],
    "Please select a valid pack type"
  ),
  crate_size: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, "Crate size is required"),
    v.maxLength(100, "Crate size must be less than 100 characters")
  ),
});

export type ProductRequestForm = v.InferInput<typeof ProductRequestSchema>;
