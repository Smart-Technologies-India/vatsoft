"use client";

import SearchHSNCode from "@/action/hsncode/searchhsncode";
import SearchParctitioner from "@/action/parctitioner/searchparctitioner";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { hsncode } from "@prisma/client";
import { Button, Input, InputRef, Radio, RadioChangeEvent } from "antd";
import { useRef, useState } from "react";
import { toast } from "react-toastify";

const HSNCode = () => {
  enum SearchOption {
    HSN,
    DESCRIPTION,
  }

  const [searchOption, setSeachOption] = useState<SearchOption>(
    SearchOption.HSN
  );

  const onChange = (e: RadioChangeEvent) => {
    setSeachOption(e.target.value);
  };

  const [isSearch, setSearch] = useState<boolean>(false);
  const init = async () => {
    setSearch(false);
  };

  const [HSNCodeData, setHSNCodeData] = useState<hsncode>();

  const hsnRef = useRef<InputRef>(null);
  const descriptionRef = useRef<InputRef>(null);
  const hsnsearch = async () => {
    if (
      hsnRef.current?.input?.value == undefined ||
      hsnRef.current?.input?.value == null ||
      hsnRef.current?.input?.value == ""
    ) {
      return toast.error("Enter HSN Code");
    }
    const search_response = await SearchHSNCode({
      hsncode: hsnRef.current?.input?.value,
    });

    if (search_response.status && search_response.data) {
      setHSNCodeData(search_response.data);
      setSearch(true);
    }
  };
  const descriptionsearch = async () => {
    if (
      descriptionRef.current?.input?.value == undefined ||
      descriptionRef.current?.input?.value == null ||
      descriptionRef.current?.input?.value == ""
    ) {
      return toast.error("Enter Description");
    }
    const search_response = await SearchHSNCode({
      description: hsnRef.current?.input?.value,
    });

    if (search_response.status && search_response.data) {
      setHSNCodeData(search_response.data);
      setSearch(true);
    }
  };

  return (
    <main className="p-3 py-2">
      <div className="bg-white p-2 shadow mt-4">
        <div className="flex gap-2">
          <p className="text-lg font-semibold">Search HSN Code</p>
          <div className="grow"></div>
          <p>
            <span className="text-rose-500">*</span> Indicates mandatory fields
          </p>
        </div>
        <div className="p-2 bg-gray-50 mt-2 flex flex-col md:flex-row lg:gap-2 lg:items-center">
          <Radio.Group
            onChange={onChange}
            value={searchOption}
            className="mt-2"
            disabled={isSearch}
          >
            <Radio value={SearchOption.HSN}>HSN</Radio>
            <Radio value={SearchOption.DESCRIPTION}>Description</Radio>
          </Radio.Group>
          {(() => {
            switch (searchOption) {
              case SearchOption.HSN:
                return (
                  <div className="flex gap-2">
                    <Input
                      className="w-60"
                      ref={hsnRef}
                      placeholder={"Enter HSN Code"}
                      disabled={isSearch}
                    />

                    {isSearch ? (
                      <Button onClick={init} type="primary">
                        Reset
                      </Button>
                    ) : (
                      <Button onClick={hsnsearch} type="primary">
                        Search
                      </Button>
                    )}
                  </div>
                );
              case SearchOption.DESCRIPTION:
                return (
                  <div className="flex gap-2">
                    <Input
                      className="w-60"
                      ref={descriptionRef}
                      placeholder={"Enter Descrilption"}
                      disabled={isSearch}
                    />

                    {isSearch ? (
                      <Button onClick={init} type="primary">
                        Reset
                      </Button>
                    ) : (
                      <Button onClick={descriptionsearch} type="primary">
                        Search
                      </Button>
                    )}
                  </div>
                );
              default:
                return null;
            }
          })()}
        </div>
        {isSearch && (
          <>
            <div>
              <Table className="border mt-6">
                <TableBody>
                  <TableRow>
                    <TableCell className="text-center w-60 p-2 border  font-semibold">
                      Chapter Head
                    </TableCell>
                    <TableCell className="text-center p-2 border">
                      {HSNCodeData?.head}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-center w-60 p-2 border  font-semibold">
                      Description
                    </TableCell>
                    <TableCell className="text-center p-2 border">
                      {HSNCodeData?.description}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <Table className="border mt-6">
                <TableBody>
                  <TableRow>
                    <TableCell className="text-center w-60 p-2 border  font-semibold">
                      HSN Code
                    </TableCell>
                    <TableCell className="text-center p-2 border">
                      {HSNCodeData?.hsncode}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <Table className="border mt-6">
                <TableBody>
                  <TableRow>
                    <TableCell className="text-center w-60 p-2 border font-semibold">
                      Technical Description
                    </TableCell>
                    <TableCell className="text-center p-2 border">
                      {HSNCodeData?.tech_description}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <Table className="border mt-6">
                <TableBody>
                  <TableRow>
                    <TableCell
                      className="text-center w-60 p-2 border font-semibold"
                      rowSpan={3}
                    >
                      Commonly used Trade Description(s)
                    </TableCell>
                    <TableCell className="text-center p-2 border">
                      {HSNCodeData?.trade1}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-center p-2 border">
                      {HSNCodeData?.trade2}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-center p-2 border">
                      {HSNCodeData?.trade3}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </>
        )}

        <p className="text-sm text-blue-600 mt-2">
          Download HSN Directory In Excel Format
        </p>
        <p className="text-sm font-semibold my-2">
          <span className="text-rose-500">Node: </span>
          If HSN of any Goods/Service is otherwise valid but not available here,
          kindly raise a ticket on VAT Self-service Portal:
          <a href="#" className="text-blue-500 px-2 font-normal">
            https://vatsmart.in
          </a>
        </p>
        <p className="text-sm font-semibold">Disclaimer:</p>
        <ol className="text-xs space-y-1 list-decimal ml-6 mt-1">
          <li>
            The revamped Search HSN tool algorithm is based on Artificial
            Intelligence and Machine Language linked with e-invoice declaration
            database. Stated differently, the Search tool matches the queried
            HSN or description with those used by other taxpayers at the time of
            generating e- invoice. The facility therefore provides prevailing
            practice of HSN/ description used by IRN-generating taxpayers.
          </li>
          <li>
            The Technical Description and corresponding Commonly used Trade
            description displayed here is as per the HSN description in the
            Customs Tariff Act, 1975 corresponding to the Trade description
            which are widely used by trade in genera! and are as per the
            declarations made by taxpayers&apos; at the IRN portal and the
            output displayed is dependent on the input provided by the user.
            These descriptions as part of Search HSN facility have been provided
            purely as a measure of Taxpayers&apos; facilitation and are not
            legally binding on the VAT department
          </li>
          <li>
            Though all efforts have been made to ensure the accuracy and
            currency Of the Search HSN facility, the same should not be
            construed as a statement Of law or used for any !ega/ purposes or
            any litigation as a legal and binding advice from the VAT
            department. VAT department hereby expressly disowns and repudiates
            any claims or liabilities (including but not limited to any third
            party claim or liability, of any nature,
          </li>
        </ol>
      </div>
    </main>
  );
};

export default HSNCode;
