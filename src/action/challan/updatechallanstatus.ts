"use server";
import axios from "axios";
import prisma from "../../../prisma/database";

export type UpdateChallanStatusParams = {
  challanId: number;
  orderStatus?: string;
  statusGroup?: string;
  orderStatusDateTime?: string;
  bankRefNo?: string;
  cardName?: string;
  paymentMode?: string;
  statusCode?: string;
  statusMessage?: string;
  responseCode?: string;
  failureMessage?: string;
  transactionDate?: Date;
  tracking_id?: string;
  orderFeeFlat?: string | number;
  orderTax?: string | number;
};

const isSuccessfulGatewayStatus = (status?: string) => {
  const normalizedStatus = status?.toString().trim().toLowerCase();
  return (
    normalizedStatus === "successful" ||
    normalizedStatus === "success" ||
    normalizedStatus === "shipped"
  );
};

const toNumber = (value?: string | number) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
};

export default async function UpdateChallanStatus(
  params: UpdateChallanStatusParams,
) {
  try {
    const updateData: Record<string, unknown> = {};
    const isSuccessfulPayment =
      params.statusGroup === "success" ||
      isSuccessfulGatewayStatus(params.orderStatus);

    if (params.orderStatus !== undefined) {
      updateData.order_status = isSuccessfulPayment
        ? "Successful"
        : params.orderStatus;
    }

    if (params.orderStatusDateTime !== undefined) {
      updateData.transaction_date = new Date(params.orderStatusDateTime);
    } else if (params.transactionDate !== undefined) {
      updateData.transaction_date = params.transactionDate;
    }

    if (params.bankRefNo !== undefined) {
      updateData.bank_name = params.bankRefNo;
    }

    if (params.cardName !== undefined) {
      updateData.card_name = params.cardName;
    }

    if (params.paymentMode !== undefined) {
      updateData.paymentmode = params.paymentMode;
    }

    if (params.statusCode !== undefined) {
      updateData.status_code = params.statusCode;
    }

    if (params.statusMessage !== undefined) {
      updateData.status_message = params.statusMessage;
    }

    if (params.responseCode !== undefined) {
      updateData.response_code = params.responseCode;
    }

    if (params.failureMessage !== undefined) {
      updateData.failure_message = params.failureMessage;
    }

    if (params.tracking_id !== undefined) {
      updateData.track_id = params.tracking_id;
    }

    if (isSuccessfulPayment) {
      updateData.paymentstatus = "PAID";

      const orderFeeFlat = toNumber(params.orderFeeFlat);
      const orderTax = toNumber(params.orderTax);

      if (orderFeeFlat !== null && orderTax !== null) {
        updateData.trans_fee = (orderFeeFlat + orderTax).toFixed(4);
      }
    }

    if (Object.keys(updateData).length === 0) {
      return {
        status: true,
        message: "No updates provided",
        data: null,
      };
    }

    const updated = await prisma.challan.update({
      where: { id: params.challanId },
      data: updateData,
      include: {
        dvat: true,
        returns_01: true,
      },
    });

    if (!updated) {
      return {
        status: false,
        message: "Challan not found",
        data: null,
      };
    }

    if (
      updateData.paymentstatus === "PAID" &&
      updated.dvat &&
      updated.returns_01
    ) {
      const isquar = updated.dvat.frequencyFilings == "QUARTERLY";

      // Quarter to months mapping
      const quarterMonthsMap: Record<string, string[]> = {
        QUARTER1: ["April", "May", "June"],
        QUARTER2: ["July", "August", "September"],
        QUARTER3: ["October", "November", "December"],
        QUARTER4: ["January", "February", "March"],
      };

      // Calculate due date based on quarterly or monthly filing
      // const paymentDate = new Date();
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

      const paymentDate = new Date(updated.transaction_date ?? "");
      const returnMonth = updated.returns_01?.month;
      const returnYear = updated.returns_01?.year;

      // Get month index from month name
      const monthIndex = monthNames.indexOf(returnMonth ?? "");

      let dueDateYear = parseInt(
        returnYear ?? new Date().getFullYear().toString(),
      );
      let dueDateMonth: number;

      if (isquar) {
        // Get current month name

        const currentMonthName = monthNames[paymentDate.getMonth()];

        // Find which quarter the payment month belongs to and get first month of next quarter
        let nextQuarterFirstMonth = "April"; // Default
        for (const [quarter, months] of Object.entries(quarterMonthsMap)) {
          if (months.includes(currentMonthName)) {
            // Get first month of next quarter
            if (quarter === "QUARTER1") {
              nextQuarterFirstMonth = "July";
            } else if (quarter === "QUARTER2") {
              nextQuarterFirstMonth = "October";
            } else if (quarter === "QUARTER3") {
              nextQuarterFirstMonth = "January";
            } else if (quarter === "QUARTER4") {
              nextQuarterFirstMonth = "April";
            }
            break;
          }
        }
        dueDateMonth = monthNames.indexOf(nextQuarterFirstMonth);

        // If next quarter month is earlier in the year, it's next year
        if (dueDateMonth < monthIndex) {
          dueDateYear++;
        }
      } else {
        // For monthly filing: 15th of next month
        dueDateMonth = monthIndex + 1; // Next month

        if (dueDateMonth > 11) {
          // If it goes beyond December (11)
          dueDateMonth = 0; // January
          dueDateYear++;
        }
      }

      const dueDate = new Date(dueDateYear, dueDateMonth, 15);

      // Calculate days late based on payment date vs due date
      const daysLate = Math.max(
        0,
        Math.floor(
          (paymentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
        ),
      );
      if (
        !(updated.total_tax_amount == "0" || updated.total_tax_amount == null)
      ) {
        await prisma.interest_working.create({
          data: {
            dvatId: updated.dvat.id,
            returnId: updated.returns_01.id,
            challanId: updated.id,
            month: updated.returns_01.month,
            outstanding_before: 0,
            interest: 0,
            payment_date: paymentDate,
            amount: updated.returns_01.total_tax_amount,
            due_date: dueDate,
            days_late: daysLate,
            status: "ACTIVE",
          },
        });
      }
    }

    if (isSuccessfulPayment) {
      const encodedMessage = encodeURIComponent(
        `Payment of ₹ ${updated.total_tax_amount} has been successfully received. Transaction ID: ${updated.track_id}. -VAT DDD.`,
      );

      await axios.get(
        `http://sms.smartechwebworks.com/submitsms.jsp?user=dddnhvat&key=781358d943XX&mobile=+91${updated.dvat.contact_one}&message=${encodedMessage}&senderid=VATDDD&accusage=1&entityid=1701174159851422588&tempid=1777178635621857685`,
      );
    }

    return {
      status: true,
      message: "Challan status updated successfully",
      data: updated,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return {
      status: false,
      message: `Failed to update challan status: ${errorMessage}`,
      data: null,
    };
  }
}
