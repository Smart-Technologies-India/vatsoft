"use client";

import { useRef, useState } from "react";
import { toast } from "react-toastify";

const Dec = () => {
  const [val, setVal] = useState<string>("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  return (
    <>
      <div className="mx-auto w-4/6 mt-6">
        <div className="flex items-start gap-4">
          <textarea
            ref={inputRef}
            placeholder="Dec text"
            className="grow h-20"
          ></textarea>

          <button
            className="bg-green-500 w-20 px-4 py-1 rounded-md text-white font-semibold text-sm border-2"
            onClick={() => {
              if (
                inputRef.current?.value == null ||
                inputRef.current?.value == undefined
              )
                return toast.error("Enter data to dec");
              setVal(inputRef.current?.value);
            }}
          >
            Dec
          </button>
        </div>
        <h1 className="mt-4 border-2 p-2 border-green-500 w-full">{val}</h1>
      </div>
    </>
  );
};
export default Dec;
