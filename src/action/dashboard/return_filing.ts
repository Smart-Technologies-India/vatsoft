"use server";
import prisma from "../../../prisma/database";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import { customAlphabet } from "nanoid";

dayjs.extend(utc);

const ReturnFiling = async (): Promise<ApiResponseType<boolean | null>> => {
  const functionname: string = ReturnFiling.name;
  try {
    const due_date_of_month = 28;

    const currentdate = dayjs();
    // const currentMonth = currentdate.format("MMMM"); // Get the current month name
    // const currentYear = currentdate.year().toString();
    // const nextMonthDate = currentdate.add(1, "month").date(due_date_of_month);

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
        const liableDate: Dayjs = dayjs(dvat.vatLiableDate ?? new Date());
        const startMonth = liableDate.startOf("month");
        const endMonth = currentdate.startOf("month");

        const months: Dayjs[] = [];
        let monthIterator = startMonth;

        while (
          monthIterator.isBefore(endMonth) ||
          monthIterator.isSame(endMonth)
        ) {
          months.push(monthIterator);
          monthIterator = monthIterator.add(1, "month");
        }

        // Loop over each month and check/create records
        await Promise.all(
          months.map(async (month) => {
            const year = month.year().toString();
            const monthName = month.format("MMMM");

            // Determine the due date based on the compositionScheme
            const dueDate = dvat.compositionScheme
              ? GetCompDueDate(year, monthName).toDate()
              : month.add(1, "month").date(due_date_of_month).toDate();

            // Check and perform upsert
            await prisma.return_filing.upsert({
              where: {
                dvatid_year_month: {
                  dvatid: dvat.id,
                  year,
                  month: monthName,
                },
              },
              create: {
                createdById: 1,
                filing_status: false,
                dvatid: dvat.id,
                year,
                month: monthName,
                status: "ACTIVE",
                due_date: dueDate.toISOString(),
              },
              update: {}, // Do nothing if record already exists
            });
          }),
        );
      }),
    );

    const returnfiling_response = await prisma.return_filing.findMany({
      where: {
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
        return_status: {
          in: ["DUE", "PENDINGFILING"],
        },
      },
    });

    const get28thDate = (): Date => {
      const today = new Date(); // Get the current date
      const year = today.getFullYear();
      const month = today.getMonth(); // 0-based month index
      return new Date(year, month, due_date_of_month); // Set the date to the 28th of the current month
    };

    if (returnfiling_response.length > 0) {
      const currentdate: Date = get28thDate();

      for (const filing of returnfiling_response) {
        const update_response = await prisma.return_filing.update({
          where: {
            id: filing.id,
          },
          data: {
            return_status: filing.filing_status
              ? filing.due_date! > filing.filing_date!
                ? "FILED"
                : "LATEFILED"
              : filing.due_date! < currentdate
                ? "PENDINGFILING"
                : "DUE",
          },
        });

        if (filing.filing_status === false && filing.due_date! < currentdate) {
          // Check if order_notice already exists for this filing period to avoid duplicates
          const { startDate, endDate } = MonthToStartEnd(filing.month, filing.year);
          
          const existingNotice = await prisma.order_notice.findFirst({
            where: {
              dvatid: filing.dvatid,
              tax_period_from: startDate,
              tax_period_to: endDate,
              form_type: "DVAT10",
              deletedAt: null,
              deletedById: null,
            },
          });

          // Only create a new notice if one doesn't already exist
          if (!existingNotice) {
            // 15 days after today date
            const due_date = new Date();
            due_date.setDate(due_date.getDate() + 15);
            const nanoid = customAlphabet(
              "1234567890abcdefghijklmnopqrstuvwyz",
              12,
            );
            const ref_no: string = nanoid();

            await prisma.order_notice.create({
              data: {
                dvatid: filing.dvatid,
                ref_no: ref_no,
                dvat24_reason: "NOTFURNISHED",
                notice_order_type: "NOTICE",
                status: "PENDING",
                tax_period_from: startDate,
                tax_period_to: endDate,
                due_date: due_date,
                form_type: "DVAT10",
                issuedId: 1,
                officerId: 1,
                createdById: 1,
                remark: "DVAT Return Not Furnished",
              },
            });
          }
        }
      }
    }

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
    `${parseInt(year) + (nextMonth === 0 ? 1 : 0)}-${nextMonth + 1}-29`,
  );
};

const MonthToStartEnd = (
  month: string,
  year: string
): {
  startDate: Date;
  endDate: Date;
} => {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const monthIndex = monthNames.indexOf(month);

  // Use dayjs to create dates in UTC to avoid timezone issues
  const startDate = dayjs.utc(`${year}-${String(monthIndex + 1).padStart(2, '0')}-01T00:00:00Z`).toDate();
  const endDate = dayjs.utc(`${year}-${String(monthIndex + 1).padStart(2, '0')}-01T00:00:00Z`).endOf('month').toDate();
  
  return { startDate, endDate };
};
