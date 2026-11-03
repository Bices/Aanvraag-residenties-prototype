const ALL = ["sit", "extra", "house", "docs", "biz", "changed", "sib", "sign"];

const T = {
  me: ["Over jou", "Je gegevens en je studies. We gebruiken je e-mailadres voor alle communicatie."],
  sit: ["Gezinssituatie", "Zoals verwacht op 31 december 2026. Hierop bouwt de rest van de aanvraag."],
  extra: ["Jouw gezin: details", "Nog enkele vragen over de ouder bij wie je woont."],
  house: ["Wie woont er op jouw adres?", "Enkel personen die op hetzelfde adres wonen als jij."],
  docs: ["Bijlagen", "Voeg hier alle gevraagde bijlagen toe (foto, scan of pdf). Je hoeft niets meer op te sturen met de post."],
  biz: ["Beroep en vennootschappen", "Deze informatie wordt gecontroleerd. Zonder correcte gegevens krijg je geen kamer met huurprijs op maat."],
  changed: ["Gewijzigde gezinssituatie", "Is je gezinsinkomen sinds 2025 gedaald? Dan houden we rekening met het huidige inkomen."],
  sib: ["Broers en zussen", "Vul hier alle broers of zussen in die ook een aanvraag doen."],
  sign: ["Controleren en ondertekenen", "Nog één keer nakijken, dan ben je klaar."]
};

const SK = {
  extra: "Details ouder",
  house: "Gezinstabel",
  changed: "Gewijzigde situatie"
};

const RES = [
  "CAMILO TORRES|Brusselsestraat 159-161, Leuven|375",
  "FRASCATI|Vital Decosterstraat 49, Leuven|131|w",
  "SINT-CATHARINA|Sluisstraat 2, Leuven|58",
  "DE RIJSCHOOL|Rijschoolstraat 6, Leuven|72",
  "BAKELEYN|Vital Decosterstraat 49C, Leuven|34",
  "EDITH STEIN|Maria Van Belstraat 6, Leuven|36",
  "SEDES VLAMINGENSTRAAT|Vlamingenstraat 87, Leuven|66|w",
  "HOLLEBERG|Schapenstraat 37, Leuven|84",
  "SEDES PARKSTRAAT|Parkstraat 23, Leuven|76",
  "PARKSTRAAT 29|Parkstraat 29, Leuven|16|s",
  "HERMAN SERVOTTE|Parkstraat 39/41/53, Leuven|50",
  "DE LA SALLE|Mechelsevest 6, Leuven|26",
  "DE VIKING|Noormannenstraat 68, Leuven|45",
  "JUNIOR HOUSE|Justus Lipsiusstraat 58, Leuven|18",
  "WOONUNITS CAMILO TORRES|Brusselsestraat 159, Leuven|60|g",
  "STUDAX-STVZ|Martelarenlaan 40, Kessel-Lo|58|u",
  "STUDENTENWIJK ARENBERG|2-25, Heverlee|793",
  "JOHANNES XXIII|Tervuursevest 139/141, Heverlee|99",
  "DE VESTEN|Tervuursevest 107, Heverlee|251",
  "WISTERIA|Sint-Janbergsesteenweg 101, Heverlee|99"
].map((s, i) => {
  const a = s.split("|");
  return { id: i, n: a[0], a: a[1], r: +a[2], f: a[3] || "" };
});

const OMK = [
  "PEGASUS|Rijschoolstraat 17, Leuven|19",
  "EDITH STEIN|Maria Van Belstraat 6, Leuven|9",
  "SEDES PARKSTRAAT|Parkstraat 23, Leuven|12",
  "ROMERO I|Blijde Inkomststraat 32, Leuven|60",
  "ROMERO II|Tiensestraat 115, Leuven|28",
  "HERMAN SERVOTTE|Parkstraat 39/41/53, Leuven|29",
  "STUDENTENWIJK ARENBERG 24|Heverlee|20",
  "DE VESTEN|Tervuursevest 107, Heverlee|10"
].map((s, i) => {
  const a = s.split("|");
  return { id: i, n: a[0], a: a[1], r: +a[2] };
});

const CHG = [
  ["wl", "Werkloosheid", "attest werkloosheidsuitkering"],
  ["lf", "Leefloon", "attest leefloon"],
  ["pe", "Pensioen", "attest pensioen"],
  ["zi", "Langdurige ziekte of invaliditeit", "attest invaliditeitsuitkering"],
  ["fa", "Faillissement", "bewijs van faillissement"],
  ["sc", "(Echt)scheiding of overlijden", "attest gezinssamenstelling"]
];

let d = { res: [], omk: [], corp: [], hh: [], sibs: [], files: {} };
let S = { i: 0, done: false };
let errs = [];
let q = "";

try {
  const x = localStorage.getItem("hpom");
  if (x) d = Object.assign(d, JSON.parse(x));
} catch (e) {}

const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const save = () => {
  try {
    localStorage.setItem("hpom", JSON.stringify(d));
  } catch (e) {}
};

const set = (n, v) => {
  d[n] = v;
  save();
  if (n === "rrn") rrnHint();
};

const sit = () => d.sit;
const hasP = () => d.par === "partner";
const isFamilyRoute = () => ["one", "both"].includes(d.sit);

function steps() {
  const s = d.sit;
  let a = ["sit"];
  if (s === "one") a.push("extra");
  if (isFamilyRoute()) a.push("house");
  a.push("docs", "biz");
  if (isFamilyRoute()) a.push("changed");
  a.push("sib", "sign");
  return a;
}

const pick = (n, v) => {
  const previous = d[n];
  d[n] = v;
  if (n === "sit" && v !== previous) {
    d.hh = [];
    if (v === "alone") {
      d.par = undefined;
      d.div = undefined;
      d.alim = undefined;
      d.ptype = undefined;
      d.kids = undefined;
    }
  }
  if (n === "sit" || n === "par") syncHH();
  save();
  render();
};

const bad = (n) => (errs.includes(n) ? " err" : "");
const fld = (n, l, t = "text", h = "") => `<label class="f${bad(n)}">${l}<input type="${t}" value="${esc(d[n])}" oninput="set('${n}',this.value)">${h}</label>`;
const ch = (n, o) => `<div class="ch${bad(n)}">${o.map((x) => `<button type="button" class="c ${d[n] === x[0] ? "on" : ""}" onclick="pick('${n}','${x[0]}')">${x[1]}</button>`).join("")}</div>`;
const ck = (n, l, re = 1) => `<label class="k${bad(n)}"><input type="checkbox" ${d[n] ? "checked" : ""} onchange="${re ? `pick('${n}',this.checked)` : `set('${n}',this.checked)`}"><span>${l}</span></label>`;
const up = (k, l) => `<label class="up ${d.files[k] ? "has" : ""}"><span>📎 ${l}</span><input type="file" onchange="fileSet('${k}',this)"><em>${d.files[k] ? "✓ " + esc(d.files[k]) : "Bestand kiezen"}</em></label>`;

function fileSet(k, el) {
  if (el.files[0]) {
    d.files[k] = el.files[0].name;
    save();
    el.parentNode.classList.add("has");
    el.nextElementSibling.textContent = "✓ " + el.files[0].name;
  }
}

function rrnOk(v) {
  const s = String(v || "").replace(/\D/g, "");
  if (s.length !== 11) return false;
  const b = +s.slice(0, 9), c = +s.slice(9);
  return 97 - b % 97 === c || 97 - (2000000000 + b) % 97 === c;
}

function rrnHint() {
  const e = document.getElementById("rh");
  if (!e) return;
  const ok = rrnOk(d.rrn);
  e.textContent = !d.rrn ? "" : ok ? "✓ Geldig rijksregisternummer" : "Controleer je nummer (11 cijfers)";
  e.className = "hint " + (ok ? "good" : "bad");
}

function syncHH() {
  const fx = d.sit === "both" ? ["Ouder 1", "Ouder 2"] : d.sit === "one" ? ["Ouder 1"].concat(hasP() ? ["Inwonende partner"] : []) : [];
  d.hh = fx.map((r) => d.hh.find((x) => x.role === r) || { role: r }).concat(d.hh.filter((x) => x.role === "Ander gezinslid"));
}

const hset = (i, k, v) => { d.hh[i][k] = v; save(); };
const hpick = (i, k, v) => { d.hh[i][k] = v; save(); render(); };
const sset = (i, k, v) => { d.sibs[i][k] = v; save(); };
const cset = (i, k, v) => { d.corp[i][k] = v; save(); };

function yesNoCell(i, k) {
  const v = d.hh[i][k];
  return `<div class="choice">${["ja", "nee"].map((x) => `<button type="button" class="c ${v === x ? "on" : ""}" onclick="hpick(${i},'${k}','${x}')">${x}</button>`).join("")}</div>`;
}

function seg(i, k, l) {
  const v = d.hh[i][k];
  return `<div class="seg">${l}: <button type="button" class="c ${v === "ja" ? "on" : ""}" onclick="hpick(${i},'${k}','ja')">ja</button><button type="button" class="c ${v === "nee" ? "on" : ""}" onclick="hpick(${i},'${k}','nee')">nee</button></div>`;
}

const V = {
  me() {
    const dl = new Date() > new Date("2026-04-22T23:59:59");
    return (dl ? `<div class="box w"><b>De deadline van 22 april 2026 is verstreken.</b> Je aanvraag komt op de wachtlijst. Je krijgt een kamervoorstel als er nog kamers vrij zijn (maandelijkse toewijzingen).</div>` : "") +
      `<div class="g">${fld("fam","Familienaam")}${fld("voor","Voornaam")}${fld("geb","Geboortedatum","date")}</div>
      <label class="f${bad("rrn")}">Rijksregisternummer<input value="${esc(d.rrn)}" inputmode="numeric" oninput="set('rrn',this.value)" placeholder="00.00.00-000.00"><span id="rh" class="hint"></span></label>
      <div class="q">Geslacht</div>${ch("sex", [["man", "Man"], ["vrouw", "Vrouw"]])}
      <div class="q">Nationaliteit</div>${ch("nat", [["be", "Belg"], ["other", "Andere"]])}${d.nat === "other" ? fld("natt", "Nationaliteit") : ""}
      <div class="q">Heb je al een studentennummer?</div>${ch("hasnr", [["nee", "Nee"], ["ja", "Ja"]])}${d.hasnr === "ja" ? fld("nr", "Studentennummer") : ""}
      <div class="q">Wettelijk adres</div><div class="g">${fld("str","Straat")}${fld("hnr","Nr")}${fld("bus","Bus")}${fld("pc","Postcode")}${fld("gem","Gemeente")}</div>
      <div class="g">${fld("mail","Contact e-mailadres","email", '<span class="hint">Alle communicatie loopt hierlangs. Controleer je inbox regelmatig.</span>')}${fld("gsm","GSM student","tel")}${fld("tel","Thuistelefoon","tel")}</div>
      <div class="q">Studies 2025-2026</div>${ch("inst", [["Middelbaar", "Middelbaar"], ["Unief / Hogeschool", "Unief / hogeschool"], ["Geen studies", "Geen studies"]])}${d.inst && d.inst !== "Geen studies" ? fld("rich", "Huidige studierichting") : ""}
      <div class="q">Studies 2026-2027</div>${ch("ninst", [["KU Leuven", "KU Leuven"], ["LUCA campus Lemmens", "LUCA campus Lemmens"], ["UCLL Leuven", "UCLL Leuven"]])}${fld("nrich", "Voorziene studierichting")}`;
  },

  sit() {
    const n = steps().length;
    const dl = new Date() > new Date("2026-04-22T23:59:59");
    return (dl ? `<div class="box w"><b>De deadline van 22 april 2026 is verstreken.</b> Je aanvraag komt op de wachtlijst. Je krijgt een kamervoorstel als er nog kamers vrij zijn (maandelijkse toewijzingen).</div>` : "") + `${ch("sit", [["alone", "Ik ben alleenstaand of zelfstandig student"], ["both", "Ik woon bij mijn beide ouders, op hetzelfde adres"], ["one", "Ik woon bij één ouder"]])}${d.sit ? `<div class="box">Jouw route: <b>${n} stappen</b>, ongeveer ${Math.round(n * 1.3)} minuten. ${d.sit === "alone" ? "Geen gezinstabel en geen vragen over ouders." : ""}</div>` : ""}`;
  },

  extra() {
    return `<div class="q">Zijn je ouders gescheiden?</div>${ch("div", [["ja", "Ja"], ["nee", "Nee"]])}
      ${d.div === "ja" ? `<div class="q">Wordt er alimentatie betaald?</div>${ch("alim", [["geen", "Nee"], ["ja", "Ja"]])}${d.alim === "ja" ? fld("alimb", "Totaal alimentatiebedrag voor alle kinderen (€ per jaar)", "number") : ""}` : ""}
      <div class="q${bad("par")}">De ouder bij wie je woont…</div>${ch("par", [["alone", "is alleenstaand"], ["partner", "heeft een nieuwe partner"]])}
      ${hasP() ? `<div class="q">Jullie…</div>${ch("ptype", [["gehuwd", "zijn gehuwd"], ["wettelijk", "wonen wettelijk samen"], ["feitelijk", "wonen feitelijk samen"]])}${ck("kids", "Ze hebben gemeenschappelijke kinderen", 0)}` : ""}`;
  },

  house() {
    if (!d.hh.length) syncHH();
    return `
      <div class="house-box">
        <div class="q">Vul deze tabel enkel in voor de personen die op hetzelfde adres wonen als jij</div>
        <div class="house-table-wrap">
          <table class="house-table">
            <thead>
              <tr>
                <th></th>
                <th>Naam + voornaam</th>
                <th>Geboortedatum</th>
                <th>Fiscaal ten laste</th>
                <th>Student hoger onderwijs<br>2026-2027</th>
                <th>Invaliditeit<br>> 66%</th>
              </tr>
            </thead>
            <tbody>
              ${d.hh.map((m, i) => `
                <tr>
                  <td>${m.role}</td>
                  <td><input type="text" value="${esc(m.name || "")}" oninput="hset(${i},'name',this.value)"></td>
                  <td><input type="date" value="${esc(m.bd || "")}" onchange="hset(${i},'bd',this.value)"></td>
                  <td>${yesNoCell(i, "tax")}</td>
                  <td>${yesNoCell(i, "stu")}</td>
                  <td>${yesNoCell(i, "inv")}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
        <button class="ghost" style="margin-top:12px" onclick="d.hh.push({role:'Ander gezinslid'});save();render()">+ Ander gezinslid toevoegen</button>
      </div>
    `;
  },

  docs() {
    return `${ck("old", "Ik heb het aanslagbiljet inkomsten 2024 nog niet ontvangen: ik voeg dat van 2023 toe.")}<div class="q">Verplichte bijlagen</div>${baseDocs().map((x) => up(x[0], x[1])).join("")}${d.sit !== "alone" ? ck("ll", "Mijn ouder(s) ontvangen leefloon") + (d.ll ? up("ll", "Attest leefloon") : "") : ""}
      <div class="box"><b>Goed om te weten</b><br>Voeg altijd de eerste pagina toe (met identiteitsgegevens). Voorlopige of vereenvoudigde berekeningen, berekeningen van de boekhouder en Tax-on-web zijn niet geldig. Ontvangen je ouders leefloon? Voeg dan het attest leefloon toe.</div>`;
  },

  biz() {
    const rl = d.sit === "both" ? ["Ouder 1", "Ouder 2"] : d.sit === "one" ? ["Ouder 1"].concat(hasP() ? ["Inwonende partner"] : []) : [];
    let h = rl.map((r, i) => `<div class="q">Beroep ${r}</div>${ch("j" + i, [["Werknemer", "Werknemer"], ["Zelfstandige", "Zelfstandige"], ["Andere", "Andere"]])}${d["j" + i] === "Andere" ? fld("jt" + i, "Welk beroep?") : ""}`).join("");
    h += `<div class="q">Ben jij${rl.length ? ", een van je ouders of je inwonende partner" : ""} minstens 25% aandeelhouder in een vennootschap (BV, NV, CV, Comm.V, VOF)?</div>${ch("vn", [["ja", "Ja"], ["nee", "Nee"]])}`;
    if (d.vn === "ja") {
      h += `<p class="hint">Geef per vennootschap de dividenden (code 694 op de jaarrekening) goedgekeurd op de algemene vergaderingen van 2021 t.e.m. 2025.</p>` + d.corp.map((c, i) => `<div class="row"><div class="g"><label class="f">Ondernemingsnummer<input value="${esc(c.n)}" oninput="cset(${i},'n',this.value)"></label><label class="f">Aandeelhouder(s) uit het gezin<input value="${esc(c.a)}" oninput="cset(${i},'a',this.value)"></label><label class="f">Percentage<input type="number" value="${esc(c.p)}" oninput="cset(${i},'p',this.value)"></label><label class="f">Totaal dividenden (€)<input type="number" value="${esc(c.v)}" oninput="cset(${i},'v',this.value)"></label></div><button class="mini" onclick="d.corp.splice(${i},1);save();render()">Verwijderen</button></div>`).join("") + `<button class="ghost" onclick="d.corp.push({});save();render()">+ Vennootschap toevoegen</button>` + up("vb", "Bijlage (optioneel): jaarrekening of bewijs van dividenden");
      if (!d.corp.length) {
        d.corp.push({});
        render();
      }
    }
    return h;
  },

  changed() {
    return `<div class="q">Is je gezinssituatie sinds 2025 veranderd én is het gezinsinkomen daardoor gedaald?</div>${ch("chgYes", [["ja", "Ja"], ["nee", "Nee"]])}${d.chgYes === "ja" ? CHG.map((c) => ck("c_" + c[0], c[1]) + (d["c_" + c[0]] ? up("c_" + c[0], "Verplichte bijlage: " + c[2]) : "")).join("") + ck("c_an", "Andere") + (d.c_an ? fld("c_ant", "Welke wijziging?") + up("c_an", "Verplichte bijlage: bijhorend attest") : "") : ""}`;
  },

  sib() {
    return `<div class="q">Doet je broer of zus ook een aanvraag?</div>${ch("sib", [["nee", "Nee"], ["ja", "Ja"]])}
    ${d.sib === "ja" ? `${d.sibs.length ? d.sibs.map((s, i) => `<div class="row"><div class="g"><label class="f">Naam en voornaam<input value="${esc(s.name || "")}" oninput="sset(${i},'name',this.value)"></label></div><button class="mini" onclick="d.sibs.splice(${i},1);save();render()">Verwijderen</button></div>`).join("") : `<p class="hint">Nog geen broer of zus toegevoegd.</p>`}<button class="ghost" style="margin-top:12px" onclick="d.sibs.push({name:''});save();render()">+ Broer of zus toevoegen</button>` : ""}`;
  },

  sign() {
    const ds = allDocs();
    return `<table class="sum"><tr><td>Gezinssituatie</td><td>${{ alone: "Alleenstaand of zelfstandig student", both: "Bij beide ouders", one: "Bij één ouder" }[d.sit] || "–"}</td></tr><tr><td>Documenten</td><td>${ds.map((x) => (d.files[x[0]] ? "✓ " : "○ ") + x[1].split(":")[0]).join("<br>")}</td></tr></table>
      ${ds.some((x) => !d.files[x[0]]) ? `<div class="box w">Sommige documenten ontbreken nog. Je kan ze later aanvullen, maar je aanvraag is pas volledig als alles binnen is.</div>` : ""}
      <div class="q">Bevestig</div>
      ${ck("k1", "Ik heb de aanvraag volledig ingevuld.", 0)}${ck("k2", "Ik heb alle nodige documenten toegevoegd.", 0)}
      ${d.vn === "ja" || d.j0 === "Zelfstandige" || d.j1 === "Zelfstandige" ? ck("k3", "Ik heb de informatie over zelfstandige activiteit of vennootschap naar waarheid ingevuld.", 0) : ""}
      ${ck("k4", "Ik voldoe aan de toelatingsvoorwaarden 2026-2027: hoofdinschrijving aan KU Leuven, LUCA Lemmens of UCLL Leuven, les in Leuven of Heverlee, minstens 27 studiepunten. Anders kan Residentiebeheer mijn huurcontract beëindigen.", 0)}
      ${ck("k5", "Ik verklaar deze aanvraag volledig en naar waarheid te hebben ingevuld.", 0)}
      <div class="g">${fld("sig", "Handtekening (typ je volledige naam)")}<label class="f">Datum<input value="${new Date().toLocaleDateString("nl-BE")}" disabled></label></div>`;
  }
};

const rl = () => {
  const t = q.toLowerCase();
  return RES.filter((r) => (r.n + r.a).toLowerCase().includes(t)).map((r) => `<div class="res"><div><b>${r.n}</b><span>${r.a} · ${r.r} kamers${r.f === "w" ? " · enkel vrouwen" : ""}${r.f === "u" ? " · enkel UCLL" : ""}</span></div>${d.res.includes(r.id) ? `<span>✓</span>` : `<button class="mini" ${d.res.length >= 10 ? "disabled" : ""} onclick="d.res.push(${r.id});save();render()">+ Toevoegen</button>`}</div>`).join("") || `<p class="hint">Geen resultaten.</p>`;
};

function mv(i, s) {
  const j = i + s;
  if (j < 0 || j >= d.res.length) return;
  [d.res[i], d.res[j]] = [d.res[j], d.res[i]];
  save();
  render();
}

function tg(id, on) {
  d.omk = d.omk.filter((x) => x !== id);
  if (on) d.omk.push(id);
  save();
}

function validate(id) {
  let e = [];
  const need = (a) => a.forEach((n) => { if (!d[n]) e.push(n); });

  if (id === "me") {
    need(["fam", "voor", "geb", "sex", "nat", "inst", "ninst", "nrich", "str", "hnr", "pc", "gem", "mail"]);
    if (!rrnOk(d.rrn)) e.push("rrn");
  }

  if (id === "sit") need(["sit"]);
  if (id === "extra") need(["par", "div"]);
  if (id === "sign") {
    need(["k1", "k2", "k4", "k5", "sig"]);
    if ((d.vn === "ja" || d.j0 === "Zelfstandige" || d.j1 === "Zelfstandige") && !d.k3) e.push("k3");
  }

  return e;
}

function go(n) {
  const st = steps();
  const id = st[S.i];

  if (n > 0) {
    errs = validate(id);
    if (errs.length) {
      render();
      return;
    }
    if (id === "sign") {
      S.done = true;
      render();
      return;
    }
  } else {
    errs = [];
  }

  S.i = Math.max(0, S.i + n);
  window.scrollTo({ top: 0, behavior: "smooth" });
  render();
}

function render() {
  const st = steps();
  const m = document.getElementById("main");

  if (S.i >= st.length) S.i = st.length - 1;
  const id = st[S.i];

  document.getElementById("rail").innerHTML = ALL.map((x) => {
    const i = st.indexOf(x);
    return `<li class="${i < 0 ? "skip" : i < S.i ? "done" : i === S.i ? "cur" : ""}">${T[x][0]}${i < 0 ? `<small>niet nodig voor jou</small>` : ""}</li>`;
  }).join("");

  if (S.done) {
    m.innerHTML = `<h2>Aanvraag ingediend (prototype)</h2><p class="sub">Je ontvangt een bevestigingsmail op je contactadres zodra je aanvraag verwerkt is. Eind mei 2026 hoor je of je een kamer kreeg; digitale huurcontracten onderteken je binnen 7 dagen.</p><div class="box">In dit prototype wordt niets verstuurd.</div><button class="ghost" onclick="try{localStorage.removeItem('hpom')}catch(e){};location.reload()">Opnieuw beginnen</button>`;
    return;
  }

  m.innerHTML = `<h2>${T[id][0]}</h2><p class="sub">${T[id][1]}</p>${errs.length ? `<div class="box w">Vul de gemarkeerde velden in om verder te gaan.</div>` : ""}${V[id]()}<div class="nav"><button class="ghost" onclick="go(-1)" ${S.i ? "" : "disabled"}>← Vorige</button><button class="pri" onclick="go(1)">${id === "sign" ? "Aanvraag indienen" : "Volgende →"}</button></div>`;

  if (id === "me") rrnHint();
}

render();

function baseDocs() {
  const list = [
    ["id", "Identiteitskaart of paspoort"],
    ["stud", "Bewijs van inschrijving 2026-2027"],
    ["adres", "Bewijs van adres / woonst"],
    ["ink", "Aanslagbiljet of belastingsaangifte 2024"]
  ];

  return d.sit === "alone" ? list : list.concat([["fam", "Gezinsinformatie / bewijs van samenwonen"]]);
}

function allDocs() {
  const docs = baseDocs();
  if (d.sit !== "alone") {
    docs.push(["parent", "Inkomen van je ouder(s)"]);
  }
  return docs;
}