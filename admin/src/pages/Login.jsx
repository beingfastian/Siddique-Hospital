import React, { useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { assets } from "../assets/assets";
import { AdminContext } from "../context/AdminContext";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-toastify";
import { DoctorContext } from "../context/DoctorContext";

const Login = () => {
  const [state, setState] = useState("Admin");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  
  const { setAToken, backendUrl } = useContext(AdminContext);
  const { setDToken, dToken } = useContext(DoctorContext);
  const navigate = useNavigate();

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (state === "Admin") {
        const { data } = await axios.post(backendUrl + "/api/admin/login", {
          email,
          password,
        });
        if (data.success) {
          localStorage.setItem("aToken", data.token);
          toast.success(data.message);
          setAToken(data.token);
        } else {
          toast.error(data.message);
        }
      } else {
        const { data } = await axios.post(backendUrl + "/api/doctor/login", {
          email,
          password,
        });
        if (data.success) {
          localStorage.setItem("dToken", data.token);
          navigate("/doctor");
          setDToken(data.token);
        } else {
          toast.error(data.message);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-blue-200/30 to-indigo-200/30 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-tr from-violet-200/30 to-pink-200/30 blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/5 border border-white/50 p-8 transition-all duration-500 hover:shadow-3xl hover:shadow-black/10">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 shadow-lg shadow-blue-500/25">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
              Welcome Back
            </h1>
            
            <p className="text-gray-500 text-sm">
              Sign in to your <span className="font-semibold text-blue-600">{state}</span> account
            </p>
          </div>

          {/* Role Toggle */}
          <div className="flex bg-gray-100/80 backdrop-blur-sm rounded-2xl p-1 mb-8 border border-gray-200/50">
            <button
              type="button"
              onClick={() => setState("Admin")}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                state === "Admin"
                  ? "bg-white text-blue-600 shadow-lg shadow-blue-100/50 transform scale-[1.02]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => setState("Doctor")}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                state === "Doctor"
                  ? "bg-white text-blue-600 shadow-lg shadow-blue-100/50 transform scale-[1.02]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Doctor
            </button>
          </div>

          {/* Form */}
          <form onSubmit={onSubmitHandler} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  className={`w-full px-4 py-4 bg-gray-50/50 border-2 rounded-2xl text-gray-700 placeholder-gray-400 transition-all duration-300 focus:outline-none ${
                    emailFocused || email
                      ? "border-blue-400 bg-white/80 shadow-lg shadow-blue-100/50 transform scale-[1.02]"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  placeholder="Enter your email"
                  required
                />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 -z-10 blur transition-opacity duration-300"></div>
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  className={`w-full px-4 py-4 pr-12 bg-gray-50/50 border-2 rounded-2xl text-gray-700 placeholder-gray-400 transition-all duration-300 focus:outline-none ${
                    passwordFocused || password
                      ? "border-blue-400 bg-white/80 shadow-lg shadow-blue-100/50 transform scale-[1.02]"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-2xl font-semibold text-white transition-all duration-300 transform ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 hover:scale-[1.02] shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <span>Signing in</span>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                </div>
              ) : (
                <span>Sign In</span>
              )}
            </button>
            <div className="mt-4 text-right">
              <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800">
                Forgot Password?
              </Link>
            </div>
          </form>
        </div>

        {/* Footer decoration */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-400">
            Secure • Encrypted • Protected
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;