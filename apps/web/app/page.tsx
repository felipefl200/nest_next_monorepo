import { redirect } from "next/navigation";
import { getSessionSnapshot } from "@/src/services/auth/session";

export default async function HomePage() {
  const session = await getSessionSnapshot();

  redirect(session.isAuthenticated ? "/dashboard" : "/login");
}
