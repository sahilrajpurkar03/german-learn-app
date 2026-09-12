export const legalOperator = {
  name: process.env.LEGAL_OPERATOR_NAME?.trim() || "",
  address: process.env.LEGAL_OPERATOR_ADDRESS?.trim() || "",
  email: process.env.LEGAL_CONTACT_EMAIL?.trim() || "",
  country: "Germany",
};

export const legalDetailsComplete = Boolean(
  legalOperator.name && legalOperator.address && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(legalOperator.email),
);

export const legalTitles = {
  imprint: "Imprint / Impressum",
  privacy: "Privacy policy",
  "data-sharing": "Data sharing policy",
  security: "Security and beta status",
} as const;

export type LegalPage = keyof typeof legalTitles;