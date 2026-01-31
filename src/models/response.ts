export interface ApiResponseType<T> {
  status: boolean;
  data: T | null;
  message: string;
  functionname: string;
}

interface createResponsePayload<T> {
  message: string;
  data?: T | null;
  functionname: string;
}

const createResponse = <T>({
  message,
  data = null,
  functionname,
}: createResponsePayload<T>): ApiResponseType<T> => {
  return {
    message,
    data,
    status: data == null || data == undefined ? false : true,
    functionname,
  };
};

export { createResponse };

export interface PaginationResponse<T> {
  status: boolean;
  data: { total: number; skip: number; take: number; result: T | null; allData?: T | null };
  message: string;
  functionname: string;
}

interface createPaginationResponsePayload<T> {
  message: string;
  data?: T | null;
  functionname: string;
  skip?: number;
  take?: number;
  total?: number;
  allData?: T | null;
}

const createPaginationResponse = <T>({
  message,
  data = null,
  functionname,
  take,
  skip,
  total,
  allData,
}: createPaginationResponsePayload<T>): PaginationResponse<T> => {
  return {
    message,
    data: {
      take: take ?? 0,
      result: data,
      skip: skip ?? 0,
      total: total ?? 0,
      allData: allData,
    },
    status: data == null || data == undefined ? false : true,
    functionname,
  };
};

export { createPaginationResponse };
