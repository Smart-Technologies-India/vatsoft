import { ApiResponseType, createResponse } from "@/models/response";
import { errorToString } from "@/utils/methods";

const ServerTime = (): ApiResponseType<Date> => {
  const functionname: string = ServerTime.name;

  try {
    return createResponse({
      message: "Server time fetched successfully",
      functionname,
      data: new Date(),
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default ServerTime;
