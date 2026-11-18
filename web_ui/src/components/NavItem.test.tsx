// Tests the sidebar link: its count badge and its unread or mention dot.
import { render, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NavItem } from "./NavItem";

describe("NavItem", () => {
  it("should label the dot so screen readers announce it", () => {
    const { container } = render(
      <NavItem href="/w/1/c/general" isActive={false} icon={null} dot="mention" dotLabel="someone mentioned you">
        general
      </NavItem>,
    );
    expect(within(container).getByRole("img", { name: "someone mentioned you" })).toBeInTheDocument();
  });

  it("should render no dot when none is given", () => {
    const { container } = render(
      <NavItem href="/w/1/c/general" isActive={false} icon={null}>
        general
      </NavItem>,
    );
    expect(within(container).queryByRole("img")).not.toBeInTheDocument();
  });

  it("should hide a zero count", () => {
    const { container } = render(
      <NavItem href="/w/1/board" isActive={false} icon={null} count={0}>
        board
      </NavItem>,
    );
    expect(within(container).queryByText("0")).not.toBeInTheDocument();
  });
});
