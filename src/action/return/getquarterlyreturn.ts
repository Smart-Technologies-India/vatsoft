import { Quarter, returns_01, returns_entry } from "@prisma/client";
import getPdfReturn from "./getpdfreturn";

interface QuarterlyReturnData {
  status: boolean;
  data?: {
    returns_01: returns_01[]; // Array of returns for each month
    returns_entry: returns_entry[];
  };
  message: string;
}

interface QuarterData {
  returns_01: returns_01 | null;
  returns_entry: returns_entry[];
}

/**
 * Fetches quarterly return data for all 3 months in a quarter
 * @param year - Financial year
 * @param quarter - Quarter (QUARTER1, QUARTER2, QUARTER3, QUARTER4)
 * @returns Combined data from all 3 months with all 3 return records
 */
async function getQuarterlyReturn(
  year: string,
  quarter: Quarter
): Promise<QuarterlyReturnData> {
  try {
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

    const quarterMonthsMap: Record<Quarter, string[]> = {
      QUARTER1: ["April", "May", "June"],
      QUARTER2: ["July", "August", "September"],
      QUARTER3: ["October", "November", "December"],
      QUARTER4: ["January", "February", "March"],
    };

    const quarterMonths = quarterMonthsMap[quarter];

    const getNewYear = (yearStr: string, month: string): string => {
      const monthIndex = monthNames.indexOf(month);
      if (monthIndex >= 0 && monthIndex <= 2) {
        // January, February, March
        return (parseInt(yearStr) + 1).toString();
      }
      return yearStr;
    };

    // Fetch all 3 months in parallel
    const responses = await Promise.all(
      quarterMonths.map((month) =>
        getPdfReturn({
          year: getNewYear(year, month),
          month,
        })
      )
    );

    let mergedEntries: returns_entry[] = [];
    let allReturns_01: returns_01[] = [];

    // Merge data from all responses
    responses.forEach((response) => {
      if (response.status && response.data) {
        mergedEntries.push(...response.data.returns_entry);
        // Collect all returns_01 from all 3 months
        if (response.data.returns_01) {
          allReturns_01.push(response.data.returns_01);
        }
      }
    });

    return {
      status: true,
      data: {
        returns_01: allReturns_01, // Return all 3 returns
        returns_entry: mergedEntries,
      },
      message: "Quarterly return data fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching quarterly return:", error);
    return {
      status: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch quarterly return data",
    };
  }
}

export default getQuarterlyReturn;

