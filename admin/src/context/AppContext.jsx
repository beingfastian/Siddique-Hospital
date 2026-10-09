import { createContext } from "react";
export const AppContext = createContext();

const AppContextProvider = (props) => {
  const currency = "Rs."; // Pakistani Rupees
  const months = [
    "",
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const slotDateFormat = (slotDate) => {
    const dateArray = slotDate.split("_");
    return dateArray[0] + " " + months[dateArray[1]] + " " + dateArray[2];
  };

  // Age in years, or "—" when the date of birth isn't known (e.g. walk-ins with no age given)
  const calculateAge = (dob) => {
    const today = new Date();
    const birthDate = new Date(dob);
    if (!dob || Number.isNaN(birthDate.getTime())) return "—";
    let age = today.getFullYear() - birthDate.getFullYear();
    const month = today.getMonth() - birthDate.getMonth();
    if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const value = {
    calculateAge,
    slotDateFormat,
    currency,
  };

  return (
    <AppContext.Provider value={value}>
      {props.children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;
