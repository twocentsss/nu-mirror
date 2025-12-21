"use server";

import { getServerSession as nextGetServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";

export async function getServerSession() {
  return nextGetServerSession(authOptions);
}
