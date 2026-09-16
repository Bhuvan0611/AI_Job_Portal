import React, { useState } from "react";
import Navbar from "../components_lite/Navbar";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useNavigate, useLocation, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { setUser } from "@/redux/authSlice";
import { USER_API_ENDPOINT } from "@/utils/data";

const VerifyOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const email = location.state?.email;

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // if someone lands here without an email, send them back to register
  if (!email) {
    return (
      <div>
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] gap-4">
          <p className="text-gray-600">No email found. Please register first.</p>
          <Link to="/register">
            <Button className="bg-[#6B3AC2] hover:bg-[#5b30a6]">Go to Register</Button>
          </Link>
        </div>
      </div>
    );
  }

  const verifyHandler = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter the 6 digit OTP");
      return;
    }
    try {
      setLoading(true);
      const res = await axios.post(
        `${USER_API_ENDPOINT}/verify-otp`,
        { email, otp },
        { headers: { "Content-Type": "application/json" }, withCredentials: true }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        // backend already logged us in (cookie + user) - go straight home
        dispatch(setUser(res.data.user));
        navigate("/");
      }
    } catch (error) {
      const message = error.response?.data?.message || "Verification failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const resendHandler = async () => {
    try {
      setResending(true);
      const res = await axios.post(
        `${USER_API_ENDPOINT}/resend-otp`,
        { email },
        { headers: { "Content-Type": "application/json" }, withCredentials: true }
      );
      if (res.data.success) {
        toast.success(res.data.message);
      }
    } catch (error) {
      const message = error.response?.data?.message || "Could not resend OTP";
      toast.error(message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-gray-50 px-4">
        <form
          onSubmit={verifyHandler}
          className="w-full max-w-md bg-white border border-gray-100 shadow-2xl rounded-2xl p-8 my-10"
        >
          <div className="text-center mb-8">
            <h1 className="font-extrabold text-3xl text-[#6B3AC2]">Verify Email</h1>
            <p className="text-gray-500 text-sm mt-2">
              We sent a 6 digit code to <span className="font-semibold">{email}</span>
            </p>
          </div>

          <div>
            <Label className="text-gray-700 font-semibold">Enter OTP</Label>
            <Input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="------"
              className="mt-1 text-center text-2xl tracking-[0.5em] font-bold"
            />
          </div>

          <div className="mt-6">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#6B3AC2] hover:bg-[#5b30a6] text-white py-3 rounded-lg font-semibold"
            >
              {loading ? "Verifying..." : "Verify"}
            </Button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Didn't get the code?{" "}
              <button
                type="button"
                onClick={resendHandler}
                disabled={resending}
                className="text-[#FA4F09] hover:underline font-semibold disabled:opacity-60"
              >
                {resending ? "Sending..." : "Resend OTP"}
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerifyOtp;
