type LegalEnvironment = {
  LEGAL_OPERATOR_NAME?: string;
  LEGAL_OPERATOR_ADDRESS?: string;
  LEGAL_CONTACT_EMAIL?: string;
  LEGAL_OPERATOR_ADDRESS_CONFIRMED?: string;
};

export function resolveLegalDetails(environment: LegalEnvironment) {
  const configuredAddress = environment.LEGAL_OPERATOR_ADDRESS?.trim() || "";
  const operator = {
    name: environment.LEGAL_OPERATOR_NAME?.trim() || "Sahil Rajpurkar",
    address: configuredAddress || "M\u00f6nsheim, 71297, Germany",
    email: environment.LEGAL_CONTACT_EMAIL?.trim() || "sahilrajpurkar1998@gmail.com",
    country: "Germany",
  };
  const contactAvailable = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(operator.email);
  const addressConfirmed = Boolean(configuredAddress && environment.LEGAL_OPERATOR_ADDRESS_CONFIRMED === "true");
  return { operator, contactAvailable, addressConfirmed, detailsComplete: Boolean(operator.name && contactAvailable && addressConfirmed) };
}

export const {
  operator: legalOperator,
  contactAvailable: legalContactAvailable,
  addressConfirmed: legalAddressConfirmed,
  detailsComplete: legalDetailsComplete,
} = resolveLegalDetails({
  LEGAL_OPERATOR_NAME: process.env.LEGAL_OPERATOR_NAME,
  LEGAL_OPERATOR_ADDRESS: process.env.LEGAL_OPERATOR_ADDRESS,
  LEGAL_CONTACT_EMAIL: process.env.LEGAL_CONTACT_EMAIL,
  LEGAL_OPERATOR_ADDRESS_CONFIRMED: process.env.LEGAL_OPERATOR_ADDRESS_CONFIRMED,
});

export const legalTitles = {
  imprint: "Imprint / Impressum",
  privacy: "Privacy policy",
  "data-sharing": "Data sharing policy",
  security: "Security and beta status",
} as const;

export type LegalPage = keyof typeof legalTitles;