// Tests which sign-in methods the login card offers for each backend configuration.
import { cleanup, render, within } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { format, t } from "@/lib/i18n";

import { LoginForm } from "./LoginForm";

vi.mock("@/hooks/use-query-param", () => ({ useQueryParam: () => null }));
vi.mock("../api/auth-actions", () => ({ submitEmailSignIn: vi.fn() }));

function renderForm(ui: ReactElement) {
  return within(render(ui).container);
}

function providerButton(view: ReturnType<typeof renderForm>, provider: string) {
  return view.queryByRole("link", { name: format(t.auth.continueWith, { provider }) });
}

describe("LoginForm", () => {
  // Each render shares the document; removing it keeps the form ids unique per test.
  afterEach(cleanup);

  it("should hide providers without real OAuth outside development", () => {
    const view = renderForm(<LoginForm oauthProviders={{ google: true, github: false }} isEmailEnabled />);
    expect(providerButton(view, "Google")).toBeInTheDocument();
    expect(providerButton(view, "GitHub")).not.toBeInTheDocument();
  });

  it("should offer the simulated provider screen in development", () => {
    const view = renderForm(<LoginForm oauthProviders={{}} isDevLogin />);
    expect(providerButton(view, "GitHub")).toHaveAttribute("href", "/login/github");
  });

  it("should show the email code form when email sign-in is enabled", () => {
    const view = renderForm(<LoginForm isEmailEnabled />);
    expect(view.getByLabelText(t.auth.emailLabel)).toBeInTheDocument();
    expect(view.getByRole("button", { name: t.auth.sendCode })).toBeInTheDocument();
    expect(view.queryByText(t.auth.orDivider)).not.toBeInTheDocument();
  });

  it("should not show the email form when email sign-in is off", () => {
    const view = renderForm(<LoginForm oauthProviders={{ google: true }} />);
    expect(view.queryByLabelText(t.auth.emailLabel)).not.toBeInTheDocument();
  });
});
