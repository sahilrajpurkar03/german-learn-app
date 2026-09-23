import { redirect } from "next/navigation";

// The periodic check-in is offered from the studio itself; keep old links working.
export default function CheckinPage() {
  redirect("/learn");
}
