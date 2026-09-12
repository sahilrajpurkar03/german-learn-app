import assert from "node:assert/strict";
import test from "node:test";
import { resolveLegalDetails } from "./legal.ts";

test("supplied operator contact remains usable while the locality is incomplete", () => {
  const details = resolveLegalDetails({});
  assert.equal(details.operator.name, "Sahil Rajpurkar");
  assert.equal(details.operator.address, "M\u00f6nsheim, 71297, Germany");
  assert.equal(details.operator.email, "sahilrajpurkar1998@gmail.com");
  assert.equal(details.contactAvailable, true);
  assert.equal(details.addressConfirmed, false);
  assert.equal(details.detailsComplete, false);
});

test("a configured location is not treated as a confirmed postal address automatically", () => {
  const details = resolveLegalDetails({ LEGAL_OPERATOR_ADDRESS: "M\u00f6nsheim, 71297, Germany" });
  assert.equal(details.detailsComplete, false);
  assert.equal(resolveLegalDetails({ LEGAL_OPERATOR_ADDRESS_CONFIRMED: "true" }).addressConfirmed, false);
});

test("public environment overrides require an explicit postal address confirmation", () => {
  const environment = {
    LEGAL_OPERATOR_NAME: " Test Operator ",
    LEGAL_OPERATOR_ADDRESS: " Example Street 1\n12345 Example Town, Germany ",
    LEGAL_CONTACT_EMAIL: " contact@example.org ",
  };
  assert.equal(resolveLegalDetails(environment).detailsComplete, false);
  const details = resolveLegalDetails({ ...environment, LEGAL_OPERATOR_ADDRESS_CONFIRMED: "true" });
  assert.equal(details.operator.name, "Test Operator");
  assert.equal(details.operator.address, "Example Street 1\n12345 Example Town, Germany");
  assert.equal(details.operator.email, "contact@example.org");
  assert.equal(details.detailsComplete, true);
});

test("an invalid email cannot become a public mail link or complete the contact details", () => {
  const details = resolveLegalDetails({ LEGAL_CONTACT_EMAIL: "not an email", LEGAL_OPERATOR_ADDRESS: "Example Street 1, Example Town", LEGAL_OPERATOR_ADDRESS_CONFIRMED: "true" });
  assert.equal(details.contactAvailable, false);
  assert.equal(details.detailsComplete, false);
});