import { google } from "googleapis";
import { mustGetEnv, readPrivateKeyFromEnv } from "@/lib/env";

export function getServiceAccountClient() {
  const email = mustGetEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  const key = readPrivateKeyFromEnv("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY");

  return new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}
