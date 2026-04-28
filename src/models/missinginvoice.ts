import { missing_invoice_complaint } from "@prisma/client";

export type MissingInvoiceComplaintWithCreator =
  missing_invoice_complaint & {
    createdBy: {
      id: number;
      firstName: string | null;
      lastName: string | null;
      mobileOne: string;
    };
  };