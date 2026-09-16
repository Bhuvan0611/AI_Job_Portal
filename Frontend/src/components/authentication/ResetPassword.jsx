import React, { useEffect, useState } from "react";
import Navbar from "../components_lite/Navbar";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useNavigate, useLocation, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { USER_API_ENDPOINT } from "@/utils/data";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // when coming from the profile "Change Password", email is passed in
  const presetEmail = location.state?.email;
  const fromProfile = location.state?.fromProfile;

  // step 1 = enter email, step 2 = enter otp + new password
  const [step, setStep] = useState(presetEmail ? 2 : 1);
  const [email, setEmail] = useState(presetEmail || "");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // send the OTP for a given email
  const sendOtp = async (targetEmail) => {
    setLoading(true);
    try {
      const res = await axios.post(
        `${USER_API_ENDPOINT}/forgot-password`,
        { email: targetEmail },
        { headers: { "Content-Type": "application/json" }, withCredentials: true }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        setStep(2);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not send OTP");
    } finally {
      setLoading(false);
    }
  };

  // if we arrived from profile, auto-send the OTP once
  useEffect(() => {
    if (fromProfile && presetEmail) {
      sendOtp(presetEmail);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    sendOtp(email);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter the 6 digit OTP");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(
        `${USER_API_ENDPOINT}/reset-password`,
        { email, otp, newPassword },
        { headers: { "Content-Type": "application/json" }, withCredentials: true }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        navigate("/login");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-gray-50 px-4">
        <form
          onSubmit={step === 1 ? handleSendOtp : handleReset}
          className="w-full max-w-md bg-white border border-gray-100 shadow-2xl rounded-2xl p-8 my-10"
        >
          <div className="text-center mb-8">
            <h1 className="font-extrabold text-3xl text-[#6B3AC2]">
              {fromProfile ? "Change Password" : "Reset Password"}
            </h1>
            <p className="text-gray-500 text-sm mt-2">
              {step === 1
                ? "Enter your registered email to get an OTP"
                : `Enter the OTP sent to ${email} and set a new password`}
            </p>
          </div>

          {step === 1 ? (
            <div>
              <Label className="text-gray-700 font-semibold">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="johndoe@gmail.com"
                className="mt-1"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label className="text-gray-700 font-semibold">OTP</Label>
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
              <div>
                <Label className="text-gray-700 font-semibold">New Password</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="********"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-gray-700 font-semibold">Confirm Password</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="********"
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <div className="mt-6">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#6B3AC2] hover:bg-[#5b30a6] text-white py-3 rounded-lg font-semibold"
            >
              {loading
                ? "Please wait..."
                : step === 1
                ? "Send OTP"
                : "Change Password"}
            </Button>
          </div>

          {step === 2 && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => sendOtp(email)}
                disabled={loading}
                className="text-[#FA4F09] hover:underline font-semibold text-sm disabled:opacity-60"
              >
                Resend OTP
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Back to{" "}
              <Link to="/login" className="text-[#6B3AC2] hover:underline font-semibold">
                Login
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
