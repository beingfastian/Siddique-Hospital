import { createContext, useEffect, useState } from "react";
import axios from "axios";
import { backendUrl } from "../lab/api";

export const LabContext = createContext();

// Login state for lab staff (their own token, like aToken/dToken)
const LabContextProvider = ({ children }) => {
  const [lToken, setLToken] = useState(() => {
    try {
      return localStorage.getItem("lToken") || "";
    } catch {
      return "";
    }
  });
  const [labName, setLabName] = useState("");

  useEffect(() => {
    if (!lToken) {
      setLabName("");
      return;
    }
    axios
      .get(`${backendUrl}/api/lab/me`, { headers: { ltoken: lToken } })
      .then(({ data }) => data.success && setLabName(data.staff.name))
      .catch(() => {});
  }, [lToken]);

  return <LabContext.Provider value={{ lToken, setLToken, labName }}>{children}</LabContext.Provider>;
};

export default LabContextProvider;
