// WhatsApp Cloud API client. Kapso proxies Meta's Cloud API unchanged, so the
// same requests work against either one; only the base URL and auth header differ.
//
//   WHATSAPP_PROVIDER=kapso -> https://api.kapso.ai/meta/whatsapp, header X-API-Key
//   WHATSAPP_PROVIDER=meta  -> https://graph.facebook.com,          header Authorization: Bearer
import { templates, LANGUAGES, hasLanguage, templateBody, templateExample, metaLanguageCode } from "./templates.js";
import { normalizePhone } from "./phone.js";

const API_VERSION = process.env.WHATSAPP_API_VERSION || "v24.0";

const providerConfig = () => {
  const provider = (process.env.WHATSAPP_PROVIDER || "").toLowerCase();
  if (provider === "kapso" && process.env.KAPSO_API_KEY) {
    return {
      provider,
      baseUrl: `https://api.kapso.ai/meta/whatsapp/${API_VERSION}`,
      headers: { "X-API-Key": process.env.KAPSO_API_KEY },
    };
  }
  if (provider === "meta" && process.env.META_ACCESS_TOKEN) {
    return {
      provider,
      baseUrl: `https://graph.facebook.com/${API_VERSION}`,
      headers: { Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}` },
    };
  }
  return null;
};

export const isCloudApiConfigured = () =>
  Boolean(providerConfig() && process.env.WHATSAPP_PHONE_NUMBER_ID);

export const cloudProviderName = () => providerConfig()?.provider || null;

const request = async (method, path, body) => {
  const config = providerConfig();
  if (!config) throw new Error("WhatsApp Cloud API is not configured");
  const response = await fetch(config.baseUrl + path, {
    method,
    headers: { ...config.headers, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message || data?.error || `HTTP ${response.status}`;
    const error = new Error(typeof message === "string" ? message : JSON.stringify(message));
    // Meta's numeric error code, e.g. 132001 = template doesn't exist in that language
    error.code = data?.error?.code;
    throw error;
  }
  return data;
};

// Cloud API expects the number without "+"
const toRecipient = (phone) => normalizePhone(phone)?.replace("+", "");

const sendMessage = async (payload) => {
  const data = await request("POST", `/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    ...payload,
  });
  return { success: true, messageId: data?.messages?.[0]?.id };
};

// Free-form text. Only allowed within 24 hours of the person's last message.
export const sendText = (to, body) =>
  sendMessage({ to: toRecipient(to), type: "text", text: { body } });

// Approved template with positional parameters ({{1}}, {{2}}, ...), in "en" or "ur"
export const sendTemplate = (to, name, params, lang = "en") =>
  sendMessage({
    to: toRecipient(to),
    type: "template",
    template: {
      name,
      language: { code: metaLanguageCode(lang) },
      components: [
        {
          type: "body",
          parameters: params.map((value) => ({ type: "text", text: String(value) })),
        },
      ],
    },
  });

// --- Template management (WhatsApp Business Account) ---

const wabaId = () => {
  if (!process.env.WHATSAPP_BUSINESS_ACCOUNT_ID) {
    throw new Error("Set WHATSAPP_BUSINESS_ACCOUNT_ID in the backend .env");
  }
  return process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
};

export const listTemplates = async () => {
  const all = [];
  let after = "";
  do {
    const query = `?limit=100${after ? `&after=${encodeURIComponent(after)}` : ""}`;
    const data = await request("GET", `/${wabaId()}/message_templates${query}`);
    all.push(...(data.data || []));
    after = data.paging?.cursors?.after && data.paging?.next ? data.paging.cursors.after : "";
  } while (after);
  return all;
};

// Submit one language of a template (a new language of an existing name is
// added by Meta as a translation of it)
export const createTemplate = (name, lang = "en") =>
  request("POST", `/${wabaId()}/message_templates`, {
    name,
    language: metaLanguageCode(lang),
    category: templates[name].category,
    parameter_format: "POSITIONAL",
    components: [
      {
        type: "BODY",
        text: templateBody(name, lang),
        example: { body_text: [templateExample(name, lang)] },
      },
    ],
  });

// Every (template, language) pair defined in code
export const templateLanguagePairs = () =>
  Object.keys(templates).flatMap((name) =>
    LANGUAGES.filter((lang) => hasLanguage(name, lang)).map((lang) => ({ name, lang }))
  );

// Status of each template and language defined in code: APPROVED / PENDING / REJECTED / MISSING
export const getTemplateStatuses = async () => {
  const existing = await listTemplates();
  return templateLanguagePairs().map(({ name, lang }) => {
    const match = existing.find((t) => t.name === name && t.language === metaLanguageCode(lang));
    return {
      name,
      language: lang,
      status: match?.status || "MISSING",
      category: match?.category || templates[name].category,
      rejectedReason: match?.rejected_reason || null,
    };
  });
};
