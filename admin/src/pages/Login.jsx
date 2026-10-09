import { useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { FaEye, FaEyeSlash, FaUserTie, FaUserMd, FaFlask, FaListOl, FaFileMedical, FaChartBar } from "react-icons/fa";
import BrandLogo from "../components/ui/BrandLogo";
import { HOSPITAL_NAME, PRODUCT_TAGLINE } from "../config";
import { AdminContext } from "../context/AdminContext";
import { DoctorContext } from "../context/DoctorContext";
import { LabContext } from "../context/LabContext";
import { Button, Field, Input } from "../components/ui";

// One sign-in page for every role. The role decides which account is checked;
// the requests and where each role lands are unchanged.
const ROLES = [
  { key: "Admin", label: "Reception / Admin", icon: <FaUserTie /> },
  { key: "Doctor", label: "Doctor", icon: <FaUserMd /> },
  { key: "Lab", label: "Lab", icon: <FaFlask /> },
];

const Login = () => {
  const [state, setState] = useState("Admin");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const { setAToken, backendUrl } = useContext(AdminContext);
  const { setDToken } = useContext(DoctorContext);
  const { setLToken } = useContext(LabContext);
  const navigate = useNavigate();

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (state === "Admin") {
        const { data } = await axios.post(backendUrl + "/api/admin/login", { email, password });
        if (data.success) {
          localStorage.setItem("aToken", data.token);
          setAToken(data.token);
        } else {
          setError(data.message);
        }
      } else if (state === "Lab") {
        const { data } = await axios.post(backendUrl + "/api/lab/login", { email, password });
        if (data.success) {
          localStorage.setItem("lToken", data.token);
          navigate("/lab");
          setLToken(data.token);
        } else {
          setError(data.message);
        }
      } else {
        const { data } = await axios.post(backendUrl + "/api/doctor/login", { email, password });
        if (data.success) {
          localStorage.setItem("dToken", data.token);
          navigate("/doctor");
          setDToken(data.token);
        } else {
          setError(data.message);
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Couldn't reach the server. Check the internet connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-2">
      {/* Brand panel (large screens) */}
      <aside className="hidden lg:flex flex-col justify-between bg-primary-900 p-12 text-white">
        <div>
          <div className="inline-block rounded-xl bg-white px-5 py-3">
            <BrandLogo size="lg" tagline />
          </div>
          <p className="mt-3 text-sm text-primary-100">{HOSPITAL_NAME}</p>
        </div>
        <div>
          <p className="font-display text-4xl font-semibold leading-tight">{PRODUCT_TAGLINE}</p>
          <ul className="mt-8 space-y-4 text-primary-50">
            <li className="flex items-center gap-3">
              <FaListOl aria-hidden="true" className="text-primary-300" /> Live queue for reception and doctors
            </li>
            <li className="flex items-center gap-3">
              <FaFileMedical aria-hidden="true" className="text-primary-300" /> Lab requests and reports in one place
            </li>
            <li className="flex items-center gap-3">
              <FaChartBar aria-hidden="true" className="text-primary-300" /> Daily, weekly and monthly reports
            </li>
          </ul>
        </div>
        <p className="text-sm text-primary-200">Secure sign-in for hospital staff only.</p>
      </aside>

      {/* Sign-in form */}
      <main className="flex min-h-screen items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <BrandLogo size="lg" tagline />
            <p className="mt-2 text-sm text-slate-500">{HOSPITAL_NAME}</p>
          </div>

          <h1 className="text-2xl font-semibold text-slate-900">Sign in</h1>
          <p className="mt-1 text-sm text-slate-600">Choose your role, then enter your work email and password.</p>

          <div role="radiogroup" aria-label="Role" className="mt-6 grid grid-cols-3 gap-2">
            {ROLES.map((r) => {
              const selected = state === r.key;
              return (
                <button
                  key={r.key}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => {
                    setState(r.key);
                    setError("");
                  }}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-sm font-medium transition-colors ${
                    selected ? "border-primary bg-primary-50 text-primary-900" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <span aria-hidden="true" className={selected ? "text-primary-700" : "text-slate-400"}>
                    {r.icon}
                  </span>
                  <span className="text-center leading-tight">{r.label}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={onSubmitHandler} className="mt-6 space-y-4" noValidate>
            <Field label="Email" htmlFor="login-email">
              <Input
                id="login-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@hospital.pk"
                required
              />
            </Field>
            <Field label="Password" htmlFor="login-password">
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:text-slate-800"
                >
                  {showPassword ? <FaEyeSlash aria-hidden="true" /> : <FaEye aria-hidden="true" />}
                </button>
              </div>
            </Field>

            {error && (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {error}
              </p>
            )}

            <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full" disabled={!email || !password}>
              {loading ? "Signing in" : "Sign in"}
            </Button>

            {state === "Doctor" && (
              <div className="text-right">
                <Link to="/forgot-password" className="text-sm font-medium text-primary-700 hover:text-primary-900">
                  Forgot password?
                </Link>
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
};

export default Login;
