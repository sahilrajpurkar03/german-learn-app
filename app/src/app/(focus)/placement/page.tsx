import type { Metadata } from "next";
import { PlacementFlow } from "@/features/onboarding/placement-flow";

export const metadata: Metadata = { title: "Level check · Sprechen" };

export default function PlacementPage() {
  return <PlacementFlow />;
}
