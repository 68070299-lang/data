const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");
const path = require("path");
const { applyTheme } = require(process.env.SKILL + "/scripts/apply_theme.js");

const ASSETS = process.env.ASSETS;
const OUT = process.env.OUT;

const THEME = {
  name: "Car Rental Night Drive",
  headFontFace: "Kanit",
  bodyFontFace: "Sarabun",
  colors: {
    dk1: "0B1426", // page background (navy)
    lt1: "F1F5F9", // main text (light)
    dk2: "16233B", // card
    lt2: "94A3B8", // muted text
    accent1: "2DD4BF", // teal
    accent2: "FBBF24", // amber
    accent3: "FB7185", // error red
    accent4: "1F3150", // card alt / borders
    accent5: "60A5FA", // info blue
    accent6: "060C18", // code background
    hlink: "2DD4BF",
    folHlink: "FBBF24",
  },
};
const H = THEME.colors;

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
pres.title = "Online Car Rental System";
pres.author = "คณะผู้จัดทำ 68070182 68070228 68070229 68070329";
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
const C = pres.SchemeColor;

const W = 13.333;
const MX = 0.6;
const CODE_FONT = "Courier New";

// ---------- layouts ----------
pres.defineSlideMaster({
  title: "COVER",
  background: { color: C.text1 },
  objects: [],
});
pres.defineSlideMaster({
  title: "CONTENT",
  background: { color: C.text1 },
  margin: [0.5, 0.6, 0.6, 0.6],
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: MX, y: 0.35, w: W - 2 * MX, h: 0.8,
        fontSize: 30, bold: true, color: C.background1, valign: "middle", align: "left", fontFace: "Kanit", margin: 0 }, text: "" } },
    { text: { text: "Online Car Rental System  |  06066300 แนวคิดระบบฐานข้อมูล",
        options: { x: MX, y: 7.0, w: 8, h: 0.3, fontSize: 10, color: C.background2, margin: 0 } } },
  ],
  slideNumber: { x: 12.2, y: 7.0, w: 0.55, h: 0.3, fontSize: 10, color: C.background2, align: "right" },
});

// ---------- helpers ----------
async function icon(Comp, hex, px = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { color: "#" + hex, size: px }));
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}
function card(s, x, y, w, h, fill = C.text2, name = "card") {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.12, fill: { color: fill },
    line: { color: C.accent4, width: 0.75 }, objectName: name });
}
async function badge(s, Comp, x, y, d, fill, iconHex, name = "icon") {
  s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { type: "none" }, objectName: name + " circle" });
  const p = d * 0.22;
  s.addImage({ data: await icon(Comp, iconHex), x: x + p, y: y + p, w: d - 2 * p, h: d - 2 * p, objectName: name });
}
function text(s, t, o) {
  s.addText(t, Object.assign({ isTextBox: true, margin: 0, color: C.background1, fontSize: 15, valign: "top" }, o));
}
const KW = new Set(("SELECT FROM WHERE ORDER BY GROUP HAVING JOIN LEFT ON AS AND OR NOT EXISTS IN INSERT INTO VALUES UPDATE SET DELETE " +
  "CREATE TABLE PRIMARY KEY REFERENCES CHECK DEFAULT NULL EXCLUDE USING WITH SUM COUNT AVG ROUND COALESCE RANK OVER DESC BEGIN COMMIT " +
  "SERIAL INT VARCHAR DECIMAL TIMESTAMP UNIQUE INDEX").split(" "));
function codeRuns(code) {
  const runs = [];
  const lines = code.split("\n");
  lines.forEach((line, li) => {
    const parts = [];
    const re = /(--.*$)|('[^']*')|([A-Za-z_][A-Za-z_0-9]*)|([^A-Za-z_'-]+|-)/g;
    let m;
    while ((m = re.exec(line)) !== null) {
      let color = H.lt1;
      if (m[1]) color = H.lt2;
      else if (m[2]) color = H.accent1;
      else if (m[3] && KW.has(m[3])) color = H.accent2;
      parts.push({ text: m[0], options: { color } });
    }
    if (parts.length === 0) parts.push({ text: " ", options: { color: H.lt1 } });
    parts[parts.length - 1].options.breakLine = li < lines.length - 1;
    runs.push(...parts);
  });
  return runs;
}
function codeBlock(s, x, y, w, h, code, size = 13, name = "code") {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.1, fill: { color: C.accent6 },
    line: { color: C.accent4, width: 1 }, objectName: name + " panel" });
  s.addText(codeRuns(code), { x: x + 0.25, y: y + 0.2, w: w - 0.5, h: h - 0.4, fontFace: CODE_FONT, fontSize: size,
    valign: "top", margin: 0, isTextBox: true, objectName: name, paraSpaceAfter: 0 });
}
function chip(s, t, x, y, w, fill, color, size = 12, name = "chip") {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h: 0.38, rectRadius: 0.19, fill: { color: fill }, line: { type: "none" }, objectName: name + " bg" });
  s.addText(t, { x, y, w, h: 0.38, fontSize: size, bold: true, color, align: "center", valign: "middle", margin: 0, isTextBox: true, objectName: name });
}
function sl(section) {
  return pres.addSlide({ masterName: "CONTENT", sectionTitle: section });
}

(async () => {
  // ================= 1. COVER =================
  pres.addSection({ title: "บทนำ" });
  let s = pres.addSlide({ masterName: "COVER", sectionTitle: "บทนำ" });
  text(s, "06066300 แนวคิดระบบฐานข้อมูล  ·  คณะเทคโนโลยีสารสนเทศ สจล.", { x: MX, y: 0.7, w: 8, h: 0.4, fontSize: 14, color: C.accent1, bold: true });
  text(s, "Online Car\nRental System", { x: MX, y: 1.3, w: 7.6, h: 2.2, fontFace: THEME.headFontFace, fontSize: 54, bold: true, valign: "top", objectName: "title" });
  text(s, "ระบบเช่ารถยนต์ออนไลน์", { x: MX, y: 3.45, w: 7.6, h: 0.6, fontFace: THEME.headFontFace, fontSize: 28, bold: true, color: C.accent2 });
  const team = [["สิทธิพันธุ์ ฮงเจริญ", "68070182"], ["จิราธิวัชร ทะวิลา", "68070228"], ["ภรัมพรหม เหลืองภุมรัตน์", "68070229"], ["พูนพิพัฒน์ ช่างเกวียน", "68070329"]];
  team.forEach(([n, id], i) => {
    const x = MX + (i % 2) * 3.8, y = 4.45 + Math.floor(i / 2) * 0.85;
    card(s, x, y, 3.6, 0.7, C.text2, "member card");
    text(s, [{ text: n, options: { bold: true, breakLine: true } }, { text: id, options: { color: C.background2, fontSize: 12 } }],
      { x: x + 0.2, y: y + 0.08, w: 3.2, h: 0.56, fontSize: 14, objectName: "member" });
  });
  text(s, "อาจารย์ผู้สอน  ผศ.ดร.พัฒนพงษ์ ฉันทมิตรโอภาส", { x: MX, y: 6.35, w: 7.6, h: 0.35, fontSize: 14, color: C.background2 });
  s.addShape(pres.shapes.OVAL, { x: 8.55, y: 1.35, w: 4.1, h: 4.1, fill: { color: C.text2 }, line: { color: C.accent1, width: 2 }, objectName: "hero ring" });
  s.addImage({ data: await icon(fa.FaCarSide, H.accent1), x: 9.35, y: 2.25, w: 2.5, h: 2.5, objectName: "hero car" });
  await badge(s, fa.FaDatabase, 11.45, 4.25, 1.1, C.accent2, H.dk1, "hero database");
  s.addNotes("สวัสดีครับ กลุ่มของเรานำเสนอโครงงาน Online Car Rental System ระบบเช่ารถยนต์ออนไลน์ วิชาแนวคิดระบบฐานข้อมูล");

  // ================= 2. PROBLEM =================
  s = sl("บทนำ");
  s.addText("ที่มาและความสำคัญของปัญหา", { placeholder: "title" });
  const probs = [
    [fa.FaFileAlt, "จดบันทึกกระดาษ", "ข้อมูลกระจายหลายแหล่ง ไม่เชื่อมโยงกัน ค้นหาช้า"],
    [fa.FaClone, "ข้อมูลซ้ำซ้อน", "ลูกค้า รถ ราคา สถานะ บันทึกซ้ำและคลาดเคลื่อน"],
    [fa.FaCalendarTimes, "จองซ้อน", "รถคันเดียวถูกจองในช่วงเวลาทับซ้อน (Double Booking)"],
    [fa.FaPhoneAlt, "ต้องโทรถาม", "ลูกค้าตรวจสอบสถานะรถเองไม่ได้ เพิ่มภาระพนักงาน"],
  ];
  for (let i = 0; i < 4; i++) {
    const [ic, h, d] = probs[i];
    const x = MX + i * 3.08, y = 1.5;
    card(s, x, y, 2.85, 3.15, C.text2, "problem card");
    await badge(s, ic, x + 0.3, y + 0.35, 0.9, C.accent4, H.accent3, "problem icon");
    text(s, h, { x: x + 0.3, y: y + 1.45, w: 2.3, h: 0.5, fontSize: 20, bold: true, fontFace: THEME.headFontFace });
    text(s, d, { x: x + 0.3, y: y + 2.0, w: 2.3, h: 1.05, fontSize: 16, color: C.background2 });
  }
  card(s, MX, 4.95, W - 2 * MX, 1.2, C.accent4, "solution banner");
  await badge(s, fa.FaCheck, MX + 0.3, 5.15, 0.8, C.accent1, H.dk1, "solution icon");
  text(s, [{ text: "ทางออก  ", options: { bold: true, color: C.accent1 } },
    { text: "ฐานข้อมูลกลางที่รวมลูกค้า รถ การจอง การเช่า และการชำระเงินไว้ในระบบเดียว ตรวจสถานะได้ทันที และป้องกันการจองซ้อนอัตโนมัติ" }],
    { x: MX + 1.35, y: 5.05, w: 10.4, h: 1.0, fontSize: 17, valign: "middle" });
  s.addNotes("ปัญหาหลักของร้านเช่ารถแบบเดิมคือข้อมูลกระจัดกระจาย ซ้ำซ้อน และเสี่ยงต่อการจองรถคันเดียวกันซ้อนกัน เราจึงออกแบบฐานข้อมูลกลางเพื่อแก้ปัญหาเหล่านี้");

  // ================= 3. OBJECTIVES & SCOPE =================
  s = sl("บทนำ");
  s.addText("วัตถุประสงค์และขอบเขต", { placeholder: "title" });
  text(s, "วัตถุประสงค์", { x: MX, y: 1.45, w: 5.8, h: 0.45, fontSize: 20, bold: true, color: C.accent2, fontFace: THEME.headFontFace });
  const objs = ["ศึกษาและวิเคราะห์กระบวนการเช่ารถ แล้วนำหลักการฐานข้อมูลมาออกแบบ",
    "ออกแบบระบบให้จัดเก็บ สืบค้น ตรวจสอบ และปรับปรุงข้อมูลได้อย่างเป็นระบบ",
    "ลดความซ้ำซ้อนและความคลาดเคลื่อนในการจัดการรถ การจอง การรับและคืนรถ"];
  objs.forEach((o, i) => {
    const y = 2.05 + i * 1.5;
    card(s, MX, y, 5.9, 1.3, C.text2, "objective card");
    text(s, String(i + 1), { x: MX + 0.25, y: y + 0.2, w: 0.8, h: 0.9, fontSize: 40, bold: true, color: C.accent1, fontFace: THEME.headFontFace, valign: "middle" });
    text(s, o, { x: MX + 1.1, y: y + 0.15, w: 4.6, h: 1.0, fontSize: 16, valign: "middle" });
  });
  text(s, "ขอบเขตของระบบ", { x: 7.0, y: 1.45, w: 5.7, h: 0.45, fontSize: 20, bold: true, color: C.accent2, fontFace: THEME.headFontFace });
  const users = [[fa.FaUser, "ลูกค้า (Customer)", "สมัคร ค้นหารถ จอง ชำระเงิน ติดตามสถานะ"],
    [fa.FaUserShield, "ผู้ดูแลระบบ (Admin)", "จัดการรถ ประเภทรถ ราคา การจอง การรับ-คืนรถ"]];
  for (let i = 0; i < 2; i++) {
    const y = 2.05 + i * 1.5;
    card(s, 7.0, y, 5.73, 1.3, C.text2, "user card");
    await badge(s, users[i][0], 7.25, y + 0.25, 0.8, C.accent4, H.accent1, "user icon");
    text(s, [{ text: users[i][1], options: { bold: true, breakLine: true, fontSize: 17 } }, { text: users[i][2], options: { color: C.background2 } }],
      { x: 8.3, y: y + 0.15, w: 4.3, h: 1.0, fontSize: 15, valign: "middle" });
  }
  text(s, "6 ตารางหลัก", { x: 7.0, y: 5.15, w: 5.7, h: 0.35, fontSize: 15, bold: true, color: C.background2 });
  ["CUSTOMER", "CAR_TYPE", "CAR", "BOOKING", "RENTAL", "PAYMENT"].forEach((t, i) => {
    chip(s, t, 7.0 + (i % 3) * 1.93, 5.6 + Math.floor(i / 3) * 0.5, 1.8, C.accent4, C.accent1, 12, "table chip");
  });
  s.addNotes("วัตถุประสงค์มี 3 ข้อ ขอบเขตครอบคลุมผู้ใช้ 2 กลุ่ม คือลูกค้าและผู้ดูแลระบบ และฐานข้อมูล 6 ตาราง");

  // ================= 4. REQUIREMENTS =================
  s = sl("บทนำ");
  s.addText("ความต้องการของผู้ใช้ (User Requirements)", { placeholder: "title" });
  text(s, "Functional Requirements", { x: MX, y: 1.45, w: 7.4, h: 0.45, fontSize: 20, bold: true, color: C.accent1, fontFace: THEME.headFontFace });
  const fr = [[fa.FaIdCard, "ระบบลูกค้า", "CRUD ข้อมูลลูกค้า และตรวจสอบเลขใบขับขี่ (LicenseNo)"],
    [fa.FaCar, "ระบบรถยนต์", "จัดหมวดหมู่ Sedan / SUV / Van / Eco Car และอัปเดตสถานะรถ"],
    [fa.FaCalendarAlt, "ระบบการเช่า", "กำหนดวันรับ-คืนรถ คำนวณ TotalAmount อัตโนมัติ"],
    [fa.FaCreditCard, "ระบบชำระเงิน", "แบ่งจ่ายได้หลายครั้ง: มัดจำ ค่าเช่า ค่าปรับ"]];
  for (let i = 0; i < 4; i++) {
    const y = 2.05 + i * 1.15;
    card(s, MX, y, 7.4, 1.0, C.text2, "requirement card");
    await badge(s, fr[i][0], MX + 0.2, y + 0.15, 0.7, C.accent4, H.accent1, "requirement icon");
    text(s, [{ text: fr[i][1] + "  ", options: { bold: true } }, { text: fr[i][2], options: { color: C.background2 } }],
      { x: MX + 1.1, y: y + 0.1, w: 6.1, h: 0.8, fontSize: 15, valign: "middle" });
  }
  text(s, "Non-functional", { x: 8.4, y: 1.45, w: 4.3, h: 0.45, fontSize: 20, bold: true, color: C.accent2, fontFace: THEME.headFontFace });
  const nfr = [[fa.FaLock, "Security", "ข้อมูลใบขับขี่และข้อมูลส่วนบุคคลต้องเข้ารหัสและเก็บอย่างปลอดภัย"],
    [fa.FaShieldAlt, "Data Integrity", "ห้ามจองรถคันเดียวกันในช่วงเวลาทับซ้อน และวันคืนต้องหลังวันรับ"]];
  for (let i = 0; i < 2; i++) {
    const y = 2.05 + i * 2.33;
    card(s, 8.4, y, 4.33, 2.13, C.text2, "nfr card");
    await badge(s, nfr[i][0], 8.65, y + 0.25, 0.7, C.accent4, H.accent2, "nfr icon");
    text(s, nfr[i][1], { x: 9.5, y: y + 0.3, w: 3.0, h: 0.6, fontSize: 18, bold: true, valign: "middle" });
    text(s, nfr[i][2], { x: 8.65, y: y + 1.05, w: 3.85, h: 0.95, fontSize: 15, color: C.background2 });
  }
  s.addNotes("ความต้องการแบ่งเป็น 4 ระบบย่อยด้านฟังก์ชัน และ 2 ด้านที่ไม่ใช่ฟังก์ชัน คือความปลอดภัยและความถูกต้องของข้อมูล ซึ่งเราบังคับไว้ในฐานข้อมูลโดยตรง");

  // ================= 5. SOFTWARE =================
  pres.addSection({ title: "การออกแบบ" });
  s = sl("การออกแบบ");
  s.addText("การเลือกใช้ซอฟต์แวร์และสถาปัตยกรรม", { placeholder: "title" });
  card(s, MX, 1.45, 6.2, 5.2, C.text2, "why postgres card");
  await badge(s, fa.FaDatabase, MX + 0.3, 1.7, 0.9, C.accent1, H.dk1, "postgres icon");
  text(s, [{ text: "PostgreSQL 16", options: { bold: true, fontSize: 24, breakLine: true } }, { text: "บน Supabase (Managed Cloud)", options: { color: C.accent1, fontSize: 15 } }],
    { x: MX + 1.4, y: 1.7, w: 4.6, h: 0.95, fontFace: THEME.headFontFace, valign: "middle" });
  const why = ["ข้อมูลมีความสัมพันธ์ชัดเจน เหมาะกับ Relational Database",
    "รองรับ CHECK, FOREIGN KEY และ EXCLUDE ใช้กันการจองซ้อนได้ในตัว",
    "รองรับ Transaction (ACID), CTE และ Window Function",
    "Supabase ให้ใช้ฟรี ออนไลน์ 24 ชั่วโมง มี SQL Editor ในเว็บ"];
  for (let i = 0; i < why.length; i++) {
    const y = 3.0 + i * 0.88;
    s.addImage({ data: await icon(fa.FaCheckCircle, H.accent1), x: MX + 0.35, y: y + 0.05, w: 0.32, h: 0.32, objectName: "check" });
    text(s, why[i], { x: MX + 0.85, y, w: 5.1, h: 0.8, fontSize: 15 });
  }
  const tiers = [[fa.FaDesktop, "Frontend", "React / Flutter บน Vercel"], [fa.FaServer, "Backend API", "RESTful API ด้วย FastAPI / Node.js"], [fa.FaDatabase, "Database", "PostgreSQL 16 (Supabase)"]];
  for (let i = 0; i < 3; i++) {
    const y = 1.45 + i * 1.45;
    card(s, 7.2, y, 5.53, 1.05, i === 2 ? C.accent4 : C.text2, "tier card");
    await badge(s, tiers[i][0], 7.4, y + 0.17, 0.7, i === 2 ? C.accent1 : C.accent4, i === 2 ? H.dk1 : H.accent1, "tier icon");
    text(s, [{ text: tiers[i][1], options: { bold: true, breakLine: true } }, { text: tiers[i][2], options: { color: C.background2, fontSize: 14 } }],
      { x: 8.3, y: y + 0.1, w: 4.3, h: 0.85, fontSize: 17, valign: "middle" });
    if (i < 2) s.addImage({ data: await icon(fa.FaArrowDown, H.lt2), x: 9.83, y: y + 1.1, w: 0.3, h: 0.3, objectName: "tier arrow" });
  }
  text(s, "เครื่องมือ", { x: 7.2, y: 5.85, w: 1.2, h: 0.38, fontSize: 14, bold: true, color: C.background2, valign: "middle" });
  ["Mermaid / draw.io (ERD)", "pgAdmin / Supabase SQL"].forEach((t, i) => chip(s, t, 8.35 + i * 2.25, 5.85, 2.15, C.accent4, C.accent2, 11, "tool chip"));
  s.addNotes("เราเลือก PostgreSQL เพราะข้อมูลมีความสัมพันธ์ชัดเจน และมี EXCLUDE constraint ที่ใช้กันการจองซ้อนได้ ซึ่ง MySQL ไม่มี ต้องเขียน trigger เอง ระบบออกแบบเป็น 3-Tier");

  // ================= 6. WORKFLOW =================
  s = sl("การออกแบบ");
  s.addText("การทำงานของระบบ 5 ขั้นตอน", { placeholder: "title" });
  const steps = [[fa.FaUserPlus, "ลงทะเบียน", "บันทึกลูกค้าและตรวจใบขับขี่", "CUSTOMER"],
    [fa.FaSearch, "ค้นหารถ", "แสดงเฉพาะรถที่ Status = Available", "CAR · CAR_TYPE"],
    [fa.FaCalendarCheck, "จองและเช่า", "TotalAmount = จำนวนวัน × DailyRate รถเปลี่ยนเป็น Rented", "BOOKING · RENTAL"],
    [fa.FaMoneyBillWave, "ชำระเงิน", "บันทึกการจ่าย การจองเป็น Confirmed", "PAYMENT"],
    [fa.FaUndoAlt, "คืนรถ", "Admin ตรวจสภาพ RENTAL = Completed รถกลับเป็น Available", "RENTAL · CAR"]];
  const sw = 2.25, sg = (W - 2 * MX - 5 * sw) / 4;
  for (let i = 0; i < 5; i++) {
    const x = MX + i * (sw + sg);
    card(s, x, 1.55, sw, 4.7, C.text2, "step card");
    await badge(s, steps[i][0], x + (sw - 1.0) / 2, 1.85, 1.0, i === 2 ? C.accent2 : C.accent1, H.dk1, "step icon");
    text(s, "ขั้นที่ " + (i + 1), { x: x + 0.2, y: 3.0, w: sw - 0.4, h: 0.35, fontSize: 13, color: C.background2, align: "center" });
    text(s, steps[i][1], { x: x + 0.2, y: 3.35, w: sw - 0.4, h: 0.5, fontSize: 20, bold: true, align: "center", fontFace: THEME.headFontFace });
    text(s, steps[i][2], { x: x + 0.2, y: 3.95, w: sw - 0.4, h: 1.5, fontSize: 14, color: C.background2, align: "center" });
    chip(s, steps[i][3], x + 0.15, 5.6, sw - 0.3, C.accent4, C.accent1, 11, "step table");
    if (i < 4) s.addImage({ data: await icon(fa.FaChevronRight, H.accent2), x: x + sw + (sg - 0.22) / 2, y: 2.2, w: 0.22, h: 0.3, objectName: "step arrow" });
  }
  text(s, "สถานะรถ:  Available → Rented → Available        สถานะการจอง:  Pending → Confirmed → Completed", { x: MX, y: 6.45, w: 12, h: 0.35, fontSize: 13, color: C.accent2 });
  s.addNotes("ระบบมี 5 ขั้นตอนหลัก ตั้งแต่ลงทะเบียน ค้นหารถ จองและเช่า ชำระเงิน จนถึงคืนรถ แต่ละขั้นจะอ่านหรือเขียนตารางที่แสดงอยู่ด้านล่าง");

  // ================= 7. BUSINESS RULES =================
  s = sl("การออกแบบ");
  s.addText("กฎทางธุรกิจ (Business Rules) → Constraint", { placeholder: "title" });
  const hdr = (t) => ({ text: t, options: { bold: true, color: C.text1, fill: { color: C.accent1 } } });
  const rules = [["BR1", "ลูกค้า 1 คนเช่าได้หลายรายการ แต่ 1 รายการเป็นของลูกค้า 1 คน", "FK customer_id ใน BOOKING (1:N)"],
    ["BR2", "รถ 1 คันห้ามถูกจองซ้อนในช่วงเวลาเดียวกัน", "EXCLUDE constraint no_overlap"],
    ["BR3", "รถแต่ละคันอยู่ใน 1 ประเภท ประเภทหนึ่งมีรถได้หลายคัน", "FK car_type_id NOT NULL"],
    ["BR4", "การเช่าต้องระบุรถ วันที่เช่า และวันที่คืน", "NOT NULL car_id, start_date, end_date"],
    ["BR5", "การเช่า 1 รายการชำระได้หลายครั้ง (มัดจำ + ส่วนที่เหลือ)", "PAYMENT → BOOKING (1:N)"],
    ["BR6", "เช่าได้เฉพาะรถที่สถานะ Available", "กรองสถานะใน query ค้นหารถว่าง"],
    ["BR7", "วันที่คืนต้องไม่อยู่ก่อนวันที่เช่า", "CHECK (end_date > start_date)"]];
  const rows = [[hdr("กฎ"), hdr("ความหมาย"), hdr("บังคับด้วย")]];
  rules.forEach((r, i) => {
    const fill = { color: i % 2 ? C.accent4 : C.text2 };
    rows.push([{ text: r[0], options: { bold: true, color: C.accent2, fill } }, { text: r[1], options: { fill } },
      { text: r[2], options: { fill, fontFace: CODE_FONT, fontSize: 13, color: C.accent1 } }]);
  });
  s.addTable(rows, { x: MX, y: 1.5, w: W - 2 * MX, colW: [1.0, 6.4, 4.73], rowH: 0.62, fontSize: 15, color: C.background1,
    border: { type: "solid", pt: 1, color: H.dk1 }, valign: "middle", margin: [0, 0.15, 0, 0.15], objectName: "business rules table" });
  s.addNotes("กฎทางธุรกิจทั้ง 7 ข้อ เราแปลงเป็น constraint ในฐานข้อมูล ข้อสำคัญคือ BR2 ใช้ EXCLUDE constraint ป้องกันการจองซ้อน และ BR7 ใช้ CHECK");

  // ================= 8. ERD =================
  s = sl("การออกแบบ");
  s.addText("Entity Relationship Diagram (ERD)", { placeholder: "title" });
  const ents = {
    CUSTOMER: { x: 0.6, y: 1.5, f: [["CustomerID", "PK"], ["Name"], ["Phone"], ["Email"], ["LicenseNo"]] },
    BOOKING: { x: 3.75, y: 1.5, f: [["BookingID", "PK"], ["CustomerID", "FK"], ["CarID", "FK"], ["StartDate"], ["EndDate"], ["DepositAmount"], ["Status"]] },
    CAR: { x: 6.9, y: 1.5, f: [["CarID", "PK"], ["CarTypeID", "FK"], ["LicensePlate"], ["Brand / Model"], ["DailyRate"], ["Status"]] },
    CAR_TYPE: { x: 10.05, y: 1.5, f: [["CarTypeID", "PK"], ["TypeName"], ["Description"]] },
    RENTAL: { x: 1.9, y: 4.45, f: [["RentalID", "PK"], ["BookingID", "FK"], ["ActualRentDate"], ["ActualReturnDate"], ["TotalAmount"], ["Status"]] },
    PAYMENT: { x: 5.6, y: 4.45, f: [["PaymentID", "PK"], ["BookingID", "FK"], ["RentalID", "FK"], ["Amount"], ["PaymentMethod"], ["PaymentType"]] },
  };
  const EW = 2.45, HH = 0.42, LH = 0.26;
  for (const [name, e] of Object.entries(ents)) {
    const h = HH + e.f.length * LH + 0.1;
    e.h = h;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: e.x, y: e.y, w: EW, h, rectRadius: 0.08, fill: { color: C.text2 }, line: { color: C.accent1, width: 1.25 }, objectName: name + " entity" });
    s.addText(name, { x: e.x, y: e.y, w: EW, h: HH, fontSize: 14, bold: true, color: C.accent1, align: "center", valign: "middle", margin: 0, isTextBox: true, objectName: name + " name" });
    s.addText(e.f.map((f, i) => ({ text: f[0] + (f[1] ? "  " + f[1] : ""), options: { color: f[1] === "PK" ? H.accent2 : f[1] === "FK" ? H.accent5 : H.lt1, bold: !!f[1], breakLine: i < e.f.length - 1 } })),
      { x: e.x + 0.18, y: e.y + HH, w: EW - 0.3, h: e.f.length * LH, fontSize: 11, fontFace: CODE_FONT, margin: 0, valign: "top", isTextBox: true, paraSpaceAfter: 0, lineSpacing: 18.7, objectName: name + " fields" });
  }
  const line = (x1, y1, x2, y2, label, lx, ly) => {
    s.addShape(pres.shapes.LINE, { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1) || 0.001, h: Math.abs(y2 - y1) || 0.001,
      flipH: (x2 < x1) !== (y2 < y1) && x1 !== x2 && y1 !== y2, line: { color: C.accent2, width: 1.75 }, objectName: "relationship " + label });
    text(s, label, { x: lx, y: ly, w: 0.9, h: 0.28, fontSize: 11, bold: true, color: C.accent2, align: "center", objectName: "cardinality" });
  };
  const ry = 1.5 + 0.75;
  line(0.6 + EW, ry, 3.75, ry, "1 : N", 0.6 + EW - 0.1, ry - 0.33);
  line(6.9, ry, 3.75 + EW, ry, "N : 1", 3.75 + EW - 0.1, ry - 0.33);
  line(10.05, ry, 6.9 + EW, ry, "N : 1", 6.9 + EW - 0.1, ry - 0.33);
  const bb = 1.5 + ents.BOOKING.h;
  line(4.6, bb, 3.125, 4.45, "1 : 0..1", 3.0, 3.95);
  line(5.4, bb, 6.825, 4.45, "1 : N", 6.15, 3.95);
  line(1.9 + EW, 5.3, 5.6, 5.3, "1 : N", 4.3, 4.98);
  card(s, 8.6, 4.45, 4.13, 2.2, C.accent4, "erd notes");
  text(s, [{ text: "PK", options: { color: C.accent2, bold: true } }, { text: " Primary Key   ", options: {} }, { text: "FK", options: { color: C.accent5, bold: true } }, { text: " Foreign Key", options: { breakLine: true } },
    { text: "ทำไมแยก BOOKING กับ RENTAL?", options: { bold: true, color: C.accent1, breakLine: true } },
    { text: "การจองยกเลิกได้และจ่ายมัดจำก่อน ส่วนการเช่าคือการรับรถจริง จึงเป็น 1 : 0..1", options: { color: C.background2 } }],
    { x: 8.85, y: 4.6, w: 3.7, h: 1.95, fontSize: 13, paraSpaceAfter: 6 });
  s.addNotes("ERD มี 6 เอนทิตี BOOKING เป็นศูนย์กลาง เชื่อมกับลูกค้าและรถแบบ N:1 การจองหนึ่งครั้งกลายเป็นการเช่าได้ไม่เกิน 1 ครั้ง และมีการชำระเงินได้หลายครั้ง");

  // ================= 9. NORMALIZATION =================
  s = sl("การออกแบบ");
  s.addText("Normalization: 1NF → 2NF → 3NF", { placeholder: "title" });
  const nf = [["1NF", C.accent3, "ตาราง BOOKING มีข้อมูลลูกค้าปนอยู่ (Name, Phone, Email, LicenseNo) และ CAR มี TypeName", "ค่าทุกช่องเป็นค่าเดี่ยว แต่ยังซ้ำซ้อน"],
    ["2NF", C.accent2, "แยก CUSTOMER ออกจาก BOOKING", "ตัด Partial Dependency: ข้อมูลลูกค้าขึ้นกับ CustomerID ไม่ใช่ BookingID"],
    ["3NF", C.accent1, "แยก CAR_TYPE ออกจาก CAR", "ตัด Transitive Dependency: CarID → CarTypeID → TypeName"]];
  nf.forEach(([t, col, a, b], i) => {
    const y = 1.5 + i * 1.62;
    card(s, MX, y, 7.6, 1.42, C.text2, "normal form card");
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: MX + 0.22, y: y + 0.26, w: 1.2, h: 0.9, rectRadius: 0.1, fill: { color: col }, line: { type: "none" }, objectName: t + " tag" });
    text(s, t, { x: MX + 0.22, y: y + 0.26, w: 1.2, h: 0.9, fontSize: 24, bold: true, color: C.text1, align: "center", valign: "middle", fontFace: THEME.headFontFace });
    text(s, [{ text: a, options: { bold: true, breakLine: true } }, { text: b, options: { color: C.background2, fontSize: 14 } }],
      { x: MX + 1.65, y: y + 0.12, w: 5.75, h: 1.2, fontSize: 15, valign: "middle" });
  });
  card(s, MX, 6.35 - 0.0, 7.6, 0.45, C.text1, "nf result");
  text(s, "ผลลัพธ์: 6 ตาราง ไม่มี Insertion / Update / Deletion Anomaly", { x: MX, y: 6.38, w: 7.6, h: 0.4, fontSize: 15, bold: true, color: C.accent1 });
  // native before / after diagram
  card(s, 8.55, 1.5, 4.18, 5.3, C.text2, "normalization diagram");
  text(s, "ก่อน (1NF)", { x: 8.8, y: 1.65, w: 3.7, h: 0.35, fontSize: 15, bold: true, color: C.accent3 });
  const fieldBox = (y, name, plain, bad, nm) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 8.8, y, w: 3.7, h: 0.95, rectRadius: 0.08, fill: { color: C.accent6 }, line: { color: C.accent4, width: 1 }, objectName: nm + " box" });
    s.addText([{ text: name + "  ", options: { bold: true, color: H.accent1 } }, { text: plain, options: { color: H.lt1 } }, { text: bad, options: { color: H.accent3, bold: true } }],
      { x: 8.95, y: y + 0.06, w: 3.45, h: 0.83, fontSize: 11, fontFace: CODE_FONT, margin: 0, valign: "middle", isTextBox: true, objectName: nm });
  };
  fieldBox(2.05, "BOOKING", "BookingID, CarID, StartDate, EndDate, Status, ", "Name, Phone, Email, LicenseNo", "1NF booking");
  fieldBox(3.1, "CAR", "CarID, CarTypeID, Brand, Model, DailyRate, ", "TypeName", "1NF car");
  s.addImage({ data: await icon(fa.FaArrowDown, H.accent2), x: 10.47, y: 4.12, w: 0.35, h: 0.35, objectName: "normalize arrow" });
  text(s, "หลัง (3NF)", { x: 8.8, y: 4.5, w: 3.7, h: 0.35, fontSize: 15, bold: true, color: C.accent1 });
  ["BOOKING", "CUSTOMER", "CAR", "CAR_TYPE", "RENTAL", "PAYMENT"].forEach((t, i) =>
    chip(s, t, 8.8 + (i % 2) * 1.9, 4.95 + Math.floor(i / 2) * 0.55, 1.8, ["CUSTOMER", "CAR_TYPE"].includes(t) ? C.accent1 : C.accent4, ["CUSTOMER", "CAR_TYPE"].includes(t) ? C.text1 : C.background1, 12, "3NF table"));
  s.addNotes("เริ่มจาก 1NF ที่ข้อมูลลูกค้าปนอยู่ในตารางการจอง ขั้น 2NF แยกตารางลูกค้า ขั้น 3NF แยกประเภทรถ เพราะ TypeName ขึ้นกับ CarTypeID ไม่ใช่ CarID โดยตรง");

  // ================= 10. DATA DICTIONARY =================
  s = sl("การออกแบบ");
  s.addText("Data Dictionary", { placeholder: "title" });
  const dd = [["CUSTOMER", "CustomerID", "–"], ["CAR_TYPE", "CarTypeID", "–"], ["CAR", "CarID", "CarTypeID"], ["BOOKING", "BookingID", "CustomerID, CarID"], ["RENTAL", "RentalID", "BookingID"], ["PAYMENT", "PaymentID", "BookingID, RentalID"]];
  const ddRows = [[hdr("ตาราง"), hdr("PK"), hdr("FK")]];
  dd.forEach((r, i) => { const fill = { color: i % 2 ? C.accent4 : C.text2 };
    ddRows.push([{ text: r[0], options: { bold: true, fill } }, { text: r[1], options: { color: C.accent2, fill } }, { text: r[2], options: { color: C.accent5, fill } }]); });
  s.addTable(ddRows, { x: MX, y: 1.5, w: 5.9, colW: [1.6, 1.7, 2.6], rowH: 0.52, fontSize: 14, color: C.background1, fontFace: CODE_FONT,
    border: { type: "solid", pt: 1, color: H.dk1 }, valign: "middle", margin: [0, 0.12, 0, 0.12], objectName: "key summary table" });
  text(s, "ชนิดข้อมูลที่ใช้", { x: MX, y: 5.35, w: 5.9, h: 0.35, fontSize: 15, bold: true, color: C.background2 });
  ["INT / SERIAL", "VARCHAR(n)", "DECIMAL(10,2)", "TIMESTAMP"].forEach((t, i) => chip(s, t, MX + (i % 2) * 2.98, 5.8 + Math.floor(i / 2) * 0.48, 2.85, C.accent4, C.accent1, 12, "type chip"));
  text(s, "ตัวอย่างรายละเอียด: ตาราง BOOKING", { x: 6.85, y: 1.5, w: 5.88, h: 0.35, fontSize: 15, bold: true, color: C.accent2 });
  const bf = [["BookingID", "INT", "PK", "รหัสการจอง"], ["CustomerID", "INT", "FK", "ลูกค้าที่จอง"], ["CarID", "INT", "FK", "รถที่จอง"],
    ["BookingDate", "TIMESTAMP", "", "วันเวลาที่จอง"], ["StartDate", "TIMESTAMP", "", "วันเริ่มเช่า"], ["EndDate", "TIMESTAMP", "", "วันสิ้นสุดการเช่า"],
    ["DepositAmount", "DECIMAL(10,2)", "", "เงินมัดจำ"], ["Status", "VARCHAR(20)", "", "สถานะการจอง"]];
  const bRows = [[hdr("Field"), hdr("Type"), hdr("Key"), hdr("คำอธิบาย")]];
  bf.forEach((r, i) => { const fill = { color: i % 2 ? C.accent4 : C.text2 };
    bRows.push([{ text: r[0], options: { fill, fontFace: CODE_FONT, bold: true } }, { text: r[1], options: { fill, fontFace: CODE_FONT, color: C.background2 } },
      { text: r[2], options: { fill, bold: true, align: "center", color: r[2] === "PK" ? C.accent2 : C.accent5 } }, { text: r[3], options: { fill } }]); });
  s.addTable(bRows, { x: 6.85, y: 1.95, w: 5.88, colW: [1.65, 1.6, 0.6, 2.03], rowH: 0.5, fontSize: 12, color: C.background1,
    border: { type: "solid", pt: 1, color: H.dk1 }, valign: "middle", margin: [0, 0.1, 0, 0.1], objectName: "booking dictionary table" });
  s.addNotes("Data Dictionary สรุปคีย์หลักและคีย์นอกของทั้ง 6 ตาราง ด้านขวาเป็นตัวอย่างรายละเอียดตาราง BOOKING ส่วนตารางอื่นอยู่ในรายงาน");

  // ================= 11. DDL =================
  pres.addSection({ title: "การสร้างและทดสอบ" });
  s = sl("การสร้างและทดสอบ");
  s.addText("สร้างฐานข้อมูลด้วย SQL DDL", { placeholder: "title" });
  codeBlock(s, MX, 1.45, 7.6, 5.3,
`CREATE TABLE booking (
  booking_id  SERIAL PRIMARY KEY,
  customer_id INT NOT NULL REFERENCES customer,
  car_id      INT NOT NULL REFERENCES car,
  start_date  TIMESTAMP NOT NULL,
  end_date    TIMESTAMP NOT NULL,
  deposit_amount DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'Pending'
    CHECK (status IN ('Pending','Confirmed',
                      'Cancelled','Completed')),
  CHECK (end_date > start_date),       -- BR7
  EXCLUDE USING gist (car_id WITH =,   -- BR2
    tsrange(start_date, end_date) WITH &&)
    WHERE (status <> 'Cancelled')
);`, 15, "booking ddl");
  const hl = [[fa.FaKey, "PK / FK", "เชื่อม customer และ car", C.accent2],
    [fa.FaFilter, "CHECK", "จำกัดค่าสถานะ และวันคืน > วันรับ (BR7)", C.accent1],
    [fa.FaBan, "EXCLUDE", "รถคันเดิม + ช่วงเวลาซ้อน = ปฏิเสธทันที (BR2)", C.accent3],
    [fa.FaBolt, "INDEX", "car(status), booking(car_id) ค้นหาเร็วขึ้น", C.accent5]];
  for (let i = 0; i < 4; i++) {
    const y = 1.45 + i * 0.98;
    await badge(s, hl[i][0], 8.55, y + 0.08, 0.66, C.accent4, [H.accent2, H.accent1, H.accent3, H.accent5][i], "ddl icon");
    text(s, [{ text: hl[i][1], options: { bold: true, breakLine: true, color: hl[i][3] } }, { text: hl[i][2], options: { color: C.background2, fontSize: 14 } }],
      { x: 9.4, y, w: 3.33, h: 0.85, fontSize: 16, valign: "middle" });
  }
  card(s, 8.55, 5.45, 4.18, 1.3, C.accent4, "ddl stats");
  text(s, [{ text: "6", options: { fontSize: 40, bold: true, color: C.accent1 } }, { text: " ตาราง    ", options: { fontSize: 15 } },
    { text: "30", options: { fontSize: 40, bold: true, color: C.accent2 } }, { text: " constraints", options: { fontSize: 15 } }],
    { x: 8.75, y: 5.5, w: 3.9, h: 1.2, valign: "middle", fontFace: THEME.headFontFace });
  s.addNotes("ตัวอย่าง DDL ของตาราง booking ซึ่งสำคัญที่สุด มี PK FK CHECK และ EXCLUDE constraint ที่ป้องกันการจองรถคันเดียวกันในเวลาที่ทับซ้อน รวมทั้งระบบมี 30 constraints");

  // ================= 12. SAMPLE DATA =================
  s = sl("การสร้างและทดสอบ");
  s.addText("ตัวอย่างข้อมูล (Sample Data)", { placeholder: "title" });
  const kpi = [["4", "ประเภทรถ"], ["8", "คัน"], ["6", "ลูกค้า"], ["8", "การจอง"], ["6", "การเช่า"], ["12", "การชำระเงิน"]];
  const kw = (W - 2 * MX - 5 * 0.25) / 6;
  kpi.forEach(([n, l], i) => {
    const x = MX + i * (kw + 0.25);
    card(s, x, 1.45, kw, 1.45, C.text2, "kpi card");
    text(s, n, { x, y: 1.5, w: kw, h: 0.85, fontSize: 44, bold: true, color: i % 2 ? C.accent2 : C.accent1, align: "center", valign: "middle", fontFace: THEME.headFontFace });
    text(s, l, { x, y: 2.35, w: kw, h: 0.4, fontSize: 15, color: C.background2, align: "center" });
  });
  const cars = [["Toyota Camry", "Sedan", "1,800", "Available"], ["Honda Civic", "Sedan", "1,500", "Rented"], ["Toyota Fortuner", "SUV", "2,500", "Available"],
    ["Toyota Commuter", "Van", "3,000", "Available"], ["Hyundai H-1", "Van", "2,800", "Maintenance"], ["Nissan Almera", "Eco Car", "900", "Available"]];
  const stCol = { Available: C.accent1, Rented: C.accent2, Maintenance: C.accent3 };
  const carRows = [[hdr("รถ"), hdr("ประเภท"), hdr("บาท/วัน"), hdr("Status")]];
  cars.forEach((r, i) => { const fill = { color: i % 2 ? C.accent4 : C.text2 };
    carRows.push([{ text: r[0], options: { fill, bold: true } }, { text: r[1], options: { fill } }, { text: r[2], options: { fill, align: "right" } }, { text: r[3], options: { fill, color: stCol[r[3]], bold: true } }]); });
  s.addTable(carRows, { x: MX, y: 3.2, w: 7.6, colW: [2.5, 1.6, 1.5, 2.0], rowH: 0.48, fontSize: 14, color: C.background1,
    border: { type: "solid", pt: 1, color: H.dk1 }, valign: "middle", margin: [0, 0.12, 0, 0.12], objectName: "car sample table" });
  card(s, 8.55, 3.2, 4.18, 3.36, C.text2, "coverage card");
  text(s, "ข้อมูลครอบคลุมทุกกรณีทดสอบ", { x: 8.8, y: 3.35, w: 3.8, h: 0.4, fontSize: 16, bold: true, color: C.accent2 });
  text(s, [{ text: "สถานะรถทั้ง 3 แบบ", options: { bullet: true, breakLine: true } }, { text: "สถานะการจองทั้ง 4 แบบ รวม Cancelled", options: { bullet: true, breakLine: true } },
    { text: "ชำระหลายงวด: มัดจำ + ค่าเช่า + ค่าปรับ", options: { bullet: true, breakLine: true } }, { text: "การเช่าที่ยังไม่คืน เพื่อทดสอบยอดค้างชำระ", options: { bullet: true } }],
    { x: 8.8, y: 3.85, w: 3.75, h: 2.6, fontSize: 15, paraSpaceAfter: 8 });
  s.addNotes("ข้อมูลตัวอย่างออกแบบให้ครอบคลุมทุกสถานะ เพื่อให้คำสั่งทดสอบทุกข้อมีผลลัพธ์ที่มีความหมาย");

  // ================= 13. EASY =================
  s = sl("การสร้างและทดสอบ");
  s.addText("การทดสอบระดับง่าย (Easy) · 6 คำสั่ง", { placeholder: "title" });
  codeBlock(s, MX, 1.45, 7.0, 1.6,
`-- E1 รถที่ว่าง เรียงตามราคา
SELECT brand, model, daily_rate
FROM car WHERE status = 'Available'
ORDER BY daily_rate;`.replace("-- E1 รถที่ว่าง เรียงตามราคา", "-- E1 available cars by price"), 14, "easy code");
  const e1 = [[hdr("brand"), hdr("model"), hdr("daily_rate")], ["Nissan", "Almera", "900.00"], ["Toyota", "Yaris Ativ", "950.00"], ["Toyota", "Camry", "1800.00"], ["Toyota", "Fortuner", "2500.00"], ["Toyota", "Commuter", "3000.00"]];
  s.addTable(e1.map((r, i) => i === 0 ? r : r.map((c, j) => ({ text: c, options: { fill: { color: i % 2 ? C.text2 : C.accent4 }, align: j === 2 ? "right" : "left" } }))),
    { x: MX, y: 3.3, w: 7.0, colW: [2.2, 2.6, 2.2], rowH: 0.42, fontSize: 13, fontFace: CODE_FONT, color: C.background1, border: { type: "solid", pt: 1, color: H.dk1 }, valign: "middle", margin: [0, 0.12, 0, 0.12], objectName: "E1 result" });
  text(s, "ผลลัพธ์ 5 แถว", { x: MX, y: 5.9, w: 7, h: 0.3, fontSize: 12, color: C.background2 });
  const easy = [["E1", "SELECT + WHERE + ORDER BY", "รถที่ว่าง เรียงตามราคา → 5 คัน"], ["E2", "SELECT WHERE", "ค้นหาลูกค้าจากเลขใบขับขี่"], ["E3", "เงื่อนไขช่วงราคา", "รถค่าเช่า ≤ 2,000 บาท → 4 คัน"],
    ["E4", "INSERT", "เพิ่มลูกค้าใหม่"], ["E5", "UPDATE", "รถซ่อมเสร็จ → Available"], ["E6", "DELETE", "ลบลูกค้าที่ไม่เคยจอง"]];
  easy.forEach(([id, k, d], i) => {
    const y = 1.45 + i * 0.88;
    card(s, 7.9, y, 4.83, 0.76, C.text2, "test row");
    text(s, id, { x: 8.05, y, w: 0.6, h: 0.76, fontSize: 16, bold: true, color: C.accent1, valign: "middle", fontFace: THEME.headFontFace });
    text(s, [{ text: k, options: { bold: true, breakLine: true, fontSize: 13, color: C.accent2, fontFace: CODE_FONT } }, { text: d, options: { fontSize: 14 } }],
      { x: 8.7, y: y + 0.05, w: 3.9, h: 0.66, valign: "middle" });
  });
  s.addNotes("ระดับง่ายเป็นคำสั่งตารางเดียว ทั้ง SELECT INSERT UPDATE DELETE ตัวอย่าง E1 หารถที่ว่างเรียงตามราคา ได้ 5 คัน");

  // ================= 14. MEDIUM =================
  s = sl("การสร้างและทดสอบ");
  s.addText("การทดสอบระดับปานกลาง (Medium) · 5 คำสั่ง", { placeholder: "title" });
  codeBlock(s, MX, 1.45, 7.0, 2.2,
`-- M2 cars and avg rate per type
SELECT t.type_name, COUNT(c.car_id) AS cars,
       ROUND(AVG(c.daily_rate), 2) AS avg_rate
FROM car_type t LEFT JOIN car c
  ON c.car_type_id = t.car_type_id
GROUP BY t.type_name ORDER BY avg_rate DESC;`, 13, "medium code");
  s.addChart(pres.charts.BAR, [{ name: "ค่าเช่าเฉลี่ย (บาท/วัน)", labels: ["Van", "SUV", "Sedan", "Eco Car"], values: [2900, 2400, 1650, 925] }], {
    x: MX, y: 3.8, w: 7.0, h: 2.95, barDir: "bar", chartColors: [H.accent1], showValue: true, dataLabelPosition: "outEnd", dataLabelColor: H.lt1, dataLabelFontSize: 12, dataLabelFontFace: "+mn-lt", dataLabelFormatCode: "#,##0",
    catAxisLabelColor: H.lt1, catAxisLabelFontSize: 13, catAxisLabelFontFace: "+mn-lt", valAxisHidden: true, valGridLine: { style: "none" }, catGridLine: { style: "none" },
    catAxisOrientation: "maxMin", showLegend: false, showTitle: true, title: "ผล M2: ค่าเช่าเฉลี่ยต่อวันตามประเภท", titleColor: H.lt2, titleFontSize: 13, titleFontFace: "+mn-lt", barGapWidthPct: 60, objectName: "M2 result chart" });
  const med = [["M1", "JOIN 3 ตาราง", "การจองพร้อมชื่อลูกค้าและรถ (8 แถว)"], ["M2", "LEFT JOIN + GROUP BY + AVG", "Van 2,900 · SUV 2,400 · Sedan 1,650"], ["M3", "SUM + GROUP BY", "Credit Card 15,900 · Cash 9,500 · QR 3,800"],
    ["M4", "GROUP BY + HAVING", "ลูกค้าที่จองมากกว่า 1 ครั้ง (2 คน)"], ["M5", "JOIN 4 ตาราง", "รถที่กำลังถูกเช่าและวันกำหนดคืน"]];
  med.forEach(([id, k, d], i) => {
    const y = 1.45 + i * 1.06;
    card(s, 7.9, y, 4.83, 0.92, C.text2, "test row");
    text(s, id, { x: 8.05, y, w: 0.65, h: 0.92, fontSize: 16, bold: true, color: C.accent1, valign: "middle", fontFace: THEME.headFontFace });
    text(s, [{ text: k, options: { bold: true, breakLine: true, fontSize: 13, color: C.accent2, fontFace: CODE_FONT } }, { text: d, options: { fontSize: 14 } }],
      { x: 8.75, y: y + 0.06, w: 3.85, h: 0.8, valign: "middle" });
  });
  s.addNotes("ระดับปานกลางใช้ JOIN หลายตาราง GROUP BY และ HAVING ตัวอย่าง M2 หาค่าเช่าเฉลี่ยตามประเภทรถ Van แพงที่สุด 2,900 บาทต่อวัน");

  // ================= 15. COMPLEX =================
  s = sl("การสร้างและทดสอบ");
  s.addText("การทดสอบระดับซับซ้อน (Complex) · 7 คำสั่ง", { placeholder: "title" });
  codeBlock(s, MX, 1.45, 7.0, 3.05,
`-- C1 outstanding balance per rental (CTE)
WITH paid AS (
  SELECT booking_id, SUM(amount) AS paid
  FROM payment WHERE status = 'Paid'
  GROUP BY booking_id)
SELECT r.rental_id,
  r.total_amount - COALESCE(p.paid, 0) AS outstanding
FROM rental r LEFT JOIN paid p USING (booking_id)
WHERE r.total_amount - COALESCE(p.paid, 0) > 0;`, 13, "complex code");
  const c1 = [[hdr("rental_id"), hdr("customer"), hdr("total"), hdr("outstanding")], ["5", "พิมพ์ชนก", "10,500", "9,500"], ["6", "วีรภัทร", "6,900", "5,400"]];
  s.addTable(c1.map((r, i) => i === 0 ? r : r.map((c, j) => ({ text: c, options: { fill: { color: C.text2 }, align: j >= 2 ? "right" : "left", color: j === 3 ? C.accent2 : C.background1, bold: j === 3 } }))),
    { x: MX, y: 4.7, w: 7.0, colW: [1.5, 2.0, 1.6, 1.9], rowH: 0.42, fontSize: 13, color: C.background1, border: { type: "solid", pt: 1, color: H.dk1 }, valign: "middle", margin: [0, 0.12, 0, 0.12], objectName: "C1 result" });
  text(s, "ผล C1 (ก่อนทำรายการคืนรถ C5): พบยอดค้างชำระ 2 รายการ", { x: MX, y: 6.05, w: 7, h: 0.3, fontSize: 12, color: C.background2 });
  const cx = [["C1", "CTE + LEFT JOIN", "ยอดค้างชำระ 9,500 และ 5,400"], ["C2", "Window: RANK() OVER", "อันดับรายได้ #1 Honda Civic 10,500"], ["C3", "NOT EXISTS + tsrange &&", "หารถว่างตามช่วงวันที่ต้องการ"],
    ["C4", "Subquery ใน HAVING", "ลูกค้าที่จ่ายสูงกว่าค่าเฉลี่ย"], ["C5", "BEGIN … COMMIT", "คืนรถครบทั้ง 4 ตารางใน 1 Transaction"], ["C6–C7", "Constraint test", "ทดสอบ BR2 และ BR7 (สไลด์ถัดไป)"]];
  cx.forEach(([id, k, d], i) => {
    const y = 1.45 + i * 0.88;
    card(s, 7.9, y, 4.83, 0.76, C.text2, "test row");
    text(s, id, { x: 8.05, y, w: 0.8, h: 0.76, fontSize: 15, bold: true, color: C.accent1, valign: "middle", fontFace: THEME.headFontFace });
    text(s, [{ text: k, options: { bold: true, breakLine: true, fontSize: 13, color: C.accent2, fontFace: CODE_FONT } }, { text: d, options: { fontSize: 14 } }],
      { x: 8.9, y: y + 0.05, w: 3.75, h: 0.66, valign: "middle" });
  });
  s.addNotes("ระดับซับซ้อนใช้ CTE, Window Function, NOT EXISTS กับช่วงเวลา, Subquery และ Transaction ตัวอย่าง C1 คำนวณยอดค้างชำระของแต่ละการเช่า");

  // ================= 16. CONSTRAINT TEST =================
  s = sl("การสร้างและทดสอบ");
  s.addText("ทดสอบความถูกต้องของข้อมูล (Constraint Test)", { placeholder: "title" });
  const tests = [["BR2 · ห้ามจองซ้อน", "จองรถ Camry 21–24 ต.ค. ซ้อนกับการจองเดิม 20–23 ต.ค.",
    `INSERT INTO booking (customer_id,
  car_id, start_date, end_date)
VALUES (3, 1, '2026-10-21 10:00',
              '2026-10-24 10:00');`, 'ERROR: conflicting key value violates\nexclusion constraint "no_overlap"'],
    ["BR7 · วันคืนต้องหลังวันรับ", "วันคืน 1 พ.ย. อยู่ก่อนวันรับ 5 พ.ย.",
    `INSERT INTO booking (customer_id,
  car_id, start_date, end_date)
VALUES (3, 3, '2026-11-05',
              '2026-11-01');`, 'ERROR: new row violates check\nconstraint "chk_booking_dates"']];
  for (let i = 0; i < 2; i++) {
    const x = MX + i * 6.2, w = 5.93;
    card(s, x, 1.45, w, 4.55, C.text2, "test card");
    text(s, tests[i][0], { x: x + 0.3, y: 1.6, w: w - 0.6, h: 0.45, fontSize: 20, bold: true, color: C.accent2, fontFace: THEME.headFontFace });
    text(s, tests[i][1], { x: x + 0.3, y: 2.08, w: w - 0.6, h: 0.4, fontSize: 14, color: C.background2 });
    codeBlock(s, x + 0.3, 2.6, w - 0.6, 1.75, tests[i][2], 13, "test sql");
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + 0.3, y: 4.5, w: w - 0.6, h: 1.25, rectRadius: 0.1, fill: { color: C.accent6 }, line: { color: C.accent3, width: 1.5 }, objectName: "error panel" });
    s.addImage({ data: await icon(fa.FaTimesCircle, H.accent3), x: x + 0.5, y: 4.85, w: 0.5, h: 0.5, objectName: "rejected icon" });
    text(s, tests[i][3], { x: x + 1.2, y: 4.55, w: w - 1.65, h: 1.15, fontSize: 13, fontFace: CODE_FONT, color: C.accent3, valign: "middle", bold: true });
  }
  await badge(s, fa.FaShieldAlt, MX, 6.15, 0.62, C.accent1, H.dk1, "takeaway icon");
  text(s, "ฐานข้อมูลปฏิเสธข้อมูลผิดได้เอง ไม่ต้องพึ่งโค้ดฝั่งแอปพลิเคชัน", { x: MX + 0.85, y: 6.15, w: 11, h: 0.62, fontSize: 18, bold: true, color: C.accent1, valign: "middle" });
  s.addNotes("ทดสอบโดยตั้งใจใส่ข้อมูลผิด ฐานข้อมูลปฏิเสธทั้ง 2 กรณี: การจองซ้อนถูก EXCLUDE constraint ปฏิเสธ และวันคืนก่อนวันรับถูก CHECK ปฏิเสธ (แนะนำให้สาธิตสดใน Supabase)");

  // ================= 17. CONCLUSION =================
  pres.addSection({ title: "สรุป" });
  s = sl("สรุป");
  s.addText("สรุปและประเมินผล", { placeholder: "title" });
  const stats = [["6", "ตาราง ถึง 3NF"], ["7", "Business Rules"], ["30", "Constraints"], ["18", "คำสั่งทดสอบผ่าน"]];
  const stw = (W - 2 * MX - 3 * 0.3) / 4;
  stats.forEach(([n, l], i) => {
    const x = MX + i * (stw + 0.3);
    card(s, x, 1.45, stw, 1.5, C.text2, "result stat");
    text(s, n, { x, y: 1.5, w: stw, h: 0.95, fontSize: 48, bold: true, color: C.accent1, align: "center", valign: "middle", fontFace: THEME.headFontFace });
    text(s, l, { x, y: 2.45, w: stw, h: 0.4, fontSize: 15, color: C.background2, align: "center" });
  });
  const cols = [[fa.FaCheckCircle, "ผลที่ได้", C.accent1, H.accent1, ["ฐานข้อมูลครบทุกความต้องการของผู้ใช้", "ป้องกันการจองซ้อนและวันที่ผิดในระดับฐานข้อมูล", "ทดสอบครบทั้งง่าย กลาง ซับซ้อน"]],
    [fa.FaExclamationTriangle, "ข้อจำกัด", C.accent2, H.accent2, ["ยังไม่มีหน้าเว็บสำหรับผู้ใช้จริง", "ยังไม่ได้เข้ารหัสข้อมูลใบขับขี่", "BR6 ยังตรวจใน query ไม่ใช่ constraint"]],
    [fa.FaRocket, "แนวทางพัฒนาต่อ", C.accent5, H.accent5, ["พัฒนา Web App เชื่อม Supabase", "Trigger อัปเดตสถานะรถอัตโนมัติ", "รีวิวรถ โปรโมชั่น และ Dashboard รายได้"]]];
  const cw = (W - 2 * MX - 2 * 0.3) / 3;
  for (let i = 0; i < 3; i++) {
    const x = MX + i * (cw + 0.3);
    card(s, x, 3.25, cw, 3.5, C.text2, "conclusion column");
    s.addImage({ data: await icon(cols[i][0], cols[i][3]), x: x + 0.3, y: 3.5, w: 0.45, h: 0.45, objectName: "column icon" });
    text(s, cols[i][1], { x: x + 0.9, y: 3.45, w: cw - 1.1, h: 0.55, fontSize: 20, bold: true, color: cols[i][2], valign: "middle", fontFace: THEME.headFontFace });
    text(s, cols[i][4].map((t, j) => ({ text: t, options: { bullet: true, breakLine: j < 2 } })), { x: x + 0.3, y: 4.2, w: cw - 0.55, h: 2.4, fontSize: 17, paraSpaceAfter: 12 });
  }
  s.addNotes("สรุป เราออกแบบฐานข้อมูล 6 ตาราง ถึง 3NF รองรับกฎทางธุรกิจครบ 7 ข้อ ทดสอบผ่าน 18 คำสั่ง ข้อจำกัดคือยังไม่มีหน้าเว็บจริง แนวทางต่อไปคือพัฒนา Web App บน Supabase");

  // ================= 18. Q&A =================
  s = pres.addSlide({ masterName: "COVER", sectionTitle: "สรุป" });
  s.addShape(pres.shapes.OVAL, { x: (W - 2.2) / 2, y: 0.9, w: 2.2, h: 2.2, fill: { color: C.text2 }, line: { color: C.accent1, width: 2 }, objectName: "closing ring" });
  s.addImage({ data: await icon(fa.FaCarSide, H.accent1), x: (W - 1.4) / 2, y: 1.3, w: 1.4, h: 1.4, objectName: "closing car" });
  text(s, "ขอบคุณครับ", { x: 0, y: 3.35, w: W, h: 1.0, fontSize: 54, bold: true, align: "center", fontFace: THEME.headFontFace, objectName: "title" });
  text(s, "Q & A", { x: 0, y: 4.35, w: W, h: 0.6, fontSize: 28, bold: true, color: C.accent2, align: "center", fontFace: THEME.headFontFace });
  text(s, team.map(t => t[0] + "  " + t[1]).join("     ·     ").replace(/(.*?·.*?)·/, "$1\n").replace("\n     ", "\n"),
    { x: 0.6, y: 5.4, w: W - 1.2, h: 0.9, fontSize: 15, color: C.background2, align: "center" });
  s.addNotes("ขอบคุณครับ ยินดีตอบคำถาม");

  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("wrote", OUT);
})().catch(e => { console.error(e); process.exit(1); });
