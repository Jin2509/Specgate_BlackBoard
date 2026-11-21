// Tests that the simulated sign-up asks for an email to verify before any account is created.
import { cleanup, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { t } from "@/lib/i18n";

import { SignUpForm } from "./SignUpForm";

vi.mock("../api/auth-actions", () => ({ signUp: vi.fn() }));

describe("SignUpForm", () => {
  // Each render shares the document; removing it keeps the form ids unique per test.
  afterEach(cleanup);

  it("should ask GitHub sign-ups for an email to receive the code", () => {
    const view = within(render(<SignUpForm provider="github" />).container);
    expect(view.getByLabelText(t.auth.verificationEmail)).toHaveAttribute("type", "email");
    expect(view.getByRole("button", { name: t.auth.sendVerificationCode })).toBeInTheDocument();
  });

  it("should use the Google email itself as the address to verify", () => {
    const view = within(render(<SignUpForm provider="google" />).container);
    expect(view.queryByLabelText(t.auth.verificationEmail)).not.toBeInTheDocument();
    expect(view.getByLabelText(t.auth.googleEmail)).toHaveAttribute("type", "email");
  });

  it("should not offer to create the account before the code step", () => {
    const view = within(render(<SignUpForm provider="google" />).container);
    expect(view.queryByRole("button", { name: t.auth.verifyAndCreate })).not.toBeInTheDocument();
  });
});
