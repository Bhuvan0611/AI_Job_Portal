import React, { useState } from "react";
import Navbar from "../components_lite/Navbar";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";
import { Building2 } from "lucide-react";
import { COMPANY_API_ENDPOINT } from "@/utils/data";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { setSingleCompany } from "@/redux/companyslice";
import axios from "axios";

const CompanyCreate = () => {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState();
  const dispatch = useDispatch();
  const registerNewCompany = async () => {
    try {
      const res = await axios.post(
        `${COMPANY_API_ENDPOINT}/register`,
        { companyName },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );
      if (res?.data?.success) {
        dispatch(setSingleCompany(res.data.company));
        toast.success(res.data.message);
        const companyId = res?.data?.company?._id;
        navigate(`/admin/companies/${companyId}`);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to create company");
    }
  };
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 md:p-8">
          <div className="flex items-start gap-3 mb-8">
            <div className="flex items-center justify-center h-11 w-11 rounded-lg bg-purple-50 text-[#6B3AC2] shrink-0">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-bold text-xl md:text-2xl text-gray-900">
                Create a New Company
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                What would you like to name your company? You can change this
                later.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-medium text-gray-700">Company Name</Label>
            <Input
              type="text"
              placeholder="e.g. Google, Microsoft, Acme Inc."
              className="h-11"
              value={companyName || ""}
              onChange={(e) => setCompanyName(e.target.value)}
            />
            <p className="text-xs text-gray-400">
              This name will be visible to job seekers.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={() => navigate("/admin/companies")}
            >
              Cancel
            </Button>
            <Button
              onClick={registerNewCompany}
              disabled={!companyName?.trim()}
              className="bg-[#6B3AC2] hover:bg-[#552d9b]"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyCreate;
