"use client";

import GetPaymentStatus from "@/action/payment/getpaymentstatus";
import { useState } from "react";
import { toast } from "react-toastify";

const TestPaymentPage = () => {
    const [orderno, setOrderno] = useState("");
    const [amount, setAmount] = useState("");
    const [result, setResult] = useState("");

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6 text-gray-800 text-center">
                    Test Your Payment Here
                </h1>
                <div className="mb-4">
                    <label className="block text-gray-700 mb-2 font-medium">
                        Order Number
                    </label>
                    <input
                        type="text"
                        value={orderno}
                        onChange={(e) => setOrderno(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter order number"
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 mb-2 font-medium">
                        Amount
                    </label>
                    <input
                        type="text"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter amount"
                    />
                </div>
                <button
                    className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition mb-4"
                    onClick={async () => {
                        if (orderno === "") {
                            toast.error("Please enter order number");
                            return;
                        }
                        if (amount === "") {
                            toast.error("Please enter amount");
                            return;
                        }
                        const res = await GetPaymentStatus({
                            Amount: amount,
                            applicant_id: orderno,
                        });
                        console.log(res);
                        setResult(JSON.stringify(res, null, 2));
                    }}
                >
                    Test Now
                </button>
                <div>
                    <label className="block text-gray-700 mb-2 font-medium">
                        Result:
                    </label>
                    <textarea
                        rows={10}
                        className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-800 resize-none"
                        value={result}
                        readOnly
                    ></textarea>
                </div>
            </div>
        </div>
    );
};
export default TestPaymentPage;
