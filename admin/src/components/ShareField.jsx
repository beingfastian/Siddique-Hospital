// Hospital's share of the doctor's consultation fee, with a live preview of the
// split so the admin sees exactly what each visit pays out.
// Same rounding as the backend (services/profitService.js): hospital = round(fee x % / 100).
export const splitFee = (fee, percent) => {
  const amount = Math.max(0, Math.round(Number(fee) || 0));
  const pct = Math.min(100, Math.max(0, Number(percent) || 0));
  const hospital = Math.round((amount * pct) / 100);
  return { hospital, doctor: amount - hospital };
};

export const rupees = (n) => `Rs. ${Math.round(Number(n) || 0).toLocaleString("en-PK")}`;

// Valid: 0–100, at most 2 decimals
export const isValidPercent = (value) => /^\d{1,3}(\.\d{1,2})?$/.test(String(value).trim()) && Number(value) <= 100;

const ShareField = ({ id = "hospital-share", value, onChange, fee, required = false, inputClassName = "" }) => {
  const valid = value === "" || isValidPercent(value);
  const split = splitFee(fee, value);
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
        Hospital share (%){required ? " *" : ""}
      </label>
      <div className="relative">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min="0"
          max="100"
          step="0.5"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. 25"
          required={required}
          aria-invalid={!valid}
          aria-describedby={`${id}-help`}
          className={`${inputClassName} pr-10`}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
      </div>
      <p id={`${id}-help`} className={`text-xs mt-1 ${valid ? "text-gray-500" : "text-red-600"}`}>
        {!valid
          ? "Enter a percentage from 0 to 100"
          : Number(fee) > 0 && value !== ""
            ? `Each visit at ${rupees(fee)}: hospital ${rupees(split.hospital)}, doctor ${rupees(split.doctor)}`
            : "The hospital's part of every consultation fee, as agreed with the doctor"}
      </p>
    </div>
  );
};

export default ShareField;
