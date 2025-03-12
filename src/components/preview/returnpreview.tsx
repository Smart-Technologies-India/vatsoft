import GetUser from "@/action/user/getuser";
import { getCookie } from "cookies-next";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { annexure1, annexure2, commodity, dvat04, user } from "@prisma/client";
import { Button, Drawer } from "antd";
import GetAnx2 from "@/action/anx2/getanx2";
import GetAnx1 from "@/action/anx1/getanx1";
import GetAnx1ById from "@/action/anx1/getanxbyid";
import { CommodityData } from "@/models/main";
import GetAllCommodity from "@/action/commodity/getcommodity";
import GetAnx2ById from "@/action/anx2/getanxbyid";
import GetDvatById from "@/action/user/register/getdvatbyid";

interface UserRegisterProps {
  userid?: number;
}

export const UserRegister = (props: UserRegisterProps): JSX.Element => {
  const id: number = props.userid ?? parseInt(getCookie("id") ?? "0");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userdata, setUserData] = useState<user | null>(null);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);

      const user = await GetUser({ id: id });

      if (user.status && user.data) {
        setUserData(user.data);
      } else {
        toast.error(user.message);
      }

      setIsLoading(false);
    };
    init();
  }, [id]);

  if (isLoading) {
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );
  }

  return (
    <>
      <div className="w-full p-4  mt-2">
        <Table className="border mt-2">
          <TableBody>
            <TableRow>
              <TableCell className="text-center p-2" colSpan={5}>
                <p className="text-lg font-nunito">User Details</p>
              </TableCell>
            </TableRow>
            <TableRow className="bg-gray-100">
              <TableCell className="text-left w-[16%] p-2 border">
                First Name
              </TableCell>
              <TableCell className="text-left p-2 border w-[36%]">
                {userdata?.firstName ?? ""}
              </TableCell>
              <TableCell className="text-left w-[16%] p-2 border hidden lg:table-cell">
                Last Name
              </TableCell>
              <TableCell className="text-left p-2 border w-[36%]  hidden lg:table-cell">
                {userdata?.lastName ?? ""}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="text-left w-60 p-2 border lg:hidden">
                Last Name
              </TableCell>
              <TableCell className="text-left p-2 border lg:hidden">
                {userdata?.lastName ?? ""}
              </TableCell>
            </TableRow>
            <TableRow className="bg-gray-100 lg:bg-transparent">
              <TableCell className="text-left w-[16&] p-2 border">
                Email
              </TableCell>
              <TableCell className="text-left p-2 border w-[36%]">
                {userdata?.email ?? ""}
              </TableCell>
              <TableCell className="text-left w-[16%] p-2 border hidden lg:table-cell">
                Mobile Number
              </TableCell>
              <TableCell className="text-left p-2 border w-[36%] hidden lg:table-cell">
                {userdata?.mobileOne ?? ""}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="text-left w-60 p-2 border lg:hidden">
                Mobile Number
              </TableCell>
              <TableCell className="text-left p-2 border lg:hidden">
                {userdata?.mobileOne ?? ""}
              </TableCell>
            </TableRow>
            <TableRow className="bg-gray-100">
              <TableCell className="text-left w-[16%] p-2 border">
                Alternate Number
              </TableCell>
              <TableCell className="text-left p-2 border w-[36%]">
                {userdata?.mobileTwo ?? ""}
              </TableCell>
              <TableCell className="text-left p-2 border w-[16%] hidden lg:table-cell">
                Pan Card
              </TableCell>
              <TableCell className="text-left p-2 border w-[36%] hidden lg:table-cell">
                {userdata?.pan ?? ""}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="text-left w-60 p-2 border lg:hidden">
                Pan Card
              </TableCell>
              <TableCell className="text-left p-2 border lg:hidden">
                {userdata?.pan ?? ""}
              </TableCell>
            </TableRow>
            <TableRow className="bg-gray-100 lg:bg-transparent">
              <TableCell className="text-left w-[16%] p-2 border">
                Aadhar Card
              </TableCell>
              <TableCell className="text-left p-2 border w-[36%]">
                {userdata?.aadhar ?? ""}
              </TableCell>
              <TableCell className="text-left w-[16%] p-2 border hidden lg:table-cell">
                Address
              </TableCell>
              <TableCell className="text-left p-2 border 2-[36%] hidden lg:table-cell">
                {userdata?.address ?? ""}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="text-left w-60 p-2 border lg:hidden">
                Address
              </TableCell>
              <TableCell className="text-left p-2 border lg:hidden">
                {userdata?.address ?? ""}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </>
  );
};

interface Dvat1PageProps {
  userid?: number;
  dvatid: number;
}
export const Dvat1Page = (props: Dvat1PageProps) => {
  const current_user_id: number =
    props.userid ?? parseInt(getCookie("id") ?? "0");

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [dvatData, setDvatData] = useState<dvat04>();

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);

      const dvatdata = await GetDvatById({
        id: props.dvatid,
      });

      if (dvatdata.status && dvatdata.data) {
        setDvatData(dvatdata.data);
      }
      setIsLoading(false);
    };
    init();
  }, [current_user_id]);
  let office_type: { [key: string]: string } = {
    Dadra_Nagar_Haveli: "Dept. of VAT - DNH",
    Branch_Office: "Branch Office",
    Head_Office: "Head Office",
  };

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );

  return (
    <>
      <div className="w-full px-4 mt-2">
        <Table className="border">
          <TableBody>
            <TableRow>
              <TableCell className="text-center p-2" colSpan={5}>
                <p className="text-lg font-nunito">DVAT 04</p>
              </TableCell>
            </TableRow>

            <CreateTable
              key1="Office"
              value1={
                office_type[dvatData?.selectOffice ?? "Dadra_Nagar_Haveli"]
              }
              key2="1. Full Name of Applicant Dealer"
              value2={dvatData?.name ?? ""}
              odd={false}
            />
            <CreateTable
              key1="2. Trade Name"
              value1={dvatData?.tradename ?? ""}
              key2="3. Nature of Business"
              value2={dvatData?.natureOfBusiness ?? ""}
              odd={true}
            />
            <CreateTable
              key1="4. Constitution Of Business"
              value1={dvatData?.constitutionOfBusiness ?? ""}
              key2="5. Type of Registration"
              value2={dvatData?.typeOfRegistration ?? ""}
              odd={false}
            />
            <CreateTable
              key1="5(a). Opting for composition scheme under section 16(2) for the
                Regulation ?"
              value1={dvatData?.compositionScheme ? "Yes" : "No"}
              key2="6. Annual Turnover Category"
              value2={
                dvatData?.annualTurnoverCategory
                  ? "Less then Rs. 5 Lacs"
                  : "Rs. 5 Lacs or above"
              }
              odd={true}
            />
            <CreateTable
              key1="6(a). Turnover of the last financial year"
              value1={dvatData?.turnoverLastFinancialYear ?? ""}
              key2="6(b). Expected turnover of the current financial year"
              value2={dvatData?.turnoverCurrentFinancialYear ?? ""}
              odd={false}
            />

            <CreateTable
              key1="7. Date from which liable for registration under Dadra and Nagar
                Haveli Value Added Tax regulation, 2005 (DD/MM/YYYY)"
              value1={
                dvatData?.vatLiableDate
                  ? format(dvatData?.vatLiableDate, "PPP")
                  : ""
              }
              key2="8. Pan Number"
              value2={dvatData?.pan ?? ""}
              odd={true}
            />
            <CreateTable
              key1="9. GST Number"
              value1={dvatData?.gst ?? ""}
              odd={false}
            />
          </TableBody>
        </Table>

        <Table className="border mt-6">
          <TableBody>
            <TableRow>
              <TableCell className="text-center p-2" colSpan={5}>
                <p className="text-lg font-nunito">
                  10 Principle place of Business
                </p>
              </TableCell>
            </TableRow>

            <CreateTable
              key1="Building Number"
              value1={dvatData?.buildingNumber ?? ""}
              key2="Area"
              value2={dvatData?.area ?? ""}
              odd={false}
            />
            <CreateTable
              key1="City"
              value1={dvatData?.city ?? ""}
              key2="Pin Code"
              value2={dvatData?.pincode ?? ""}
              odd={true}
            />
            <CreateTable
              key1="Address"
              value1={dvatData?.address ?? ""}
              odd={false}
            />
          </TableBody>
        </Table>

        <Table className="border mt-6">
          <TableBody>
            <TableRow>
              <TableCell className="text-center p-2" colSpan={5}>
                <p className="text-lg font-nunito">Contact Details</p>
              </TableCell>
            </TableRow>
            <CreateTable
              key1="Mobile Number"
              value1={dvatData?.contact_one ?? ""}
              key2="Alternate Number"
              value2={dvatData?.contact_two ?? ""}
              odd={true}
            />
            <CreateTable
              key1="Email"
              value1={dvatData?.email ?? ""}
              key2="Fax Number"
              value2={dvatData?.faxNumber ?? ""}
              odd={false}
            />
          </TableBody>
        </Table>
      </div>
    </>
  );
};

interface Dvat2PageProps {
  userid?: number;
  dvatid: number;
}
export const Dvat2Page = (props: Dvat2PageProps) => {
  const current_user_id: number =
    props.userid ?? parseInt(getCookie("id") ?? "0");

  let type_of_account: { [key: string]: string } = {
    CURRENT: "Current Account",
    SAVING: "Saving Account",
    OVERDRAFT: "Overdraft Account",
    CASH_CREDIT: "Cash Credit Account",
  };

  const [user, setUser] = useState<user>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [commodity, setCommodity] = useState<commodity[]>([]);

  const [commodityData, setCommodityData] = useState<CommodityData[]>([]);

  const [dvatdata, setDvatData] = useState<dvat04>();

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);

      const user = await GetUser({ id: current_user_id });

      if (user.status) {
        setUser(user.data!);
      } else {
        toast.error(user.message);
      }

      const dvatresponse: any = await GetDvatById({
        id: props.dvatid,
      });

      setCommodityData([]);
      if (dvatresponse.status) {
        setDvatData(dvatresponse.data!);

        if (dvatresponse.data!.selectComOneId) {
          const commodityone = {
            id: dvatresponse.data!.selectComOneId,
            act: dvatresponse.data!.selectComOne.act,
            code: dvatresponse.data!.selectComOne.code,
            commodity: dvatresponse.data!.selectComOne.name,
            purpose: dvatresponse.data!.purposeOne,
            description: dvatresponse.data!.descriptionOne,
          };
          setCommodityData((prev) => [...prev, commodityone]);
        }

        if (dvatresponse.data!.selectComTwoId) {
          const commoditytwo = {
            id: dvatresponse.data!.selectComTwoId,
            act: dvatresponse.data!.selectComTwo.act,
            code: dvatresponse.data!.selectComTwo.code,
            commodity: dvatresponse.data!.selectComTwo.name,
            purpose: dvatresponse.data!.purposeTwo,
            description: dvatresponse.data!.descriptionTwo,
          };
          setCommodityData((prev) => [...prev, commoditytwo]);
        }

        if (dvatresponse.data!.selectComThreeId) {
          const commoditythree = {
            id: dvatresponse.data!.selectComThreeId,
            act: dvatresponse.data!.selectComThree.act,
            code: dvatresponse.data!.selectComThree.code,
            commodity: dvatresponse.data!.selectComThree.name,
            purpose: dvatresponse.data!.purposeThree,
            description: dvatresponse.data!.descriptionThree,
          };
          setCommodityData((prev) => [...prev, commoditythree]);
        }

        if (dvatresponse.data!.selectComFourId) {
          const commodityfour = {
            id: dvatresponse.data!.selectComFourId,
            act: dvatresponse.data!.selectComFour.act,
            code: dvatresponse.data!.selectComFour.code,
            commodity: dvatresponse.data!.selectComFour.name,
            purpose: dvatresponse.data!.purposeFour,
            description: dvatresponse.data!.descriptionFour,
          };
          setCommodityData((prev) => [...prev, commodityfour]);
        }

        if (dvatresponse.data!.selectComFiveId) {
          const commodityfive = {
            id: dvatresponse.data!.selectComFiveId,
            act: dvatresponse.data!.selectComFive.act,
            code: dvatresponse.data!.selectComFive.code,
            commodity: dvatresponse.data!.selectComFive.name,
            purpose: dvatresponse.data!.purposeFive,
            description: dvatresponse.data!.descriptionFive,
          };
          setCommodityData((prev) => [...prev, commodityfive]);
        }
      }

      const commoditylist = await GetAllCommodity({});

      if (commoditylist.status) {
        setCommodity(commoditylist.data!);
      }
      setIsLoading(false);
    };
    init();
  }, [current_user_id]);

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );

  return (
    <>
      <div className="w-full px-4">
        <Table className="border mt-6">
          <TableBody>
            <TableRow>
              <TableCell className="text-center p-2" colSpan={5}>
                <p className="text-lg font-nunito">
                  11 Address for service of notice (If Different From Principle
                  Place of Business)
                </p>
              </TableCell>
            </TableRow>
            <CreateTable
              key1="Building Name"
              value1={dvatdata?.noticeServingBuildingName ?? ""}
              key2="Area"
              value2={dvatdata?.noticeServingArea ?? ""}
              odd={false}
            />
            <CreateTable
              key1="City"
              value1={dvatdata?.noticeServingCity ?? ""}
              key2="Pincode"
              value2={dvatdata?.noticeServingPincode ?? ""}
              odd={true}
            />
            <CreateTable
              key1="Address"
              value1={dvatdata?.noticeServingAddress ?? ""}
              odd={false}
            />
          </TableBody>
        </Table>

        <Table className="border mt-6">
          <TableBody>
            <TableRow>
              <TableCell className="text-center p-2" colSpan={5}>
                <p className="text-lg font-nunito">
                  12 Number of additional places of business within or outside
                  the state
                </p>
              </TableCell>
            </TableRow>
            <CreateTable
              key1="Godown"
              value1={dvatdata?.additionalGodown ?? ""}
              key2="Factory"
              value2={dvatdata?.additionalFactory ?? ""}
              odd={false}
            />
            <CreateTable
              key1="Shops"
              value1={dvatdata?.additionalShops ?? ""}
              key2="Other Place of Business"
              value2={dvatdata?.otherPlaceOfBusiness ?? ""}
              odd={true}
            />
          </TableBody>
        </Table>

        <Table className="border mt-6">
          <TableBody>
            <TableRow>
              <TableCell className="text-center p-2" colSpan={5}>
                <p className="text-lg font-nunito">
                  13 Details of main Bank Account
                </p>
              </TableCell>
            </TableRow>
            <CreateTable
              key1="Bank Name"
              value1={dvatdata?.bankName ?? ""}
              key2="Type of Account"
              value2={type_of_account[dvatdata?.typeOfAccount ?? ""]}
              odd={false}
            />
            <CreateTable
              key1="IFSC Code"
              value1={dvatdata?.ifscCode ?? ""}
              key2="Account Number"
              value2={dvatdata?.accountnumber ?? ""}
              odd={true}
            />
            <CreateTable
              key1="Address of Bank"
              value1={dvatdata?.addressOfBank ?? ""}
              odd={false}
            />
          </TableBody>
        </Table>

        <Table className="border mt-6">
          <TableBody>
            <TableRow>
              <TableCell className="text-center p-2" colSpan={5}>
                <p className="text-lg font-nunito">
                  14 Details Of Investment in the business (details should be
                  current as on date of application)
                </p>
              </TableCell>
            </TableRow>
            <CreateTable
              key1="Own Capital (Rs)"
              value1={dvatdata?.ownCapital ?? ""}
              key2="Loan From Bank (Rs)"
              value2={dvatdata?.loanFromBank ?? ""}
              odd={false}
            />
            <CreateTable
              key1="Loan From Other (Rs"
              value1={dvatdata?.loanFromOther ?? ""}
              key2="Plant And Machinery (Rs)"
              value2={dvatdata?.plantAndMachinery ?? ""}
              odd={true}
            />
            <CreateTable
              key1="Land & Building (Rs)"
              value1={dvatdata?.landAndBuilding ?? ""}
              key2="Other Assets & Investments (Rs)"
              value2={dvatdata?.otherAssetsInvestments ?? ""}
              odd={false}
            />
          </TableBody>
        </Table>

        <Table className="border mt-6">
          <TableBody>
            <CreateTable
              key1="16. Accounting Basis"
              value1={dvatdata?.accountingBasis ?? ""}
              key2="17. Frequency of filing return (to be filled in by the dealer
                whose turnover is less then Rs. 5 crore in the preceeding year)"
              value2={dvatdata?.frequencyFilings ?? ""}
              odd={false}
            />
          </TableBody>
        </Table>

        <Table className="mt-6">
          <TableBody>
            <TableRow>
              <TableCell className="border text-center p-2" colSpan={5}>
                <p className="text-lg font-nunito">
                  15 Description of top 5 Items you deal or propose to deal in
                </p>
              </TableCell>
            </TableRow>
            <TableRow className="bg-gray-100 border">
              <TableCell className="w-[100px] text-sm font-normal p-2 border">
                Act
              </TableCell>
              <TableCell className=" text-sm font-normal p-2 border">
                Code
              </TableCell>
              <TableCell className=" text-sm font-normal p-2 border">
                Commodity
              </TableCell>
              <TableCell className=" text-sm font-normal p-2 border">
                Dealer&apos;s description
              </TableCell>
            </TableRow>
            {commodityData.map((com, index) => (
              <TableRow key={index}>
                <TableCell className="text-xs p-2 border">{com.act}</TableCell>
                <TableCell className="text-xs p-2 border">{com.code}</TableCell>
                <TableCell className="text-xs p-2 border">
                  {com.commodity}
                </TableCell>
                <TableCell className="text-xs p-2 border">
                  {com.description}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {commodityData.length <= 0 ? (
          <div className="text-sm text-red-500 mt-2">
            No Commodity Added Yet! Add Commodity to Proceed Further!
          </div>
        ) : null}
      </div>
    </>
  );
};

interface Dvat3PageProps {
  userid?: number;
  dvatid: number;
}

export const Dvat3Page = (props: Dvat3PageProps) => {
  const current_user_id: number =
    props.userid ?? parseInt(getCookie("id") ?? "0");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [dvatData, setDvatData] = useState<dvat04>();

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);

      const user = await GetUser({ id: current_user_id });

      if (user.status) {
        // setUser(user.data!);
      } else {
        toast.error(user.message);
      }

      const dvatdata = await GetDvatById({
        id: props.dvatid,
      });

      if (dvatdata.status && dvatdata.data) {
        setDvatData(dvatdata.data);
      }

      setIsLoading(false);
    };
    init();
  }, [current_user_id]);

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );

  return (
    <>
      <div className=" w-full p-4 mt-2">
        <Table className="border mt-2">
          <TableBody>
            <TableRow>
              <TableCell className="text-center p-2" colSpan={5}>
                <p className="text-lg font-nunito">18 Security</p>
              </TableCell>
            </TableRow>
            <CreateTable
              key1="Reference Number"
              value1={dvatData?.transactionId ?? ""}
              key2="Amount Of Security (Rs)"
              value2={dvatData?.securityDepositAmount ?? ""}
              odd={false}
            />
            <CreateTable
              key1="Name Of Bank"
              value1={dvatData?.nameOfBank ?? ""}
              key2="Branch Name"
              value2={dvatData?.branchName ?? ""}
              odd={true}
            />
            <CreateTable
              key1="Type Of Security"
              value1={dvatData?.depositType ?? ""}
              key2="Date Of Expiry Of Security"
              value2={
                dvatData?.dateOfExpiry
                  ? format(dvatData?.dateOfExpiry, "PPP")
                  : ""
              }
              odd={false}
            />
          </TableBody>
        </Table>

        <Table className="border mt-6">
          <TableBody>
            <CreateTable
              key1="19. Number of Person having interest in Business"
              value1={(dvatData?.numberOfOwners ?? "").toString()}
              key2="20. Number of Managers"
              value2={(dvatData?.numberOfManagers ?? "").toString()}
              odd={true}
            />
            <CreateTable
              key1="21. Number of authorised signatory"
              value1={(dvatData?.numberOfSignatory ?? "").toString()}
              key2="22. Name of Manager"
              value2={dvatData?.nameOfManager ?? ""}
              odd={false}
            />
            <CreateTable
              key1="23. Name of authorised signatory"
              value1={dvatData?.nameOfSignatory ?? ""}
              odd={true}
            />
          </TableBody>
        </Table>
      </div>
    </>
  );
};

interface Anx1PageProps {
  dvatid: number;
  userid?: number;
  extend: boolean;
}

export const Anx1Page = (props: Anx1PageProps) => {
  const current_user_id: number =
    props.userid ?? parseInt(getCookie("id") ?? "0");

  const [user, setUser] = useState<user>();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [Annexuredata, setAnnexuredata] = useState<annexure1[]>([]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);

      const user = await GetUser({ id: current_user_id });

      if (user.status) {
        setUser(user.data!);
      } else {
        toast.error(user.message);
      }

      const getanx1resposne = await GetAnx1({ dvatid: props.dvatid });

      if (getanx1resposne.status && getanx1resposne.data) {
        setAnnexuredata(getanx1resposne.data);
      }
      setIsLoading(false);
    };
    init();
  }, [current_user_id, props.dvatid]);

  const [open, setOpen] = useState(false);
  const [annexure, setAnnexure] = useState<annexure1 | null>(null);

  const showDrawer = async (id: number) => {
    const data = await GetAnx1ById({ id: id });

    if (data.status && data.data) {
      setOpen(true);
      setAnnexure(data.data);
    } else {
      toast.error(data.message);
    }
  };

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );
  return (
    <>
      <Drawer
        width={640}
        placement="right"
        closeIcon={null}
        onClose={() => {
          setOpen(false);
        }}
        open={open}
      >
        <Anx1Info annexure={annexure!} />
        <div className="flex mt-4">
          <Button
            type="primary"
            onClick={() => {
              setOpen(false);
            }}
          >
            Close
          </Button>
        </div>
      </Drawer>

      {Annexuredata.length > 0 && (
        <div className="w-full p-4 mt-2">
          <Table>
            <TableRow>
              <TableCell className="text-center p-2 border" colSpan={5}>
                <p className="text-lg font-nunito">Annexure-1</p>
              </TableCell>
            </TableRow>
            <TableRow className="bg-gray-100">
              <TableCell className="w-[100px] p-2 border">Type</TableCell>
              <TableCell className="w-[200px] p-2 border">Name</TableCell>
              <TableCell className="w-[60px] p-2 border">Contact</TableCell>
              <TableCell className="w-[160px] p-2 border  hidden-print">
                Is Authorised Signatory
              </TableCell>
              <TableCell className="w-[80px] p-2">Action</TableCell>
            </TableRow>
            <TableBody>
              {Annexuredata.map((data) => {
                return (
                  <TableRow key={data.id}>
                    <TableCell className="font-medium p-2 border">
                      {data.titleParticulasOfperson}
                    </TableCell>
                    <TableCell className="p-2 border">
                      {data.nameOfPerson}
                    </TableCell>
                    <TableCell className="p-2 border">{data.contact}</TableCell>
                    <TableCell className="p-2 border">
                      {data.isAuthorisedSignatory ? "YES" : "NO"}
                    </TableCell>

                    <TableCell className="p-2 border hidden-print">
                      <Button
                        onClick={() => showDrawer(data.id)}
                        type="primary"
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {props.extend &&
        Annexuredata.map((data: annexure1, index: number) => (
          <div
            className="rounded-sm p-4 border border-black mt-6 relative m-4"
            key={index}
          >
            <span className="-translate-y-7 bg-white px-1 -translate-x-2 inline-block absolute text-sm">
              {index + 1}
            </span>
            <Anx1Info annexure={data} />
          </div>
        ))}
    </>
  );
};

interface Anx2PageProps {
  dvatid: number;
  userid?: number;
  extend: boolean;
}

export const Anx2Page = (props: Anx2PageProps) => {
  const current_user_id: number =
    props.userid ?? parseInt(getCookie("id") ?? "0");

  const [user, setUser] = useState<user>();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [Annexuredata, setAnnexuredata] = useState<annexure2[]>([]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);

      const user = await GetUser({ id: current_user_id });

      if (user.status) {
        setUser(user.data!);
      } else {
        toast.error(user.message);
      }

      const getanx2resposne = await GetAnx2({ dvatid: props.dvatid });

      if (getanx2resposne.status && getanx2resposne.data) {
        setAnnexuredata(getanx2resposne.data);
      }

      setIsLoading(false);
    };
    init();
  }, [current_user_id, props.dvatid]);

  const [open, setOpen] = useState(false);
  const [annexure, setAnnexure] = useState<annexure2 | null>(null);

  const showDrawer = async (id: number) => {
    const data = await GetAnx2ById({ id: id });

    if (data.status && data.data) {
      setOpen(true);
      setAnnexure(data.data);
    } else {
      toast.error(data.message);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );
  }

  return (
    <>
      <Drawer
        width={640}
        placement="right"
        closeIcon={null}
        onClose={() => {
          setOpen(false);
        }}
        open={open}
      >
        <Anx2Info annexure={annexure!} />

        <div className="flex mt-4">
          <Button
            type="primary"
            onClick={() => {
              setOpen(false);
            }}
          >
            Close
          </Button>
        </div>
      </Drawer>

      {Annexuredata.length > 0 && (
        <div className="w-full p-4 mt-2">
          <Table>
            <TableRow>
              <TableCell className="text-center p-2 border" colSpan={5}>
                <p className="text-lg font-nunito">Annexure-2</p>
              </TableCell>
            </TableRow>

            <TableRow className="bg-gray-100">
              <TableCell className="w-[100px] p-2 border">Type</TableCell>
              <TableCell className="w-[200px] p-2 border">Name</TableCell>
              <TableCell className="w-[60px] p-2 border">Contact</TableCell>
              <TableCell className="w-[160px] p-2 border">
                Is Authorised Signatory
              </TableCell>
              <TableCell className="w-[80px] p-2  hidden-print">
                Action
              </TableCell>
            </TableRow>

            <TableBody>
              {Annexuredata.map((data) => {
                return (
                  <TableRow key={data.id}>
                    <TableCell className="p-2 border">
                      {data.typeOfPerson}
                    </TableCell>
                    <TableCell className="p-2 border">{data.name}</TableCell>
                    <TableCell className="p-2 border">{data.contact}</TableCell>
                    <TableCell className="p-2 border">Yes</TableCell>
                    <TableCell className="p-2 border  hidden-print">
                      <Button
                        type="primary"
                        onClick={() => showDrawer(data.id)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {props.extend &&
        Annexuredata.map((data: annexure2, index: number) => (
          <div
            className="rounded-sm p-4 border border-black mt-6 relative m-4"
            key={index}
          >
            <span className="-translate-y-7 bg-white px-1 -translate-x-2 inline-block absolute text-sm">
              {index + 1}
            </span>
            <Anx2Info annexure={data} />
          </div>
        ))}
    </>
  );
};

interface Anx3PageProps {
  dvatid: number;
  userid?: number;
}

export const Anx3Page = (props: Anx3PageProps) => {
  const current_user_id: number =
    props.userid ?? parseInt(getCookie("id") ?? "0");

  const [user, setUser] = useState<user>();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [Annexuredata, setAnnexuredata] = useState<annexure1[]>([]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);

      const user = await GetUser({ id: current_user_id });

      if (user.status) {
        setUser(user.data!);
      } else {
        toast.error(user.message);
      }

      const getanx1resposne = await GetAnx1({ dvatid: props.dvatid });

      if (getanx1resposne.status) {
        setAnnexuredata(getanx1resposne.data!);
      }
      setIsLoading(false);
    };
    init();
  }, [current_user_id, props.dvatid]);

  const [open, setOpen] = useState(false);
  const [annexure, setAnnexure] = useState<annexure1 | null>(null);
  const showDrawer = async (id: number) => {
    const data = await GetAnx1ById({ id: id });

    if (data.status && data.data) {
      setOpen(true);
      setAnnexure(data.data);
    } else {
      toast.error(data.message);
    }
  };

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );

  return (
    <>
      <Drawer
        width={640}
        placement="right"
        closeIcon={null}
        onClose={() => {
          setOpen(false);
        }}
        open={open}
      >
        <Anx1Info annexure={annexure!} />
        <div className="flex mt-4">
          <Button
            type="primary"
            onClick={() => {
              setOpen(false);
            }}
          >
            Close
          </Button>
        </div>
      </Drawer>
      <div className="w-full mt-2 px-4">
        <Table>
          <TableRow>
            <TableCell className="text-center p-2 border" colSpan={5}>
              <p className="text-lg font-nunito">Annexure-3</p>
            </TableCell>
          </TableRow>
          <TableRow className="bg-gray-100">
            <TableCell className="w-[100px] p-2 border">Type</TableCell>
            <TableCell className="w-[200px] p-2 border">Name</TableCell>
            <TableCell className="w-[60px] p-2 border">Contact</TableCell>
            <TableCell className="w-[160px] p-2 border">
              Is Authorised Signatory
            </TableCell>
            <TableCell className="w-[80px] p-2 hidden-print">Action</TableCell>
          </TableRow>
          <TableBody>
            {Annexuredata.map((data) => {
              return (
                <TableRow key={data.id}>
                  <TableCell className="font-medium border p-2">
                    {data.titleParticulasOfperson}
                  </TableCell>
                  <TableCell className="border p-2">
                    {data.nameOfPerson}
                  </TableCell>
                  <TableCell className="border p-2">{data.contact}</TableCell>
                  <TableCell className="border p-2">
                    {data.isAuthorisedSignatory ? "Yes" : "No"}
                  </TableCell>
                  <TableCell className="p-2 border hidden-print">
                    <Button type="primary" onClick={() => showDrawer(data.id)}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
};

interface CreateTableProps {
  key1: string;
  key2?: string;
  value1: string;
  value2?: string;
  odd: boolean;
}

const CreateTable = (props: CreateTableProps) => {
  return (
    <>
      <TableRow className={`bg-gray-100 ${props.odd && "lg:bg-transparent"}`}>
        <TableCell className={`text-left "w-[20%] p-2 border`}>
          {props.key1}
        </TableCell>
        <TableCell className={`text-left p-2 w-[32%] border`}>
          {props.value1}
        </TableCell>
        {props.key2 ? (
          <>
            <TableCell className="text-left w-[20%] p-2 border hidden lg:table-cell">
              {props.key2}
            </TableCell>
            <TableCell className="text-left p-2 border w-[32%]  hidden lg:table-cell">
              {props.value2}
            </TableCell>
          </>
        ) : (
          <>
            <TableCell className="text-left w-[20%] p-2 hidden lg:table-cell"></TableCell>
            <TableCell className="text-left p-2 w-[32%]  hidden lg:table-cell"></TableCell>
          </>
        )}
      </TableRow>
      {props.key2 && (
        <TableRow>
          <TableCell className="text-left w-60 p-2 border lg:hidden">
            {props.key2}
          </TableCell>
          <TableCell className="text-left p-2 border lg:hidden">
            {props.value2}
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

interface Anx1InfoProps {
  annexure: annexure1;
}

const Anx1Info = (props: Anx1InfoProps) => {
  return (
    <>
      <p className="text-lg text-left">
        Particulars Of Person Having Interest In the Business
      </p>
      <Table className="mt-2">
        <TableBody>
          <TableRow>
            <TableCell className="text-left w-60 p-2 border">
              Title Particulars of person
            </TableCell>
            <TableCell className="text-left p-2 border">
              {props.annexure.titleParticulasOfperson}
            </TableCell>
          </TableRow>
          <TableRow className="bg-gray-100">
            <TableCell className="text-left w-60 p-2 border">
              Full Name of Person
            </TableCell>
            <TableCell className="text-left p-2 border">
              {props.annexure.nameOfPerson}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-left w-60 p-2 border">
              Date Of Birth
            </TableCell>
            <TableCell className="text-left p-2 border">
              {props.annexure.dateOfBirth
                ? format(props.annexure.dateOfBirth, "PPP")
                : ""}
            </TableCell>
          </TableRow>
          <TableRow className="bg-gray-100">
            <TableCell className="text-left w-60 p-2 border">Gender</TableCell>
            <TableCell className="text-left p-2 border">
              {props.annexure.gender}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-left w-60 p-2 border">
              Father&apos;s Name
            </TableCell>
            <TableCell className="text-left p-2 border">
              {props.annexure.fatherName}
            </TableCell>
          </TableRow>
          <TableRow className="bg-gray-100">
            <TableCell className="text-left w-60 p-2 border">PAN</TableCell>
            <TableCell className="text-left p-2 border">
              {props.annexure.panNumber}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-left w-60 p-2 border">
              Aadhar No.
            </TableCell>
            <TableCell className="text-left p-2 border">
              {props.annexure.aadharNumber}
            </TableCell>
          </TableRow>
          <TableRow className="bg-gray-100">
            <TableCell className="text-left w-60 p-2 border">
              Designation
            </TableCell>
            <TableCell className="text-left p-2 border">
              {props.annexure.designation}
            </TableCell>
          </TableRow>
          <TableRow className="bg-gray-100">
            <TableCell className="text-left w-60 p-2 border">
              Education Qualification
            </TableCell>
            <TableCell className="text-left p-2 border">
              {props.annexure.eductionQualification}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <p className="text-lg text-left mt-4">Residential Address</p>
      <Table className="mt-2">
        <TableBody>
          <TableRow>
            <TableCell className="text-left w-60 p-2 border">
              Building Name/ Number
            </TableCell>
            <TableCell className="text-left p-2 border">
              {props.annexure.rbuildingName}
            </TableCell>
          </TableRow>
          <TableRow className="bg-gray-100">
            <TableCell className="text-left w-60 p-2 border">
              Area/ Road/ Locality/ Market
            </TableCell>
            <TableCell className="text-left p-2 border">
              {props.annexure.rareaName}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-left w-60 p-2 border">
              Village/ Town
            </TableCell>
            <TableCell className="text-left p-2 border">
              {props.annexure.rvillageName}
            </TableCell>
          </TableRow>
          <TableRow className="bg-gray-100">
            <TableCell className="text-left w-60 p-2 border">Pincode</TableCell>
            <TableCell className="text-left p-2 border">
              {props.annexure.rpincode}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <p className="text-lg text-left mt-4">Permanent Address</p>
      <Table className="mt-2">
        <TableBody>
          <TableRow>
            <TableCell className="text-left w-60 p-2 border">
              Building Name/ Number
            </TableCell>
            <TableCell className="text-left p-2 border">
              {props.annexure.pbuildingName}
            </TableCell>
          </TableRow>
          <TableRow className="bg-gray-100">
            <TableCell className="text-left w-60 p-2 border">
              Area/ Road/ Locality/ Market
            </TableCell>
            <TableCell className="text-left p-2 border">
              {props.annexure.pareaName}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-left w-60 p-2 border">
              Village/ Town
            </TableCell>
            <TableCell className="text-left p-2 border">
              {props.annexure.pvillageName}
            </TableCell>
          </TableRow>
          <TableRow className="bg-gray-100">
            <TableCell className="text-left w-60 p-2 border">Pincode</TableCell>
            <TableCell className="text-left p-2 border">
              {props.annexure.ppincode}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <p className="text-lg text-left mt-4">Contact Details</p>
      <Table className="mt-2">
        <TableBody>
          <TableRow>
            <TableCell className="text-left w-60 p-2 border">
              Contact Number
            </TableCell>
            <TableCell className="text-left p-2 border">
              {props.annexure.contact}
            </TableCell>
          </TableRow>
          <TableRow className="bg-gray-100">
            <TableCell className="text-left w-60 p-2 border">
              Email Id
            </TableCell>
            <TableCell className="text-left p-2 border">
              {props.annexure.email}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </>
  );
};

interface Anx2InfoProps {
  annexure: annexure2;
}

const Anx2Info = (props: Anx2InfoProps) => {
  return (
    <>
      <p className="text-lg text-left">
        Details of Additional Places of Business
      </p>
      <Table className="mt-2">
        <TableBody>
          <TableRow>
            <TableCell className="text-left w-60 p-2 border">
              Name of the Applicant
            </TableCell>
            <TableCell className="text-left p-2 border">
              {props.annexure.name}
            </TableCell>
          </TableRow>
          <TableRow className="bg-gray-100">
            <TableCell className="text-left w-60 p-2 border">Type</TableCell>
            <TableCell className="text-left p-2 border">
              {props.annexure.typeOfPerson}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-left w-60 p-2 border">
              Branch Name
            </TableCell>
            <TableCell className="text-left p-2 border">
              {props.annexure.branchName}
            </TableCell>
          </TableRow>
          <TableRow className="bg-gray-100">
            <TableCell className="text-left w-60 p-2 border">
              Contact Number
            </TableCell>
            <TableCell className="text-left p-2 border">
              {props.annexure.contact}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <p className="text-lg text-left mt-4">Address</p>
      <Table className="mt-2">
        <TableBody>
          <TableRow>
            <TableCell className="text-left w-60 p-2 border">
              Building Name/ Number
            </TableCell>
            <TableCell className="text-left p-2 border">
              {props.annexure.buildingName}
            </TableCell>
          </TableRow>
          <TableRow className="bg-gray-100">
            <TableCell className="text-left w-60 p-2 border">
              Area/ Road/ Locality/ Market
            </TableCell>
            <TableCell className="text-left p-2 border">
              {props.annexure.areaName}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-left w-60 p-2 border">
              Village/ Town
            </TableCell>
            <TableCell className="text-left p-2 border">
              {props.annexure.village}
            </TableCell>
          </TableRow>
          <TableRow className="bg-gray-100">
            <TableCell className="text-left w-60 p-2 border">Pincode</TableCell>
            <TableCell className="text-left p-2 border">
              {props.annexure.pinCode}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-left w-60 p-2 border">
              Date of Establishment
            </TableCell>
            <TableCell className="text-left p-2 border">
              {props.annexure.dateOfExtablishment
                ? format(props.annexure.dateOfExtablishment, "PPP")
                : ""}
            </TableCell>
          </TableRow>
          <TableRow className="bg-gray-100">
            <TableCell className="text-left w-60 p-2 border">
              Location of Business Place
            </TableCell>
            <TableCell className="text-left p-2 border">
              {props.annexure.locationOfBusinessPlace}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <p className="text-lg text-left mt-4">Registration No. of Branch</p>
      <Table className="mt-2">
        <TableBody>
          <TableRow>
            <TableCell className="text-left w-60 p-2 border">
              Under State Act
            </TableCell>
            <TableCell className="text-left p-2 border">
              {props.annexure.underStateAct}
            </TableCell>
          </TableRow>
          <TableRow className="bg-gray-100">
            <TableCell className="text-left w-60 p-2 border">
              Under CST Act, 1958
            </TableCell>
            <TableCell className="text-left p-2 border">
              {props.annexure.underCstAct}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </>
  );
};
