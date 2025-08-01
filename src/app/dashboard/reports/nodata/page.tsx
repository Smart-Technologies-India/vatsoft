"use client";

import { Alert } from "antd";

const NoDatePage = () => {
  return (
    <>
      <div className="p-3 py-2">
        <div className="bg-white p-2 shadow mt-4">
          <div>
            <Alert message="No data available" type="error" showIcon />
          </div>
        </div>
      </div>
    </>
  );
};

export default NoDatePage;
