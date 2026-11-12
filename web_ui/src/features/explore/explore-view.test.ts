// Test tìm kiếm workspace chung.
import { describe, expect, it } from "vitest";
import { getDiscoverableWorkspaces } from "@/lib/mock/queries";
import { searchWorkspaces } from "./explore-view";

describe("searchWorkspaces", () => {
  const all = getDiscoverableWorkspaces();

  it("chỉ có workspace chung ở chế độ ai cũng tìm thấy", () => {
    expect(all.every((w) => w.kind === "shared" && w.visibility === "discoverable")).toBe(true);
  });

  it("tìm theo tên hoặc đề bài, không phân biệt hoa thường", () => {
    expect(searchWorkspaces(all, "ĐỒ ÁN").map((w) => w.id)).toEqual(["do-an"]);
    expect(searchWorkspaces(all, "đo đếm").map((w) => w.id)).toEqual(["do-an"]);
    expect(searchWorkspaces(all, "   ")).toHaveLength(all.length);
    expect(searchWorkspaces(all, "không-có-gì-khớp")).toHaveLength(0);
  });
});
