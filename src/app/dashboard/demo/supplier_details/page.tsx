import {
  GgInfo,
  MaterialSymbolsClose,
  TablerRefresh,
} from "@/components/icons";
import { Button, Input } from "antd";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useActionState, useOptimistic } from "react";

const supplierDetails = () => {
  // const opt = useOptimistic();
  // const actionstatus = useActionState()
  return (
    <>
      <div className="p-6">
        <div className="bg-white p-4 flex text-xs justify-between shadow">
          <div>
            <p>GSTIN - 27AFZPC4455K1ZU</p>
            <p>FY - 2024-25</p>
          </div>
          <div>
            <p>Legal Name - FARZANA MOHAMMED SAYEED CHOUHAN</p>
            <p>Return Period - May</p>
          </div>
          <div>
            <p>Trade Name - TRADER SHIPPING TNOTAI</p>
          </div>
        </div>

        <div className="bg-white p-2 shadow mt-4">
          <div className="bg-blue-500 p-2 text-white">
            B2B Invoices - supplier Details
          </div>
          <div className="text-blue-400 bg-blue-500 bg-opacity-10 border border-blue-300 mt-2 text-sm p-2 flex gap-2 items-center">
            <GgInfo className="text-xl cursor-pointer" />
            <p className="flex-1">
              Instantly download records up-to 500 using Download Documents
              (CSV) option.
            </p>

            <MaterialSymbolsClose className="text-xl cursor-pointer" />
          </div>

          <Table className="border mt-4">
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead className="whitespace-nowrap">
                  SGTIN of Supplier
                </TableHead>
                <TableHead className="whitespace-nowrap text-center">
                  Supplier Name
                </TableHead>
                <TableHead className="text-center">
                  GSTR-1/IFF/GSTR-5 Filing status
                </TableHead>
                <TableHead className="text-center">
                  GSTR-1/IFF/GSTR-5 Filling Date
                </TableHead>
                <TableHead className="text-center">
                  GSTR-1/IFF/GSTR-5 Filing Reriod
                </TableHead>
                <TableHead className="text-center">
                  GSTR-3B filing status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="text-center">07AKBPG2465L1Z5</TableCell>
                <TableCell className="text-center">ARD LOGISTICS</TableCell>
                <TableCell className="text-center">Y</TableCell>
                <TableCell className="text-center">11-Jun-24</TableCell>
                <TableCell className="text-center">May-24</TableCell>
                <TableCell className="text-center">Y</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-center">27AAACG83331R1Z3</TableCell>
                <TableCell className="text-center">
                  GRT Global LOGISTICS PVT LTD
                </TableCell>
                <TableCell className="text-center">Y</TableCell>
                <TableCell className="text-center">11-Jun-24</TableCell>
                <TableCell className="text-center">May-24</TableCell>
                <TableCell className="text-center">Y</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <div className="flex mt-2 gap-2">
            <div className="grow"></div>
            <Button type="default">CANCEL</Button>
            <Button type="primary">CONFIRM</Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default supplierDetails;
