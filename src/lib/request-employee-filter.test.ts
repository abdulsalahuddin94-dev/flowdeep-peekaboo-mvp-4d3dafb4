import { test } from "node:test";
import assert from "node:assert/strict";
import { matchesRequestEmployees } from "./request-employee-filter";

test("any assigned employee matches With employees regardless of pending completion", () => {
  assert.equal(matchesRequestEmployees({ assignees: ["John Smith", "Mei Chen"] }, ["with"]), true);
  assert.equal(matchesRequestEmployees({ assignedTo: "John Smith" }, ["with"]), true);
  assert.equal(matchesRequestEmployees({}, ["with"]), false);
});
test("Without employees excludes assigned people", () => {
  assert.equal(matchesRequestEmployees({ assignees: [] }, ["without"]), true);
  assert.equal(matchesRequestEmployees({ assignedTo: "Mei Chen" }, ["without"]), false);
});
test("All or both options includes requests with and without employees", () => {
  for (const selected of [[], ["with", "without"]]) {
    assert.equal(matchesRequestEmployees({}, selected), true);
    assert.equal(matchesRequestEmployees({ assignees: ["John Smith"] }, selected), true);
  }
});