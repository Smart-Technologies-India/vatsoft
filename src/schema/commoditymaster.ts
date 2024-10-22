import { Dvat04Commodity } from "@prisma/client";
import {
  enum_,
  InferInput,
  minLength,
  object,
  string,
  pipe,
  nullish,
} from "valibot";

const CommodityMasterSchema = object({
  product_name: pipe(string(), minLength(1, "Product Name is required.")),
  product_type: enum_(Dvat04Commodity, "Product Type is required."),
  mrp: pipe(string("MRP is required."), minLength(1, "MRP is required.")),
  sale_price: pipe(
    string("Sale Price is required."),
    minLength(1, "Sale Price is required.")
  ),
  oidc_price: pipe(
    string("OIDC Price Amount is required."),
    minLength(1, "OIDC Price Amount is required.")
  ),
  oidc_discount_percent: pipe(
    string("OIDC Discount Percent is required."),
    minLength(1, "OIDC Discount Percent is required.")
  ),
  taxable_at: pipe(
    string("Taxable At is required."),
    minLength(1, "Taxable At is required.")
  ),
  description: pipe(
    string("Description is required."),
    minLength(1, "Description is required.")
  ),
  remark: nullish(string()),
});

type CommodityMasterForm = InferInput<typeof CommodityMasterSchema>;
export { CommodityMasterSchema, type CommodityMasterForm };
