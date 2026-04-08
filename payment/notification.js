import prisma from "../prisma/database.js";

const notification = async () => {
  // const dvatRecord = await prisma.return_filing.findMany({
  //   where: {
  //     return_status:"DUE",
  //     deletedAt: null,
  //   },
  // });
  // console.log("Fetched dvat record:", dvatRecord);

  // if (!dvatRecord) {
  //   console.error("No dvat record found with id 1");
  //   return false;
  // }
  return true;
};

export { notification };
