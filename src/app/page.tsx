import { redirect } from "next/navigation";

export const instant = false;

export default function HomePage() {
  // Proxy sends unauthenticated users to /login.
  redirect("/chats");
}
