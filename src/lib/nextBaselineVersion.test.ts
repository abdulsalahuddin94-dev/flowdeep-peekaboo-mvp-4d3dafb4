import { test } from "node:test";
import assert from "node:assert/strict";
import { nextBaselineVersion, type ApprovalRequest } from "./projects-store";
const cr = (projectId: string, v?: number, status: ApprovalRequest["status"] = "approved") =>
  ({ id: "x", type: "change-request", projectId, status, baselineVersion: v } as ApprovalRequest);
test("first approved change request creates V5", () => assert.equal(nextBaselineVersion([], "p-1"), 5));
test("next version follows the project's latest approved baseline", () =>
  assert.equal(nextBaselineVersion([cr("p-1", 5), cr("p-1", 6), cr("p-2", 9)], "p-1"), 7));
