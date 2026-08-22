"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { Button, Input, Form, Tabs, Card, Spin, Table, Space, Select, DatePicker, InputNumber } from "antd";
import GetReturnsData, { type ReturnsData } from "@/action/return/getreturnsdata";
import SearchReturn from "@/action/return/searchreturn";
import { TestReturn, CreateInterestWorking } from "@/action/testreturn";
import dayjs, { Dayjs } from "dayjs";

type TabName = "getReturnsData" | "interestCalculator" | "searchReturns" | "testReturn" | "createInterestWorking";

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

  // Create Interest Working state
  const [createInterestDvatId, setCreateInterestDvatId] = useState<string>("");

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
      const asOfDate = interestCalc.asOfDate ? new Date(interestCalc.asOfDate.toDate()) : new Date();
      const annualRate = parseFloat(interestCalc.annualRate) || 15;

      const daysDiff = Math.floor((asOfDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const interest = daysDiff > 0 ? (totalDue * annualRate * daysDiff) / (100 * 365) : 0;

      setResult({
        status: true,
        data: {
          totalDue,
          dueDate: dueDate.toISOString(),
          asOfDate: asOfDate.toISOString(),
          daysPassed: Math.max(0, daysDiff),
          annualRate,
          calculatedInterest: Math.max(0, interest),
          payments: interestCalc.payments.map(p => ({
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
        fromdate: searchParams.fromDate ? new Date(searchParams.fromDate.toDate()) : undefined,
        todate: searchParams.toDate ? new Date(searchParams.toDate.toDate()) : undefined,
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
            <strong>Due Date:</strong> {new Date(data.dueDate).toLocaleDateString()}
            <br />
            <strong>As Of Date:</strong> {new Date(data.asOfDate).toLocaleDateString()}
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
                    render: (value: string) => new Date(value).toLocaleDateString(),
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
        render: (value: string | null) => value ? new Date(value).toLocaleDateString() : "N/A",
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
            Test GetReturnsData, Interest Calculations, and Return Search functions
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
                          backgroundColor: result.status ? "#f6ffed" : "#fff1f0",
                          borderColor: result.status ? "#b7eb8f" : "#ffccc7",
                        }}
                      >
                        <div className="space-y-2">
                          <div>
                            <strong>Status:</strong>{" "}
                            <span className={result.status ? "text-green-600" : "text-red-600"}>
                              {result.status ? "✓ Success" : "✗ Failed"}
                            </span>
                          </div>
                          <div>
                            <strong>Message:</strong> {result.message}
                          </div>
                          {Array.isArray(result.data) && (
                            <div>
                              <strong>Records Found:</strong> {result.data.length}
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
                            setInterestCalc({ ...interestCalc, totalDue: e.target.value })
                          }
                        />
                      </Form.Item>

                      <Form.Item label="Annual Interest Rate (%)" required>
                        <Input
                          placeholder="Enter annual rate (default 15%)"
                          type="number"
                          value={interestCalc.annualRate}
                          onChange={(e) =>
                            setInterestCalc({ ...interestCalc, annualRate: e.target.value })
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
                            <strong>Payments Added: {interestCalc.payments.length}</strong>
                            <Table
                              dataSource={interestCalc.payments}
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
                                  render: (value: Dayjs) => value.format("DD/MM/YYYY"),
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
                                          payments: interestCalc.payments.filter(
                                            (_, i) => i !== index
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
                            setSearchParams({ ...searchParams, rrNumber: e.target.value })
                          }
                        />
                      </Form.Item>

                      <Form.Item label="User ID (Optional)">
                        <Input
                          placeholder="Enter User ID"
                          type="number"
                          value={searchParams.userId}
                          onChange={(e) =>
                            setSearchParams({ ...searchParams, userId: e.target.value })
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
                          backgroundColor: result.status ? "#f6ffed" : "#fff1f0",
                          borderColor: result.status ? "#b7eb8f" : "#ffccc7",
                        }}
                      >
                        <div className="space-y-2">
                          <div>
                            <strong>Status:</strong>{" "}
                            <span className={result.status ? "text-green-600" : "text-red-600"}>
                              {result.status ? "✓ Success" : "✗ Failed"}
                            </span>
                          </div>
                          <div>
                            <strong>Message:</strong> {result.message}
                          </div>
                          {Array.isArray(result.data) && (
                            <div>
                              <strong>Records Found:</strong> {result.data.length}
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
                        This will mark the return as PAID and create/update returns_01_work and interest_working records
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
                          backgroundColor: result.status ? "#f6ffed" : "#fff1f0",
                          borderColor: result.status ? "#b7eb8f" : "#ffccc7",
                        }}
                      >
                        <div className="space-y-2">
                          <div>
                            <strong>Status:</strong>{" "}
                            <span className={result.status ? "text-green-600" : "text-red-600"}>
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
                        onChange={(e) => setCreateInterestDvatId(e.target.value)}
                      />
                      <small className="text-gray-500">
                        This will create interest_working records for all PAID challans of this DVAT ID
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
                          backgroundColor: result.status ? "#f6ffed" : "#fff1f0",
                          borderColor: result.status ? "#b7eb8f" : "#ffccc7",
                        }}
                      >
                        <div className="space-y-2">
                          <div>
                            <strong>Status:</strong>{" "}
                            <span className={result.status ? "text-green-600" : "text-red-600"}>
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
          ]}
        />
      </div>
    </div>
  );
};

export default TestReturnPage;
