// Phone number helpers for WhatsApp (Pakistan by default).

// Normalize to E.164, e.g. "0318 9047157", "923189047157", "3189047157" -> "+923189047157".
export const normalizePhone = (phoneNumber) => {
  if (!phoneNumber) return null;
  let digits = String(phoneNumber).replace("whatsapp:", "").replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("00")) return "+" + digits.slice(2);
  if (digits.startsWith("92")) return "+" + digits;
  if (digits.startsWith("0")) digits = digits.slice(1);
  return "+92" + digits;
};

// Ways the same number may be stored on a patient record ("+923…", "923…", "03…").
export const phoneVariants = (phoneNumber) => {
  const e164 = normalizePhone(phoneNumber);
  if (!e164) return [];
  const variants = new Set([e164, e164.slice(1)]);
  if (e164.startsWith("+92")) variants.add("0" + e164.slice(3));
  return [...variants];
};
