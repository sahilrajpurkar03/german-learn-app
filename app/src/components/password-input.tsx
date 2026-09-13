"use client";

import { useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";

type PasswordInputProps = Omit<ComponentProps<"input">, "type"> & {
  id: string;
  visibilityLabel?: string;
};

export function PasswordInput({ id, visibilityLabel = "password", ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const label = `${visible ? "Hide" : "Show"} ${visibilityLabel}`;

  return (
    <div className="password-input">
      <input {...props} id={id} type={visible ? "text" : "password"} />
      <button
        type="button"
        aria-label={label}
        aria-controls={id}
        title={label}
        disabled={props.disabled}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
      </button>
    </div>
  );
}