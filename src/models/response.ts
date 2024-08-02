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
