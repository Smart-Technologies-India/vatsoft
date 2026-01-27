"use client";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import CreateFirstStock from "@/action/firststock/firststockcreat";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { commodity_master, dvat04 } from "@prisma/client";
import { Alert, Button, Drawer, Modal, Radio, RadioChangeEvent, Input, Form, Select, Switch } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import AllCommodityMaster from "@/action/commoditymaster/allcommoditymaster";
import GetDvat04ByTin from "@/action/dvat/getdvatbytin";

const FirstStock = () => {
  const router = useRouter();
  const [userid, setUserid] = useState<number>(0);

  const [dvatdata, setDvatData] = useState<dvat04 | null>(null);
  const [isLoading, setLoading] = useState<boolean>(true);
  const [searchTin, setSearchTin] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
      setUserid(authResponse.data);
      setLoading(false);
    };
    init();
  }, []);

  const searchDvat = async () => {
    if (!searchTin || searchTin.trim() === "") {
      toast.error("Please enter TIN number");
      return;
    }
    
    setIsSearching(true);
    const dvat = await GetDvat04ByTin({ tinNumber: searchTin });
    if (dvat.status && dvat.data) {
      setDvatData(dvat.data);
      toast.success("DVAT record found");
    } else {
      toast.error(dvat.message || "DVAT record not found");
      setDvatData(null);
    }
    setIsSearching(false);
  };

  const [stockBox, setStockBox] = useState<boolean>(false);
  const [quantityCount, setQuantityCount] = useState("pcs");

  const onChange = ({ target: { value } }: RadioChangeEvent) => {
    setQuantityCount(value);
  };

  const showCrates = (quantity: number, crate_size: number): string => {
    const crates = Math.floor(quantity / crate_size);
    const pcs = quantity % crate_size;
    if (crates == 0) return `${pcs} Pcs`;
    if (pcs == 0) return `${crates} Crate`;
    return `${crates} Crate ${pcs} Pcs`;
  };

  interface StockData {
    id: number | null;
    item: commodity_master;
    quantity: number;
  }

  const [stock, setStock] = useState<StockData[]>([]);
  const [open, setOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const submit = async () => {
    setOpen(false);
    setAgreed(false);

    const created_data = await CreateFirstStock({
      data: stock,
      dvatid: dvatdata?.id ?? 0,
      createdById: userid,
    });
    if (created_data.status) {
      setStock([]);
      toast.success(created_data.message);
      setDvatData(null);
      setSearchTin("");
    } else {
      toast.error(created_data.message);
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
        placement="right"
        closeIcon={null}
        onClose={() => {
          setStockBox(false);
        }}
        size="large"
        open={stockBox}
      >
        <p className="text-lg text-left mb-4">Add Multiple Products</p>
        <MultipleProductForm
          setAddBox={setStockBox}
          setStock={setStock}
          stock={stock}
          dvatdata={dvatdata}
        />
      </Drawer>

      <main className="w-full p-4">
        <div className="bg-white px-4 py-2 mt-2">
          <p className="text-2xl font-semibold mb-4">First Stock Management</p>

          {/* Search DVAT Section */}
          {!dvatdata && (
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <p className="text-lg font-semibold mb-3">Search DVAT by TIN Number</p>
              <div className="flex gap-2">
                <Input
                  size="large"
                  placeholder="Enter TIN Number"
                  value={searchTin}
                  onChange={(e) => setSearchTin(e.target.value)}
                  onPressEnter={searchDvat}
                  className="flex-1"
                />
                <Button
                  size="large"
                  type="primary"
                  className="bg-blue-500 hover:bg-blue-600"
                  onClick={searchDvat}
                  loading={isSearching}
                >
                  Search
                </Button>
              </div>
            </div>
          )}

          {/* DVAT Details Section */}
          {dvatdata && (
            <>
              <div className="bg-green-50 p-4 rounded-lg mb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">Trade Name</p>
                    <p className="text-lg font-semibold">{dvatdata.tradename}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">TIN Number</p>
                    <p className="text-lg font-semibold">{dvatdata.tinNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Commodity</p>
                    <p className="text-lg font-semibold">{dvatdata.commodity}</p>
                  </div>
                  <Button
                    size="small"
                    danger
                    onClick={() => {
                      setDvatData(null);
                      setStock([]);
                      setSearchTin("");
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 mb-4">
                <p className="text-lg font-semibold items-center">Stock</p>
                <div className="grow"></div>
                <div className="flex gap-2 items-center">
                  <Radio.Group
                    size="small"
                    onChange={onChange}
                    value={quantityCount}
                    optionType="button"
                  >
                    <Radio.Button className="w-20 text-center" value="pcs">
                      {dvatdata?.commodity == "FUEL" ? "Litre" : "Pcs"}
                    </Radio.Button>
                    <Radio.Button className="w-20 text-center" value="crate">
                      Crate
                    </Radio.Button>
                  </Radio.Group>
                </div>
                <Button
                  size="small"
                  type="primary"
                  className="bg-blue-500 hover:bg-blue-500"
                  onClick={() => {
                    setStockBox(true);
                  }}
                >
                  Add Products
                </Button>
              </div>

              <Alert
                message='Note: Add all products with quantities. Once submitted, changes cannot be made.'
                type="warning"
                showIcon
              />

              {stock.length != 0 ? (
                <>
                  <Table className="border mt-2">
                    <TableHeader>
                      <TableRow className="bg-gray-100">
                        <TableHead className="whitespace-nowrap w-14 border text-center p-2">
                          Sr. No.
                        </TableHead>
                        <TableHead className="whitespace-nowrap w-56 border text-center p-2">
                          Product Name
                        </TableHead>
                        <TableHead className="whitespace-nowrap border text-center p-2">
                          {quantityCount == "pcs"
                            ? dvatdata?.commodity == "FUEL"
                              ? "Litres"
                              : "Qty"
                            : "Crate"}
                        </TableHead>
                        <TableHead className="whitespace-nowrap border text-center p-2">
                          Description
                        </TableHead>
                        <TableHead className="whitespace-nowrap border text-center p-2">
                          Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stock.map((val: StockData, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="p-2 border text-center">
                            {index + 1}
                          </TableCell>
                          <TableCell className="p-2 border text-left">
                            {val.item.product_name}
                          </TableCell>
                          <TableCell className="p-2 border text-center">
                            {quantityCount == "pcs"
                              ? val.quantity
                              : showCrates(val.quantity, val.item.crate_size)}
                          </TableCell>
                          <TableCell className="p-2 border text-left">
                            {val.item.description}
                          </TableCell>
                          <TableCell className="p-2 border text-left">
                            <Button
                              size="small"
                              type="primary"
                              danger
                              onClick={async () => {
                                setStock(
                                  stock.filter(
                                    (item) => item.item.id != val.item.id
                                  )
                                );
                              }}
                            >
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="flex mt-2 gap-2">
                    <div className="grow"></div>
                    <Button
                      size="small"
                      type="primary"
                      className="bg-blue-500 hover:bg-blue-500"
                      onClick={async () => {
                        setOpen(true);
                      }}
                    >
                      Submit
                    </Button>
                  </div>
                </>
              ) : (
                <Alert
                  style={{
                    marginTop: "10px",
                    padding: "8px",
                  }}
                  type="error"
                  showIcon
                  description="There is no stock. Click 'Add Products' to add items."
                />
              )}
            </>
          )}
        </div>
      </main>

      <Modal title="Confirmation" open={open} footer={null} closeIcon={false}>
        <div>
          <p>
            I, {dvatdata?.tradename}, holding TIN number {dvatdata?.tinNumber},
            hereby acknowledge that the details entered and the opening stock
            data submitted are accurate and complete to the best of my knowledge.
            I take full responsibility for the accuracy of the data provided.
          </p>
        </div>

        <div className="mt-4 flex items-start gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <input
            type="checkbox"
            id="agreeCheckbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
          />
          <label
            htmlFor="agreeCheckbox"
            className="text-sm text-gray-700 font-medium cursor-pointer select-none"
          >
            I agree to the above statement and confirm that all information
            provided is true and accurate.
          </label>
        </div>

        <div className="flex gap-2 mt-4">
          <div className="grow"></div>
          <button
            className="py-2 rounded-md border border-gray-300 px-4 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            onClick={() => {
              setOpen(false);
              setAgreed(false);
            }}
          >
            Close
          </button>
          {agreed && (
            <button
              onClick={submit}
              className="py-2 rounded-md bg-blue-500 hover:bg-blue-600 px-4 text-sm text-white transition-colors shadow-sm"
            >
              Submit
            </button>
          )}
        </div>
      </Modal>
    </>
  );
};

export default FirstStock;

// Multiple Product Form Component
interface MultipleProductFormProps {
  setStock: React.Dispatch<React.SetStateAction<any[]>>;
  stock: any[];
  setAddBox: React.Dispatch<React.SetStateAction<boolean>>;
  dvatdata: dvat04 | null;
}

const MultipleProductForm = (props: MultipleProductFormProps) => {
  const [commodityMaster, setCommodityMaster] = useState<commodity_master[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<commodity_master[]>([]);
  const [searchText, setSearchText] = useState<string>("");
  const [selectedProducts, setSelectedProducts] = useState<Map<number, { quantity: string; quantityType: string }>>(new Map());

  useEffect(() => {
    const init = async () => {
      const commodity_response = await AllCommodityMaster({});
      if (commodity_response.status && commodity_response.data) {
        let products = commodity_response.data;
        if (props.dvatdata?.commodity == "FUEL") {
          products = products.filter((val) => val.product_type == "FUEL");
        } else {
          products = products.filter((val) => val.product_type != "FUEL");
        }
        setCommodityMaster(products);
        setFilteredProducts(products);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (searchText.trim() === "") {
      setFilteredProducts(commodityMaster);
    } else {
      const filtered = commodityMaster.filter(product =>
        product.product_name.toLowerCase().includes(searchText.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchText, commodityMaster]);

  const handleCheckboxChange = (productId: number, checked: boolean) => {
    const newSelected = new Map(selectedProducts);
    if (checked) {
      newSelected.set(productId, { quantity: "", quantityType: "pcs" });
    } else {
      newSelected.delete(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleQuantityChange = (productId: number, quantity: string) => {
    const newSelected = new Map(selectedProducts);
    const existing = newSelected.get(productId);
    if (existing) {
      newSelected.set(productId, { ...existing, quantity });
      setSelectedProducts(newSelected);
    }
  };

  const handleQuantityTypeChange = (productId: number, quantityType: string) => {
    const newSelected = new Map(selectedProducts);
    const existing = newSelected.get(productId);
    if (existing) {
      newSelected.set(productId, { ...existing, quantityType });
      setSelectedProducts(newSelected);
    }
  };

  const handleSubmit = () => {
    if (selectedProducts.size === 0) {
      toast.error("Please select at least one product");
      return;
    }

    const newStockItems: any[] = [];

    for (const [productId, data] of selectedProducts.entries()) {
      if (!data.quantity || data.quantity === "0") {
        toast.error("Please enter quantity for all selected products");
        return;
      }

      const commodityItem = commodityMaster.find(c => c.id === productId);
      if (!commodityItem) continue;

      // Check if product already exists in stock
      const existingProduct = props.stock.find(item => item.item.id === productId);
      if (existingProduct) {
        toast.error(`${commodityItem.product_name} is already in the stock list`);
        return;
      }

      // Calculate quantity based on type
      const quantity = data.quantityType === "pcs" 
        ? parseInt(data.quantity)
        : parseInt(data.quantity) * commodityItem.crate_size;

      newStockItems.push({
        id: null,
        item: commodityItem,
        quantity: quantity
      });
    }

    if (newStockItems.length > 0) {
      props.setStock([...props.stock, ...newStockItems]);
      toast.success(`${newStockItems.length} product(s) added to stock`);
      props.setAddBox(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Box */}
      <div className="mb-3">
        <Input
          size="large"
          placeholder="Search products..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          prefix={<span className="text-gray-400">🔍</span>}
          allowClear
        />
      </div>

      {/* Product List */}
      <div className="flex-1 overflow-y-auto border rounded-lg bg-gray-50 p-2" style={{ maxHeight: 'calc(100vh - 250px)' }}>
        {filteredProducts.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No products found</div>
        ) : (
          <div className="space-y-1">
            {filteredProducts.map((product) => {
              const isSelected = selectedProducts.has(product.id);
              const productData = selectedProducts.get(product.id);
              const isAlreadyInStock = props.stock.some(item => item.item.id === product.id);

              return (
                <div
                  key={product.id}
                  className={`flex items-center gap-2 p-2 rounded-lg border bg-white hover:bg-blue-50 transition-colors ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  } ${isAlreadyInStock ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => handleCheckboxChange(product.id, e.target.checked)}
                    className="w-4 h-4 shrink-0 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    disabled={isAlreadyInStock}
                  />

                  {/* Product Name */}
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {product.product_name}
                    </p>
                    {product.description && (
                      <p className="text-xs text-gray-500 truncate">{product.description}</p>
                    )}
                  </div>

                  {/* Quantity Input - Only show if selected */}
                  {isSelected && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Input
                        size="small"
                        type="number"
                        placeholder="Qty"
                        value={productData?.quantity}
                        onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                        style={{ width: '70px', height: '28px' }}
                        min="1"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-600 font-medium">
                          {props.dvatdata?.commodity === "FUEL" ? "L" : "Pcs"}
                        </span>
                        <Switch
                          size="small"
                          checked={productData?.quantityType === "crate"}
                          onChange={(checked) => handleQuantityTypeChange(product.id, checked ? "crate" : "pcs")}
                        />
                        <span className="text-xs text-gray-600 font-medium">Crt</span>
                      </div>
                    </div>
                  )}

                  {isAlreadyInStock && (
                    <span className="text-xs text-gray-400 shrink-0">Added</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary and Actions */}
      <div className="mt-3 pt-3 border-t">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-600">
            {selectedProducts.size} product(s) selected
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => props.setAddBox(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="primary"
            className="flex-1 bg-blue-500 hover:bg-blue-600"
            onClick={handleSubmit}
            disabled={selectedProducts.size === 0}
          >
            Add Selected ({selectedProducts.size})
          </Button>
        </div>
      </div>
    </div>
  );
};
