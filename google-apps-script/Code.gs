const SHEET_ID = "1DqQ3-igfVa4VVAdfzUXsEp5xVRHfR-AfPXX6SvmpUDY";
const TIME_ZONE = "America/Los_Angeles";
const SHEETS = { MEMBERS: "Members", SESSIONS: "Sessions", ATTENDANCE: "Attendance", ATTEMPTS: "Attempts" };

/** Run once after pasting this project into Extensions > Apps Script. */
function setupAttendanceSystem() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  setupSheet_(spreadsheet, SHEETS.MEMBERS, ["Member ID", "Name", "Family", "Section", "Member PIN", "Active"]);
  setupSheet_(spreadsheet, SHEETS.SESSIONS, ["Date", "Code", "Opens At", "Closes At", "Active", "Created At"]);
  setupSheet_(spreadsheet, SHEETS.ATTENDANCE, ["Attendance ID", "Date", "Member ID", "Name", "Family", "Section", "Status", "Submitted At", "Approved At", "Code Entered"]);
  setupSheet_(spreadsheet, SHEETS.ATTEMPTS, ["Attempt ID", "Date", "Member ID", "Name", "Section", "Result", "Submitted At", "Code Entered"]);
  seedMembers_(spreadsheet.getSheetByName(SHEETS.MEMBERS));
  CacheService.getScriptCache().remove("active-members-v1");
  SpreadsheetApp.flush();
}

function doGet(event) {
  const action = String(event.parameter.action || "health");
  if (action === "health") { activeMembers_(); return json_({ ok: true, service: "AmeriCal Attendance" }); }
  return json_({ ok: false, error: "Unknown action" });
}

function doPost(event) {
  try {
    const body = JSON.parse(event.postData.contents || "{}");
    if (body.action === "verifyMember") return json_(verifyMember_(body));
    if (body.action === "checkIn") return json_(checkIn_(body));
    if (body.action === "adminData") { requireAdmin_(body.adminKey); return json_({ ok: true, sessions: readRows_(SHEETS.SESSIONS), attendance: readRows_(SHEETS.ATTENDANCE), attempts: readRows_(SHEETS.ATTEMPTS) }); }
    if (body.action === "saveSession") { requireAdmin_(body.adminKey); return json_(saveSession_(body)); }
    if (body.action === "setSessionActive") { requireAdmin_(body.adminKey); return json_(setSessionActive_(body)); }
    return json_({ ok: false, error: "Unknown action" });
  } catch (error) {
    return json_({ ok: false, error: error.message || "Request failed" });
  }
}

function verifyMember_(body) {
  const memberId = Number(body.memberId);
  const member = activeMembers_().find(row => Number(row["Member ID"]) === memberId);
  if (!member) return { ok: false, error: "Unknown or inactive member" };
  if (clean_(member["Member PIN"]) !== clean_(body.memberPin)) return { ok: false, error: "Incorrect member PIN" };
  return { ok: true, name: member.Name, section: member.Section };
}

function checkIn_(body) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const date = clean_(body.date); const memberId = Number(body.memberId); const code = clean_(body.code).toUpperCase();
    const member = activeMembers_().find(row => Number(row["Member ID"]) === memberId);
    if (!member) return attempt_(body, "Unknown or inactive member");
    if (clean_(member["Member PIN"]) !== clean_(body.memberPin)) return attempt_(body, "Incorrect member PIN");
    const session = readRows_(SHEETS.SESSIONS).find(row => sheetDate_(row.Date) === date && truthy_(row.Active));
    if (!session) return attempt_(body, "No active rehearsal session");
    const now = new Date(); const opens = new Date(session["Opens At"]); const closes = new Date(session["Closes At"]);
    if (now < opens || now > closes) return attempt_(body, "Check-in window is closed");
    if (clean_(session.Code).toUpperCase() !== code) return attempt_(body, "Incorrect rehearsal code");
    const attendance = readRows_(SHEETS.ATTENDANCE);
    if (attendance.some(row => sheetDate_(row.Date) === date && Number(row["Member ID"]) === memberId && row.Status === "Approved")) return attempt_(body, "Already checked in");
    const id = Utilities.getUuid(); const timestamp = new Date();
    append_(SHEETS.ATTENDANCE, [id, date, memberId, member.Name, member.Family, member.Section, "Approved", timestamp, timestamp, code]);
    return { ok: true, status: "approved", message: "Check-in approved", attendanceId: id };
  } finally { lock.releaseLock(); }
}

function saveSession_(body) {
  const date = clean_(body.date); const code = clean_(body.code).toUpperCase();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Date must use YYYY-MM-DD");
  if (new Date(`${date}T12:00:00`).getDay() !== 6) throw new Error("Rehearsal date must be a Saturday");
  if (code.length < 4 || code.length > 12) throw new Error("Code must be 4–12 characters");
  const opens = new Date(body.opensAt); const closes = new Date(body.closesAt);
  if (!(opens < closes)) throw new Error("Closing time must be after opening time");
  const sheet = sheet_(SHEETS.SESSIONS); const rows = readRows_(SHEETS.SESSIONS); const index = rows.findIndex(row => sheetDate_(row.Date) === date);
  const values = [date, code, opens, closes, true, new Date()];
  if (index >= 0) sheet.getRange(index + 2, 1, 1, values.length).setValues([values]); else sheet.appendRow(values);
  return { ok: true, message: "Session saved" };
}

function setSessionActive_(body) {
  const date = clean_(body.date); const sheet = sheet_(SHEETS.SESSIONS); const rows = readRows_(SHEETS.SESSIONS); const index = rows.findIndex(row => sheetDate_(row.Date) === date);
  if (index < 0) throw new Error("Session not found");
  sheet.getRange(index + 2, 5).setValue(Boolean(body.active));
  return { ok: true };
}

function attempt_(body, result) {
  append_(SHEETS.ATTEMPTS, [Utilities.getUuid(), clean_(body.date), Number(body.memberId) || "", clean_(body.name), clean_(body.section), result, new Date(), clean_(body.code).toUpperCase()]);
  return { ok: false, status: "rejected", error: result };
}

function requireAdmin_(value) {
  const expected = PropertiesService.getScriptProperties().getProperty("ADMIN_KEY");
  if (!expected || clean_(value) !== expected) throw new Error("Not authorized");
}

function setupSheet_(spreadsheet, name, headers) {
  const sheet = spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1); sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#142534").setFontColor("#ffffff");
  sheet.autoResizeColumns(1, headers.length);
}

function seedMembers_(sheet) {
  const rows = [
    [1,"Aaron Wu","Strings","Cello"],[2,"Alan Shi","Winds","Clarinet"],[3,"Alex Nian","Strings","Violin 2"],[4,"Alex Zhu","Winds","Clarinet"],[5,"Alice Chen","Strings","Cello"],[6,"Annie Jiao","Strings","Violin 1"],[7,"Arthur Lin","Strings","Cello"],[8,"Asher Chen","Strings","Bass"],[9,"Audrey Wu","Strings","Violin 2"],[10,"Benjamin He","Winds","Bassoon"],[11,"Calvin He","Winds","Bassoon"],[12,"Chase Lee","Strings","Viola"],[13,"Cyan Nguyen","Strings","Viola"],[14,"Donnie Ding","Strings","Violin 2"],[15,"Eden Chen","Strings","Cello"],[16,"Edison Yang","Strings","Double Bass"],[17,"Elise Dai-Liu","Strings","Cello"],[18,"Ella Huang","Winds","Clarinet"],[19,"Emma Li","Winds","Bassoon"],[20,"Eric Cheng","Winds","Saxophone"],[21,"Evan Wheatcroft","Strings","Double Bass"],[22,"Farrah","Strings","Cello"],[23,"Hillary Liang","Winds","Tuba"],[24,"Jacob Lin","Winds","Saxophone"],[25,"Janet Yang","Winds","Clarinet"],[26,"Jessica Liang","Winds","Flute"],[27,"Joshua Zhou","Winds","Flute"],[28,"Julia Liang","Winds","Trumpet"],[29,"Kaden Wu","Winds","Trombone"],[30,"Kaylee Lin","Strings","Violin 2"],[31,"Kelervia Fang","Winds","Clarinet"],[32,"Kevin Zhang","Winds","Saxophone"],[33,"Kyler Sun","Winds","Clarinet"],[34,"Lillian Tsaur","Winds","Flute"],[35,"Logan Wheatcroft","Percussion","Drum"],[36,"Lucas Shen","Winds","Bass Clarinet"],[37,"Lucas Yang","Percussion","Percussion"],[38,"Madelyn Chen","Strings","Cello"],[39,"Mason Huang","Strings","Cello"],[40,"Mason Li","Percussion","Percussion"],[41,"Matthew Wang","Winds","Oboe"],[42,"Meryl Chen","Strings","Violin 1"],[43,"Michael Zhang","Winds","Trombone"],[44,"Nathan Liang","Strings","Cello"],[45,"Nicole Luo","Strings","Violin 2"],[46,"Phoebe Xie","Strings","Cello"],[47,"Reina Wang","Strings","Violin 2"],[48,"Richie Luo","Strings","Violin 2"],[49,"Sabrina Long","Strings","Violin 1"],[50,"Selina","Strings","Violin 1"],[51,"Serena Liang","Strings","Violin 2"],[52,"Sophia Ma","Winds","Flute"],[53,"Sophia Yao","Winds","Clarinet"],[54,"Stella Yao","Strings","Double Bass"],[55,"Tanya Zhang","Strings","Violin 2"],[56,"Tiffany Lee","Winds","Trombone"],[57,"Tony Li","Percussion","Piano"],[58,"Tony Yi","Winds","Clarinet"],[59,"Vanessa Wang","Strings","Violin 1"],[60,"Victoria Fang","Winds","Flute"],[61,"Vincent Yao","Strings","Violin 1"],[62,"Wu Shug Liu","Winds","Oboe"],[63,"Yunhan Mo","Strings","Cello"],[64,"Zen Parris","Strings","Violin 1"],[65,"Cooper He","Strings","Violin 1"],[66,"Ziteng Chen","Winds","Clarinet"],[67,"Wentian Chen","Winds","Trumpet"],[68,"Shijie Rong","Winds","Saxophone"],[69,"Lillian Che","Winds","Flute"],[70,"Daniel Guo","Winds","Trumpet"],[71,"Eric Wang","Strings","Violin 2"],[72,"Jimmy Xiang","Strings","Violin 2"],[73,"Junshery Xiong","Strings","Viola"]
  ];
  const existingPins = new Map(sheet.getDataRange().getValues().slice(1).map(row => [Number(row[0]), clean_(row[4])]));
  const usedPins = new Set([...existingPins.values()].filter(Boolean));
  rows.forEach(row => { let pin = existingPins.get(row[0]); if (!pin) { do { pin = String(Math.floor(100000 + Math.random() * 900000)); } while (usedPins.has(pin)); } usedPins.add(pin); row.push(pin, true); });
  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

function readRows_(name) {
  const sheet = sheet_(name); const values = sheet.getDataRange().getValues(); if (values.length < 2) return [];
  const headers = values.shift().map(String); return values.filter(row => row.some(value => value !== "")).map(row => Object.fromEntries(headers.map((header, index) => [header, row[index]])));
}
function activeMembers_() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get("active-members-v1");
  if (cached) return JSON.parse(cached);
  const members = readRows_(SHEETS.MEMBERS).filter(row => truthy_(row.Active));
  cache.put("active-members-v1", JSON.stringify(members), 300);
  return members;
}
function append_(name, row) { sheet_(name).appendRow(row); }
function sheet_(name) { const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(name); if (!sheet) throw new Error(`${name} sheet is not set up`); return sheet; }
function sheetDate_(value) { return value instanceof Date ? Utilities.formatDate(value, TIME_ZONE, "yyyy-MM-dd") : clean_(value).slice(0, 10); }
function truthy_(value) { return value === true || String(value).toLowerCase() === "true"; }
function clean_(value) { return String(value == null ? "" : value).trim(); }
function json_(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
