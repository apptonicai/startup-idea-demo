import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import {
  decideClaim,
  decideConfirm,
  decideExpire,
  decideMarkPaid,
  decideMessage,
  LEAD_EXPIRY_MS,
  type LeadStatus,
  type SettlementStatus,
} from "./lead-flow";
import { isPickupZone, type PickupZone } from "./zones";

export type Driver = {
  id: string;
  name: string;
  area: string;
};

export type Lead = {
  id: string;
  posterId: string;
  posterName: string;
  pickupZone: string;
  dropHint: string;
  note: string | null;
  commissionPaise: number;
  status: LeadStatus;
  claimedById: string | null;
  claimedByName: string | null;
  claimedAt: string | null;
  expiresAt: string;
  createdAt: string;
  reviewedAt: string | null;
};

export type ThreadMessage = {
  id: string;
  leadId: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string;
};

export type Settlement = {
  id: string;
  leadId: string;
  amountPaise: number;
  status: SettlementStatus;
  note: string | null;
  markedPaidAt: string | null;
  confirmedAt: string | null;
  pickupZone: string;
  dropHint: string;
  posterName: string;
  acceptorName: string | null;
};

export type LeadDetail = {
  lead: Lead;
  messages: ThreadMessage[];
  settlement: Settlement | null;
};

export type ActionFailure = { ok: false; reason: string };
export type ActionSuccess = { ok: true };
export type ActionResult = ActionSuccess | ActionFailure;

type LeadRow = {
  id: string;
  poster_id: string;
  poster_name: string;
  pickup_zone: string;
  drop_hint: string;
  note: string | null;
  commission_paise: number;
  status: LeadStatus;
  claimed_by_id: string | null;
  claimed_by_name: string | null;
  claimed_at: string | null;
  expires_at: string;
  created_at: string;
  reviewed_at: string | null;
};

type SettlementRow = {
  id: string;
  lead_id: string;
  amount_paise: number;
  status: SettlementStatus;
  note: string | null;
  marked_paid_at: string | null;
  confirmed_at: string | null;
  pickup_zone: string;
  drop_hint: string;
  poster_name: string;
  acceptor_name: string | null;
};

const globalForDb = globalThis as unknown as { leadpassDb?: Database.Database };

const LEAD_SELECT = `
  SELECT
    l.id,
    l.poster_id,
    poster.name AS poster_name,
    l.pickup_zone,
    l.drop_hint,
    l.note,
    l.commission_paise,
    l.status,
    l.claimed_by_id,
    claimer.name AS claimed_by_name,
    l.claimed_at,
    l.expires_at,
    l.created_at,
    l.reviewed_at
  FROM leads l
  JOIN drivers poster ON poster.id = l.poster_id
  LEFT JOIN drivers claimer ON claimer.id = l.claimed_by_id
`;

function mapLead(row: LeadRow): Lead {
  return {
    id: row.id,
    posterId: row.poster_id,
    posterName: row.poster_name,
    pickupZone: row.pickup_zone,
    dropHint: row.drop_hint,
    note: row.note,
    commissionPaise: row.commission_paise,
    status: row.status,
    claimedById: row.claimed_by_id,
    claimedByName: row.claimed_by_name,
    claimedAt: row.claimed_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
  };
}

function mapSettlement(row: SettlementRow): Settlement {
  return {
    id: row.id,
    leadId: row.lead_id,
    amountPaise: row.amount_paise,
    status: row.status,
    note: row.note,
    markedPaidAt: row.marked_paid_at,
    confirmedAt: row.confirmed_at,
    pickupZone: row.pickup_zone,
    dropHint: row.drop_hint,
    posterName: row.poster_name,
    acceptorName: row.acceptor_name,
  };
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS drivers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      area TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      poster_id TEXT NOT NULL REFERENCES drivers(id),
      pickup_zone TEXT NOT NULL,
      drop_hint TEXT NOT NULL,
      note TEXT,
      commission_paise INTEGER NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('open', 'claimed', 'expired', 'settled')),
      claimed_by_id TEXT REFERENCES drivers(id),
      claimed_at TEXT,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      reviewed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL REFERENCES leads(id),
      sender_id TEXT NOT NULL REFERENCES drivers(id),
      body TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settlements (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL UNIQUE REFERENCES leads(id),
      amount_paise INTEGER NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('unpaid', 'marked_paid', 'confirmed')),
      note TEXT,
      marked_paid_at TEXT,
      confirmed_at TEXT
    );
  `);
}

function seedIfEmpty(db: Database.Database) {
  const count = db.prepare("SELECT COUNT(*) AS n FROM drivers").get() as { n: number };
  if (count.n > 0) return;

  const now = Date.now();
  const iso = (offsetMs: number) => new Date(now + offsetMs).toISOString();

  const insertDriver = db.prepare(
    "INSERT INTO drivers (id, name, area) VALUES (?, ?, ?)",
  );
  const drivers: Array<[string, string, string]> = [
    ["drv_ramesh", "Ramesh", "Majiwada"],
    ["drv_suresh", "Suresh", "Kapurbawdi"],
    ["drv_anita", "Anita", "Cadbury Jn"],
    ["drv_vikram", "Vikram", "Kolshet"],
    ["drv_meena", "Meena", "Kalwa"],
  ];
  const insertLead = db.prepare(`
    INSERT INTO leads (
      id, poster_id, pickup_zone, drop_hint, note, commission_paise, status,
      claimed_by_id, claimed_at, expires_at, created_at, reviewed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
  `);
  const insertMessage = db.prepare(
    "INSERT INTO messages (id, lead_id, sender_id, body, created_at) VALUES (?, ?, ?, ?, ?)",
  );
  const insertSettlement = db.prepare(`
    INSERT INTO settlements (
      id, lead_id, amount_paise, status, note, marked_paid_at, confirmed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const seed = db.transaction(() => {
    for (const driver of drivers) insertDriver.run(...driver);

    insertLead.run(
      "lead_open_station",
      "drv_anita",
      "Station",
      "Viviana Mall",
      "Waiting near the auto stand",
      8000,
      "open",
      null,
      null,
      iso(LEAD_EXPIRY_MS),
      iso(-2 * 60 * 1000),
    );
    insertLead.run(
      "lead_open_ghodbunder",
      "drv_vikram",
      "Ghodbunder",
      "Waghbil signal",
      null,
      10000,
      "open",
      null,
      null,
      iso(LEAD_EXPIRY_MS - 60 * 1000),
      iso(-4 * 60 * 1000),
    );
    insertLead.run(
      "lead_open_teen",
      "drv_meena",
      "Teen Hath Naka",
      "Mulund West station",
      "Two passengers, one suitcase",
      6000,
      "open",
      null,
      null,
      iso(LEAD_EXPIRY_MS - 3 * 60 * 1000),
      iso(-6 * 60 * 1000),
    );

    insertLead.run(
      "lead_claimed_majiwada",
      "drv_ramesh",
      "Majiwada",
      "Hiranandani Estate",
      "Blue shirt, tea stall",
      12000,
      "claimed",
      "drv_suresh",
      iso(-8 * 60 * 1000),
      iso(7 * 60 * 1000),
      iso(-12 * 60 * 1000),
    );
    insertMessage.run(
      "msg_maji_1",
      "lead_claimed_majiwada",
      "drv_suresh",
      "I am at the Majiwada signal in a white Dzire.",
      iso(-7 * 60 * 1000),
    );
    insertMessage.run(
      "msg_maji_2",
      "lead_claimed_majiwada",
      "drv_ramesh",
      "Customer is in a blue shirt near the tea stall.",
      iso(-6 * 60 * 1000),
    );
    insertSettlement.run(
      "set_maji",
      "lead_claimed_majiwada",
      12000,
      "unpaid",
      null,
      null,
      null,
    );

    insertLead.run(
      "lead_awaiting_cadbury",
      "drv_anita",
      "Cadbury Jn",
      "Pokhran Road 2",
      null,
      9000,
      "claimed",
      "drv_vikram",
      iso(-20 * 60 * 1000),
      iso(-5 * 60 * 1000),
      iso(-25 * 60 * 1000),
    );
    insertMessage.run(
      "msg_cad_1",
      "lead_awaiting_cadbury",
      "drv_vikram",
      "Picked up the customer. I have the commission in cash.",
      iso(-18 * 60 * 1000),
    );
    insertMessage.run(
      "msg_cad_2",
      "lead_awaiting_cadbury",
      "drv_anita",
      "Thanks. Mark it paid once you hand the cash over.",
      iso(-17 * 60 * 1000),
    );
    insertSettlement.run(
      "set_cad",
      "lead_awaiting_cadbury",
      9000,
      "marked_paid",
      "Cash handed at Cadbury Jn",
      iso(-10 * 60 * 1000),
      null,
    );
  });

  seed();
}

export function getDb(): Database.Database {
  if (globalForDb.leadpassDb) return globalForDb.leadpassDb;
  const dir = path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  const db = new Database(path.join(dir, "leadpass.db"));
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  seedIfEmpty(db);
  globalForDb.leadpassDb = db;
  return db;
}

export function sweepExpired(now = new Date().toISOString()) {
  getDb()
    .prepare(
      "UPDATE leads SET status = 'expired' WHERE status = 'open' AND expires_at <= ?",
    )
    .run(now);
}

export function listDrivers(): Driver[] {
  return getDb()
    .prepare("SELECT id, name, area FROM drivers ORDER BY name")
    .all() as Driver[];
}

export function getDriver(id: string): Driver | null {
  const row = getDb()
    .prepare("SELECT id, name, area FROM drivers WHERE id = ?")
    .get(id) as Driver | undefined;
  return row ?? null;
}

function leadById(id: string): Lead | null {
  const row = getDb().prepare(`${LEAD_SELECT} WHERE l.id = ?`).get(id) as
    | LeadRow
    | undefined;
  return row ? mapLead(row) : null;
}

export function listFeedLeads(): Lead[] {
  sweepExpired();
  const rows = getDb()
    .prepare(
      `${LEAD_SELECT} WHERE l.status IN ('open', 'claimed') ORDER BY l.created_at DESC`,
    )
    .all() as LeadRow[];
  return rows.map(mapLead);
}

export function listPostedBy(driverId: string): Lead[] {
  sweepExpired();
  const rows = getDb()
    .prepare(`${LEAD_SELECT} WHERE l.poster_id = ? ORDER BY l.created_at DESC`)
    .all(driverId) as LeadRow[];
  return rows.map(mapLead);
}

export function listClaimedBy(driverId: string): Lead[] {
  sweepExpired();
  const rows = getDb()
    .prepare(`${LEAD_SELECT} WHERE l.claimed_by_id = ? ORDER BY l.claimed_at DESC`)
    .all(driverId) as LeadRow[];
  return rows.map(mapLead);
}

function settlementForLead(leadId: string): Settlement | null {
  const row = getDb()
    .prepare(
      `
      SELECT
        s.id, s.lead_id, s.amount_paise, s.status, s.note,
        s.marked_paid_at, s.confirmed_at,
        l.pickup_zone, l.drop_hint,
        poster.name AS poster_name,
        claimer.name AS acceptor_name
      FROM settlements s
      JOIN leads l ON l.id = s.lead_id
      JOIN drivers poster ON poster.id = l.poster_id
      LEFT JOIN drivers claimer ON claimer.id = l.claimed_by_id
      WHERE s.lead_id = ?
    `,
    )
    .get(leadId) as SettlementRow | undefined;
  return row ? mapSettlement(row) : null;
}

export function getLeadDetail(id: string): LeadDetail | null {
  sweepExpired();
  const lead = leadById(id);
  if (!lead) return null;
  const messages = getDb()
    .prepare(
      `
      SELECT m.id, m.lead_id AS leadId, m.sender_id AS senderId, d.name AS senderName,
             m.body, m.created_at AS createdAt
      FROM messages m
      JOIN drivers d ON d.id = m.sender_id
      WHERE m.lead_id = ?
      ORDER BY m.created_at ASC
    `,
    )
    .all(id) as ThreadMessage[];
  return { lead, messages, settlement: settlementForLead(id) };
}

export function createLead(input: {
  posterId: string;
  pickupZone: string;
  dropHint: string;
  note: string | null;
  commissionPaise: number;
}): ActionResult & { id?: string } {
  if (!getDriver(input.posterId)) return { ok: false, reason: "missing_driver" };
  if (!isPickupZone(input.pickupZone)) return { ok: false, reason: "bad_zone" };
  const dropHint = input.dropHint.trim();
  if (dropHint.length < 2 || dropHint.length > 120) {
    return { ok: false, reason: "bad_drop" };
  }
  const note = input.note?.trim() ? input.note.trim().slice(0, 280) : null;
  if (!Number.isInteger(input.commissionPaise) || input.commissionPaise <= 0) {
    return { ok: false, reason: "bad_amount" };
  }
  const id = crypto.randomUUID();
  const createdAt = new Date();
  getDb()
    .prepare(
      `
      INSERT INTO leads (
        id, poster_id, pickup_zone, drop_hint, note, commission_paise, status,
        claimed_by_id, claimed_at, expires_at, created_at, reviewed_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'open', NULL, NULL, ?, ?, NULL)
    `,
    )
    .run(
      id,
      input.posterId,
      input.pickupZone satisfies PickupZone,
      dropHint,
      note,
      input.commissionPaise,
      new Date(createdAt.getTime() + LEAD_EXPIRY_MS).toISOString(),
      createdAt.toISOString(),
    );
  return { ok: true, id };
}

export function claimLead(leadId: string, claimerId: string): ActionResult {
  sweepExpired();
  const db = getDb();
  const run = db.transaction((): ActionResult => {
    const lead = leadById(leadId);
    if (!lead) return { ok: false, reason: "missing" };
    if (!getDriver(claimerId)) return { ok: false, reason: "missing_driver" };
    const decision = decideClaim({
      leadStatus: lead.status,
      posterId: lead.posterId,
      claimerId,
      claimedById: lead.claimedById,
    });
    if (!decision.ok) return decision;
    const now = new Date().toISOString();
    const info = db
      .prepare(
        `
        UPDATE leads
        SET status = 'claimed', claimed_by_id = ?, claimed_at = ?
        WHERE id = ? AND status = 'open' AND claimed_by_id IS NULL AND poster_id != ?
      `,
      )
      .run(claimerId, now, leadId, claimerId);
    if (info.changes !== 1) return { ok: false, reason: "already_claimed" };
    db.prepare(
      `
      INSERT INTO settlements (
        id, lead_id, amount_paise, status, note, marked_paid_at, confirmed_at
      ) VALUES (?, ?, ?, 'unpaid', NULL, NULL, NULL)
    `,
    ).run(crypto.randomUUID(), leadId, lead.commissionPaise);
    return { ok: true };
  });
  return run();
}

export function sendMessage(
  leadId: string,
  senderId: string,
  body: string,
): ActionResult {
  const text = body.trim();
  if (text.length < 1 || text.length > 500) return { ok: false, reason: "bad_message" };
  const db = getDb();
  const lead = leadById(leadId);
  if (!lead) return { ok: false, reason: "missing" };
  const decision = decideMessage({
    leadStatus: lead.status,
    senderId,
    posterId: lead.posterId,
    claimerId: lead.claimedById,
  });
  if (!decision.ok) return decision;
  db.prepare(
    "INSERT INTO messages (id, lead_id, sender_id, body, created_at) VALUES (?, ?, ?, ?, ?)",
  ).run(crypto.randomUUID(), leadId, senderId, text, new Date().toISOString());
  return { ok: true };
}

function cleanNote(note: string | null | undefined): string | null {
  const trimmed = note?.trim() ?? "";
  if (!trimmed) return null;
  return trimmed.slice(0, 160);
}

export function markPaid(
  leadId: string,
  actorId: string,
  note: string | null,
): ActionResult {
  const db = getDb();
  const run = db.transaction((): ActionResult => {
    const lead = leadById(leadId);
    const settlement = settlementForLead(leadId);
    if (!lead || !settlement || !lead.claimedById) {
      return { ok: false, reason: "missing" };
    }
    const decision = decideMarkPaid({
      settlementStatus: settlement.status,
      actorId,
      acceptorId: lead.claimedById,
    });
    if (!decision.ok) return decision;
    const nextNote = cleanNote(note) ?? settlement.note;
    const info = db
      .prepare(
        `
        UPDATE settlements
        SET status = 'marked_paid', marked_paid_at = ?, note = ?
        WHERE lead_id = ? AND status = 'unpaid'
      `,
      )
      .run(new Date().toISOString(), nextNote, leadId);
    if (info.changes !== 1) return { ok: false, reason: "already_marked_paid" };
    return { ok: true };
  });
  return run();
}

export function confirmReceived(
  leadId: string,
  actorId: string,
  note: string | null,
): ActionResult {
  const db = getDb();
  const run = db.transaction((): ActionResult => {
    const lead = leadById(leadId);
    const settlement = settlementForLead(leadId);
    if (!lead || !settlement) return { ok: false, reason: "missing" };
    const decision = decideConfirm({
      settlementStatus: settlement.status,
      actorId,
      posterId: lead.posterId,
    });
    if (!decision.ok) return decision;
    const nextNote = cleanNote(note) ?? settlement.note;
    const now = new Date().toISOString();
    const info = db
      .prepare(
        `
        UPDATE settlements
        SET status = 'confirmed', confirmed_at = ?, note = ?
        WHERE lead_id = ? AND status = 'marked_paid'
      `,
      )
      .run(now, nextNote, leadId);
    if (info.changes !== 1) return { ok: false, reason: "not_marked_paid" };
    db.prepare("UPDATE leads SET status = 'settled' WHERE id = ? AND status = 'claimed'").run(
      leadId,
    );
    return { ok: true };
  });
  return run();
}

export function expireOpenLead(leadId: string): ActionResult {
  const db = getDb();
  const run = db.transaction((): ActionResult => {
    const lead = leadById(leadId);
    if (!lead) return { ok: false, reason: "missing" };
    const decision = decideExpire(lead.status);
    if (!decision.ok) return decision;
    const info = db
      .prepare("UPDATE leads SET status = 'expired' WHERE id = ? AND status = 'open'")
      .run(leadId);
    if (info.changes !== 1) return { ok: false, reason: "not_open" };
    return { ok: true };
  });
  return run();
}

export function markThreadReviewed(leadId: string): ActionResult {
  const info = getDb()
    .prepare(
      "UPDATE leads SET reviewed_at = ? WHERE id = ? AND reviewed_at IS NULL",
    )
    .run(new Date().toISOString(), leadId);
  if (info.changes !== 1) {
    const lead = leadById(leadId);
    if (!lead) return { ok: false, reason: "missing" };
    return { ok: false, reason: "already_reviewed" };
  }
  return { ok: true };
}

export type AdminCounts = {
  open: number;
  claimed: number;
  awaitingConfirm: number;
  settled: number;
};

export function adminCounts(): AdminCounts {
  sweepExpired();
  const db = getDb();
  const open = db
    .prepare("SELECT COUNT(*) AS n FROM leads WHERE status = 'open'")
    .get() as { n: number };
  const claimed = db
    .prepare(
      `
      SELECT COUNT(*) AS n
      FROM leads l
      JOIN settlements s ON s.lead_id = l.id
      WHERE l.status = 'claimed' AND s.status = 'unpaid'
    `,
    )
    .get() as { n: number };
  const awaiting = db
    .prepare("SELECT COUNT(*) AS n FROM settlements WHERE status = 'marked_paid'")
    .get() as { n: number };
  const settled = db
    .prepare("SELECT COUNT(*) AS n FROM settlements WHERE status = 'confirmed'")
    .get() as { n: number };
  return {
    open: open.n,
    claimed: claimed.n,
    awaitingConfirm: awaiting.n,
    settled: settled.n,
  };
}

export function listAdminLeads(): Lead[] {
  sweepExpired();
  const rows = getDb()
    .prepare(`${LEAD_SELECT} ORDER BY l.created_at DESC`)
    .all() as LeadRow[];
  return rows.map(mapLead);
}

export function listSettlements(): Settlement[] {
  sweepExpired();
  const rows = getDb()
    .prepare(
      `
      SELECT
        s.id, s.lead_id, s.amount_paise, s.status, s.note,
        s.marked_paid_at, s.confirmed_at,
        l.pickup_zone, l.drop_hint,
        poster.name AS poster_name,
        claimer.name AS acceptor_name
      FROM settlements s
      JOIN leads l ON l.id = s.lead_id
      JOIN drivers poster ON poster.id = l.poster_id
      LEFT JOIN drivers claimer ON claimer.id = l.claimed_by_id
      ORDER BY l.created_at DESC
    `,
    )
    .all() as SettlementRow[];
  return rows.map(mapSettlement);
}
