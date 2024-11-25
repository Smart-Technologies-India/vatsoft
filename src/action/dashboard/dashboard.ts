"use server";

import prisma from "../../../prisma/database";
interface DashboardMonthPayload {
  userid: number;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";

interface ResponseDate {
  month: string;
  year: number;
  date: string;
  completed: boolean;
}

const DashboardMonth = async (
  payload: DashboardMonthPayload
): Promise<ApiResponseType<ResponseDate[] | null>> => {
  const functionname: string = DashboardMonth.name;
  try {
    return createResponse({
      message: "this is a message",
      functionname,
      data: await getLastSixMonths(payload.userid),
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default DashboardMonth;

const getLastSixMonths = async (userid: number): Promise<ResponseDate[]> => {
  const dvat = await prisma.dvat04.findFirst({
    where: {
      createdById: userid,
      status: "APPROVED",
      deletedAt: null,
      deletedById: null,
    },
  });
  if (!dvat) return [];

  const iscomp: boolean = dvat.compositionScheme ?? false;
  const liableDate: Date = dvat.vatLiableDate!;
  const response_data: ResponseDate[] = [];

  const currentDate = new Date();
  const startMonth = currentDate.getMonth(); // Current month
  const startYear = currentDate.getFullYear();

  for (let i = 5, j = 0; i >= 0; i--, j++) {
    const date = new Date(startYear, startMonth - i, 1);

    // Stop counting if the date is before liableDate
    if (date < liableDate) break;

    const year = date.getFullYear();

    let formdata = await prisma.returns_01.findFirst({
      where: {
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
        createdById: userid,
        year: year.toString(),
        return_type: "REVISED",
        month: date.toLocaleString("default", { month: "long" }),
      },
    });
    if (!formdata) {
      formdata = await prisma.returns_01.findFirst({
        where: {
          deletedAt: null,
          deletedById: null,
          status: "ACTIVE",
          createdById: userid,
          year: year.toString(),
          return_type: "ORIGINAL",
          month: date.toLocaleString("default", { month: "long" }),
        },
      });
    }

    let completed: boolean = false;
    let filed_on: Date = new Date();

    if (formdata) {
      if (formdata.compositionScheme) {
        if (formdata.rr_number && formdata.rr_number.trim() !== "") {
          completed = true;
          filed_on = formdata.filing_datetime;
        }
      } else {
        if (formdata.rr_number && formdata.rr_number.trim() !== "") {
          completed = true;
          filed_on = formdata.filing_datetime;
        }
      }
    } else if (iscomp) {
      if (
        ["June", "September", "December", "March"].includes(
          date.toLocaleString("default", { month: "long" })
        )
      ) {
        completed = false;
      }
    }

    response_data.push({
      month: date.toLocaleString("default", { month: "short" }),
      year: year,
      date: completed ? filed_on.toISOString() : date.toISOString(),
      completed: completed,
    });
  }

  // Remove trailing months not in the composition scheme if needed
  for (let i = response_data.length - 1; i >= 0; i--) {
    if (
      ["jun", "sep", "dec", "mar"].includes(
        response_data[i].month.toLowerCase()
      )
    ) {
      break;
    } else {
      response_data.pop();
    }
  }
  return response_data;
};

// const getLastSixMonths = async (userid: number): Promise<ResponseDate[]> => {
//   const dvat = await prisma.dvat04.findFirst({
//     where: {
//       createdById: userid,
//       status: "APPROVED",
//       deletedAt: null,
//       deletedById: null,
//     },
//   });
//   if (!dvat) return [];

//   const iscomp: boolean = dvat.compositionScheme ?? false;
//   const liableDate: Date = dvat.vatLiableDate!;
//   const response_data: ResponseDate[] = [];

//   const currentDate = new Date();
//   const startMonth = currentDate.getMonth(); // 0-indexed (0 for January, 11 for December)
//   const startYear = currentDate.getFullYear();

//   for (let i = 5, j = 0; i >= 0; i--, j++) {
//     // let liableDate: Date =
//     // Create a new date object for each month
//     const date = new Date(startYear, startMonth - i, 1);
//     if (date < liableDate) break;

//     // Handle potential underflow of month
//     const year = date.getFullYear();

//     let formdata = await prisma.returns_01.findFirst({
//       where: {
//         deletedAt: null,
//         deletedById: null,
//         status: "ACTIVE",
//         createdById: userid,
//         year: year.toString(),
//         return_type: "REVISED",
//         month: date.toLocaleString("default", { month: "long" }),
//       },
//     });
//     if (!formdata) {
//       formdata = await prisma.returns_01.findFirst({
//         where: {
//           deletedAt: null,
//           deletedById: null,
//           status: "ACTIVE",
//           createdById: userid,
//           year: year.toString(),
//           return_type: "ORIGINAL",
//           month: date.toLocaleString("default", { month: "long" }),
//         },
//       });
//     }

//     let completed: boolean = false;
//     let filed_on: Date = new Date();

//     if (formdata) {
//       if (formdata.compositionScheme) {
//         if (
//           formdata.rr_number != "" &&
//           formdata.rr_number != undefined &&
//           formdata.rr_number != null
//         ) {
//           completed = true;
//           filed_on = formdata.filing_datetime;

//           if (response_data[j - 1]) {
//             response_data[j - 1].completed = true;
//             response_data[j - 1].date = formdata.filing_datetime.toISOString();
//           }

//           if (response_data[j - 2]) {
//             response_data[j - 2].completed = true;
//             response_data[j - 2].date = formdata.filing_datetime.toISOString();
//           }
//         } else {
//           completed = false;

//           if (response_data[j - 1]) {
//             response_data[j - 1].completed = false;
//             response_data[j - 1].date = date.toISOString();
//           }

//           if (response_data[j - 2]) {
//             response_data[j - 2].completed = false;
//             response_data[j - 2].date = date.toISOString();
//           }
//         }
//       } else {
//         if (
//           formdata.rr_number != "" &&
//           formdata.rr_number != undefined &&
//           formdata.rr_number != null
//         ) {
//           completed = true;
//           filed_on = formdata.filing_datetime;
//         }
//       }
//     } else if (iscomp) {
//       if (
//         ["June", "September", "December", "March"].includes(
//           date.toLocaleString("default", { month: "long" })
//         )
//       ) {
//         completed = false;

//         if (response_data[j - 1]) {
//           response_data[j - 1].completed = false;
//           response_data[j - 1].date = date.toISOString();
//         }

//         if (response_data[j - 2]) {
//           response_data[j - 2].completed = false;
//           response_data[j - 2].date = date.toISOString();
//         }
//       }
//     }

//     response_data.push({
//       month: date.toLocaleString("default", { month: "short" }),
//       year: year,
//       date: completed ? filed_on.toISOString() : date.toISOString(),
//       completed: completed,
//     });
//   }

//   for (let i = response_data.length - 1; i >= 0; i--) {
//     if (
//       ["jun", "sep", "dec", "mar"].includes(
//         response_data[i].month.toLowerCase()
//       )
//     ) {
//       break;
//     } else {
//       response_data.pop();
//     }
//   }

//   return response_data;
// };
