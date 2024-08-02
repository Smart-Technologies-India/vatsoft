"use server";
interface DashboardMonthPayload {}

import { errorToString, formateDate } from "@/utils/methods";
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
      data: getLastSixMonths(),
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default DashboardMonth;

const getLastSixMonths = (): ResponseDate[] => {
  const response_data: ResponseDate[] = [];
  const currentDate = new Date();

  // Start from the current month and year
  const startMonth = currentDate.getMonth(); // 0-indexed (0 for January, 11 for December)
  const startYear = currentDate.getFullYear();

  for (let i = 0; i < 6; i++) {
    // Create a new date object for each month
    const date = new Date(startYear, startMonth - i, 1);

    // Handle potential underflow of month
    const year = date.getFullYear();

    response_data.push({
      month: date.toLocaleString("default", { month: "short" }),
      year: year,
      date: date.toISOString(),
      completed: i == 0 ? false : true,
    });
  }

  return response_data.reverse();
};
