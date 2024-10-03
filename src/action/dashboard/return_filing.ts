"use server";
import prisma from "../../../prisma/database";

import utc from "dayjs/plugin/utc";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import dayjs, { Dayjs } from "dayjs";

const ReturnFiling = async (): Promise<ApiResponseType<boolean | null>> => {
  const functionname: string = ReturnFiling.name;
  try {
    const currentdate = dayjs();
    const currentMonth = currentdate.format("MMMM"); // Get the current month name
    const currentYear = currentdate.year().toString();
    const nextMonthDate = currentdate.add(1, "month").date(28);

    const dvat_response = await prisma.dvat04.findMany({
      where: {
        deletedAt: null,
        deletedById: null,
        status: "APPROVED",
        vatLiableDate: {
          lt: currentdate.toDate(),
        },
      },
    });

    if (!dvat_response || dvat_response.length === 0) {
      return createResponse({
        message: "There is nothing to create.",
        functionname,
      });
    }

    // Use Promise.all to handle multiple upserts concurrently
    await Promise.all(
      dvat_response.map(async (dvat) => {
        // Determine the correct month based on compositionScheme
        const duedate: Date = dvat.compositionScheme
          ? GetCompDueDate(currentYear, currentMonth).toDate()
          : nextMonthDate.toDate(); // Convert Day.js object to Date object

        // Perform upsert operation
        await prisma.return_filing.upsert({
          where: {
            dvatid_year_month: {
              // Composite unique index (assuming it exists in your schema)
              dvatid: dvat.id,
              year: currentYear,
              month: currentMonth,
            },
          },
          create: {
            createdById: 1,
            filing_status: false,
            dvatid: dvat.id,
            year: currentYear,
            month: currentMonth,
            status: "ACTIVE",
            due_date: duedate.toISOString(),
          },
          update: {}, // Empty update: do nothing if the record already exists
        });
      })
    );

    return createResponse({
      message: "Return filings created successfully.",
      functionname,
      data: true,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default ReturnFiling;

const GetCompDueDate = (year: string, month: string): Dayjs => {
  let nextMonth: number;

  // Determine the next month based on the input month
  if (["April", "May", "June"].includes(month)) {
    nextMonth = 6; // July
  } else if (["July", "August", "September"].includes(month)) {
    nextMonth = 9; // October
  } else if (["October", "November", "December"].includes(month)) {
    nextMonth = 0; // January of next year
  } else if (["January", "February", "March"].includes(month)) {
    nextMonth = 3; // April
  } else {
    nextMonth = new Date(parseInt(year), 0).getMonth(); // Default case (though this shouldn't occur)
  }

  // Create the due date using Day.js and convert it to a Date object
  return dayjs(
    `${parseInt(year) + (nextMonth === 0 ? 1 : 0)}-${nextMonth + 1}-29`
  );
};
