"use client";

import GeneratePassword from "@/action/user/genpass";
import { Button, Input } from "antd";
// import { useState } from "react";
// import { hash } from "bcrypt";
import { toast } from "react-toastify";

export default function LoginPage() {
  // const [password, setPassword] = useState<string | undefined>(undefined);
  // const [value, setValue] = useState<string | undefined>(undefined);

  const generate = async () => {
    // if (password === undefined) {
    //   toast.error("Please enter a valid password");
    //   return;
    // }
    const newpass = await GeneratePassword({});
    if (!newpass.status) {
      toast.error(newpass.message);
      return;
    }
    // setValue(newpass.data!);
  };

  return (
    <div className="bg-gray-200 grid place-items-center h-screen w-full">
      <div className="bg-white rounded p-6 shadow-md">
        <h1 className="text-xl text-center">Generate Password</h1>
        {/* <Input
          id="tin"
          type="text"
          maxLength={12}
          onChange={(e) => setPassword(e.target.value)}
          value={password === undefined ? "" : password.toString()}
        />

        <Button onClick={generate} type="primary" className="mt-2 w-full">
          Generate
        </Button>

        {value !== undefined && (
          <p>
            Generated Password: <br />
            {value}
          </p>
        )} */}

        <Button onClick={generate} type="primary" className="mt-2 w-full">
          Set Password
        </Button>
      </div>
    </div>
  );
}
