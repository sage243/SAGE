/**
 * Download product photos from Unsplash into public/products/
 * and set imageUrl on each product in products-master.json.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public", "products");
const masterPath = path.join(root, "data", "products-master.json");
fs.mkdirSync(outDir, { recursive: true });

const u = (id) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1000&q=80`;

/** Only verified 200 OK Unsplash IDs */
const I = {
  soapBar: u("1611930022073-b7a4ba5fcccd"),
  soapCare: u("1556229010-6c3f2c9ca5f8"),
  soapSoft: u("1556228578-0d85b1a4d571"),
  soapPink: u("1598440947619-2c35fc9aa908"),
  detergent: u("1563453392212-326f5e854473"),
  cleaning: u("1556911220-e15b29be8c8f"),
  scrub: u("1581578731548-c64695cc6952"),
  oil: u("1608571423902-eed4a5ad8108"),
  oilPour: u("1508747703725-719777637510"),
  butter: u("1589985270826-4b7bb135bc9d"),
  tea: u("1564890369478-c89ca6d9cde9"),
  soup: u("1547592166-23ac45744acd"),
  spices: u("1610832958506-aa56368176cf"),
  toothpaste: u("1607613009820-a29f7bb81c04"),
  toothpaste2: u("1620916297397-a4a5402a3c6c"),
  notebook: u("1531346878377-a5be20888e57"),
  pens: u("1587049352846-4a222e784d38"),
  bulb: u("1513506003901-1e6a229e2d15"),
  juice: u("1622597467836-f3285f2131b8"),
  yogurt: u("1488477181946-6428a0291777"),
  cheese: u("1452195100486-9cc805987862"),
  chocolate: u("1511381939415-e44015466834"),
  cake: u("1578985545062-69928b1d9587"),
  ice: u("1497034825429-c343d7c6a68f"),
  biscuits: u("1558961363-fa8fdf82db35"),
  bread: u("1509440159596-0249088772ff"),
  oats: u("1574323347407-f5e1ad6d020b"),
  milk: u("1563636619-e9143da7973b"),
  pasta: u("1621996346565-e3dbc646d9a9"),
  tomato: u("1592924357228-91a4daadcfea"),
  veggies: u("1615485290382-441e4d049cb5"),
  rice: u("1536304993881-ff6e9eefa2a6"),
  basket: u("1542838132-92c53300491e"),
  shelf: u("1604719312566-8912e9227c6a"),
  car: u("1486262715619-67b85e0b08d3"),
  catering: u("1414235077428-338989a2e8c0"),
  travel: u("1436491865332-7a61a109cc05"),
  baby: u("1515488042361-ee00e0ddd4e4"),
  razor: u("1621607512214-68297480165e"),
  pads: u("1631549916768-4119b2e5f926"),
  fish: u("1519708227418-c8fd9a32b7a2"),
  beef: u("1603048588665-791ca8aea617"),
  kitchen: u("1556910103-1c02745aae4d"),
  salad: u("1516685018646-549198525c1b"),
  herbs: u("1466637574441-749b8f19452f"),
  fresh: u("1505576391880-b3f9d713dc4f"),
  candy: u("1596797038530-2c107229654b"),
};

function pick(p) {
  const s = `${p.sku} ${p.name} ${p.category} ${p.subcategory || ""}`.toLowerCase();
  if (p.kind === "service") return s.includes("visa") ? I.travel : I.catering;

  if (s.includes("savon") || s.includes("soap")) {
    if (/lux|beauté|glycérine|belivoir/.test(s)) return I.soapSoft;
    if (/monganga|family|toilette|protex|palmolive/.test(s)) return I.soapCare;
    if (/éléphant|diamant/.test(s)) return I.soapPink;
    return I.soapBar;
  }
  if (/omo|détergent|soumamousse|laver/.test(s)) return I.detergent;
  if (/vim|récurer|insecticide|baygon/.test(s)) return I.scrub;
  if (/huile|simba|palme|végétale/.test(s)) return /1l|pét|bouteille/.test(s) ? I.oilPour : I.oil;
  if (/margarine|blue band|bona|graisse/.test(s)) return I.butter;
  if (/thé|lipton|moto/.test(s)) return I.tea;
  if (/knorr|cube|assaisonnement/.test(s)) return I.soup;
  if (/glutamate|épicerie|top magique|top sel/.test(s)) return I.spices;
  if (/dentifrice|pepsodent|colgate|maxam|bucco/.test(s))
    return /75ml|pepsodent/.test(s) ? I.toothpaste : I.toothpaste2;
  if (/cahier/.test(s)) return I.notebook;
  if (/stylo/.test(s)) return I.pens;
  if (/ampoule|led/.test(s)) return I.bulb;
  if (/pile/.test(s)) return I.bulb; // metal cylindrical — close visual
  if (/allumette/.test(s)) return I.kitchen;
  if (/serviette|hygiénique|diva|féminin/.test(s)) return I.pads;
  if (/lame|rasoir|rasage/.test(s)) return I.razor;
  if (/nectar|jus|sumol|boisson/.test(s)) return I.juice;
  if (/bonbon|mint|confiserie/.test(s)) return I.candy;
  if (/phosphatine|blédine|infantile/.test(s)) return I.baby;
  if (/yaourt/.test(s)) return I.yogurt;
  if (/fromage|vache/.test(s)) return I.cheese;
  if (/choco|tartiner/.test(s)) return /stick|individuel/.test(s) ? I.ice : I.chocolate;
  if (/biscuit/.test(s)) return I.biscuits;
  if (/avoine|flocon|céréale/.test(s)) return I.oats;
  if (/lait/.test(s)) return I.milk;
  if (/pâte|spaghetti|roni/.test(s)) return I.pasta;
  if (/tomate/.test(s)) return I.tomato;
  if (/mayonnaise|mayo/.test(s)) return I.salad;
  if (/sardine|pilchard/.test(s)) return I.fish;
  if (/corned|bœuf|beef/.test(s)) return I.beef;
  if (/riz/.test(s)) return I.rice;
  if (/panier/.test(s)) return I.basket;
  if (/frein|auto/.test(s)) return I.car;
  if (/conserve/.test(s)) return I.veggies;
  return I.shelf;
}

async function download(url, dest) {
  const res = await fetch(url, {
    headers: { "User-Agent": "SAGE-Platform/1.0" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(String(res.status));
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1500) throw new Error("small");
  fs.writeFileSync(dest, buf);
  return buf.length;
}

const products = JSON.parse(fs.readFileSync(masterPath, "utf8"));
const stats = { ok: 0, skip: 0, fail: 0 };

for (const p of products) {
  const file = `${p.sku.replace(/[^a-zA-Z0-9_-]/g, "_")}.jpg`;
  const dest = path.join(outDir, file);
  const publicPath = `/products/${file}`;
  const url = pick(p);

  if (fs.existsSync(dest) && fs.statSync(dest).size > 1500) {
    p.imageUrl = publicPath;
    stats.skip++;
    continue;
  }
  try {
    await download(url, dest);
    p.imageUrl = publicPath;
    stats.ok++;
    process.stdout.write(`OK ${p.sku}\n`);
  } catch (e) {
    p.imageUrl = url;
    stats.fail++;
    process.stdout.write(`REMOTE ${p.sku} (${e.message})\n`);
  }
}

fs.writeFileSync(masterPath, JSON.stringify(products, null, 2) + "\n");
console.log(stats, "with images", products.filter((p) => p.imageUrl).length);
