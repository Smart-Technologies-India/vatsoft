"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";

interface UserWithDvat {
  id: number;
  firstName: string | null;
  lastName: string | null;
  mobileOne: string;
  email: string | null;
  dvat04: {
    id: number;
    tinNumber: string | null;
    name: string | null;
    commodity: string | null;
  }[];
}

const GetAllUsersWithDvat = async (): Promise<
  ApiResponseType<UserWithDvat[]>
> => {
  const functionname: string = GetAllUsersWithDvat.name;

  try {
    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        role: "USER",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        mobileOne: true,
        email: true,
        dvat04_createdBy: {
          where: {
            deletedAt: null,
          },
          select: {
            id: true,
            tinNumber: true,
            name: true,
            commodity: true,
          },
        },
      },
      orderBy: {
        firstName: "asc",
      },
    });

    const formattedUsers = users.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      mobileOne: user.mobileOne,
      email: user.email,
      dvat04: user.dvat04_createdBy,
    }));

    return createResponse({
      message: "Users fetched successfully",
      functionname,
      data: formattedUsers as any,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
      data: [],
    });
  }
};

export default GetAllUsersWithDvat;
