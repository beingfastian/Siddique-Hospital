import userModel from "../model/userModel.js";

// Small database updates that run once at startup and are safe to run again.
// They never stop the server: a failure is logged and the app keeps working.

// Patients used to need a unique phone number. Families share phones, so the
// unique index on phone is replaced by a normal one (still fast to search).
const patientPhoneIndex = async () => {
  const indexes = await userModel.collection.indexes().catch(() => []);
  const phone = indexes.find((i) => i.key && Object.keys(i.key).length === 1 && i.key.phone === 1);
  if (phone?.unique) {
    await userModel.collection.dropIndex(phone.name);
    console.log("Migration: patient phone numbers no longer need to be unique (families can share one)");
  }
  await userModel.createIndexes();
};

export const runMigrations = async () => {
  for (const [name, step] of [["patient phone index", patientPhoneIndex]]) {
    try {
      await step();
    } catch (error) {
      console.error(`Migration "${name}" failed:`, error.message);
    }
  }
};
