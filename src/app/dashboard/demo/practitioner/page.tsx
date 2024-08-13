import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const Refund = () => {
  return (
    <main className="p-6">
      <div className="w-full bg-white p-4">
        <Table className="border mt-2">
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead className="whitespace-nowrap w-64 border">
                Date and Day
              </TableHead>
              <TableHead className="whitespace-nowrap border">
                Description
              </TableHead>
              <TableHead className="whitespace-nowrap border">
                State/Centre
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell
                className="p-1 border text-left bg-gray-100"
                colSpan={3}
              >
                Jan
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="p-2 border text-center">
                06/01/2024, Saturday
              </TableCell>
              <TableCell className="p-2 border text-center">Saturday</TableCell>
              <TableCell className="p-2 border text-center">Centre</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="p-2 border text-center">
                14/01/2024, Sunday
              </TableCell>
              <TableCell className="p-2 border text-center">Sunday</TableCell>
              <TableCell className="p-2 border text-center">
                Gujarat/Center
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="p-2 border text-center">
                20/01/2024, Saturday
              </TableCell>
              <TableCell className="p-2 border text-center">Saturday</TableCell>
              <TableCell className="p-2 border text-center">Centre</TableCell>
            </TableRow>
            <TableRow>
              <TableCell
                className="p-1 border text-left bg-gray-100"
                colSpan={3}
              >
                Feb
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="p-2 border text-center">
                06/01/2024, Saturday
              </TableCell>
              <TableCell className="p-2 border text-center">Saturday</TableCell>
              <TableCell className="p-2 border text-center">Centre</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="p-2 border text-center">
                14/01/2024, Sunday
              </TableCell>
              <TableCell className="p-2 border text-center">Sunday</TableCell>
              <TableCell className="p-2 border text-center">
                Gujarat/Center
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="p-2 border text-center">
                20/01/2024, Saturday
              </TableCell>
              <TableCell className="p-2 border text-center">Saturday</TableCell>
              <TableCell className="p-2 border text-center">Centre</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </main>
  );
};

export default Refund;
