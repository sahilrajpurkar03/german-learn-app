import Image from "next/image";

export function Logo({ size = 36, withName = true }: { size?: number; withName?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Image src="/logo.png" alt={withName ? "" : "Sprechen"} width={size} height={size} priority className="rounded-[22%] shadow-sm" />
      {withName && <span className="font-display text-xl font-semibold tracking-tight text-ink">Sprechen</span>}
    </span>
  );
}
