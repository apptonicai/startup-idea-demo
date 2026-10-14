import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  decideClaim,
  decideConfirm,
  decideExpire,
  decideMarkPaid,
  decideMessage,
} from "./lead-flow.ts";

const poster = "drv_ramesh";
const acceptor = "drv_suresh";
const other = "drv_anita";

describe("exclusive claim", () => {
  it("lets the first other driver claim an open lead", () => {
    const result = decideClaim({
      leadStatus: "open",
      posterId: poster,
      claimerId: acceptor,
      claimedById: null,
    });
    assert.deepEqual(result, { ok: true, value: { status: "claimed" } });
  });

  it("refuses a second claim", () => {
    const result = decideClaim({
      leadStatus: "claimed",
      posterId: poster,
      claimerId: other,
      claimedById: acceptor,
    });
    assert.deepEqual(result, { ok: false, reason: "already_claimed" });
  });

  it("refuses a claim when a claimer is already recorded", () => {
    const result = decideClaim({
      leadStatus: "open",
      posterId: poster,
      claimerId: other,
      claimedById: acceptor,
    });
    assert.deepEqual(result, { ok: false, reason: "already_claimed" });
  });
});

describe("poster cannot self-claim", () => {
  it("refuses the poster", () => {
    const result = decideClaim({
      leadStatus: "open",
      posterId: poster,
      claimerId: poster,
      claimedById: null,
    });
    assert.deepEqual(result, { ok: false, reason: "self_claim" });
  });
});

describe("confirm only after mark-paid", () => {
  it("refuses confirm while unpaid", () => {
    const result = decideConfirm({
      settlementStatus: "unpaid",
      actorId: poster,
      posterId: poster,
    });
    assert.deepEqual(result, { ok: false, reason: "not_marked_paid" });
  });

  it("lets the poster confirm after the acceptor marks paid", () => {
    const marked = decideMarkPaid({
      settlementStatus: "unpaid",
      actorId: acceptor,
      acceptorId: acceptor,
    });
    assert.equal(marked.ok, true);
    const confirmed = decideConfirm({
      settlementStatus: "marked_paid",
      actorId: poster,
      posterId: poster,
    });
    assert.deepEqual(confirmed, {
      ok: true,
      value: { settlementStatus: "confirmed", leadStatus: "settled" },
    });
  });

  it("refuses the poster marking paid", () => {
    const result = decideMarkPaid({
      settlementStatus: "unpaid",
      actorId: poster,
      acceptorId: acceptor,
    });
    assert.deepEqual(result, { ok: false, reason: "not_acceptor" });
  });
});

describe("expire only while open", () => {
  it("expires an open lead", () => {
    assert.deepEqual(decideExpire("open"), { ok: true, value: { status: "expired" } });
  });

  it("refuses expire after claim", () => {
    assert.deepEqual(decideExpire("claimed"), { ok: false, reason: "not_open" });
  });

  it("refuses expire after settlement", () => {
    assert.deepEqual(decideExpire("settled"), { ok: false, reason: "not_open" });
  });
});

describe("messages", () => {
  it("allows either party after claim", () => {
    assert.equal(
      decideMessage({
        leadStatus: "claimed",
        senderId: poster,
        posterId: poster,
        claimerId: acceptor,
      }).ok,
      true,
    );
  });

  it("refuses a third driver", () => {
    assert.deepEqual(
      decideMessage({
        leadStatus: "claimed",
        senderId: other,
        posterId: poster,
        claimerId: acceptor,
      }),
      { ok: false, reason: "not_party" },
    );
  });
});
