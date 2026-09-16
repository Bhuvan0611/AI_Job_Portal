import React, { useEffect, useState } from "react";
import Navbar from "../components_lite/Navbar";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { useNavigate } from "react-router-dom";
import { RadioGroup } from "../ui/radio-group";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import axios from "axios";
import { toast } from "sonner";
import { USER_API_ENDPOINT } from "@/utils/data.js";
import { useDispatch, useSelector } from "react-redux";
import { setLoading, setUser } from "@/redux/authSlice";
import { RESET_STORE } from "@/redux/store";

const Login = () => {
  const [input, setInput] = useState({
    email: "",
    password: "", 
    role: "",
  });
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, user } = useSelector((store) => store.auth);
  const changeEventHandler = (e) => {
    setInput({ ...input, [e.target.name]: e.target.value });
  };

  const submitHandler = async (e) => {
    e.preventDefault();

    try {
      dispatch(setLoading(true)); // Start loading
      const res = await axios.post(`${USER_API_ENDPOINT}/login`, input, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });
      if (res.data.success) {
        // Guard against any leftover state from a previous session on this
        // browser (e.g. it ended without hitting "logout") bleeding into
        // this new login.
        dispatch({ type: RESET_STORE });
        dispatch(setUser(res.data.user));
        navigate("/");
        toast.success(res.data.message);
      }
    } catch (error) {
      const data = error.response?.data;
      // email not verified yet - send them to the OTP screen
      if (data?.needVerification) {
        toast.error(data.message);
        navigate("/verify-otp", { state: { email: input.email } });
        return;
      }
      toast.error(data?.message || "Login failed");
    } finally {
      dispatch(setLoading(false)); // End loading
    }
  };

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  return (
    <div>
      <Navbar></Navbar>
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-gray-50 px-4">
        <form
          onSubmit={submitHandler}
          className="w-full max-w-md bg-white border border-gray-100 shadow-2xl rounded-2xl p-8 my-10"
        >
          <div className="text-center mb-8">
            <h1 className="font-extrabold text-3xl text-[#6B3AC2]">
              Welcome Back
            </h1>
            <p className="text-gray-500 text-sm mt-2">Login to your account</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label className="text-gray-700 font-semibold">Email</Label>
              <Input
                type="email"
                value={input.email}
                name="email"
                onChange={changeEventHandler}
                placeholder="johndoe@gmail.com"
                className="mt-1 w-full focus:ring-[#6B3AC2]"
              />
            </div>
            <div>
              <Label className="text-gray-700 font-semibold">Password</Label>
              <Input
                type="password"
                value={input.password}
                name="password"
                onChange={changeEventHandler}
                placeholder="********"
                className="mt-1 w-full focus:ring-[#6B3AC2]"
              />
              <div className="text-right mt-1">
                <Link
                  to="/forgot-password"
                  className="text-sm text-[#FA4F09] hover:underline font-semibold"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>

            <div className="pt-2">
              <Label className="text-gray-700 font-semibold">Select Role</Label>
              <RadioGroup className="flex items-center gap-6 mt-2">
                <div className="flex items-center space-x-2">
                  <Input
                    type="radio"
                    name="role"
                    value="Student"
                    checked={input.role === "Student"}
                    onChange={changeEventHandler}
                    className="cursor-pointer w-4 h-4 text-[#6B3AC2]"
                  />
                  <Label htmlFor="r1" className="cursor-pointer">Student</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    type="radio"
                    name="role"
                    value="Recruiter"
                    checked={input.role === "Recruiter"}
                    onChange={changeEventHandler}
                    className="cursor-pointer w-4 h-4 text-[#6B3AC2]"
                  />
                  <Label htmlFor="r2" className="cursor-pointer">Recruiter</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className="mt-8">
            {loading ? (
              <Button disabled className="w-full bg-[#6B3AC2] hover:bg-[#5b30a6] text-white py-3 rounded-lg flex justify-center items-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </Button>
            ) : (
              <Button
                type="submit"
                className="w-full bg-[#6B3AC2] hover:bg-[#5b30a6] text-white py-3 rounded-lg font-semibold text-md transition-colors"
              >
                Login
              </Button>
            )}
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Don't have an account?{" "}
              <Link to="/register" className="text-[#FA4F09] hover:underline font-semibold">
                Register here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
