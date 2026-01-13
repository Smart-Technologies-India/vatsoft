"use client";
import uploadPhoto from "@/action/test";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { longtext } from "@/utils/methods";
import Link from "next/link";
import { useRef, useState } from "react";
import { toast } from "react-toastify";

export default function Home() {
  const [womenfile, setWomenFile] = useState<File | null>(null);
  const cWomenFile = useRef<HTMLInputElement>(null);
  const uploadFile = async () => {
    
    if (womenfile == null) {
      toast.error("Please select a file to upload", { theme: "light" });
      return;
    }

    const formdata = new FormData();
    formdata.append("name", "somu");
    formdata.append("age", "23");
    formdata.append("file", womenfile);

    const photoresponse = await uploadPhoto(formdata);

    // var formdata = new FormData();
    // formdata.append("files", womenfile);

    // var requestOptions = { method: "POST", body: formdata };

    // const response = await fetch("/api/upload/", requestOptions);
    // const result = await response.text();
  };
  return (
    <>
      <div className="bg-rose-500 py-2 text-center text-white">
        this is just a test
      </div>

      <DocUploader
        title="Aadhar Card/Pan Card/Passport"
        file={womenfile}
        setFile={setWomenFile}
        cFile={cWomenFile}
      />
      <div className="relative">
        {/* <Image src="/file/upload.jpg" width={300} height={300} alt="error" /> */}
      </div>

      <button onClick={uploadFile}>Upload file</button>
    </>
  );
}

interface DocUploaderProps {
  title: string;
  file: File | null;
  setFile: React.Dispatch<React.SetStateAction<File | null>>;
  cFile: React.RefObject<HTMLInputElement | null>;
}

const DocUploader = (props: DocUploaderProps) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (selectedFile) {
      const fileSize = selectedFile.size / (1024 * 1024);

      if (fileSize < 5) {
        if (
          selectedFile.type.startsWith("image/") ||
          selectedFile.type.startsWith("application/pdf")
        ) {
          props.setFile(selectedFile);
        } else {
          toast.error("Please select an image or pdf file.", {
            theme: "light",
          });
        }
      } else {
        toast.error("File size must be less than 5 MB.", { theme: "light" });
      }
    }
  };

  return (
    <div className="flex gap-4 mt-2 items-center bg-gray-100 px-2 py-2 rounded-sm">
      <Label htmlFor="termfile">{props.title}</Label>
      <div className="grow"></div>
      <p className="text-sm">
        {props.file != null
          ? longtext(props.file.name, 10)
          : "No File Selected"}
      </p>
      <Button
        onClick={() => props.cFile.current?.click()}
        variant={"secondary"}
        className="bg-gray-200 hover:bg-gray-300 h-8"
      >
        {props.file == null ? "Upload File" : "Change File"}
      </Button>
      {props.file != null && (
        <Link
          target="_blank"
          href={URL.createObjectURL(props.file!)}
          className="bg-gray-200 text-black py-1 px-4 rounded-md text-sm h-8 grid place-items-center"
        >
          View File
        </Link>
      )}

      <div className="hidden">
        <Input
          type="file"
          ref={props.cFile}
          accept="*/*"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};
