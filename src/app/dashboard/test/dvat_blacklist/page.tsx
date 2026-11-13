"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input, Button, Modal, Select, Space, Spin, Pagination } from "antd";
import { toast } from "react-toastify";
import SearchDvatForBlacklist from "@/action/dvat/searchdvatforblacklist";
import GetBlacklistedDvats from "@/action/dvat/getblacklisteddvats";
import AddDvatToBlacklist from "@/action/dvat/adddvattoblacklist";
import RemoveDvatFromBlacklist from "@/action/dvat/removedvatfromblacklist";
import { getCurrentUserInfo } from "@/action/auth/getcurrentuserinfo";
import { formateDate } from "@/utils/methods";

interface DvatOption {
  id: number;
  tinNumber: string;
  tradename: string;
  commodity: string;
  selectOffice: string;
  frequencyFilings: string;
  isBlacklisted: boolean;
}

interface BlacklistedDvat {
  id: number;
  dvatId: number;
  tinnumber: string;
  tradename: string;
  commodity: string;
  office: string;
  frequency: string;
  created_at: Date;
}

export default function DvatBlacklistPage() {
  const [selectedDvat, setSelectedDvat] = useState<number | null>(null);
  const [dvatOptions, setDvatOptions] = useState<DvatOption[]>([]);
  const [blacklistedDvats, setBlacklistedDvats] = useState<BlacklistedDvat[]>(
    [],
  );
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [blacklistSearchTerm, setBlacklistSearchTerm] = useState<string>("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userOffice, setUserOffice] = useState<string>("");
  const [pagination, setPagination] = useState({
    take: 10000,
    skip: 0,
    total: 0,
  });
  const [blacklistPagination, setBlacklistPagination] = useState({
    take: 10,
    skip: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isBlacklistLoading, setIsBlacklistLoading] = useState(false);
  const [isAddingToBlacklist, setIsAddingToBlacklist] = useState(false);
  const [isRemovingFromBlacklist, setIsRemovingFromBlacklist] = useState(false);

  // Get user info on mount
  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const response = await getCurrentUserInfo();
        if (response.status && response.data) {
          setUserRole(response.data.role);
          setUserOffice(response.data.office);
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    };
    getUserInfo();
  }, []);

  // Fetch DVAT options for selection
  const fetchDvatOptions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await SearchDvatForBlacklist({
        searchTerm,
        skip: pagination.skip,
        take: pagination.take,
      });

      if (response.status && response.data?.result) {
        let dvatData = response.data.result;

        // Filter by office if user is not admin
        dvatData = dvatData.filter(
          (dvat: DvatOption) => dvat.selectOffice === userOffice,
        );

        setDvatOptions(dvatData);
        setPagination({
          take: response.data.take,
          skip: response.data.skip,
          total: response.data.total,
        });
      } else {
        toast.error(response.message || "Failed to fetch DVAT records");
      }
    } catch (error) {
      toast.error("Error fetching DVAT records");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, pagination.skip, pagination.take, userRole, userOffice]);

  // Fetch blacklisted DVAT records
  const fetchBlacklistedDvats = useCallback(async () => {
    setIsBlacklistLoading(true);
    try {
      const response = await GetBlacklistedDvats({
        searchTerm: blacklistSearchTerm,
        skip: blacklistPagination.skip,
        take: blacklistPagination.take,
        office: userRole === "ADMIN" ? undefined : userOffice,
      });

      console.log("Blacklisted DVAT response:", response);
      if (response.status && response.data?.result) {
        setBlacklistedDvats(response.data.result);
        setBlacklistPagination({
          take: response.data.take,
          skip: response.data.skip,
          total: response.data.total,
        });
      } else {
        toast.error(response.message || "Failed to fetch blacklisted records");
      }
    } catch (error) {
      toast.error("Error fetching blacklisted records");
      console.error(error);
    } finally {
      setIsBlacklistLoading(false);
    }
  }, [
    blacklistSearchTerm,
    blacklistPagination.skip,
    blacklistPagination.take,
    userRole,
    userOffice,
  ]);

  // Initial load
  useEffect(() => {
    fetchDvatOptions();
    fetchBlacklistedDvats();
  }, []);

  // Handle search
  useEffect(() => {
    setPagination((prev) => ({ ...prev, skip: 0 }));
  }, [searchTerm]);

  useEffect(() => {
    if (pagination.skip === 0) {
      fetchDvatOptions();
    } else {
      setPagination((prev) => ({ ...prev, skip: 0 }));
    }
  }, [searchTerm]);

  // Handle redflag search
  useEffect(() => {
    setBlacklistPagination((prev) => ({ ...prev, skip: 0 }));
  }, [blacklistSearchTerm]);

  useEffect(() => {
    if (blacklistPagination.skip === 0) {
      fetchBlacklistedDvats();
    } else {
      setBlacklistPagination((prev) => ({ ...prev, skip: 0 }));
    }
  }, [blacklistSearchTerm]);

  // Handle redflag pagination changes
  useEffect(() => {
    fetchBlacklistedDvats();
  }, [blacklistPagination.skip, blacklistPagination.take]);

  // Handle add to redflag
  const handleAddToBlacklist = async () => {
    if (!selectedDvat) {
      toast.error("Please select a DVAT to add to redflag");
      return;
    }

    setIsAddingToBlacklist(true);
    try {
      const response = await AddDvatToBlacklist({ dvatId: selectedDvat });

      if (response.status) {
        toast.success("DVAT added to redflag successfully");
        setSelectedDvat(null);
        await fetchDvatOptions();
        await fetchBlacklistedDvats();
      } else {
        toast.error(response.message || "Failed to add DVAT to redflag");
      }
    } catch (error) {
      toast.error("Error adding DVAT to redflag");
      console.error(error);
    } finally {
      setIsAddingToBlacklist(false);
    }
  };

  // Handle remove from redflag
  const handleRemoveFromBlacklist = (blacklistId: number) => {
    Modal.confirm({
      title: "Remove from Redflag",
      content: "Are you sure you want to remove this DVAT from the redflag?",
      okText: "Yes",
      cancelText: "No",
      onOk: async () => {
        setIsRemovingFromBlacklist(true);
        try {
          const response = await RemoveDvatFromBlacklist({
            blacklistId,
          });

          if (response.status) {
            toast.success("DVAT removed from redflag successfully");
            await fetchBlacklistedDvats();
            await fetchDvatOptions();
          } else {
            toast.error(
              response.message || "Failed to remove DVAT from redflag",
            );
          }
        } catch (error) {
          toast.error("Error removing DVAT from redflag");
          console.error(error);
        } finally {
          setIsRemovingFromBlacklist(false);
        }
      },
    });
  };

  return (
    <div className="p-3 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            DVAT Redflag Management
          </h1>
          <p className="text-sm text-gray-600">
            Manage redflagged DVAT entries and add new ones to the redflag list
          </p>
        </div>

        {/* Add to Redflag Section */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Add DVAT to Redflag
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
            <div className="md:col-span-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Search
              </label>
              <Input
                placeholder="Search by TIN or Trade Name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="middle"
              />
            </div>

            <div className="md:col-span-5">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Select DVAT
              </label>
              <Spin spinning={isLoading}>
                <Select
                  size="middle"
                  placeholder="Select a DVAT"
                  value={selectedDvat}
                  onChange={setSelectedDvat}
                  style={{ width: "100%" }}
                  optionLabelProp="label"
                  options={dvatOptions
                    .filter((dvat) => !dvat.isBlacklisted)
                    .map((dvat) => ({
                      value: dvat.id,
                      label: `${dvat.tinNumber} - ${dvat.tradename}`,
                      children: (
                        <div>
                          <div className="font-semibold text-sm">
                            {dvat.tinNumber} - {dvat.tradename}
                          </div>
                          <div className="text-xs text-gray-500">
                            {dvat.commodity} | {dvat.selectOffice}
                          </div>
                        </div>
                      ),
                    }))}
                />
              </Spin>
            </div>

            <div className="md:col-span-3">
              <Button
                type="primary"
                onClick={handleAddToBlacklist}
                loading={isAddingToBlacklist}
                disabled={!selectedDvat}
                className="w-full"
                size="middle"
              >
                Add to Redflag
              </Button>
            </div>
          </div>
        </div>

        {/* Blacklisted DVATs Table */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Blacklisted DVATs
          </h2>

          <div className="mb-3">
            <Input
              placeholder="Search by TIN or Trade Name"
              value={blacklistSearchTerm}
              onChange={(e) => setBlacklistSearchTerm(e.target.value)}
              size="middle"
            />
          </div>

          <Spin spinning={isBlacklistLoading}>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                      TIN Number
                    </TableHead>
                    <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                      Trade Name
                    </TableHead>
                    <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                      Commodity
                    </TableHead>
                    {userRole === "ADMIN" && (
                      <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                        Office
                      </TableHead>
                    )}
                    <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                      Frequency
                    </TableHead>
                    <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                      Added Date
                    </TableHead>
                    <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blacklistedDvats.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={userRole === "ADMIN" ? 7 : 6}
                        className="text-center py-4"
                      >
                        <p className="text-gray-500 text-sm">
                          No blacklisted DVATs found
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    blacklistedDvats.map((dvat) => (
                      <TableRow
                        key={dvat.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <TableCell className="text-center p-2 text-xs text-gray-900">
                          {dvat.tinnumber}
                        </TableCell>
                        <TableCell className="text-center p-2 text-xs text-gray-900">
                          {dvat.tradename}
                        </TableCell>
                        <TableCell className="text-center p-2 text-xs text-gray-900">
                          {dvat.commodity}
                        </TableCell>
                        {userRole === "ADMIN" && (
                          <TableCell className="text-center p-2 text-xs text-gray-900">
                            {dvat.office}
                          </TableCell>
                        )}
                        <TableCell className="text-center p-2 text-xs text-gray-900">
                          {dvat.frequency}
                        </TableCell>
                        <TableCell className="text-center p-2 text-xs text-gray-900">
                          {formateDate(dvat.created_at)}
                        </TableCell>
                        <TableCell className="text-center p-2">
                          <Button
                            danger
                            size="small"
                            onClick={() => handleRemoveFromBlacklist(dvat.id)}
                            loading={isRemovingFromBlacklist}
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Spin>

          {blacklistedDvats.length > 0 && (
            <div className="mt-3">
              <Pagination
                current={
                  Math.floor(
                    blacklistPagination.skip / blacklistPagination.take,
                  ) + 1
                }
                pageSize={blacklistPagination.take}
                total={blacklistPagination.total}
                onChange={(page, pageSize) => {
                  setBlacklistPagination({
                    skip: (page - 1) * pageSize,
                    take: pageSize,
                    total: blacklistPagination.total,
                  });
                }}
                size="small"
                showSizeChanger
                showTotal={(total) => `Total ${total} blacklisted DVATs`}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
