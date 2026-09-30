/* ═══════════════════════════════════════════════════════════
     1. BEÁLLÍTÁSOK
     ═══════════════════════════════════════════════════════════ */
const CONFIG = {
    gramm: 30,   // egy palack becsült tömege, gramm — csak a kijelzéshez
    betet: 50,   // visszaváltási díj palackonként, forint — csak a kijelzéshez
    demo: false  // production: ne jelenjen meg kitalált adat
};

/* ═══════════════════════════════════════════════════════════
   2. ADATFORRÁS
   A számolást (SUMIF, palack/fő, helyezés) a Google Sheet végzi.
   A render(csomag) formátuma pontosan az, amit a Sheet-hez kötött
   Apps Script ír a Firebase "allapot" csomópontjába:
   {
     frissitve: "2026-09-16T13:33:09.000Z",
     ossz_palack: 267,
     visszavaltas: { osszeg_ft: 8500, palack_db: 170 },
     osztalyok: [
       { osztaly:"13.C", letszam:30, palack:133, per_fo:4.43,
         hely_kiraly:1, hely_hos:2 }, ...
     ]
   }
   ═══════════════════════════════════════════════════════════ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyB5mTbNbHoy4MOJ8KEZMavdxl5lS5eTzkw",
    authDomain: "iskola-pet.firebaseapp.com",
    databaseURL: "https://iskola-pet-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "iskola-pet",
    storageBucket: "iskola-pet.firebasestorage.app",
    messagingSenderId: "441611015098",
    appId: "1:441611015098:web:66ab9566ca7d0695ed8383"
};

const DEMO = {
    frissitve: new Date().toISOString(),
    ossz_palack: 267,
    visszavaltas: { osszeg_ft: 8500, palack_db: 170 },
    osztalyok: [
        { osztaly: "13.C", letszam: 30, palack: 0, per_fo: 0.00, hely_kiraly: 1, hely_hos: 2 },
        { osztaly: "12.C", letszam: 24, palack: 0, per_fo: 0.00, hely_kiraly: 4, hely_hos: 4 },
        { osztaly: "11.C", letszam: 27, palack: 0, per_fo: 0.00, hely_kiraly: 3, hely_hos: 3 },
        { osztaly: "9.G", letszam: 20, palack: 0, per_fo: 0.00, hely_kiraly: 2, hely_hos: 1 },
        { osztaly: "22.C", letszam: 26, palack: 0, per_fo: 0.00, hely_kiraly: 5, hely_hos: 5 },
        { osztaly: "10.B", letszam: 29, palack: 0, per_fo: 0.00, hely_kiraly: 6, hely_hos: 6 },
        { osztaly: "11.A", letszam: 25, palack: 0, per_fo: 0.00, hely_kiraly: 7, hely_hos: 7 }
    ]
};

try {
    const db = getDatabase(initializeApp(firebaseConfig));
    onValue(ref(db, "allapot"), snap => {
        const val = snap.val();
        if (val && Array.isArray(val.osztalyok)) render(val, "élő adat");
        else render(CONFIG.demo ? DEMO : { osztalyok: [] }, CONFIG.demo ? "demó adat" : "nincs rögzített leadás");
    }, err => {
        console.warn("Firebase:", err);
        if (CONFIG.demo) render(DEMO, "demó adat");
    });
} catch (e) {
    console.warn("Firebase indítás sikertelen:", e);
    if (CONFIG.demo) render(DEMO, "demó adat");
}

/* ═══════════════════════════════════════════════════════════
   3. MEGJELENÍTÉS — a kapott csomagot csak kirajzolja, nem számol
   ═══════════════════════════════════════════════════════════ */
let state = { rows: [], mode: "total", expanded: false };
const TOP_N = 5;
const nf = n => n.toLocaleString("hu-HU");
const $ = id => document.getElementById(id);

function render(csomag, forras) {
    state.rows = csomag.osztalyok.map(o => ({
        osztaly: o.osztaly,
        darab: Number(o.palack) || 0,
        fo: o.letszam || null,
        per: o.per_fo ?? null
    }));

    const total = csomag.ossz_palack ?? state.rows.reduce((s, r) => s + r.darab, 0);
    $("total").textContent = nf(total);
    $("kg").textContent = nf(Math.round(total * CONFIG.gramm / 1000)) + " kg";
    $("ft").textContent = nf(total * CONFIG.betet) + " Ft";
    $("cls").textContent = state.rows.filter(r => Number(r.darab) > 0).length;

    const vissza = csomag.visszavaltas || null;
    if (vissza && vissza.osszeg_ft !== undefined) {
        const redeemedFt = Number(vissza.osszeg_ft) || 0;
        const redeemedCount = Number(vissza.palack_db ?? (redeemedFt / CONFIG.betet)) || 0;
        const pct = total > 0 ? (redeemedCount / total * 100) : 0;
        const pending = Math.max(total - redeemedCount, 0);

        $("redeemedCount").textContent = Number.isInteger(redeemedCount)
            ? nf(redeemedCount)
            : redeemedCount.toLocaleString("hu-HU", { maximumFractionDigits: 1 });
        $("redeemedFt").textContent = nf(redeemedFt) + " Ft";
        $("redeemFill").style.width = Math.min(pct, 100).toFixed(1) + "%";
        $("redeemPercent").textContent = total > 0
            ? "A rögzített leadások " + pct.toLocaleString("hu-HU", { maximumFractionDigits: 1 }) + "%-a már vissza lett váltva."
            : "Nincs még diákok által rögzített leadás.";
        $("redeemPending").textContent = pending > 0
            ? nf(pending) + " palack még visszaváltásra vár"
            : (redeemedCount > total && total > 0 ? "A visszaváltott darabszám meghaladja a rögzített leadást." : "");
    } else {
        $("redeemedCount").textContent = "—";
        $("redeemedFt").textContent = "—";
        $("redeemFill").style.width = "0%";
        $("redeemPercent").textContent = "Még nincs rögzített tényleges visszaváltás.";
        $("redeemPending").textContent = "";
    }

    const t = csomag.frissitve ? new Date(csomag.frissitve) : new Date();
    $("stamp").textContent = "Frissítve: " +
        t.toLocaleDateString("hu-HU") + " " +
        t.toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit" });
    $("foot").textContent = forras;

    draw();
}

function draw() {
    const per = state.mode === "per";
    $("note").textContent = per
        ? "A leadott palackok száma osztva az osztálylétszámmal."
        : "Az osztály által eddig leadott összes palack.";

    const full = [...state.rows]
        .filter(r => !per || r.per !== null)
        .sort((a, b) => per ? b.per - a.per : b.darab - a.darab);

    const board = $("board");
    const more = $("more");

    if (!full.length) {
        board.innerHTML = '<p class="empty">Még nincs rögzített leadás.</p>';
        more.hidden = true;
        return;
    }

    const list = state.expanded ? full : full.slice(0, TOP_N);
    const max = per ? full[0].per : full[0].darab;
    const head = `<div class="hrow">
      <div></div><div>Osztály</div>
      <div class="r">${per ? "Palack / fő" : "Palack"}</div>
      <div class="r c4">${per ? "Összesen" : "Palack / fő"}</div>
    </div>`;

    board.innerHTML = head + list.map((r, i) => {
        const main = per ? r.per.toFixed(1).replace(".", ",") : nf(r.darab);
        const side = per ? nf(r.darab) : (r.per ? r.per.toFixed(1).replace(".", ",") : "–");
        const w = max ? ((per ? r.per : r.darab) / max * 100).toFixed(1) : 0;
        return `<div class="row${i === 0 ? " top" : ""}">
      <span class="fill" style="width:${w}%"></span>
      <span class="rank">${i + 1}.</span>
      <span class="cls">${r.osztaly}<small>${r.fo ? r.fo + " fő" : "létszám nincs megadva"}</small></span>
      <span class="n1">${main}</span>
      <span class="n2">${side}</span>
    </div>`;
    }).join("");

    if (full.length > TOP_N) {
        more.hidden = false;
        more.textContent = state.expanded
            ? "Csak az élen állók"
            : "Összes megtekintése (" + full.length + ")";
    } else {
        more.hidden = true;
    }
}

$("more").addEventListener("click", () => {
    state.expanded = !state.expanded;
    draw();
});

document.querySelectorAll(".tabs button").forEach(b => {
    b.addEventListener("click", () => {
        document.querySelectorAll(".tabs button")
            .forEach(x => x.setAttribute("aria-selected", x === b));
        state.mode = b.dataset.mode;
        state.expanded = false;
        draw();
    });
});

render({ osztalyok: [], ossz_palack: 0 }, "betöltés");