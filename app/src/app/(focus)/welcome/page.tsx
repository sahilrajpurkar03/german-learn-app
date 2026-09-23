import type { Metadata } from "next";
import { WelcomeFlow } from "@/features/onboarding/welcome-flow";

export const metadata: Metadata = { title: "Welcome · Sprechen" };

export default function WelcomePage() {
  return <WelcomeFlow />;
}
