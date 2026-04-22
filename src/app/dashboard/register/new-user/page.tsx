"use client";

import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import CreateNewUserDvat04 from "@/action/register/newuser/createnewuserdvat04";
import GetUserByMobile from "@/action/register/newuser/getuserbymobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dvat04Commodity,
  FrequencyFilings,
  SelectOffice,
} from "@prisma/client";
import { Modal } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

const ALLOWED_COMMODITIES: Dvat04Commodity[] = [
  Dvat04Commodity.FUEL,
  Dvat04Commodity.LIQUOR,
];

interface CreateNewUserFormPayload {
  firstName: string;
  lastName: string;
  mobile: string;
  pan: string;
  tinNumber: string;
  name: string;
  tradename: string;
  selectOffice: SelectOffice;
  compositionScheme: boolean;
  commodity: Dvat04Commodity;
  frequencyFilings: FrequencyFilings;
}

const NewUserRegisterPage = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isFetchingUser, setIsFetchingUser] = useState<boolean>(false);
  const [isExistingUser, setIsExistingUser] = useState<boolean>(false);

  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [mobile, setMobile] = useState<string>("");
  const [pan, setPan] = useState<string>("");
  const [tinNumber, setTinNumber] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [tradename, setTradename] = useState<string>("");
  const [selectOffice, setSelectOffice] = useState<SelectOffice>(
    SelectOffice.Dadra_Nagar_Haveli
  );
  const [compositionScheme, setCompositionScheme] = useState<boolean>(false);
  const [commodity, setCommodity] = useState<Dvat04Commodity>(
    Dvat04Commodity.FUEL
  );
  const [frequencyFilings, setFrequencyFilings] = useState<FrequencyFilings>(
    FrequencyFilings.MONTHLY
  );
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
  const [pendingPayload, setPendingPayload] =
    useState<CreateNewUserFormPayload | null>(null);

  const handleMobileBlur = async () => {
    if (mobile.trim().length !== 10) {
      return;
    }

    setIsFetchingUser(true);
    const userResponse = await GetUserByMobile({ mobile: mobile.trim() });

    if (userResponse.status && userResponse.data) {
      setFirstName(userResponse.data.firstName ?? "");
      setLastName(userResponse.data.lastName ?? "");
      setPan(userResponse.data.pan ?? "");
      setIsExistingUser(true);
      toast.info("Existing user found. User details loaded.");
    } else {
      setIsExistingUser(false);
    }

    setIsFetchingUser(false);
  };

  const getValidatedPayload = (): CreateNewUserFormPayload | null => {
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !mobile.trim() ||
      !pan.trim()
    ) {
      toast.error("Please fill first name, last name, mobile and PAN.");
      return null;
    }

    if (!name.trim() || !tradename.trim()) {
      toast.error("Please fill DVAT-04 name and trade name.");
      return null;
    }

    if (!tinNumber.trim()) {
      toast.error("Please fill TIN number.");
      return null;
    }

    if (!/^\d{11}$/.test(tinNumber.trim())) {
      toast.error("TIN number must be exactly 11 digits.");
      return null;
    }

    if (mobile.trim().length !== 10) {
      toast.error("Mobile number must be 10 digits.");
      return null;
    }

    return {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      mobile: mobile.trim(),
      pan: pan.trim().toUpperCase(),
      tinNumber: tinNumber.trim(),
      name: name.trim(),
      tradename: tradename.trim(),
      selectOffice,
      compositionScheme,
      commodity,
      frequencyFilings,
    };
  };

  const handleCreate = async (payload: CreateNewUserFormPayload) => {
    setIsSubmitting(true);

    const authResponse = await getAuthenticatedUserId();
    if (!authResponse.status || !authResponse.data) {
      toast.error(authResponse.message);
      setIsSubmitting(false);
      return router.push("/");
    }

    const response = await CreateNewUserDvat04(payload);

    if (!response.status || !response.data) {
      toast.error(response.message);
      setIsSubmitting(false);
      return;
    }

    toast.success(
      `${response.message} Application ID: ${response.data.dvat04.id}`
    );

    setIsSubmitting(false);
    router.push("/dashboard/register/department-track-application-status");
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = getValidatedPayload();
    if (!payload) {
      return;
    }

    setPendingPayload(payload);
    setIsConfirmOpen(true);
  };

  const handleConfirmCreate = async () => {
    if (!pendingPayload) {
      return;
    }

    setIsConfirmOpen(false);
    await handleCreate(pendingPayload);
    setPendingPayload(null);
  };

  const handleCloseConfirm = () => {
    setIsConfirmOpen(false);
    setPendingPayload(null);
  };

  return (
    <main className="min-h-screen bg-[#f6f7fb] w-full py-2 px-6">
      <div className="bg-white w-full p-4 px-8 shadow mt-6">
        <div className="flex gap-2">
          <p className="text-lg font-nunito">Register New User Account</p>
          <div className="grow"></div>
          <p className="text-sm">
            <span className="text-red-500">*</span> Include mandatory fields
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="mobile">Mobile *</Label>
              <Input
                id="mobile"
                value={mobile}
                maxLength={10}
                onBlur={handleMobileBlur}
                onChange={(e) =>
                  setMobile(e.target.value.replace(/[^0-9]/g, ""))
                }
                placeholder="Enter 10 digit mobile number"
              />
              <p className="text-xs text-gray-500 mt-1">
                {isFetchingUser
                  ? "Checking existing user..."
                  : isExistingUser
                  ? "Existing user found. User details are locked and only DVAT-04 will be created."
                  : "If mobile exists, user data will auto-fill and only DVAT-04 will be created."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={firstName}
                disabled={isExistingUser}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter first name"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={lastName}
                disabled={isExistingUser}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter last name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pan">PAN *</Label>
              <Input
                id="pan"
                value={pan}
                disabled={isExistingUser}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
                placeholder="Enter PAN"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">DVAT-04 Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter name"
              />
            </div>
            <div>
              <Label htmlFor="tradename">Trade Name *</Label>
              <Input
                id="tradename"
                value={tradename}
                onChange={(e) => setTradename(e.target.value)}
                placeholder="Enter trade name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tinNumber">TIN Number *</Label>
              <Input
                id="tinNumber"
                value={tinNumber}
                onChange={(e) =>
                  setTinNumber(e.target.value.replace(/[^0-9]/g, ""))
                }
                placeholder="Enter 11 digit TIN number"
                minLength={11}
                maxLength={11}
              />
              <p className="text-xs text-gray-500 mt-1">
                Prefix rule: DAMAN=2500, DIU=2501, Dadra_Nagar_Haveli=2600 or 2650
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="office">Select Office *</Label>
              <select
                id="office"
                value={selectOffice}
                onChange={(e) => setSelectOffice(e.target.value as SelectOffice)}
                className="w-full border rounded-md px-3 h-10"
              >
                {Object.values(SelectOffice).map((office) => (
                  <option key={office} value={office}>
                    {office}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="commodity">Commodity *</Label>
              <select
                id="commodity"
                value={commodity}
                onChange={(e) =>
                  setCommodity(e.target.value as Dvat04Commodity)
                }
                className="w-full border rounded-md px-3 h-10"
              >
                {ALLOWED_COMMODITIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="frequency">Frequency Filing *</Label>
              <select
                id="frequency"
                value={frequencyFilings}
                onChange={(e) =>
                  setFrequencyFilings(e.target.value as FrequencyFilings)
                }
                className="w-full border rounded-md px-3 h-10"
              >
                {Object.values(FrequencyFilings).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="composition">Composition</Label>
              <select
                id="composition"
                value={compositionScheme ? "YES" : "NO"}
                onChange={(e) => setCompositionScheme(e.target.value === "YES")}
                className="w-full border rounded-md px-3 h-10"
              >
                <option value="NO">NO</option>
                <option value="YES">YES</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="grow"></div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Create"}
            </Button>
          </div>
        </form>
      </div>

      <Modal
        title="Confirm New User Details"
        open={isConfirmOpen && Boolean(pendingPayload)}
        onOk={handleConfirmCreate}
        onCancel={handleCloseConfirm}
        okText="Confirm & Create"
        confirmLoading={isSubmitting}
        cancelButtonProps={{ disabled: isSubmitting }}
        destroyOnHidden
      >
        {pendingPayload && (
          <>
            <p className="text-sm text-gray-600 mt-1">
              Please verify all details before creating the entry.
            </p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <p>
                <span className="font-semibold">First Name:</span>{" "}
                {pendingPayload.firstName}
              </p>
              <p>
                <span className="font-semibold">Last Name:</span>{" "}
                {pendingPayload.lastName}
              </p>
              <p>
                <span className="font-semibold">Mobile:</span>{" "}
                {pendingPayload.mobile}
              </p>
              <p>
                <span className="font-semibold">PAN:</span> {pendingPayload.pan}
              </p>
              <p>
                <span className="font-semibold">TIN Number:</span>{" "}
                {pendingPayload.tinNumber}
              </p>
              <p>
                <span className="font-semibold">DVAT-04 Name:</span>{" "}
                {pendingPayload.name}
              </p>
              <p>
                <span className="font-semibold">Trade Name:</span>{" "}
                {pendingPayload.tradename}
              </p>
              <p>
                <span className="font-semibold">Office:</span>{" "}
                {pendingPayload.selectOffice}
              </p>
              <p>
                <span className="font-semibold">Commodity:</span>{" "}
                {pendingPayload.commodity}
              </p>
              <p>
                <span className="font-semibold">Frequency Filing:</span>{" "}
                {pendingPayload.frequencyFilings}
              </p>
              <p>
                <span className="font-semibold">Composition:</span>{" "}
                {pendingPayload.compositionScheme ? "YES" : "NO"}
              </p>
            </div>
          </>
        )}
      </Modal>
    </main>
  );
};

export default NewUserRegisterPage;
