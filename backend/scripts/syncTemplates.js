// Submits the WhatsApp templates defined in whatsapp/templates.js to the hospital's
// WhatsApp Business Account (only the ones that don't exist yet), then prints the
// review status of each. Run with: npm run templates:sync
//
// Needs WHATSAPP_PROVIDER=kapso (or meta), the API key/token, WHATSAPP_PHONE_NUMBER_ID
// and WHATSAPP_BUSINESS_ACCOUNT_ID in backend/.env. Safe to run repeatedly.
import "dotenv/config";
import { templates, TEMPLATE_LANGUAGE } from "../whatsapp/templates.js";
import { isCloudApiConfigured, listTemplates, createTemplate, getTemplateStatuses } from "../whatsapp/cloudApi.js";

if (!isCloudApiConfigured()) {
  console.error("WhatsApp Cloud API is not configured. Set WHATSAPP_PROVIDER=kapso, KAPSO_API_KEY,");
  console.error("WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_BUSINESS_ACCOUNT_ID in backend/.env.");
  process.exit(1);
}

try {
  const existing = await listTemplates();
  const existingNames = new Set(
    existing.filter((t) => t.language === TEMPLATE_LANGUAGE).map((t) => t.name)
  );

  for (const name of Object.keys(templates)) {
    if (existingNames.has(name)) continue;
    try {
      const result = await createTemplate(name);
      console.log(`Submitted ${name} (${result.status || "PENDING"})`);
    } catch (error) {
      console.error(`Could not submit ${name}: ${error.message}`);
    }
  }

  console.log(`\nTemplate status (language: ${TEMPLATE_LANGUAGE}):`);
  for (const t of await getTemplateStatuses()) {
    const reason = t.rejectedReason && t.rejectedReason !== "NONE" ? `  reason: ${t.rejectedReason}` : "";
    console.log(`  ${t.status.padEnd(9)} ${t.name} (${t.category})${reason}`);
  }
  console.log("\nPENDING templates are under review by Meta, usually minutes to a few hours.");
  console.log("Run this command again to check. Messages using a template only send once it is APPROVED.");
} catch (error) {
  console.error("Template sync failed:", error.message);
  if (/sandbox/i.test(error.message)) {
    console.error("
This is a Kapso sandbox number, which can't use templates.");
    console.error("Connect a real number in Kapso (Phone numbers -> Instant setup, or your own SIM),");
    console.error("then put its WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_BUSINESS_ACCOUNT_ID in backend/.env.");
  }
  // exitCode instead of process.exit(): exiting while network handles are
  // closing crashes Node on Windows ("Assertion failed ... async.c")
  process.exitCode = 1;
}
