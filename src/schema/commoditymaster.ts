import { Dvat04Commodity } from "@prisma/client";
import {
  enum_,
  InferInput,
  minLength,
  object,
  string,
  pipe,
  nullish,
  number,
} from "valibot";

const CommodityMasterSchema = object({
  product_name: pipe(string(), minLength(1, "Product Name is required.")),
  market_type: pipe(
    string("Market Type is required."),
    minLength(1, "Market Type is required.")
  ),
  mrp: pipe(string("MRP is required."), minLength(1, "MRP is required.")),
  crate_size: pipe(
    string("Pcs/Crate is required."),
    minLength(1, "Pcs/Crate is required.")
  ),
  pack_type: pipe(
    string("Pack Type is required."),
    minLength(1, "Pack Type is required.")
  ),
  pack_size: pipe(
    string("Pack Size is required."),
    minLength(1, "Pack Size is required.")
  ),
});

type CommodityMasterForm = InferInput<typeof CommodityMasterSchema>;
export { CommodityMasterSchema, type CommodityMasterForm };
