"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import {
  Button,
  Input,
  Form,
  Tabs,
  Card,
  Spin,
  Table,
  DatePicker,
  InputNumber,
  Progress,
  Statistic,
  Row,
  Col,
} from "antd";
import GetReturnsData from "@/action/return/getreturnsdata";
import SearchReturn from "@/action/return/searchreturn";
import { TestReturn, CreateInterestWorking } from "@/action/testreturn";
import { UpdateReturnByDvat } from "@/action/updatereturnbydvat";
import FixReturnsUrnNumber from "@/action/return/fixreturnsurnumber";
import FixReturns from "@/action/fixreturns";
import { Dayjs } from "dayjs";
import ServerTime from "@/action/servertime";

type TabName =
  | "getReturnsData"
  | "interestCalculator"
  | "searchReturns"
  | "testReturn"
  | "updateReturnByDvat"
  | "createInterestWorking"
  | "fixReturnsUrnNumber"
  | "fixDuplicateReturns";

const TestReturnPage = () => {
  const [activeTab, setActiveTab] = useState<TabName>("getReturnsData");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // GetReturnsData state
  const [dvatId, setDvatId] = useState<string>("");

  // Interest Calculator state
  const [interestCalc, setInterestCalc] = useState({
    totalDue: "",
    dueDate: null as Dayjs | null,
    annualRate: "15",
    asOfDate: null as Dayjs | null,
    payments: [] as Array<{ amount: number; date: Dayjs }>,
    newPaymentAmount: "",
    newPaymentDate: null as Dayjs | null,
  });

  // Search Returns state
  const [searchParams, setSearchParams] = useState({
    rrNumber: "",
    userId: "",
    fromDate: null as Dayjs | null,
    toDate: null as Dayjs | null,
  });

  // Test Return state
  const [testReturnId, setTestReturnId] = useState<string>("");

  // Update Return By DVAT state
  const [updateReturnDvatId, setUpdateReturnDvatId] = useState<string>("");

  // Create Interest Working state
  const [createInterestDvatId, setCreateInterestDvatId] = useState<string>("");

  // Fix Returns URN Number state
  const [fixUrnBatchSize, setFixUrnBatchSize] = useState<number>(100);
  const [fixUrnProgress, setFixUrnProgress] = useState<number>(0);

  // Fix Duplicate Returns state
  const [fixDuplicateProgress, setFixDuplicateProgress] = useState<number>(0);

  // Get Returns Data handler
  const handleGetReturnsData = async () => {
    if (!dvatId) {
      toast.error("Please enter DVAT ID");
      return;
    }

    setLoading(true);
    try {
      const response = await GetReturnsData({
        dvatId: parseInt(dvatId),
      });
      setResult(response);

      if (response.status) {
        toast.success("Returns data fetched successfully");
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error("Error: " + error.message);
      setResult({
        status: false,
        data: null,
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate interest handler
  const handleCalculateInterest = () => {
    if (!interestCalc.totalDue || !interestCalc.dueDate) {
      toast.error("Please enter Total Due and Due Date");
      return;
    }

    setLoading(true);
    try {
      // Simple interest calculation (can be expanded with complex payment logic)
      const totalDue = parseFloat(interestCalc.totalDue);
      const dueDate = new Date(interestCalc.dueDate.toDate());
      const asOfDate = interestCalc.asOfDate
        ? new Date(interestCalc.asOfDate.toDate())
        : (ServerTime().data as Date);
      const annualRate = parseFloat(interestCalc.annualRate) || 15;

      const daysDiff = Math.floor(
        (asOfDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      const interest =
        daysDiff > 0 ? (totalDue * annualRate * daysDiff) / (100 * 365) : 0;

      setResult({
        status: true,
        data: {
          totalDue,
          dueDate: dueDate.toISOString(),
          asOfDate: asOfDate.toISOString(),
          daysPassed: Math.max(0, daysDiff),
          annualRate,
          calculatedInterest: Math.max(0, interest),
          payments: interestCalc.payments.map((p) => ({
            amount: p.amount,
            date: p.date.toISOString(),
          })),
        },
        message: "Interest calculated successfully",
      });
      toast.success("Interest calculated successfully");
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Search Returns handler
  const handleSearchReturns = async () => {
    setLoading(true);
    try {
      const response = await SearchReturn({
        rr_number: searchParams.rrNumber || undefined,
        userid: searchParams.userId ? parseInt(searchParams.userId) : undefined,
        fromdate: searchParams.fromDate
          ? new Date(searchParams.fromDate.toDate())
          : undefined,
        todate: searchParams.toDate
          ? new Date(searchParams.toDate.toDate())
          : undefined,
      });
      setResult(response);

      if (response.status) {
        toast.success("Returns searched successfully");
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Test Return handler
  const handleTestReturn = async () => {
    if (!testReturnId) {
      toast.error("Please enter Return ID");
      return;
    }

    setLoading(true);
    try {
      const response = await TestReturn({
        id: parseInt(testReturnId),
      });
      setResult(response);

      if (response.status) {
        toast.success("Test return completed successfully");
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error("Error: " + error.message);
      setResult({
        status: false,
        data: null,
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Update Return By DVAT handler
  const handleUpdateReturnByDvat = async () => {
    if (!updateReturnDvatId) {
      toast.error("Please enter DVAT ID");
      return;
    }

    setLoading(true);
    try {
      const response = await UpdateReturnByDvat({
        dvatId: parseInt(updateReturnDvatId),
      });
      setResult(response);

      if (response.status) {
        toast.success("Returns updated successfully for DVAT user");
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error("Error: " + error.message);
      setResult({
        status: false,
        data: null,
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Create Interest Working handler
  const handleCreateInterestWorking = async () => {
    if (!createInterestDvatId) {
      toast.error("Please enter DVAT ID");
      return;
    }

    setLoading(true);
    try {
      const response = await CreateInterestWorking({
        dvatid: parseInt(createInterestDvatId),
      });
      setResult(response);

      if (response.status) {
        toast.success("Interest working records created successfully");
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error("Error: " + error.message);
      setResult({
        status: false,
        data: null,
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Fix Returns URN Number handler
  const handleFixReturnsUrnNumber = async () => {
    setLoading(true);
    setFixUrnProgress(0);
    setResult(null);

    try {
      // Simulate initial progress
      const progressInterval = setInterval(() => {
        setFixUrnProgress((prev) => {
          if (prev < 85) return prev + Math.random() * 20;
          return prev;
        });
      }, 300);

      const response = await FixReturnsUrnNumber({
        batchSize: fixUrnBatchSize,
      });

      clearInterval(progressInterval);
      setResult(response);

      if (response.status) {
        const data = response.data;
        setFixUrnProgress(100);
        toast.success(
          `Successfully fixed ${data?.totalUpdated} out of ${data?.totalProcessed} records in ${data?.batches.length} batches`,
        );
      } else {
        setFixUrnProgress(0);
        toast.error(response.message);
      }
    } catch (error: any) {
      setFixUrnProgress(0);
      toast.error("Error: " + error.message);
      setResult({
        status: false,
        data: null,
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Fix Duplicate Returns handler
  const handleFixDuplicateReturns = async () => {
    setLoading(true);
    setFixDuplicateProgress(0);
    setResult(null);

    try {
      // Simulate initial progress
      const progressInterval = setInterval(() => {
        setFixDuplicateProgress((prev) => {
          if (prev < 85) return prev + Math.random() * 20;
          return prev;
        });
      }, 300);

      const response = await FixReturns();

      clearInterval(progressInterval);
      setResult(response);

      if (response.status) {
        setFixDuplicateProgress(100);
        toast.success(response.message);
      } else {
        setFixDuplicateProgress(0);
        toast.error(response.message);
      }
    } catch (error: any) {
      setFixDuplicateProgress(0);
      toast.error("Error: " + error.message);
      setResult({
        status: false,
        data: null,
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Add payment to interest calculator
  const handleAddPayment = () => {
    if (!interestCalc.newPaymentAmount || !interestCalc.newPaymentDate) {
      toast.error("Please enter payment amount and date");
      return;
    }

    const newPayment = {
      amount: parseFloat(interestCalc.newPaymentAmount),
      date: interestCalc.newPaymentDate,
    };

    setInterestCalc({
      ...interestCalc,
      payments: [...interestCalc.payments, newPayment],
      newPaymentAmount: "",
      newPaymentDate: null,
    });
    toast.success("Payment added");
  };

  const renderReturnsDataResult = () => {
    if (!result || !result.data || !Array.isArray(result.data)) return null;

    const columns = [
      {
        title: "Period",
        dataIndex: "returnPeriod",
        key: "returnPeriod",
      },
      {
        title: "Entries",
        dataIndex: "entryCount",
        key: "entryCount",
      },
      {
        title: "Challans",
        dataIndex: "challanCount",
        key: "challanCount",
      },
      {
        title: "Output Tax",
        dataIndex: "outputTax",
        key: "outputTax",
        render: (value: number) => value.toFixed(2),
      },
      {
        title: "Input Credit",
        dataIndex: "inputCredit",
        key: "inputCredit",
        render: (value: number) => value.toFixed(2),
      },
      {
        title: "Net Tax",
        dataIndex: "netTax",
        key: "netTax",
        render: (value: number) => (
          <span className={value < 0 ? "text-green-600" : "text-red-600"}>
            {value.toFixed(2)}
          </span>
        ),
      },
      {
        title: "Interest",
        dataIndex: "interest",
        key: "interest",
        render: (value: number) => value.toFixed(2),
      },
      {
        title: "Penalty",
        dataIndex: "penalty",
        key: "penalty",
        render: (value: number) => value.toFixed(2),
      },
      {
        title: "Cash Carry Forward",
        dataIndex: "cashCarryForward",
        key: "cashCarryForward",
        render: (value: number) => value.toFixed(2),
      },
      {
        title: "ITC Carry Forward",
        dataIndex: "itcCarryForward",
        key: "itcCarryForward",
        render: (value: number) => value.toFixed(2),
      },
    ];

    return (
      <div className="space-y-4">
        <Card>
          <Table
            dataSource={result.data}
            columns={columns}
            pagination={{ pageSize: 10 }}
            size="small"
            scroll={{ x: 1200 }}
            rowKey="id"
          />
        </Card>
      </div>
    );
  };

  const renderInterestResult = () => {
    if (!result || !result.data) return null;

    const data = result.data;
    return (
      <Card title="Interest Calculation Result">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded">
              <strong>Total Due:</strong>
              <div className="text-2xl font-bold text-blue-600">
                ₹{data.totalDue?.toFixed(2) || "0.00"}
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded">
              <strong>Days Passed:</strong>
              <div className="text-2xl font-bold text-orange-600">
                {data.daysPassed || 0} days
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded">
              <strong>Annual Rate:</strong>
              <div className="text-2xl font-bold text-green-600">
                {data.annualRate || 0}%
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded">
              <strong>Calculated Interest:</strong>
              <div className="text-2xl font-bold text-red-600">
                ₹{data.calculatedInterest?.toFixed(2) || "0.00"}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded">
            <strong>Due Date:</strong>{" "}
            {new Date(data.dueDate).toLocaleDateString()}
            <br />
            <strong>As Of Date:</strong>{" "}
            {new Date(data.asOfDate).toLocaleDateString()}
          </div>

          {data.payments && data.payments.length > 0 && (
            <Card type="inner" title={`Payments (${data.payments.length})`}>
              <Table
                dataSource={data.payments}
                columns={[
                  {
                    title: "Amount",
                    dataIndex: "amount",
                    key: "amount",
                    render: (value: number) => `₹${value.toFixed(2)}`,
                  },
                  {
                    title: "Date",
                    dataIndex: "date",
                    key: "date",
                    render: (value: string) =>
                      new Date(value).toLocaleDateString(),
                  },
                ]}
                pagination={false}
                size="small"
              />
            </Card>
          )}
        </div>
      </Card>
    );
  };

  const renderSearchResult = () => {
    if (!result || !result.data || !Array.isArray(result.data)) return null;

    const columns = [
      {
        title: "ID",
        dataIndex: "id",
        key: "id",
      },
      {
        title: "RR Number",
        dataIndex: "rr_number",
        key: "rr_number",
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
      },
      {
        title: "Return Type",
        dataIndex: "return_type",
        key: "return_type",
      },
      {
        title: "Year",
        dataIndex: "year",
        key: "year",
      },
      {
        title: "Month",
        dataIndex: "month",
        key: "month",
      },
      {
        title: "Transaction Date",
        dataIndex: "transaction_date",
        key: "transaction_date",
        render: (value: string | null) =>
          value ? new Date(value).toLocaleDateString() : "N/A",
      },
    ];

    return (
      <Card>
        <Table
          dataSource={result.data}
          columns={columns}
          pagination={{ pageSize: 10 }}
          size="small"
          scroll={{ x: 1000 }}
          rowKey="id"
        />
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800">
            Return Actions & Interest Calculator Test
          </h1>
          <p className="text-gray-600 mt-2">
            Test GetReturnsData, Interest Calculations, and Return Search
            functions
          </p>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as TabName)}
          items={[
            {
              key: "getReturnsData",
              label: "Get Returns Data",
              children: (
                <Card>
                  <Form layout="vertical" className="space-y-4">
                    <Form.Item label="DVAT ID" required>
                      <Input
                        placeholder="Enter DVAT04 ID"
                        type="number"
                        value={dvatId}
                        onChange={(e) => setDvatId(e.target.value)}
                      />
                      <small className="text-gray-500">
                        Enter the DVAT04 ID to fetch all returns data
                      </small>
                    </Form.Item>

                    <Button
                      type="primary"
                      onClick={handleGetReturnsData}
                      loading={loading}
                      size="large"
                      block
                    >
                      Fetch Returns Data
                    </Button>
                  </Form>

                  {loading && (
                    <div className="mt-6 flex justify-center">
                      <Spin size="large" />
                    </div>
                  )}

                  {result && activeTab === "getReturnsData" && (
                    <div className="mt-6 space-y-4">
                      <Card
                        type="inner"
                        title="Response Status"
                        style={{
                          backgroundColor: result.status
                            ? "#f6ffed"
                            : "#fff1f0",
                          borderColor: result.status ? "#b7eb8f" : "#ffccc7",
                        }}
                      >
                        <div className="space-y-2">
                          <div>
                            <strong>Status:</strong>{" "}
                            <span
                              className={
                                result.status
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {result.status ? "✓ Success" : "✗ Failed"}
                            </span>
                          </div>
                          <div>
                            <strong>Message:</strong> {result.message}
                          </div>
                          {Array.isArray(result.data) && (
                            <div>
                              <strong>Records Found:</strong>{" "}
                              {result.data.length}
                            </div>
                          )}
                        </div>
                      </Card>

                      {result.status && renderReturnsDataResult()}

                      <Card type="inner" title="Full JSON Response">
                        <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-auto max-h-96 text-xs">
                          {JSON.stringify(result, null, 2)}
                        </pre>
                      </Card>
                    </div>
                  )}
                </Card>
              ),
            },
            {
              key: "interestCalculator",
              label: "Interest Calculator",
              children: (
                <Card>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Form.Item label="Total Due Amount" required>
                        <Input
                          placeholder="Enter total due amount"
                          type="number"
                          value={interestCalc.totalDue}
                          onChange={(e) =>
                            setInterestCalc({
                              ...interestCalc,
                              totalDue: e.target.value,
                            })
                          }
                        />
                      </Form.Item>

                      <Form.Item label="Annual Interest Rate (%)" required>
                        <Input
                          placeholder="Enter annual rate (default 15%)"
                          type="number"
                          value={interestCalc.annualRate}
                          onChange={(e) =>
                            setInterestCalc({
                              ...interestCalc,
                              annualRate: e.target.value,
                            })
                          }
                        />
                      </Form.Item>

                      <Form.Item label="Due Date" required>
                        <DatePicker
                          value={interestCalc.dueDate}
                          onChange={(date) =>
                            setInterestCalc({ ...interestCalc, dueDate: date })
                          }
                          className="w-full"
                        />
                      </Form.Item>

                      <Form.Item label="As Of Date">
                        <DatePicker
                          value={interestCalc.asOfDate}
                          onChange={(date) =>
                            setInterestCalc({ ...interestCalc, asOfDate: date })
                          }
                          className="w-full"
                        />
                      </Form.Item>
                    </div>

                    <Card type="inner" title="Add Payments (Optional)">
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2 items-end">
                          <Form.Item label="Payment Amount">
                            <Input
                              placeholder="Amount"
                              type="number"
                              value={interestCalc.newPaymentAmount}
                              onChange={(e) =>
                                setInterestCalc({
                                  ...interestCalc,
                                  newPaymentAmount: e.target.value,
                                })
                              }
                            />
                          </Form.Item>
                          <Form.Item label="Payment Date">
                            <DatePicker
                              value={interestCalc.newPaymentDate}
                              onChange={(date) =>
                                setInterestCalc({
                                  ...interestCalc,
                                  newPaymentDate: date,
                                })
                              }
                              className="w-full"
                            />
                          </Form.Item>
                          <Button onClick={handleAddPayment} block>
                            Add Payment
                          </Button>
                        </div>

                        {interestCalc.payments.length > 0 && (
                          <div className="mt-4">
                            <strong>
                              Payments Added: {interestCalc.payments.length}
                            </strong>
                            <Table
                              dataSource={interestCalc.payments}
                              columns={[
                                {
                                  title: "Amount",
                                  dataIndex: "amount",
                                  key: "amount",
                                  render: (value: number) =>
                                    `₹${value.toFixed(2)}`,
                                },
                                {
                                  title: "Date",
                                  dataIndex: "date",
                                  key: "date",
                                  render: (value: Dayjs) =>
                                    value.format("DD/MM/YYYY"),
                                },
                                {
                                  title: "Action",
                                  key: "action",
                                  render: (_, __, index) => (
                                    <Button
                                      danger
                                      size="small"
                                      onClick={() => {
                                        setInterestCalc({
                                          ...interestCalc,
                                          payments:
                                            interestCalc.payments.filter(
                                              (_, i) => i !== index,
                                            ),
                                        });
                                      }}
                                    >
                                      Remove
                                    </Button>
                                  ),
                                },
                              ]}
                              pagination={false}
                              size="small"
                            />
                          </div>
                        )}
                      </div>
                    </Card>

                    <Button
                      type="primary"
                      onClick={handleCalculateInterest}
                      loading={loading}
                      size="large"
                      block
                    >
                      Calculate Interest
                    </Button>
                  </div>

                  {loading && (
                    <div className="mt-6 flex justify-center">
                      <Spin size="large" />
                    </div>
                  )}

                  {result && activeTab === "interestCalculator" && (
                    <div className="mt-6 space-y-4">
                      {result.status && renderInterestResult()}

                      <Card type="inner" title="Full JSON Response">
                        <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-auto max-h-96 text-xs">
                          {JSON.stringify(result, null, 2)}
                        </pre>
                      </Card>
                    </div>
                  )}
                </Card>
              ),
            },
            {
              key: "searchReturns",
              label: "Search Returns",
              children: (
                <Card>
                  <Form layout="vertical" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Form.Item label="RR Number (Optional)">
                        <Input
                          placeholder="Enter RR Number"
                          value={searchParams.rrNumber}
                          onChange={(e) =>
                            setSearchParams({
                              ...searchParams,
                              rrNumber: e.target.value,
                            })
                          }
                        />
                      </Form.Item>

                      <Form.Item label="User ID (Optional)">
                        <Input
                          placeholder="Enter User ID"
                          type="number"
                          value={searchParams.userId}
                          onChange={(e) =>
                            setSearchParams({
                              ...searchParams,
                              userId: e.target.value,
                            })
                          }
                        />
                      </Form.Item>

                      <Form.Item label="From Date (Optional)">
                        <DatePicker
                          value={searchParams.fromDate}
                          onChange={(date) =>
                            setSearchParams({ ...searchParams, fromDate: date })
                          }
                          className="w-full"
                        />
                      </Form.Item>

                      <Form.Item label="To Date (Optional)">
                        <DatePicker
                          value={searchParams.toDate}
                          onChange={(date) =>
                            setSearchParams({ ...searchParams, toDate: date })
                          }
                          className="w-full"
                        />
                      </Form.Item>
                    </div>

                    <Button
                      type="primary"
                      onClick={handleSearchReturns}
                      loading={loading}
                      size="large"
                      block
                    >
                      Search Returns
                    </Button>
                  </Form>

                  {loading && (
                    <div className="mt-6 flex justify-center">
                      <Spin size="large" />
                    </div>
                  )}

                  {result && activeTab === "searchReturns" && (
                    <div className="mt-6 space-y-4">
                      <Card
                        type="inner"
                        title="Response Status"
                        style={{
                          backgroundColor: result.status
                            ? "#f6ffed"
                            : "#fff1f0",
                          borderColor: result.status ? "#b7eb8f" : "#ffccc7",
                        }}
                      >
                        <div className="space-y-2">
                          <div>
                            <strong>Status:</strong>{" "}
                            <span
                              className={
                                result.status
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {result.status ? "✓ Success" : "✗ Failed"}
                            </span>
                          </div>
                          <div>
                            <strong>Message:</strong> {result.message}
                          </div>
                          {Array.isArray(result.data) && (
                            <div>
                              <strong>Records Found:</strong>{" "}
                              {result.data.length}
                            </div>
                          )}
                        </div>
                      </Card>

                      {result.status && renderSearchResult()}

                      <Card type="inner" title="Full JSON Response">
                        <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-auto max-h-96 text-xs">
                          {JSON.stringify(result, null, 2)}
                        </pre>
                      </Card>
                    </div>
                  )}
                </Card>
              ),
            },
            {
              key: "testReturn",
              label: "Test Return",
              children: (
                <Card>
                  <Form layout="vertical" className="space-y-4">
                    <Form.Item label="Return ID" required>
                      <Input
                        placeholder="Enter Return ID (returns_01 id)"
                        type="number"
                        value={testReturnId}
                        onChange={(e) => setTestReturnId(e.target.value)}
                      />
                      <small className="text-gray-500">
                        This will mark the return as PAID and create/update
                        returns_01_work and interest_working records
                      </small>
                    </Form.Item>

                    <Button
                      type="primary"
                      onClick={handleTestReturn}
                      loading={loading}
                      size="large"
                      block
                      danger
                    >
                      Execute Test Return
                    </Button>
                  </Form>

                  {loading && (
                    <div className="mt-6 flex justify-center">
                      <Spin size="large" />
                    </div>
                  )}

                  {result && activeTab === "testReturn" && (
                    <div className="mt-6 space-y-4">
                      <Card
                        type="inner"
                        title="Response Status"
                        style={{
                          backgroundColor: result.status
                            ? "#f6ffed"
                            : "#fff1f0",
                          borderColor: result.status ? "#b7eb8f" : "#ffccc7",
                        }}
                      >
                        <div className="space-y-2">
                          <div>
                            <strong>Status:</strong>{" "}
                            <span
                              className={
                                result.status
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {result.status ? "✓ Success" : "✗ Failed"}
                            </span>
                          </div>
                          <div>
                            <strong>Message:</strong> {result.message}
                          </div>
                          {result.data && (
                            <div>
                              <strong>Return ID:</strong> {result.data.id}
                            </div>
                          )}
                        </div>
                      </Card>

                      <Card type="inner" title="Full JSON Response">
                        <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-auto max-h-96 text-xs">
                          {JSON.stringify(result, null, 2)}
                        </pre>
                      </Card>
                    </div>
                  )}
                </Card>
              ),
            },
            {
              key: "updateReturnByDvat",
              label: "Update Return By DVAT",
              children: (
                <Card>
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded">
                      <h3 className="font-bold text-blue-800 mb-2">
                        📊 Update Returns for Single DVAT User
                      </h3>
                      <p className="text-blue-700 text-sm">
                        This will process and update all PAID returns for a specific DVAT user. It calculates R4/R5 turnover, net tax, interest, and penalty, then updates the returns_01_work table with computed values.
                      </p>
                    </div>

                    <Form layout="vertical" className="space-y-4">
                      <Form.Item label="DVAT ID" required>
                        <Input
                          placeholder="Enter DVAT04 ID"
                          type="number"
                          value={updateReturnDvatId}
                          onChange={(e) => setUpdateReturnDvatId(e.target.value)}
                        />
                        <small className="text-gray-500">
                          Enter the specific DVAT ID to update all their PAID returns (ORIGINAL or REVISED type only)
                        </small>
                      </Form.Item>

                      <Button
                        type="primary"
                        onClick={handleUpdateReturnByDvat}
                        loading={loading}
                        size="large"
                        block
                        danger
                      >
                        Update Returns for DVAT User
                      </Button>
                    </Form>

                    {loading && (
                      <div className="mt-6 flex justify-center">
                        <Spin size="large" />
                      </div>
                    )}

                    {result && activeTab === "updateReturnByDvat" && (
                      <div className="mt-6 space-y-4">
                        <Card
                          type="inner"
                          title="Response Status"
                          style={{
                            backgroundColor: result.status
                              ? "#f6ffed"
                              : "#fff1f0",
                            borderColor: result.status ? "#b7eb8f" : "#ffccc7",
                          }}
                        >
                          <div className="space-y-2">
                            <div>
                              <strong>Status:</strong>{" "}
                              <span
                                className={
                                  result.status
                                    ? "text-green-600"
                                    : "text-red-600"
                                }
                              >
                                {result.status ? "✓ Success" : "✗ Failed"}
                              </span>
                            </div>
                            <div>
                              <strong>Message:</strong> {result.message}
                            </div>
                            {result.data && (
                              <div>
                                <strong>Last Processed Return ID:</strong>{" "}
                                {result.data.id}
                              </div>
                            )}
                          </div>
                        </Card>

                        <Card type="inner" title="Full JSON Response">
                          <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-auto max-h-96 text-xs">
                            {JSON.stringify(result, null, 2)}
                          </pre>
                        </Card>
                      </div>
                    )}
                  </div>
                </Card>
              ),
            },
            {
              key: "createInterestWorking",
              label: "Create Interest Working",
              children: (
                <Card>
                  <Form layout="vertical" className="space-y-4">
                    <Form.Item label="DVAT ID" required>
                      <Input
                        placeholder="Enter DVAT04 ID"
                        type="number"
                        value={createInterestDvatId}
                        onChange={(e) =>
                          setCreateInterestDvatId(e.target.value)
                        }
                      />
                      <small className="text-gray-500">
                        This will create interest_working records for all PAID
                        challans of this DVAT ID
                      </small>
                    </Form.Item>

                    <Button
                      type="primary"
                      onClick={handleCreateInterestWorking}
                      loading={loading}
                      size="large"
                      block
                      danger
                    >
                      Create Interest Working Records
                    </Button>
                  </Form>

                  {loading && (
                    <div className="mt-6 flex justify-center">
                      <Spin size="large" />
                    </div>
                  )}

                  {result && activeTab === "createInterestWorking" && (
                    <div className="mt-6 space-y-4">
                      <Card
                        type="inner"
                        title="Response Status"
                        style={{
                          backgroundColor: result.status
                            ? "#f6ffed"
                            : "#fff1f0",
                          borderColor: result.status ? "#b7eb8f" : "#ffccc7",
                        }}
                      >
                        <div className="space-y-2">
                          <div>
                            <strong>Status:</strong>{" "}
                            <span
                              className={
                                result.status
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {result.status ? "✓ Success" : "✗ Failed"}
                            </span>
                          </div>
                          <div>
                            <strong>Message:</strong> {result.message}
                          </div>
                          {result.data && (
                            <div>
                              <strong>DVAT ID:</strong> {result.data.id}
                            </div>
                          )}
                        </div>
                      </Card>

                      <Card type="inner" title="Full JSON Response">
                        <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-auto max-h-96 text-xs">
                          {JSON.stringify(result, null, 2)}
                        </pre>
                      </Card>
                    </div>
                  )}
                </Card>
              ),
            },
            {
              key: "fixReturnsUrnNumber",
              label: "Fix Returns URN Number",
              children: (
                <Card>
                  <div className="space-y-6">
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
                      <h3 className="font-bold text-yellow-800 mb-2">
                        ⚠️ Fix Returns Entry URN Numbers
                      </h3>
                      <p className="text-yellow-700 text-sm">
                        This will update returns_entry table to sync URN numbers
                        from daily_sale table where they don&apos;t match. It
                        processes all matching records in configurable batches
                        to avoid timeouts.
                      </p>
                    </div>

                    <Form layout="vertical" className="space-y-4">
                      <Form.Item label="Batch Size" required>
                        <InputNumber
                          min={10}
                          max={500}
                          value={fixUrnBatchSize}
                          onChange={(value) => setFixUrnBatchSize(value || 100)}
                          placeholder="Enter batch size (default: 100)"
                        />
                        <small className="text-gray-500">
                          Number of records to process per batch. Higher values
                          process faster but use more resources.
                        </small>
                      </Form.Item>

                      <Button
                        type="primary"
                        onClick={handleFixReturnsUrnNumber}
                        loading={loading}
                        size="large"
                        block
                        danger
                      >
                        {loading
                          ? "Processing..."
                          : "Start Fixing Returns URN Numbers"}
                      </Button>
                    </Form>

                    {loading && (
                      <div className="space-y-4">
                        <Card
                          type="inner"
                          title="Processing Progress"
                          style={{ borderColor: "#1890ff" }}
                        >
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-700 font-medium">
                                Processing batches...
                              </span>
                              <span className="text-blue-600 font-bold">
                                In Progress
                              </span>
                            </div>
                            <Progress
                              percent={fixUrnProgress}
                              status="active"
                              strokeColor={{
                                "0%": "#108ee9",
                                "100%": "#87d068",
                              }}
                              format={(percent) => `${percent}%`}
                            />
                            <div className="bg-blue-50 p-3 rounded flex items-center gap-2">
                              <Spin size="small" />
                              <p className="text-blue-700 text-sm">
                                Please wait while batches are being processed...
                              </p>
                            </div>
                          </div>
                        </Card>
                      </div>
                    )}

                    {result && activeTab === "fixReturnsUrnNumber" && (
                      <div className="mt-6 space-y-4">
                        <Card
                          type="inner"
                          title="Response Status"
                          style={{
                            backgroundColor: result.status
                              ? "#f6ffed"
                              : "#fff1f0",
                            borderColor: result.status ? "#b7eb8f" : "#ffccc7",
                          }}
                        >
                          <div className="space-y-4">
                            <div>
                              <strong>Status:</strong>{" "}
                              <span
                                className={
                                  result.status
                                    ? "text-green-600"
                                    : "text-red-600"
                                }
                              >
                                {result.status ? "✓ Success" : "✗ Failed"}
                              </span>
                            </div>
                            <div>
                              <strong>Message:</strong> {result.message}
                            </div>

                            {result.data && (
                              <div className="space-y-4">
                                <Row gutter={16}>
                                  <Col xs={12} sm={8}>
                                    <Statistic
                                      title="Total Processed"
                                      value={result.data.totalProcessed}
                                      valueStyle={{ color: "#1890ff" }}
                                    />
                                  </Col>
                                  <Col xs={12} sm={8}>
                                    <Statistic
                                      title="Total Updated"
                                      value={result.data.totalUpdated}
                                      valueStyle={{ color: "#52c41a" }}
                                    />
                                  </Col>
                                  <Col xs={12} sm={8}>
                                    <Statistic
                                      title="Batches Executed"
                                      value={result.data.batches?.length || 0}
                                      valueStyle={{ color: "#faad14" }}
                                    />
                                  </Col>
                                </Row>

                                <div className="bg-green-50 p-4 rounded border border-green-200">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium text-green-800">
                                      Overall Completion
                                    </span>
                                    <span className="text-green-600 font-bold">
                                      100%
                                    </span>
                                  </div>
                                  <Progress
                                    percent={100}
                                    strokeColor="#52c41a"
                                    format={(percent) => `${percent}%`}
                                  />
                                  <div className="mt-3 text-sm text-green-700">
                                    <p>✓ Successfully processed all batches</p>
                                    <p className="mt-1">
                                      Success Rate:{" "}
                                      {result.data.totalProcessed > 0
                                        ? (
                                            (result.data.totalUpdated /
                                              result.data.totalProcessed) *
                                            100
                                          ).toFixed(2)
                                        : 0}
                                      %
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </Card>

                        {result.data?.batches &&
                          result.data.batches.length > 0 && (
                            <Card
                              type="inner"
                              title={`Batch Progress (${result.data.batches.length} batches completed)`}
                              style={{ borderColor: "#52c41a" }}
                            >
                              <div className="space-y-3 max-h-96 overflow-y-auto">
                                {result.data.batches.map(
                                  (batch: any, index: number) => {
                                    const successRate =
                                      batch.processed > 0
                                        ? (batch.updated / batch.processed) *
                                          100
                                        : 0;
                                    return (
                                      <div
                                        key={batch.batchNumber}
                                        className="p-3 bg-gray-50 rounded border border-gray-200"
                                      >
                                        <div className="flex justify-between items-center mb-2">
                                          <span className="font-medium text-gray-700">
                                            Batch {batch.batchNumber}
                                            <span className="ml-2 text-xs text-gray-500">
                                              ({batch.processed} records)
                                            </span>
                                          </span>
                                          <span
                                            className={`text-sm font-bold ${batch.error ? "text-red-600" : "text-green-600"}`}
                                          >
                                            {batch.error
                                              ? "❌ Failed"
                                              : "✓ Success"}
                                          </span>
                                        </div>
                                        <Progress
                                          percent={successRate}
                                          strokeColor={
                                            batch.error ? "#ff7875" : "#52c41a"
                                          }
                                          size="small"
                                          format={(percent) =>
                                            `${batch.updated}/${batch.processed}`
                                          }
                                        />
                                      </div>
                                    );
                                  },
                                )}
                              </div>
                            </Card>
                          )}

                        {result.data?.batches &&
                          result.data.batches.length > 0 && (
                            <Card
                              type="inner"
                              title={`Batch Details Table (${result.data.batches.length})`}
                            >
                              <Table
                                dataSource={result.data.batches}
                                columns={[
                                  {
                                    title: "Batch #",
                                    dataIndex: "batchNumber",
                                    key: "batchNumber",
                                    width: 80,
                                  },
                                  {
                                    title: "Processed",
                                    dataIndex: "processed",
                                    key: "processed",
                                    width: 100,
                                  },
                                  {
                                    title: "Updated",
                                    dataIndex: "updated",
                                    key: "updated",
                                    width: 100,
                                  },
                                  {
                                    title: "Status",
                                    dataIndex: "error",
                                    key: "status",
                                    render: (error: string | undefined) => (
                                      <span
                                        className={
                                          error
                                            ? "text-red-600"
                                            : "text-green-600"
                                        }
                                      >
                                        {error ? "❌ Failed" : "✓ Success"}
                                      </span>
                                    ),
                                  },
                                ]}
                                pagination={{ pageSize: 10 }}
                                size="small"
                                rowKey="batchNumber"
                              />
                            </Card>
                          )}

                        {result.data?.failedBatches &&
                          result.data.failedBatches.length > 0 && (
                            <Card
                              type="inner"
                              title="Failed Batches"
                              style={{ borderColor: "#ff7875" }}
                            >
                              <Table
                                dataSource={result.data.failedBatches}
                                columns={[
                                  {
                                    title: "Batch #",
                                    dataIndex: "batchNumber",
                                    key: "batchNumber",
                                  },
                                  {
                                    title: "Error",
                                    dataIndex: "error",
                                    key: "error",
                                    render: (error: string) => (
                                      <span className="text-red-600 text-xs">
                                        {error}
                                      </span>
                                    ),
                                  },
                                ]}
                                pagination={{ pageSize: 5 }}
                                size="small"
                                rowKey="batchNumber"
                              />
                            </Card>
                          )}

                        <Card type="inner" title="Full JSON Response">
                          <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-auto max-h-96 text-xs">
                            {JSON.stringify(result, null, 2)}
                          </pre>
                        </Card>
                      </div>
                    )}
                  </div>
                </Card>
              ),
            },
            {
              key: "fixDuplicateReturns",
              label: "Fix Duplicate Returns",
              children: (
                <Card>
                  <div className="space-y-6">
                    <div className="bg-red-50 border border-red-200 p-4 rounded">
                      <h3 className="font-bold text-red-800 mb-2">
                        🧹 Clean Duplicate Return Entries
                      </h3>
                      <p className="text-red-700 text-sm">
                        This will find and remove duplicate return entries while keeping the first record. It will extract invoice amounts from deleted records and group them by returns_01Id for later adjustment of return values.
                      </p>
                    </div>

                    <Button
                      type="primary"
                      danger
                      onClick={handleFixDuplicateReturns}
                      loading={loading}
                      size="large"
                      block
                    >
                      {loading ? "Processing..." : "Start Fixing Duplicate Returns"}
                    </Button>

                    {loading && (
                      <div className="space-y-4">
                        <Card
                          type="inner"
                          title="Processing Progress"
                          style={{ borderColor: "#ff4d4f" }}
                        >
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-700 font-medium">
                                Scanning and removing duplicates...
                              </span>
                              <span className="text-red-600 font-bold">
                                In Progress
                              </span>
                            </div>
                            <Progress
                              percent={fixDuplicateProgress}
                              status="active"
                              strokeColor={{
                                "0%": "#ff4d4f",
                                "100%": "#52c41a",
                              }}
                              format={(percent) => `${percent}%`}
                            />
                            <div className="bg-red-50 p-3 rounded flex items-center gap-2">
                              <Spin size="small" />
                              <p className="text-red-700 text-sm">
                                Please wait while duplicates are being processed...
                              </p>
                            </div>
                          </div>
                        </Card>
                      </div>
                    )}

                    {result && activeTab === "fixDuplicateReturns" && (
                      <div className="mt-6 space-y-4">
                        <Card
                          type="inner"
                          title="Response Status"
                          style={{
                            backgroundColor: result.status
                              ? "#f6ffed"
                              : "#fff1f0",
                            borderColor: result.status ? "#b7eb8f" : "#ffccc7",
                          }}
                        >
                          <div className="space-y-4">
                            <div>
                              <strong>Status:</strong>{" "}
                              <span
                                className={
                                  result.status
                                    ? "text-green-600"
                                    : "text-red-600"
                                }
                              >
                                {result.status ? "✓ Success" : "✗ Failed"}
                              </span>
                            </div>
                            <div>
                              <strong>Message:</strong> {result.message}
                            </div>

                            {result.data && (
                              <div className="space-y-4">
                                <Row gutter={16}>
                                  <Col xs={12} sm={8}>
                                    <Statistic
                                      title="Duplicate Groups"
                                      value={result.data.total_groups}
                                      valueStyle={{ color: "#ff4d4f" }}
                                    />
                                  </Col>
                                  <Col xs={12} sm={8}>
                                    <Statistic
                                      title="Total Deleted"
                                      value={result.data.total_deleted}
                                      valueStyle={{ color: "#fa541c" }}
                                    />
                                  </Col>
                                  <Col xs={12} sm={8}>
                                    <Statistic
                                      title="Total Kept"
                                      value={result.data.total_kept}
                                      valueStyle={{ color: "#52c41a" }}
                                    />
                                  </Col>
                                </Row>

                                {result.data.deleted_invoices_by_return &&
                                  result.data.deleted_invoices_by_return
                                    .length > 0 && (
                                    <Card
                                      type="inner"
                                      title={`Deleted Invoice Amounts by Return (${result.data.deleted_invoices_by_return.length} returns affected)`}
                                      style={{ borderColor: "#faad14" }}
                                    >
                                      <div className="space-y-4 max-h-96 overflow-y-auto">
                                        {result.data.deleted_invoices_by_return.map(
                                          (invoiceGroup: any, index: number) => (
                                            <div
                                              key={index}
                                              className="p-4 bg-orange-50 rounded border border-orange-200"
                                            >
                                              <div className="flex justify-between items-center mb-3">
                                                <div>
                                                  <span className="font-bold text-orange-800">
                                                    Returns_01 ID:{" "}
                                                    {invoiceGroup.returns_01Id}
                                                  </span>
                                                  <span className="ml-4 text-sm text-orange-700">
                                                    {invoiceGroup.deleted_count}{" "}
                                                    duplicate{
                                                      invoiceGroup.deleted_count >
                                                      1
                                                        ? "s"
                                                        : ""
                                                    }{" "}
                                                    deleted
                                                  </span>
                                                </div>
                                              </div>
                                              <div className="bg-white p-3 rounded border border-orange-100">
                                                <strong className="text-sm text-gray-600">
                                                  Deleted Invoice Amounts:
                                                </strong>
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                  {invoiceGroup.total_invoice_number.map(
                                                    (
                                                      amount: number,
                                                      idx: number,
                                                    ) => (
                                                      <span
                                                        key={idx}
                                                        className="inline-block bg-orange-100 text-orange-800 px-3 py-1 rounded text-sm font-mono"
                                                      >
                                                        ₹
                                                        {amount.toFixed(2)}
                                                      </span>
                                                    ),
                                                  )}
                                                </div>
                                                <div className="mt-3 pt-3 border-t border-orange-100">
                                                  <span className="text-sm text-gray-700">
                                                    <strong>Total Amount:</strong>{" "}
                                                    ₹
                                                    {invoiceGroup.total_invoice_number
                                                      .reduce(
                                                        (
                                                          sum: number,
                                                          amt: number,
                                                        ) => sum + amt,
                                                        0,
                                                      )
                                                      .toFixed(2)}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          ),
                                        )}
                                      </div>
                                    </Card>
                                  )}
                              </div>
                            )}
                          </div>
                        </Card>

                        <Card type="inner" title="Full JSON Response">
                          <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-auto max-h-96 text-xs">
                            {JSON.stringify(result, null, 2)}
                          </pre>
                        </Card>
                      </div>
                    )}
                  </div>
                </Card>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
};

export default TestReturnPage;
