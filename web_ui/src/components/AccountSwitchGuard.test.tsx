// Tests that a tab reloads itself when it finds a different signed-in account.
import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AccountSwitchGuard } from "./AccountSwitchGuard";

const originalLocation = window.location;
const reload = vi.fn();

beforeEach(() => {
  Object.defineProperty(window, "location", { configurable: true, value: { ...originalLocation, reload } });
});

afterEach(() => {
  Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
  window.sessionStorage.clear();
  reload.mockReset();
});

describe("AccountSwitchGuard", () => {
  it("should not reload on the first page of a tab", () => {
    render(<AccountSwitchGuard userId="u_lan" />);
    expect(reload).not.toHaveBeenCalled();
  });

  it("should not reload while the same account stays signed in", () => {
    render(<AccountSwitchGuard userId="u_lan" />);
    render(<AccountSwitchGuard userId="u_lan" />);
    expect(reload).not.toHaveBeenCalled();
  });

  it("should reload when another account signs in on the same tab", () => {
    render(<AccountSwitchGuard userId="u_lan" />);
    render(<AccountSwitchGuard userId="u_long" />);
    expect(reload).toHaveBeenCalledOnce();
  });
});
