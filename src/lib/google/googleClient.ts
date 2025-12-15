import { google, type drive_v3, type sheets_v4 } from "googleapis";

export function makeGoogleClient(accessToken?: string, refreshToken?: string): {
  auth: InstanceType<typeof google.auth.OAuth2>;
  drive: drive_v3.Drive;
  sheets: sheets_v4.Sheets;
} {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );

  auth.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  const drive = google.drive({ version: "v3", auth });
  const sheets = google.sheets({ version: "v4", auth });

  return { auth, drive, sheets };
}
