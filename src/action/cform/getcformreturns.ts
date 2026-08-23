"use server";
import prisma from "../../../prisma/database";
import { revalidatePath } from "next/cache";

export async function GetCFormReturnsEntries(cformId: number) {
  try {
    const returns = await prisma.cform_returns.findMany({
      where: {
        cformId: cformId,
      },
      include: {
        returns_entry: true,
      },
    });

    return {
      status: true,
      data: returns,
      message: "Returns entries fetched successfully",
    };
  } catch (error: any) {
    console.error("Error fetching cform returns:", error);
    return {
      status: false,
      data: null,
      message: error.message || "Failed to fetch returns entries",
    };
  }
}

export async function UpdateReturnEntryDescription(
  cformReturnsId: number,
  description: string,
) {
  try {
    const updated = await prisma.cform_returns.update({
      where: {
        id: cformReturnsId,
      },
      data: {
        description_of_goods: description,
      },
    });

    revalidatePath("/dashboard/returns/cform-status");

    return {
      status: true,
      data: updated,
      message: "Description updated successfully",
    };
  } catch (error: any) {
    console.error("Error updating returns entry:", error);
    return {
      status: false,
      data: null,
      message: error.message || "Failed to update description",
    };
  }
}
