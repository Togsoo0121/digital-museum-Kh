import "./App.css";
import { useEffect, useId, useMemo, useState } from "react";
import { db, auth } from "./firebase";
import { createQPayInvoice } from "./services/qpayService.js";
import { qrSvgDataUrl } from "./utils/qrCode";
import { onValue, ref, set } from "firebase/database";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  ArrowLeft,
  Bell,
  BookOpen,
  Building2,
  CalendarCheck,
  ChevronDown,
  ChevronRight,
  Clock,
  Database,
  Download,
  ExternalLink,
  Eye,
  FileText,
  FileUp,
  Globe2,
  GraduationCap,
  Headphones,
  Home,
  Image as ImageIcon,
  Layers3,
  LayoutDashboard,
  Loader2,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Maximize2,
  Menu,
  Music,
  Newspaper,
  Phone,
  Plus,
  QrCode,
  Save,
  Settings,
  ShieldCheck,
  Sparkles,
  Ticket,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";

const CLOUD_NAME = "dsg5ey8do";
const UPLOAD_PRESET = "museum_upload";
const LOCAL_DATA_KEY = "khentiiMuseumDataFallback";
const LOCAL_TICKET_KEY = "khentiiMuseumTicketRequests";
const AUTH_ROLE_KEY = "khentiiMuseumAuthRole";

const museumImages = {
  hero: "/hero-bg.png",
  halls:
    "https://images.unsplash.com/photo-1554907984-15263bfd63bd?auto=format&fit=crop&w=1800&q=85",
  artifact:
    "https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=1400&q=85",
  gallery:
    "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&w=1400&q=85",
  education:
    "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1800&q=85",
  vr: "/hero-bg.png",
};

const demoArVrItems = [
  {
    title: "AMNH: Говийн олдворын 360 VR аялал",
    type: "YouTube 360 видео",
    desc: "Америкийн Байгалийн түүхийн музейн Говийн чулуужсан олдвор, судалгааны сан хөмрөгийг 360 VR хэлбэрээр танилцуулсан сургалтын демо.",
    url: "https://www.youtube.com/watch?v=HDdqd8c_-hY",
    fallbackVideo: "",
    thumbnail: "https://img.youtube.com/vi/HDdqd8c_-hY/hqdefault.jpg",
  },
  {
    title: "Florida Museum: Fossil Hall 360",
    type: "YouTube 360 видео",
    desc: "Флоридагийн Байгалийн түүхийн музейн чулуужсан олдворын танхимын виртуал аялал. VR/AR үзмэр хуудсын YouTube embed болон төхөөрөмжөөр нээх урсгалыг шалгахад тохиромжтой.",
    url: "https://www.youtube.com/watch?v=gPfX1ASO3nQ",
    fallbackVideo: "",
    thumbnail: "https://img.youtube.com/vi/gPfX1ASO3nQ/hqdefault.jpg",
  },
  {
    title: "Huntington: VR музейн 360 аялал",
    type: "YouTube 360 видео",
    desc: "Huntington Library, Art Museum and Botanical Gardens-ийн музейн орчны 4K 360 VR аялал. Хэрэглэгч YouTube/VR төхөөрөмжөөр нээж турших боломжтой.",
    url: "https://www.youtube.com/watch?v=GcGnhTci5Wc",
    fallbackVideo: "",
    thumbnail: "https://img.youtube.com/vi/GcGnhTci5Wc/hqdefault.jpg",
  },
  {
    title: "Mongol Sword",
    type: "AR GLB model",
    desc: "Монгол илдний demo 3D загвар. GLB model viewer дээр auto-rotate, camera controls, fullscreen болон AR view товчоор туршина.",
    url: "/models/mongol-sword.glb",
    fallbackVideo: "",
    thumbnail: museumImages.vr,
  },
  {
    title: "Horse Statue",
    type: "AR GLB model",
    desc: "Морин хөшөөний demo 3D загвар. Танхимын AR үзмэрийн урсгалыг Meta Quest, Pico болон mobile browser дээр шалгахад зориулав.",
    url: "/models/horse-statue.glb",
    fallbackVideo: "",
    thumbnail: museumImages.vr,
  },
  {
    title: "Warrior Helmet",
    type: "AR GLB model",
    desc: "Дайчны дуулганы demo 3D загвар. Эргүүлэх, ойртуулах, fullscreen болон AR view туршилтын үндсэн үзмэр.",
    url: "/models/warrior-helmet.glb",
    fallbackVideo: "",
    thumbnail: museumImages.vr,
  },
];

const emptyMedia = {
  images: [],
  sidePhotos: [],
  videos: [],
  audios: [],
  documents: [],
};

const defaultData = {
  museumName: "Хэнтий аймгийн музей",
  slogan: "Virtual Museum Platform",
  logo: "",
  logoBg: "#c48a2c",
  loader: {
    enabled: true,
    text: "Хэнтий аймгийн музей",
    subText: "Түүх • Соёл • Боловсрол",
    image: "/hero-bg.png",
    video: "",
  },
  heroTitle: "Хэнтий аймгийн музей",
  heroText:
    "Түүх, археологи, угсаатны зүй, боловсролын хөтөлбөр, VR/AR үзмэр, цахим тасалбар болон үзмэрийн тайлбарыг нэг дор нэгтгэсэн музейн цахим орчин.",
  heroImage: museumImages.hero,
  hallsHeroImage: museumImages.halls,
  educationHeroImage: museumImages.education,
  arVrHeroImage: museumImages.vr,
  seo: {
    title: "Хэнтий аймгийн музей | Цахим музей",
    description:
      "Хэнтий аймгийн музейн цахим платформ: үзэсгэлэн, боловсролын хөтөлбөр, цахим тасалбар, VR/AR үзмэр болон соёлын өвийн мэдээлэл.",
    keywords:
      "Хэнтий аймгийн музей, цахим музей, Монголын музей, үзэсгэлэн, боловсролын хөтөлбөр, VR/AR үзмэр",
    ogTitle: "Хэнтий аймгийн музей | Цахим музей",
    ogDescription:
      "Хэнтий нутгийн түүх, соёлын өв, үзэсгэлэн, боловсролын ажил, VR/AR үзмэрийг нэг дор үзэх цахим музей.",
    ogImage: museumImages.hero,
  },
  aboutPages: {
    greeting: {
      title: "Мэндчилгээ",
      subtitle: "Музейн захирлын мэндчилгээ",
      published: true,
      sortOrder: 1,
      directorName: "Музейн захирал",
      role: "Хэнтий аймгийн музей",
      image: museumImages.gallery,
      images: [museumImages.gallery],
      video: "",
      body:
        "Эрхэм зочид, судлаачид, хүүхэд залуучууд та бүхнийг Хэнтий аймгийн музейн цахим орчинд тавтай морилно уу. Манай музей Хэнтий нутгийн түүх, археологи, угсаатны зүй, байгалийн болон соёлын өвийг хадгалж хамгаалах, судлах, олон нийтэд хүртээмжтэйгээр таниулах эрхэм зорилготой. Бид уламжлалт үзэсгэлэнгээ орчин үеийн дижитал үйлчилгээ, боловсролын хөтөлбөр, VR/AR үзмэртэй хослуулан музейн шинэ туршлагыг бүрдүүлж байна.",
    },
    structure: {
      title: "МУЗЕЙН БҮТЭЦ",
      subtitle: "Байгууллагын үндсэн бүтэц, чиг үүрэг",
      published: true,
      sortOrder: 2,
      images: [museumImages.halls],
      video: "",
      body:
        "Хэнтий аймгийн музей нь сан хөмрөг, судалгаа шинжилгээ, үзэсгэлэн, боловсрол, олон нийттэй харилцах, дижитал контент, захиргаа аж ахуйн чиг үүргийг уялдуулан ажилладаг. Бүтцийн нэгж бүр музейн сан хөмрөгийг хамгаалах, үзэгчдэд чанартай үйлчилгээ үзүүлэх, орон нутгийн соёлын өвийг олон нийтэд тогтвортой хүргэх зорилгоор хамтран ажиллана.",
    },
    organization: {
      title: "Зохион байгуулалт",
      subtitle: "Алба, нэгжийн зохион байгуулалт",
      published: true,
      sortOrder: 3,
      images: [museumImages.gallery],
      video: "",
      description:
        "Музейн үйл ажиллагаа нь сан хөмрөгийн хамгаалалт, эрдэм шинжилгээ, үзэсгэлэнгийн зохион байгуулалт, боловсролын үйлчилгээ, олон нийттэй харилцах ажил, дижитал музейн хөгжүүлэлт гэсэн чиглэлүүдээр хэрэгжинэ.",
      departments: [
        "Сан хөмрөг, бүртгэл мэдээллийн алба",
        "Эрдэм шинжилгээ, судалгааны алба",
        "Үзэсгэлэн, тайлбар үйлчилгээний алба",
        "Боловсрол, олон нийтийн хөтөлбөрийн алба",
        "Дижитал музей, медиа хөгжүүлэлтийн алба",
      ],
    },
    intro: {
      title: "Товч танилцуулга",
      subtitle: "Үүсгэн байгуулагдсан үеэс өнөөг хүртэл",
      published: true,
      sortOrder: 4,
      images: [museumImages.vr],
      video: "",
      body:
        "Хэнтий аймгийн музей нь нутгийн түүх, соёлын өвийг үе үеийн судлаач, музейн ажилтнуудын хөдөлмөрөөр бүрдүүлж, өнөөдөр олон нийт, сургууль, судлаачдад нээлттэй соёл боловсролын төв болон хөгжиж байна.",
    },
  },
  timelineSlides: [
    {
      year: "1949",
      title: "Музейн эхлэл",
      image: museumImages.halls,
      desc:
        "Хэнтий нутагт музейн сан хөмрөг бүрдүүлэх, түүх соёлын дурсгалыг цуглуулах анхны ажлууд эхэлсэн үе.",
    },
    {
      year: "1970-аад он",
      title: "Сан хөмрөгийн баяжилт",
      image: museumImages.artifact,
      desc:
        "Археологи, угсаатны зүй, түүхийн баримт, ахуйн эд өлгийн зүйлсээр сан хөмрөг тогтвортой нэмэгдэж, үзэсгэлэнгийн чиглэлүүд өргөжсөн.",
    },
    {
      year: "1990-ээд он",
      title: "Олон нийтэд чиглэсэн музей",
      image: museumImages.gallery,
      desc:
        "Сургалт, тайлбар, судалгааны ажлыг орон нутгийн иргэд, сурагч, судлаачдад илүү хүртээмжтэй болгох шинэ хэлбэрүүд нэвтэрсэн.",
    },
    {
      year: "Өнөөдөр",
      title: "Цахим музейн шинэ шат",
      image: museumImages.vr,
      desc:
        "Үзэсгэлэн, боловсролын хөтөлбөр, цахим тасалбар, VR/AR үзмэр, медиа санг нэгтгэсэн ухаалаг музейн платформ болон хөгжиж байна.",
    },
  ],
  publications: [
    {
      id: "publication-research-2026",
      title: "Судалгааны эмхэтгэл",
      year: "2026",
      author: "Хэнтий аймгийн музей",
      category: "Судалгаа",
      coverImage: museumImages.gallery,
      desc: "Хэнтий нутгийн түүх, археологи, угсаатны зүйн судалгааны нийтлэл, эмхэтгэл.",
      fullDesc:
        "Хэнтий нутгийн түүх, археологи, угсаатны зүй, соёлын өвийн судалгааны өгүүлэл, эх сурвалж, тайлбар бүхий музейн хэвлэл.",
      date: "2026",
      files: [],
      published: true,
      sortOrder: 1,
    },
    {
      id: "publication-catalog-2026",
      title: "Үзэсгэлэнгийн каталог",
      year: "2026",
      author: "Хэнтий аймгийн музей",
      category: "Каталог",
      coverImage: museumImages.artifact,
      desc: "Музейн онцлох үзмэрүүдийн тайлбар, зураг, эх сурвалжийн мэдээлэл.",
      fullDesc:
        "Музейн онцлох үзмэрүүдийн зураг, тайлбар, он цаг, материал, эх сурвалжийн мэдээллийг нэгтгэсэн каталог.",
      date: "2026",
      files: [],
      published: true,
      sortOrder: 2,
    },
  ],
  transparency: [
    {
      id: "transparency-report",
      title: "Үйл ажиллагааны мэдээлэл",
      date: "2026-01-01",
      category: "Тайлан",
      desc: "Музейн төлөвлөгөө, тайлан, олон нийтэд нээлттэй мэдээллийн багц.",
      fileUrl: "",
      files: [],
      published: true,
      sortOrder: 1,
    },
    {
      id: "transparency-procurement",
      title: "Худалдан авалт ба хамтын ажиллагаа",
      date: "2026-01-01",
      category: "Зар",
      desc: "Ил тод байдлын хүрээнд нийтэлсэн зар, тайлан, хамтын ажиллагааны мэдээлэл.",
      fileUrl: "",
      files: [],
      published: true,
      sortOrder: 2,
    },
  ],
  paymentSettings: {
    mode: "demo",
    currency: "MNT",
    ticketTypes: [
      { id: "adult", name: "Том хүн", price: 10000, description: "Музейн үндсэн үзлэг" },
      { id: "student", name: "Оюутан / сурагч", price: 5000, description: "Сургуулийн насны болон оюутан" },
      { id: "family", name: "Гэр бүл", price: 25000, description: "4 хүртэл хүний багц" },
    ],
  },
  notifications: [],
  about:
    "Хэнтий аймгийн музей нь түүх, археологи, угсаатны зүй, соёлын өвийг хадгалж хамгаалах, судлах, олон нийтэд таниулах, хүүхэд залуучуудад өв соёлын боловсрол олгох байгууллага юм.",
  visit: {
    title: "Зочлох мэдээлэл",
    time: "Даваа-Бямба: 09:00-18:00",
    ticket:
      "Бүлгийн аялал, сургалтын хөтөлбөр, тусгай тайлбартай үзлэгийн хүсэлтийг цахимаар илгээнэ үү.",
    address: "Чингис хот, Хэнтий аймаг",
    mapEmbed:
      "https://www.google.com/maps?q=Chinggis%20City%20Khentii%20Mongolia&output=embed",
  },
  contact: {
    address: "Чингис хот, Хэнтий аймаг",
    email: "museum@khentii.mn",
    phone: "0000-0000",
  },
  floors: [
    {
      name: "1 давхар",
      title: "Өвийн угтах танхимууд",
      desc: "Музейн үндсэн чиглэл, Хэнтий нутгийн түүхэн орчин, угтах үзмэрүүдийг танилцуулна.",
      image: museumImages.halls,
      videos: [],
      halls: [
        {
          title: "Түүхийн танхим",
          shortDesc:
            "Хэнтий нутгийн түүхэн хөгжил, археологийн олдвор, баримтат өв.",
          desc: "Энэ танхим нь Хэнтий нутгийн эртний түүх, археологийн дурсгал, эзэнт гүрний үеийн өв, судалгааны үнэ цэнийг олон нийтэд ойлгомжтой хэлбэрээр хүргэнэ.",
          images: [museumImages.halls],
          sidePhotos: [],
          videos: [],
          audios: [],
          documents: [],
          exhibits: [
            {
              id: "exhibit-heritage-001",
              title: "Эртний нүүдэлчдийн хэрэглээний эдлэл",
              period: "XIII зуун",
              material: "Мод, төмөр, арьс",
              foundPlace: "Хэнтий аймаг",
              shortDesc: "Нүүдэлчдийн өдөр тутмын хэрэглээ, ур хийцийн жишээ.",
              desc: "Энэхүү үзмэр нь Хэнтий нутгийн нүүдэлчдийн ахуй, гар урлал, материал ашиглалт, тухайн үеийн соёлын харилцааг тайлбарлах чухал эх сурвалж юм.",
              images: [museumImages.artifact],
              sidePhotos: [museumImages.artifact],
              videos: [],
              audios: [],
              documents: [],
            },
          ],
        },
      ],
    },
  ],
  educationPrograms: [
    {
      title: "Сургуулийн музейн хичээл",
      audience: "ЕБС-ийн сурагчид",
      type: "Танхимын хөтөлбөр",
      desc: "Түүх, нийгэм, эх хэл, урлагийн хичээлтэй уялдсан музейн тайлбар, даалгавар, хэлэлцүүлэг.",
      resources: [],
      videos: [],
    },
    {
      title: "Дижитал өвийн хичээл",
      audience: "Багш, сурагч, гэр бүл",
      type: "Цахим сургалт",
      desc: "Үзмэрийн зураг, QR тайлбар, богино видео, аудио эх сурвалж ашиглан өв соёлыг зайнаас судлах хичээл.",
      resources: [],
      videos: [],
    },
    {
      title: "Сургуулийн хамтын ажиллагаа",
      audience: "Сургууль, дугуйлан",
      type: "Хамтын төсөл",
      desc: "Сургалтын төлөвлөгөө, музейн аялал, бүтээлч даалгавар, судалгааны өдөрлөгийг хамтран зохион байгуулна.",
      resources: [],
      videos: [],
    },
  ],
  arVrItems: demoArVrItems,
  news: [
    {
      title: "Боловсролын аяллын хүсэлтийг цахимаар авна",
      desc: "Сурагчдын бүлэг, байгууллага, гэр бүлүүд музейн боловсролын аяллын хүсэлтээ урьдчилан илгээх боломжтой.",
      date: new Date().toISOString().slice(0, 10),
    },
  ],
  ticketRequests: [],
};

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function textValue(value, fallback = "") {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object") {
    return (
      value.mn ||
      value.mongolian ||
      value.en ||
      value.value ||
      value.url ||
      value.src ||
      fallback
    );
  }
  return fallback;
}

function mediaList(value) {
  return safeArray(value)
    .map((item) => textValue(item))
    .filter(Boolean);
}

function normalizeFileItem(item = {}) {
  if (typeof item === "string") {
    return {
      id: stableHash(item),
      title: item.split("/").pop() || "Файл",
      url: item,
      type: fileTypeFromUrl(item),
    };
  }
  const url = textValue(item.url || item.src || item.file);
  return {
    id: textValue(item.id, stableHash(`${item.title || ""}-${url}`)),
    title: textValue(item.title, url.split("/").pop() || "Файл"),
    url,
    type: textValue(item.type, fileTypeFromUrl(url)),
  };
}

function fileTypeFromUrl(url = "") {
  const clean = textValue(url).split("?")[0].toLowerCase();
  if (clean.endsWith(".pdf")) return "pdf";
  if (clean.endsWith(".doc") || clean.endsWith(".docx")) return "docx";
  if (clean.endsWith(".zip") || clean.endsWith(".rar")) return "zip";
  if (/\.(png|jpe?g|webp|gif)$/i.test(clean)) return "image";
  return "file";
}

function createId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readLocalTickets() {
  try {
    return JSON.parse(window.localStorage.getItem(LOCAL_TICKET_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeLocalTickets(requests) {
  window.localStorage.setItem(LOCAL_TICKET_KEY, JSON.stringify(requests));
}

function readLocalData() {
  try {
    const saved = window.localStorage.getItem(LOCAL_DATA_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function writeLocalData(data) {
  try {
    window.localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Local data fallback write error:", error);
  }
}

function mergeTickets(primary, secondary) {
  const seen = new Set();
  return [...safeArray(primary), ...safeArray(secondary)].filter((item) => {
    const key = item.id || `${item.name}-${item.phone}-${item.date}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function qrUrl(url, size = 320) {
  return qrSvgDataUrl(url, size);
}

function exhibitPublicPath(exhibit, floorIndex, hallIndex, exhibitIndex) {
  const id = textValue(exhibit?.id);
  if (id) return `/exhibit/${encodeURIComponent(id)}`;
  return `/exhibit/${floorIndex}/${hallIndex}/${exhibitIndex}`;
}

function exhibitPublicUrl(exhibit, floorIndex, hallIndex, exhibitIndex) {
  return `${window.location.origin}${exhibitPublicPath(
    exhibit,
    floorIndex,
    hallIndex,
    exhibitIndex
  )}`;
}

function safeFileName(value, fallback = "exhibit-qr") {
  const cleaned = textValue(value, fallback)
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || fallback;
}

function stableHash(value) {
  const input = textValue(value);
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash.toString(36);
}

function fallbackExhibitId(floorIndex, hallIndex, exhibitIndex, exhibit = {}) {
  const seed = [
    floorIndex,
    hallIndex,
    exhibitIndex,
    textValue(exhibit.title),
    textValue(exhibit.period),
    textValue(exhibit.foundPlace),
  ].join("|");
  return `legacy-exhibit-${floorIndex + 1}-${hallIndex + 1}-${stableHash(seed)}`;
}

async function downloadQrCode(url, title) {
  try {
    const response = await fetch(qrUrl(url, 900));
    if (!response.ok) throw new Error("QR download failed");
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `${safeFileName(title)}-qr.png`;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  } catch {
    const anchor = document.createElement("a");
    anchor.href = qrUrl(url, 900);
    anchor.target = "_blank";
    anchor.rel = "noreferrer";
    anchor.click();
  }
}

function printQrCode(url, title) {
  const printWindow = window.open("", "_blank", "width=760,height=900");
  if (!printWindow) return;
  const doc = printWindow.document;
  doc.open();
  doc.write("<!doctype html><html><head><title>QR</title></head><body></body></html>");
  doc.close();

  const style = doc.createElement("style");
  style.textContent = `
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: Arial, sans-serif; color: #171615; }
    main { width: min(640px, 100% - 48px); text-align: center; }
    img { width: 360px; height: 360px; max-width: 100%; }
    h1 { font-size: 28px; margin: 0 0 14px; }
    p { overflow-wrap: anywhere; color: #555; font-size: 14px; line-height: 1.5; }
  `;
  doc.head.appendChild(style);

  const main = doc.createElement("main");
  const heading = doc.createElement("h1");
  heading.textContent = title || "Үзмэрийн QR код";
  const image = doc.createElement("img");
  image.src = qrUrl(url, 720);
  image.alt = "QR код";
  const link = doc.createElement("p");
  link.textContent = url;
  main.append(heading, image, link);
  doc.body.appendChild(main);
  image.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
}

function paymentStatusLabel(status) {
  const value = textValue(status, "pending");
  if (value === "paid" || value === "Баталгаажсан") return "Төлөгдсөн";
  if (value === "cancelled" || value === "Цуцалсан") return "Цуцалсан";
  return "Хүлээгдэж байна";
}

function paymentStatusKey(status) {
  const value = textValue(status, "pending");
  if (value === "paid" || value === "Баталгаажсан") return "paid";
  if (value === "cancelled" || value === "Цуцалсан") return "cancelled";
  return "pending";
}

function csvEscape(value) {
  return `"${textValue(value).replace(/"/g, '""')}"`;
}

function exportOrdersCsv(orders) {
  const header = [
    "Order ID",
    "Customer",
    "Phone",
    "Email",
    "Ticket type",
    "Quantity",
    "Total amount",
    "Payment status",
    "Date",
    "Created",
  ];
  const rows = safeArray(orders).map((order) => [
    order.id,
    order.name,
    order.phone,
    order.email,
    order.ticketType,
    order.quantity,
    order.totalAmount,
    paymentStatusLabel(order.paymentStatus),
    order.date,
    order.createdAt,
  ]);
  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `ticket-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function getPathParts() {
  return window.location.pathname.split("/").filter(Boolean);
}

function isDirectVideo(url) {
  return /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url || "");
}

function isDirectImage(url) {
  return /\.(jpg|jpeg|png|webp|avif)(\?|#|$)/i.test(url || "");
}

function isModel3d(url) {
  return /\.(glb|gltf)(\?|#|$)/i.test(url || "");
}

function isYoutube(url) {
  return /youtube\.com|youtu\.be/i.test(url || "");
}

function youtubeEmbed(url) {
  const value = textValue(url);
  const short = value.match(/youtu\.be\/([^?&]+)/);
  const long = value.match(/[?&]v=([^?&]+)/);
  const embed = value.match(/youtube\.com\/embed\/([^?&]+)/);
  const id = short?.[1] || long?.[1] || embed?.[1];
  return id ? `https://www.youtube.com/embed/${id}` : value;
}

function requestFullscreen(elementId) {
  const element = document.getElementById(elementId);
  if (!element) return;
  const request =
    element.requestFullscreen ||
    element.webkitRequestFullscreen ||
    element.msRequestFullscreen;
  if (request) request.call(element);
}

async function activateModelAr(elementId) {
  const element = document.getElementById(elementId);
  const viewer = element?.querySelector("model-viewer");
  if (viewer?.activateAR) {
    try {
      await viewer.activateAR();
      return;
    } catch (error) {
      console.error("AR view fallback:", error);
    }
  }
  requestFullscreen(elementId);
}

function upsertMeta(selector, attributes) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value || "");
  });
}

function normalizeTicket(request = {}) {
  const ticketType = textValue(request.ticketType, textValue(request.type, "Том хүн"));
  const quantity = Math.max(1, Number(request.quantity || request.guests || 1));
  const unitPrice = Number(request.unitPrice || request.price || 0);
  const totalAmount = Number(request.totalAmount || unitPrice * quantity || 0);
  const createdAt = textValue(request.createdAt, new Date().toISOString());
  return {
    ...request,
    id: textValue(request.id, createId()),
    name: textValue(request.name),
    phone: textValue(request.phone),
    email: textValue(request.email),
    date: textValue(request.date),
    guests: textValue(request.guests, String(quantity)),
    ticketType,
    quantity,
    unitPrice,
    totalAmount,
    currency: textValue(request.currency, "MNT"),
    note: textValue(request.note),
    status: textValue(request.status, "pending"),
    paymentStatus: textValue(request.paymentStatus, textValue(request.status, "pending")),
    paymentMode: textValue(request.paymentMode, "demo"),
    invoiceId: textValue(request.invoiceId),
    paymentUrl: textValue(request.paymentUrl),
    qpayPayload: textValue(request.qpayPayload),
    paidAt: textValue(request.paidAt),
    cancelledAt: textValue(request.cancelledAt),
    createdAt,
    source: textValue(request.source, "firebase"),
  };
}

function normalizeTicketType(item = {}) {
  return {
    id: textValue(item.id, `ticket-${stableHash(item.name || item.title || "ticket")}`),
    name: textValue(item.name || item.title, "Тасалбар"),
    price: Number(item.price || 0),
    description: textValue(item.description || item.desc),
  };
}

function normalizePaymentSettings(settings = {}) {
  const mode = textValue(settings.mode, defaultData.paymentSettings.mode);
  return {
    mode: mode === "live" ? "live" : "demo",
    currency: textValue(settings.currency, "MNT"),
    ticketTypes: safeArray(
      settings.ticketTypes?.length
        ? settings.ticketTypes
        : defaultData.paymentSettings.ticketTypes
    ).map(normalizeTicketType),
  };
}

function normalizeNotification(item = {}) {
  return {
    id: textValue(item.id, `notification-${stableHash(`${item.orderId || ""}-${item.createdAt || ""}`)}`),
    type: textValue(item.type, "ticket"),
    title: textValue(item.title, "New ticket request"),
    orderId: textValue(item.orderId),
    customerName: textValue(item.customerName),
    phone: textValue(item.phone),
    email: textValue(item.email),
    contact: textValue(item.contact || item.phone || item.email),
    ticketType: textValue(item.ticketType),
    quantity: Number(item.quantity || 1),
    totalAmount: Number(item.totalAmount || 0),
    paymentStatus: textValue(item.paymentStatus, "pending"),
    createdAt: textValue(item.createdAt, new Date().toISOString()),
    read: Boolean(item.read),
  };
}

function normalizeEducation(item = {}) {
  return {
    title: textValue(item.title, "Боловсролын хөтөлбөр"),
    audience: textValue(item.audience),
    type: textValue(item.type),
    desc: textValue(item.desc),
    resources: mediaList(item.resources),
    videos: mediaList(item.videos),
  };
}

function normalizeArVr(item = {}) {
  return {
    title: textValue(item.title, "VR/AR үзмэр"),
    type: textValue(item.type, "VR video"),
    desc: textValue(item.desc),
    url: textValue(item.url),
    fallbackVideo: textValue(item.fallbackVideo),
    thumbnail: textValue(item.thumbnail, museumImages.vr),
  };
}

function mergeDemoArVrItems(items = []) {
  const normalized = safeArray(items).map(normalizeArVr);
  const knownUrls = new Set(normalized.map((item) => item.url).filter(Boolean));
  const missingDemos = demoArVrItems
    .filter((item) => !knownUrls.has(item.url))
    .map(normalizeArVr);
  return [...normalized, ...missingDemos];
}

function normalizeSeo(seo = {}) {
  const legacyTitle = "Хэнтий музей | Virtual Museum";
  const title = textValue(seo.title, defaultData.seo.title);
  const ogTitle = textValue(seo.ogTitle, textValue(seo.title, defaultData.seo.ogTitle));
  return {
    title: title === legacyTitle ? defaultData.seo.title : title,
    description: textValue(seo.description, defaultData.seo.description),
    keywords: textValue(seo.keywords, defaultData.seo.keywords),
    ogTitle: ogTitle === legacyTitle ? defaultData.seo.ogTitle : ogTitle,
    ogDescription: textValue(
      seo.ogDescription,
      textValue(seo.description, defaultData.seo.ogDescription)
    ),
    ogImage: textValue(seo.ogImage, defaultData.seo.ogImage),
  };
}

function normalizeAboutPages(aboutPages = {}) {
  const source = aboutPages || {};
  return {
    greeting: {
      ...defaultData.aboutPages.greeting,
      ...(source.greeting || {}),
      title: textValue(source.greeting?.title, defaultData.aboutPages.greeting.title),
      subtitle: textValue(
        source.greeting?.subtitle,
        defaultData.aboutPages.greeting.subtitle
      ),
      published:
        typeof source.greeting?.published === "boolean"
          ? source.greeting.published
          : defaultData.aboutPages.greeting.published,
      sortOrder: Number(source.greeting?.sortOrder || defaultData.aboutPages.greeting.sortOrder),
      directorName: textValue(
        source.greeting?.directorName,
        defaultData.aboutPages.greeting.directorName
      ),
      role: textValue(source.greeting?.role, defaultData.aboutPages.greeting.role),
      image: textValue(source.greeting?.image, defaultData.aboutPages.greeting.image),
      images: mediaList(source.greeting?.images?.length ? source.greeting.images : defaultData.aboutPages.greeting.images),
      video: textValue(source.greeting?.video),
      body: textValue(source.greeting?.body, defaultData.aboutPages.greeting.body),
    },
    structure: {
      ...defaultData.aboutPages.structure,
      ...(source.structure || {}),
      title: textValue(source.structure?.title, defaultData.aboutPages.structure.title),
      subtitle: textValue(
        source.structure?.subtitle,
        defaultData.aboutPages.structure.subtitle
      ),
      published:
        typeof source.structure?.published === "boolean"
          ? source.structure.published
          : defaultData.aboutPages.structure.published,
      sortOrder: Number(source.structure?.sortOrder || defaultData.aboutPages.structure.sortOrder),
      images: mediaList(source.structure?.images?.length ? source.structure.images : defaultData.aboutPages.structure.images),
      video: textValue(source.structure?.video),
      body: textValue(source.structure?.body, defaultData.aboutPages.structure.body),
    },
    organization: {
      ...defaultData.aboutPages.organization,
      ...(source.organization || {}),
      title: textValue(
        source.organization?.title,
        defaultData.aboutPages.organization.title
      ),
      subtitle: textValue(
        source.organization?.subtitle,
        defaultData.aboutPages.organization.subtitle
      ),
      published:
        typeof source.organization?.published === "boolean"
          ? source.organization.published
          : defaultData.aboutPages.organization.published,
      sortOrder: Number(
        source.organization?.sortOrder || defaultData.aboutPages.organization.sortOrder
      ),
      images: mediaList(
        source.organization?.images?.length
          ? source.organization.images
          : defaultData.aboutPages.organization.images
      ),
      video: textValue(source.organization?.video),
      description: textValue(
        source.organization?.description,
        defaultData.aboutPages.organization.description
      ),
      departments: safeArray(
        source.organization?.departments?.length
          ? source.organization.departments
          : defaultData.aboutPages.organization.departments
      ).map((item) => textValue(item)),
    },
    intro: {
      ...defaultData.aboutPages.intro,
      ...(source.intro || {}),
      title: textValue(source.intro?.title, defaultData.aboutPages.intro.title),
      subtitle: textValue(source.intro?.subtitle, defaultData.aboutPages.intro.subtitle),
      published:
        typeof source.intro?.published === "boolean"
          ? source.intro.published
          : defaultData.aboutPages.intro.published,
      sortOrder: Number(source.intro?.sortOrder || defaultData.aboutPages.intro.sortOrder),
      images: mediaList(source.intro?.images?.length ? source.intro.images : defaultData.aboutPages.intro.images),
      video: textValue(source.intro?.video),
      body: textValue(source.intro?.body, defaultData.aboutPages.intro.body),
    },
  };
}

function normalizeTimelineSlide(item = {}) {
  return {
    id: textValue(item.id, `timeline-${stableHash(`${item.year || ""}-${item.title || ""}`)}`),
    year: textValue(item.year, "Он цаг"),
    title: textValue(item.title, "Түүхэн үе"),
    image: textValue(item.image, museumImages.halls),
    desc: textValue(item.desc),
  };
}

function normalizePublication(item = {}) {
  return {
    id: textValue(item.id, `publication-${stableHash(`${item.title || ""}-${item.year || item.date || ""}`)}`),
    title: textValue(item.title, "Гарчиг"),
    year: textValue(item.year, textValue(item.date)),
    date: textValue(item.date, textValue(item.year)),
    author: textValue(item.author || item.editor, "Хэнтий аймгийн музей"),
    category: textValue(item.category, "Ном хэвлэл"),
    coverImage: textValue(item.coverImage || item.image, museumImages.gallery),
    desc: textValue(item.desc, textValue(item.fullDesc)),
    fullDesc: textValue(item.fullDesc, textValue(item.desc)),
    files: safeArray(item.files?.length ? item.files : item.attachments).map(normalizeFileItem),
    published: typeof item.published === "boolean" ? item.published : true,
    sortOrder: Number(item.sortOrder || 0),
  };
}

function normalizeTransparency(item = {}) {
  const primaryFile = textValue(item.fileUrl || item.url);
  const files = safeArray(item.files).map(normalizeFileItem);
  if (primaryFile && !files.some((file) => file.url === primaryFile)) {
    files.unshift(normalizeFileItem({ title: item.title, url: primaryFile }));
  }
  return {
    id: textValue(item.id, `transparency-${stableHash(`${item.title || ""}-${item.date || ""}`)}`),
    title: textValue(item.title, "Ил тод мэдээлэл"),
    date: textValue(item.date, new Date().toISOString().slice(0, 10)),
    category: textValue(item.category, "Мэдээлэл"),
    desc: textValue(item.desc || item.description),
    fileUrl: primaryFile,
    files,
    published: typeof item.published === "boolean" ? item.published : true,
    sortOrder: Number(item.sortOrder || 0),
  };
}

function normalizeFloor(floor = {}, floorIndex = 0) {
  return {
    name: textValue(floor.name, "Давхар"),
    title: textValue(floor.title, "Давхрын танхимууд"),
    desc: textValue(floor.desc),
    image: textValue(floor.image),
    videos: mediaList(floor.videos),
    halls: safeArray(floor.halls).map((hall, hallIndex) => ({
      title: textValue(hall?.title, "Танхим"),
      category: textValue(hall?.category, textValue(floor.name, "Танхим")),
      shortDesc: textValue(hall?.shortDesc, textValue(hall?.desc)),
      desc: textValue(hall?.desc, textValue(hall?.shortDesc)),
      images: mediaList(hall?.images),
      sidePhotos: mediaList(hall?.sidePhotos),
      videos: mediaList(hall?.videos),
      audios: mediaList(hall?.audios).concat(textValue(hall?.audio) ? [textValue(hall.audio)] : []),
      documents: mediaList(hall?.documents),
      exhibits: safeArray(hall?.exhibits).map((exhibit, exhibitIndex) => ({
        id: textValue(
          exhibit?.id,
          fallbackExhibitId(floorIndex, hallIndex, exhibitIndex, exhibit)
        ),
        title: textValue(exhibit?.title, "Үзмэр"),
        category: textValue(exhibit?.category, "Үзмэр"),
        period: textValue(exhibit?.period),
        material: textValue(exhibit?.material),
        foundPlace: textValue(exhibit?.foundPlace),
        shortDesc: textValue(exhibit?.shortDesc, textValue(exhibit?.desc)),
        desc: textValue(exhibit?.desc, textValue(exhibit?.shortDesc)),
        images: mediaList(exhibit?.images),
        sidePhotos: mediaList(exhibit?.sidePhotos),
        videos: mediaList(exhibit?.videos),
        audios: mediaList(exhibit?.audios).concat(
          textValue(exhibit?.audio) ? [textValue(exhibit.audio)] : []
        ),
        documents: mediaList(exhibit?.documents),
      })),
    })),
  };
}

function safeData(saved) {
  const hasSaved = saved && typeof saved === "object";
  const source = hasSaved ? saved : defaultData;
  const floors =
    hasSaved && Array.isArray(saved.floors) && saved.floors.length
      ? saved.floors
      : defaultData.floors;

  return {
    ...defaultData,
    ...source,
    museumName: textValue(source.museumName, defaultData.museumName),
    slogan: textValue(source.slogan, defaultData.slogan),
    logo: textValue(source.logo),
    logoBg: textValue(source.logoBg, defaultData.logoBg),
    heroTitle: textValue(source.heroTitle, defaultData.heroTitle),
    heroText: textValue(source.heroText, defaultData.heroText),
    heroImage: textValue(source.heroImage, defaultData.heroImage),
    hallsHeroImage: textValue(source.hallsHeroImage, defaultData.hallsHeroImage),
    educationHeroImage: textValue(
      source.educationHeroImage,
      defaultData.educationHeroImage
    ),
    arVrHeroImage: textValue(source.arVrHeroImage, defaultData.arVrHeroImage),
    seo: normalizeSeo(source.seo || {}),
    aboutPages: normalizeAboutPages(source.aboutPages || {}),
    timelineSlides:
      hasSaved && Array.isArray(source.timelineSlides)
        ? source.timelineSlides.map(normalizeTimelineSlide)
        : defaultData.timelineSlides,
    publications:
      hasSaved && Array.isArray(source.publications)
        ? source.publications.map(normalizePublication)
        : defaultData.publications,
    transparency:
      hasSaved && Array.isArray(source.transparency)
        ? source.transparency.map(normalizeTransparency)
        : defaultData.transparency,
    paymentSettings: normalizePaymentSettings(source.paymentSettings || {}),
    notifications: safeArray(source.notifications).map(normalizeNotification),
    about: textValue(source.about, defaultData.about),
    loader: {
      ...defaultData.loader,
      ...(source.loader || {}),
      enabled:
        typeof source.loader?.enabled === "boolean"
          ? source.loader.enabled
          : defaultData.loader.enabled,
      text: textValue(source.loader?.text, defaultData.loader.text),
      subText: textValue(source.loader?.subText, defaultData.loader.subText),
      image: textValue(source.loader?.image, defaultData.loader.image),
      video: textValue(source.loader?.video),
    },
    visit: {
      ...defaultData.visit,
      ...(source.visit || {}),
      title: textValue(source.visit?.title, defaultData.visit.title),
      time: textValue(source.visit?.time, defaultData.visit.time),
      ticket: textValue(source.visit?.ticket, defaultData.visit.ticket),
      address: textValue(source.visit?.address, defaultData.visit.address),
      mapEmbed: textValue(source.visit?.mapEmbed, defaultData.visit.mapEmbed),
    },
    contact: {
      ...defaultData.contact,
      ...(source.contact || {}),
      address: textValue(source.contact?.address, defaultData.contact.address),
      email: textValue(source.contact?.email, defaultData.contact.email),
      phone: textValue(source.contact?.phone, defaultData.contact.phone),
    },
    educationPrograms:
      hasSaved && Array.isArray(source.educationPrograms)
        ? source.educationPrograms.map(normalizeEducation)
        : defaultData.educationPrograms,
    arVrItems:
      hasSaved && Array.isArray(source.arVrItems)
        ? mergeDemoArVrItems(source.arVrItems)
        : defaultData.arVrItems,
    news: hasSaved
      ? safeArray(source.news).map((item) => ({
          title: textValue(item?.title, "Мэдээ"),
          desc: textValue(item?.desc),
          date: textValue(item?.date),
        }))
      : defaultData.news,
    ticketRequests: safeArray(source.ticketRequests).map(normalizeTicket),
    floors: floors.map(normalizeFloor),
  };
}

export default function App() {
  const [data, setData] = useState(defaultData);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");
  const [dbStatus, setDbStatus] = useState("");
  const [dbError, setDbError] = useState("");
  const [routeTick, setRouteTick] = useState(0);
  const [selectedFloor, setSelectedFloor] = useState(0);

  const pathParts = getPathParts();
  const page = pathParts[0] || "home";
  const subPage = pathParts[1] || "";
  const floorSlug = pathParts[1];
  const hallSlug = pathParts[2];
  const exhibitSlug = pathParts[3];

  const isAdminPage = page === "admin";
  const isAboutPage = page === "about";
  const isHallsPage = page === "halls";
  const isEducationPage = page === "education";
  const isArVrPage = page === "vr-ar" || page === "ar-vr";
  const isPublicationsPage = page === "publications";
  const isPublicationDetailPage = page === "publication";
  const isTransparencyPage = page === "transparency";
  const isTicketPage = page === "ticket";
  const isHallDetailPage = page === "hall";
  const isExhibitDetailPage = page === "exhibit";

  const navigate = (path) => {
    window.history.pushState({}, "", path);
    setMenuOpen(false);
    setRouteTick((value) => value + 1);
    setTimeout(() => {
      const hash = window.location.hash.replace("#", "");
      if (hash) {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 80);
  };

  useEffect(() => {
    const onPop = () => setRouteTick((value) => value + 1);
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("popstate", onPop);
    window.addEventListener("scroll", onScroll);
    onScroll();

    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const start = Date.now();
    const finishLoading = () => {
      const elapsed = Date.now() - start;
      window.setTimeout(
        () => mounted && setLoading(false),
        Math.max(0, 850 - elapsed)
      );
    };

    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (!mounted) return;
      setAuthUser(user);
      const role = window.localStorage.getItem(AUTH_ROLE_KEY);
      setAdminLoggedIn(Boolean(user && role === "admin"));
      setUserLoggedIn(Boolean(user && role === "user"));
    });

    const dataRef = ref(db, "museumData");
    const unsubscribe = onValue(
      dataRef,
      (snapshot) => {
        if (!mounted) return;
        const localSaved = readLocalData();
        const nextData = snapshot.exists()
          ? safeData(snapshot.val())
          : safeData(localSaved || defaultData);
        const localTickets = readLocalTickets().map(normalizeTicket);
        const mergedData = {
          ...nextData,
          ticketRequests: mergeTickets(nextData.ticketRequests, localTickets),
        };
        setData(mergedData);
        writeLocalData(mergedData);
        setDbStatus(
          snapshot.exists()
            ? "Firebase өгөгдөл уншигдлаа."
            : "Firebase өгөгдөл хоосон тул local fallback ашиглаж байна."
        );
        setDbError("");
        finishLoading();
      },
      (error) => {
        console.error("Firebase read error:", error);
        if (!mounted) return;
        const localTickets = readLocalTickets().map(normalizeTicket);
        const localData = safeData(readLocalData() || defaultData);
        setData({
          ...localData,
          ticketRequests: mergeTickets(localData.ticketRequests, localTickets),
        });
        setDbStatus("Local fallback идэвхтэй.");
        setDbError(
          "Firebase database унших боломжгүй байна. Local fallback ашиглаж байна. Database rules болон Firebase тохиргоог шалгана уу."
        );
        finishLoading();
      }
    );

    const hardStop = window.setTimeout(() => setLoading(false), 3200);
    return () => {
      mounted = false;
      window.clearTimeout(hardStop);
      unsubscribe();
      authUnsubscribe();
    };
  }, []);

  useEffect(() => {
    document.title = normalizeSeo(data.seo || {}).title;
  }, [data.museumName, data.seo]);

  useEffect(() => {
    const seo = normalizeSeo(data.seo || {});
    document.title = seo.title;
    upsertMeta('meta[name="description"]', {
      name: "description",
      content: seo.description,
    });
    upsertMeta('meta[name="keywords"]', {
      name: "keywords",
      content: seo.keywords,
    });
    upsertMeta('meta[property="og:title"]', {
      property: "og:title",
      content: seo.ogTitle,
    });
    upsertMeta('meta[property="og:description"]', {
      property: "og:description",
      content: seo.ogDescription,
    });
    upsertMeta('meta[property="og:image"]', {
      property: "og:image",
      content: seo.ogImage,
    });
    upsertMeta('meta[property="og:type"]', {
      property: "og:type",
      content: "website",
    });
  }, [data.seo]);

  const saveData = async (newData, options = {}) => {
    const fixed = safeData(newData);
    setData(fixed);
    writeLocalData(fixed);
    setSaving(true);
    try {
      await set(ref(db, "museumData"), fixed);
      setDbStatus("Өөрчлөлт Firebase database болон local fallback руу хадгалагдлаа.");
      setDbError("");
      return { ok: true, data: fixed };
    } catch (error) {
      console.error("Firebase write error:", error);
      const message =
        "Firebase хадгалалт амжилтгүй. Өөрчлөлт localStorage fallback-д хадгалагдсан. Admin нэвтрэлт, database rules, Firebase project тохиргоог шалгана уу.";
      setDbStatus("Local fallback-д хадгаллаа.");
      setDbError(message);
      if (!options.silent) {
        window.setTimeout(() => setDbError(message), 0);
      }
      return { ok: false, error, data: fixed };
    } finally {
      setSaving(false);
    }
  };

  const uploadToCloudinary = async (file, type = "image") => {
    if (!file) return null;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    setUploading(file.name);

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${type}/upload`,
        { method: "POST", body: formData }
      );
      const result = await res.json();
      if (!res.ok || !result.secure_url) {
        setDbError(result.error?.message || "Файл байршуулж чадсангүй.");
        return null;
      }
      return result.secure_url;
    } catch (error) {
      console.error(error);
      setDbError("Upload холболтын алдаа гарлаа.");
      return null;
    } finally {
      setUploading("");
    }
  };

  const uploadMany = async (files, type) => {
    const uploaded = [];
    for (const file of Array.from(files || [])) {
      const url = await uploadToCloudinary(file, type);
      if (url) uploaded.push(url);
    }
    return uploaded;
  };

  const updateField = (field, value) => saveData({ ...data, [field]: value });
  const updateNested = (parent, field, value) =>
    saveData({ ...data, [parent]: { ...data[parent], [field]: value } });

  const loginWithRole = async (role) => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      window.localStorage.setItem(AUTH_ROLE_KEY, role);
      setAdminLoggedIn(role === "admin");
      setUserLoggedIn(role === "user");
      setDbError("");
      navigate(role === "admin" ? "/admin" : "/");
    } catch (error) {
      console.error(error);
      setDbError("Нэвтрэх мэдээлэл буруу эсвэл Firebase Auth тохиргоо идэвхгүй байна.");
    }
  };

  const logout = async () => {
    await signOut(auth);
    window.localStorage.removeItem(AUTH_ROLE_KEY);
    setAdminLoggedIn(false);
    setUserLoggedIn(false);
    setAuthUser(null);
    navigate("/");
  };

  const totalHalls = useMemo(
    () =>
      data.floors.reduce(
        (sum, floor) => sum + safeArray(floor.halls).length,
        0
      ),
    [data.floors]
  );

  const totalExhibits = useMemo(
    () =>
      data.floors.reduce(
        (sum, floor) =>
          sum +
          safeArray(floor.halls).reduce(
            (hallSum, hall) => hallSum + safeArray(hall.exhibits).length,
            0
          ),
        0
      ),
    [data.floors]
  );

  const unreadNotifications = useMemo(
    () => safeArray(data.notifications).filter((item) => !item.read).length,
    [data.notifications]
  );

  const hallDetail = useMemo(() => {
    if (!isHallDetailPage) return null;
    const floorIndex = Number(floorSlug);
    const hallIndex = Number(hallSlug);
    const floor = data.floors[floorIndex];
    const hall = floor?.halls?.[hallIndex];
    if (!floor || !hall) return null;
    return { floor, hall, floorIndex, hallIndex };
  }, [data.floors, floorSlug, hallSlug, isHallDetailPage, routeTick]);

  const exhibitDetail = useMemo(() => {
    if (!isExhibitDetailPage) return null;
    if (hallSlug === undefined && exhibitSlug === undefined) {
      const exhibitId = decodeURIComponent(floorSlug || "");
      for (let fIndex = 0; fIndex < data.floors.length; fIndex += 1) {
        const floor = data.floors[fIndex];
        for (let hIndex = 0; hIndex < safeArray(floor?.halls).length; hIndex += 1) {
          const hall = floor.halls[hIndex];
          const eIndex = safeArray(hall?.exhibits).findIndex(
            (item) => textValue(item?.id) === exhibitId
          );
          if (eIndex >= 0) {
            return {
              floor,
              hall,
              exhibit: hall.exhibits[eIndex],
              floorIndex: fIndex,
              hallIndex: hIndex,
              exhibitIndex: eIndex,
            };
          }
        }
      }
      return null;
    }
    const floorIndex = Number(floorSlug);
    const hallIndex = Number(hallSlug);
    const exhibitIndex = Number(exhibitSlug);
    const floor = data.floors[floorIndex];
    const hall = floor?.halls?.[hallIndex];
    const exhibit = hall?.exhibits?.[exhibitIndex];
    if (!floor || !hall || !exhibit) return null;
    return { floor, hall, exhibit, floorIndex, hallIndex, exhibitIndex };
  }, [
    data.floors,
    floorSlug,
    hallSlug,
    exhibitSlug,
    isExhibitDetailPage,
    routeTick,
  ]);

  const publicationDetail = useMemo(() => {
    if (!isPublicationDetailPage) return null;
    const id = decodeURIComponent(floorSlug || "");
    return safeArray(data.publications).find((item) => item.id === id) || null;
  }, [data.publications, floorSlug, isPublicationDetailPage, routeTick]);

  const addFloor = () =>
    saveData({
      ...data,
      floors: [
        ...data.floors,
        {
          name: `${data.floors.length + 1} давхар`,
          title: "Шинэ давхар",
          desc: "",
          image: "",
          videos: [],
          halls: [],
        },
      ],
    });

  const updateFloor = (floorIndex, field, value) => {
    const floors = data.floors.map((floor, index) =>
      index === floorIndex ? { ...floor, [field]: value } : floor
    );
    saveData({ ...data, floors });
  };

  const deleteFloor = (floorIndex) => {
    if (!window.confirm("Энэ давхрыг устгах уу?")) return;
    saveData({
      ...data,
      floors: data.floors.filter((_, index) => index !== floorIndex),
    });
  };

  const addHall = (floorIndex) => {
    const floors = data.floors.map((floor, index) =>
      index === floorIndex
        ? {
            ...floor,
            halls: [
              ...safeArray(floor.halls),
              {
                title: "Шинэ танхим",
                category: "Танхим",
                shortDesc: "",
                desc: "",
                exhibits: [],
                ...emptyMedia,
              },
            ],
          }
        : floor
    );
    saveData({ ...data, floors });
  };

  const updateHall = (floorIndex, hallIndex, field, value) => {
    const floors = data.floors.map((floor, index) =>
      index !== floorIndex
        ? floor
        : {
            ...floor,
            halls: safeArray(floor.halls).map((hall, hIndex) =>
              hIndex === hallIndex ? { ...hall, [field]: value } : hall
            ),
          }
    );
    saveData({ ...data, floors });
  };

  const deleteHall = (floorIndex, hallIndex) => {
    if (!window.confirm("Энэ танхимыг устгах уу?")) return;
    const floors = data.floors.map((floor, index) =>
      index !== floorIndex
        ? floor
        : {
            ...floor,
            halls: safeArray(floor.halls).filter(
              (_, hIndex) => hIndex !== hallIndex
            ),
          }
    );
    saveData({ ...data, floors });
  };

  const addExhibit = (floorIndex, hallIndex) => {
    const floors = data.floors.map((floor, index) =>
      index !== floorIndex
        ? floor
        : {
            ...floor,
            halls: safeArray(floor.halls).map((hall, hIndex) =>
              hIndex !== hallIndex
                ? hall
                : {
                    ...hall,
                    exhibits: [
                      ...safeArray(hall.exhibits),
                      {
                        id: createId(),
                        title: "Шинэ үзмэр",
                        category: "Үзмэр",
                        period: "",
                        material: "",
                        foundPlace: "",
                        shortDesc: "",
                        desc: "",
                        ...emptyMedia,
                      },
                    ],
                  }
            ),
          }
    );
    saveData({ ...data, floors });
  };

  const updateExhibit = (floorIndex, hallIndex, exhibitIndex, field, value) => {
    const floors = data.floors.map((floor, index) =>
      index !== floorIndex
        ? floor
        : {
            ...floor,
            halls: safeArray(floor.halls).map((hall, hIndex) =>
              hIndex !== hallIndex
                ? hall
                : {
                    ...hall,
                    exhibits: safeArray(hall.exhibits).map((exhibit, eIndex) =>
                      eIndex === exhibitIndex
                        ? { ...exhibit, [field]: value }
                        : exhibit
                    ),
                  }
            ),
          }
    );
    saveData({ ...data, floors });
  };

  const deleteExhibit = (floorIndex, hallIndex, exhibitIndex) => {
    if (!window.confirm("Энэ үзмэрийг устгах уу?")) return;
    const floors = data.floors.map((floor, index) =>
      index !== floorIndex
        ? floor
        : {
            ...floor,
            halls: safeArray(floor.halls).map((hall, hIndex) =>
              hIndex !== hallIndex
                ? hall
                : {
                    ...hall,
                    exhibits: safeArray(hall.exhibits).filter(
                      (_, eIndex) => eIndex !== exhibitIndex
                    ),
                  }
            ),
          }
    );
    saveData({ ...data, floors });
  };

  const addItem = (key, item) =>
    saveData({ ...data, [key]: [item, ...safeArray(data[key])] });

  const updateItem = (key, index, field, value) =>
    saveData({
      ...data,
      [key]: safeArray(data[key]).map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    });

  const deleteItem = (key, index) =>
    saveData({
      ...data,
      [key]: safeArray(data[key]).filter((_, itemIndex) => itemIndex !== index),
    });

  const appendHallMedia = (floorIndex, hallIndex, field, urls) => {
    const hall = data.floors[floorIndex]?.halls?.[hallIndex];
    updateHall(floorIndex, hallIndex, field, [
      ...safeArray(hall?.[field]),
      ...urls,
    ]);
  };

  const appendExhibitMedia = (floorIndex, hallIndex, exhibitIndex, field, urls) => {
    const exhibit =
      data.floors[floorIndex]?.halls?.[hallIndex]?.exhibits?.[exhibitIndex];
    updateExhibit(floorIndex, hallIndex, exhibitIndex, field, [
      ...safeArray(exhibit?.[field]),
      ...urls,
    ]);
  };

  const uploadLogo = async (file) => {
    const url = await uploadToCloudinary(file, "image");
    if (url) updateField("logo", url);
  };
  const uploadHero = async (field, file) => {
    const url = await uploadToCloudinary(file, "image");
    if (url) updateField(field, url);
  };
  const uploadLoaderMedia = async (field, file, type) => {
    const url = await uploadToCloudinary(file, type);
    if (url) updateNested("loader", field, url);
  };
  const uploadFloorImage = async (floorIndex, file) => {
    const url = await uploadToCloudinary(file, "image");
    if (url) updateFloor(floorIndex, "image", url);
  };
  const uploadFloorVideos = async (floorIndex, files) => {
    const urls = await uploadMany(files, "video");
    if (!urls.length) return;
    const floor = data.floors[floorIndex];
    updateFloor(floorIndex, "videos", [...safeArray(floor.videos), ...urls]);
  };
  const uploadHallMedia = async (floorIndex, hallIndex, field, files, type) => {
    const urls = await uploadMany(files, type);
    if (urls.length) appendHallMedia(floorIndex, hallIndex, field, urls);
  };
  const uploadExhibitMedia = async (
    floorIndex,
    hallIndex,
    exhibitIndex,
    field,
    files,
    type
  ) => {
    const urls = await uploadMany(files, type);
    if (urls.length) appendExhibitMedia(floorIndex, hallIndex, exhibitIndex, field, urls);
  };

  const deleteMedia = (scope, indexes, field, mediaIndex) => {
    if (scope === "floor") {
      const [floorIndex] = indexes;
      const floor = data.floors[floorIndex];
      updateFloor(
        floorIndex,
        field,
        safeArray(floor?.[field]).filter((_, index) => index !== mediaIndex)
      );
    }
    if (scope === "hall") {
      const [floorIndex, hallIndex] = indexes;
      const hall = data.floors[floorIndex]?.halls?.[hallIndex];
      updateHall(
        floorIndex,
        hallIndex,
        field,
        safeArray(hall?.[field]).filter((_, index) => index !== mediaIndex)
      );
    }
    if (scope === "exhibit") {
      const [floorIndex, hallIndex, exhibitIndex] = indexes;
      const exhibit =
        data.floors[floorIndex]?.halls?.[hallIndex]?.exhibits?.[exhibitIndex];
      updateExhibit(
        floorIndex,
        hallIndex,
        exhibitIndex,
        field,
        safeArray(exhibit?.[field]).filter((_, index) => index !== mediaIndex)
      );
    }
  };

  const addUrlMedia = (scope, indexes, field, url) => {
    const cleanUrl = url.trim();
    if (!cleanUrl) return;
    if (scope === "floor") {
      const [floorIndex] = indexes;
      const floor = data.floors[floorIndex];
      updateFloor(floorIndex, field, [...safeArray(floor?.[field]), cleanUrl]);
    }
    if (scope === "hall") {
      appendHallMedia(indexes[0], indexes[1], field, [cleanUrl]);
    }
    if (scope === "exhibit") {
      appendExhibitMedia(indexes[0], indexes[1], indexes[2], field, [cleanUrl]);
    }
  };

  const uploadEducationMedia = async (programIndex, field, files, type) => {
    const urls = await uploadMany(files, type);
    if (!urls.length) return;
    const program = data.educationPrograms[programIndex];
    updateItem("educationPrograms", programIndex, field, [
      ...safeArray(program?.[field]),
      ...urls,
    ]);
  };

  const uploadArVrMedia = async (index, field, file, type) => {
    const url = await uploadToCloudinary(file, type);
    if (url) updateItem("arVrItems", index, field, url);
  };

  const uploadSeoImage = async (file) => {
    const url = await uploadToCloudinary(file, "image");
    if (url) updateNested("seo", "ogImage", url);
  };

  const uploadTimelineImage = async (index, file) => {
    const url = await uploadToCloudinary(file, "image");
    if (url) updateItem("timelineSlides", index, "image", url);
  };

  const updateAboutPage = (section, field, value) =>
    saveData({
      ...data,
      aboutPages: {
        ...data.aboutPages,
        [section]: {
          ...data.aboutPages[section],
          [field]: value,
        },
      },
    });

  const uploadAboutImages = async (section, files) => {
    const urls = await uploadMany(files, "image");
    if (!urls.length) return;
    const pageData = data.aboutPages[section] || {};
    updateAboutPage(section, "images", [...safeArray(pageData.images), ...urls]);
  };

  const uploadAboutVideo = async (section, file) => {
    const url = await uploadToCloudinary(file, "video");
    if (url) updateAboutPage(section, "video", url);
  };

  const uploadAboutDirectorImage = async (section, file) => {
    const url = await uploadToCloudinary(file, "image");
    if (url) updateAboutPage(section, "image", url);
  };

  const deleteAboutImage = (section, imageIndex) => {
    const pageData = data.aboutPages[section] || {};
    updateAboutPage(
      section,
      "images",
      safeArray(pageData.images).filter((_, index) => index !== imageIndex)
    );
  };

  const uploadPublicationCover = async (index, file) => {
    const url = await uploadToCloudinary(file, "image");
    if (url) updateItem("publications", index, "coverImage", url);
  };

  const uploadPublicationFiles = async (index, files) => {
    const urls = await uploadMany(files, "raw");
    if (!urls.length) return;
    const publication = data.publications[index];
    updateItem("publications", index, "files", [
      ...safeArray(publication?.files),
      ...urls.map((url) => normalizeFileItem(url)),
    ]);
  };

  const uploadTransparencyFiles = async (index, files) => {
    const urls = await uploadMany(files, "raw");
    if (!urls.length) return;
    const item = data.transparency[index];
    updateItem("transparency", index, "files", [
      ...safeArray(item?.files),
      ...urls.map((url) => normalizeFileItem(url)),
    ]);
  };

  const addTicketRequest = async (request) => {
    const ticketType = safeArray(data.paymentSettings.ticketTypes).find(
      (item) => item.id === request.ticketTypeId || item.name === request.ticketType
    ) || safeArray(data.paymentSettings.ticketTypes)[0] || normalizeTicketType({});
    const quantity = Math.max(1, Number(request.quantity || request.guests || 1));
    const unitPrice = Number(ticketType.price || request.unitPrice || 0);
    const totalAmount = unitPrice * quantity;
    const createdAt = new Date().toISOString();
    const nextRequest = normalizeTicket({
      ...request,
      id: createId(),
      ticketType: ticketType.name,
      ticketTypeId: ticketType.id,
      quantity,
      guests: String(quantity),
      unitPrice,
      totalAmount,
      currency: data.paymentSettings.currency || "MNT",
      status: "pending",
      paymentStatus: "pending",
      paymentMode: data.paymentSettings.mode,
      source: "firebase",
      createdAt,
    });
    let invoice = null;
    try {
      invoice = await createQPayInvoice(nextRequest, data.paymentSettings.mode);
    } catch (error) {
      console.error("QPay invoice placeholder:", error);
      invoice = {
        invoiceId: "",
        qrPayload: "",
        paymentUrl: "",
      };
    }
    const orderWithInvoice = normalizeTicket({
      ...nextRequest,
      invoiceId: invoice?.invoiceId,
      qpayPayload: invoice?.qrPayload,
      paymentUrl: invoice?.paymentUrl,
    });
    const notification = normalizeNotification({
      id: createId(),
      type: "ticket",
      title: "New ticket request",
      orderId: orderWithInvoice.id,
      customerName: orderWithInvoice.name,
      phone: orderWithInvoice.phone,
      email: orderWithInvoice.email,
      contact: orderWithInvoice.phone || orderWithInvoice.email,
      ticketType: orderWithInvoice.ticketType,
      quantity: orderWithInvoice.quantity,
      totalAmount: orderWithInvoice.totalAmount,
      paymentStatus: orderWithInvoice.paymentStatus,
      createdAt,
      read: false,
    });
    const nextData = {
      ...data,
      ticketRequests: [orderWithInvoice, ...safeArray(data.ticketRequests)],
      notifications: [notification, ...safeArray(data.notifications)],
    };
    setData(nextData);
    writeLocalData(safeData(nextData));

    try {
      await set(ref(db, "museumData"), safeData(nextData));
      setDbStatus("Тасалбарын хүсэлт Firebase руу хадгалагдлаа.");
      setDbError("");
      return { ok: true, fallback: false, order: orderWithInvoice };
    } catch (error) {
      console.error("Ticket Firebase fallback:", error);
      const localRequest = { ...orderWithInvoice, source: "local" };
      const localTickets = mergeTickets([localRequest], readLocalTickets());
      writeLocalTickets(localTickets);
      setData({
        ...nextData,
        ticketRequests: mergeTickets(nextData.ticketRequests, localTickets),
      });
      setDbStatus("Тасалбарын хүсэлт таны төхөөрөмж дээр хадгалагдлаа.");
      setDbError(
        "Firebase database бичих эрхгүй байна. Admin хэсэгт database rules болон Firebase Auth тохиргоог шалгана уу."
      );
      return { ok: true, fallback: true, order: localRequest };
    }
  };

  const updateTicketOrder = async (orderId, changes) => {
    const updatedTickets = safeArray(data.ticketRequests).map((order) =>
      order.id === orderId ? normalizeTicket({ ...order, ...changes }) : order
    );
    const updatedNotifications = safeArray(data.notifications).map((notification) =>
      notification.orderId === orderId
        ? normalizeNotification({
            ...notification,
            paymentStatus: changes.paymentStatus || notification.paymentStatus,
          })
        : notification
    );
    return saveData({
      ...data,
      ticketRequests: updatedTickets,
      notifications: updatedNotifications,
    });
  };

  const markTicketPaid = (orderId) =>
    updateTicketOrder(orderId, {
      status: "paid",
      paymentStatus: "paid",
      paidAt: new Date().toISOString(),
    });

  const cancelTicketOrder = (orderId) =>
    updateTicketOrder(orderId, {
      status: "cancelled",
      paymentStatus: "cancelled",
      cancelledAt: new Date().toISOString(),
    });

  const markNotificationRead = (notificationId) =>
    saveData({
      ...data,
      notifications: safeArray(data.notifications).map((notification) =>
        notification.id === notificationId ? { ...notification, read: true } : notification
      ),
    });

  const createBackup = () => {
    window.localStorage.setItem("museumDataBackup", JSON.stringify(data));
    setDbStatus("Browser backup үүслээ.");
  };

  const restoreBackup = () => {
    const backup = window.localStorage.getItem("museumDataBackup");
    if (!backup) {
      setDbError("Backup олдсонгүй.");
      return;
    }
    try {
      saveData(JSON.parse(backup));
    } catch {
      setDbError("Backup файл унших боломжгүй байна.");
    }
  };

  const downloadBackup = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `museum-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (loading && data.loader.enabled && !isAdminPage) {
    return <LoadingScreen loader={data.loader} museumName={data.museumName} />;
  }

  if (isAdminPage) {
    return (
      <AdminPage
        data={data}
        adminLoggedIn={adminLoggedIn}
        unreadNotifications={unreadNotifications}
        authUser={authUser}
        email={email}
        password={password}
        setEmail={setEmail}
        setPassword={setPassword}
        loginWithRole={loginWithRole}
        logout={logout}
        saving={saving}
        uploading={uploading}
        dbStatus={dbStatus}
        dbError={dbError}
        navigate={navigate}
        totalHalls={totalHalls}
        totalExhibits={totalExhibits}
        updateField={updateField}
        updateNested={updateNested}
        uploadLogo={uploadLogo}
        uploadHero={uploadHero}
        uploadLoaderMedia={uploadLoaderMedia}
        addFloor={addFloor}
        updateFloor={updateFloor}
        deleteFloor={deleteFloor}
        addHall={addHall}
        updateHall={updateHall}
        deleteHall={deleteHall}
        addExhibit={addExhibit}
        updateExhibit={updateExhibit}
        deleteExhibit={deleteExhibit}
        uploadFloorImage={uploadFloorImage}
        uploadFloorVideos={uploadFloorVideos}
        uploadHallMedia={uploadHallMedia}
        uploadExhibitMedia={uploadExhibitMedia}
        deleteMedia={deleteMedia}
        addUrlMedia={addUrlMedia}
        addItem={addItem}
        updateItem={updateItem}
        deleteItem={deleteItem}
        markTicketPaid={markTicketPaid}
        cancelTicketOrder={cancelTicketOrder}
        markNotificationRead={markNotificationRead}
        uploadEducationMedia={uploadEducationMedia}
        uploadArVrMedia={uploadArVrMedia}
        uploadSeoImage={uploadSeoImage}
        uploadTimelineImage={uploadTimelineImage}
        updateAboutPage={updateAboutPage}
        uploadAboutImages={uploadAboutImages}
        uploadAboutVideo={uploadAboutVideo}
        uploadAboutDirectorImage={uploadAboutDirectorImage}
        deleteAboutImage={deleteAboutImage}
        uploadPublicationCover={uploadPublicationCover}
        uploadPublicationFiles={uploadPublicationFiles}
        uploadTransparencyFiles={uploadTransparencyFiles}
        createBackup={createBackup}
        restoreBackup={restoreBackup}
        downloadBackup={downloadBackup}
      />
    );
  }

  return (
    <div className="App">
      <PublicSiteHeader
        data={data}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        navigate={navigate}
        scrolled={scrolled}
        page={page}
      />

      {isTicketPage ? (
        <TicketPage
          data={data}
          subPage={subPage}
          addTicketRequest={addTicketRequest}
          markTicketPaid={markTicketPaid}
          navigate={navigate}
        />
      ) : isAboutPage ? (
        <AboutPage data={data} section={subPage} navigate={navigate} />
      ) : isEducationPage ? (
        <EducationPage data={data} navigate={navigate} />
      ) : isArVrPage ? (
        <ArVrPage data={data} navigate={navigate} />
      ) : isPublicationDetailPage ? (
        <PublicationDetailPage item={publicationDetail} navigate={navigate} />
      ) : isPublicationsPage ? (
        <PublicationsPage data={data} navigate={navigate} />
      ) : isTransparencyPage ? (
        <TransparencyPage data={data} />
      ) : isHallDetailPage ? (
        <HallDetailPage detail={hallDetail} navigate={navigate} />
      ) : isExhibitDetailPage ? (
        <ExhibitDetailPage detail={exhibitDetail} navigate={navigate} />
      ) : isHallsPage ? (
        <HallsPage
          data={data}
          selectedFloor={selectedFloor}
          setSelectedFloor={setSelectedFloor}
          navigate={navigate}
        />
      ) : (
        <HomePage
          data={data}
          totalHalls={totalHalls}
          totalExhibits={totalExhibits}
          navigate={navigate}
        />
      )}

      <Footer data={data} navigate={navigate} />
    </div>
  );
}

function LoadingScreen({ loader, museumName }) {
  return (
    <main className="loaderScreen">
      {loader.video ? (
        <video
          className="loaderMedia"
          src={loader.video}
          autoPlay
          muted
          loop
          playsInline
        />
      ) : loader.image ? (
        <img className="loaderMedia" src={loader.image} alt={museumName} />
      ) : null}
      <div className="loaderPanel">
        <div className="loaderMark">
          <Sparkles size={28} />
        </div>
        <h1>{loader.text}</h1>
        <p>{loader.subText}</p>
        <div className="loaderBar">
          <span />
        </div>
      </div>
    </main>
  );
}

function PublicSiteHeader({
  data,
  menuOpen,
  setMenuOpen,
  navigate,
  scrolled,
  page,
}) {
  const aboutItems = [
    { label: "Мэндчилгээ", path: "/about/greeting" },
    { label: "Музейн бүтэц", path: "/about/structure" },
    { label: "Зохион байгуулалт", path: "/about/organization" },
    { label: "Товч танилцуулга", path: "/about/intro" },
  ];
  const navItems = [
    { label: "ТАНХИМ", path: "/halls", key: "halls", icon: Layers3 },
    {
      label: "БОЛОВСРОЛЫН ХӨТӨЛБӨР",
      path: "/education",
      key: "education",
      icon: GraduationCap,
    },
    { label: "НОМ ХЭВЛЭЛ", path: "/publications", key: "publications", icon: BookOpen },
    { label: "ИЛ ТОД БАЙДАЛ", path: "/transparency", key: "transparency", icon: FileText },
    { label: "ЦАХИМ ТАСАЛБАР", path: "/ticket", key: "ticket", icon: Ticket },
    { label: "VR/AR ҮЗМЭР", path: "/vr-ar", key: "vr-ar", icon: Globe2 },
  ];

  return (
    <header className={`siteHeader ${scrolled ? "scrolled" : ""}`}>
      <button className="brand asButton" onClick={() => navigate("/")}>
        <span className="brandMark" style={{ background: data.logoBg }}>
          {data.logo ? <img src={data.logo} alt={data.museumName} /> : "ХМ"}
        </span>
        <span>
          <strong>{data.museumName}</strong>
          <small>{data.slogan}</small>
        </span>
      </button>

      <button
        className="iconButton menuButton"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Цэс"
      >
        {menuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      <nav className={menuOpen ? "nav open" : "nav"}>
        <div className="navDropdown">
          <button className={page === "about" ? "active" : ""} type="button">
            <Building2 size={17} />
            БИДНИЙ ТУХАЙ
            <ChevronDown size={15} />
          </button>
          <div className="dropdownMenu">
            {aboutItems.map((item) => (
              <button key={item.path} onClick={() => navigate(item.path)} type="button">
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            page === item.key || (item.key === "vr-ar" && page === "ar-vr");
          return (
            <button
              key={item.key}
              className={active ? "active" : ""}
              onClick={() => navigate(item.path)}
              type="button"
            >
              <Icon size={17} />
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}

function HomePage({ data, totalHalls, totalExhibits, navigate }) {
  const featuredHalls = data.floors
    .flatMap((floor, floorIndex) =>
      safeArray(floor.halls).map((hall, hallIndex) => ({
        floor,
        hall,
        floorIndex,
        hallIndex,
      }))
    )
    .slice(0, 4);

  return (
    <main>
      <section
        className="hero"
        style={{ backgroundImage: `url("${data.heroImage || museumImages.hero}")` }}
      >
        <div className="heroContent">
          <span className="eyebrow">
            <Sparkles size={16} />
            {data.slogan}
          </span>
          <h1>{data.heroTitle}</h1>
          <p>{data.heroText}</p>
          <div className="heroActions">
            <button className="primaryButton" onClick={() => navigate("/ticket")}>
              <Ticket size={18} />
              Тасалбар захиалах
            </button>
            <button className="ghostButton" onClick={() => navigate("/halls")}>
              <Layers3 size={18} />
              Танхим үзэх
            </button>
          </div>
        </div>
      </section>

      <section className="metricBand" aria-label="Музейн үзүүлэлт">
        <Metric value={data.floors.length} label="Давхар" icon={Building2} />
        <Metric value={totalHalls} label="Танхим" icon={Layers3} />
        <Metric value={totalExhibits} label="Үзмэр" icon={Sparkles} />
        <Metric
          value={safeArray(data.educationPrograms).length}
          label="Хөтөлбөр"
          icon={GraduationCap}
        />
      </section>

      <section className="sectionSplit aboutOnly" id="about">
        <div>
          <span className="sectionKicker">Танилцуулга</span>
          <h2>Өв соёлыг судалгаа, боловсрол, орчин үеийн туршлагатай холбох орон зай</h2>
        </div>
        <div>
          <p>{data.about}</p>
        </div>
      </section>

      <section className="sectionWrap">
        <div className="sectionHeader">
          <div>
            <span className="sectionKicker">Explore</span>
            <h2>Онцлох танхимууд</h2>
          </div>
          <button className="textButton" onClick={() => navigate("/halls")}>
            Бүгдийг харах
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="hallGrid">
          {featuredHalls.map(({ floor, hall, floorIndex, hallIndex }) => (
            <button
              className="hallCard"
              key={`${floorIndex}-${hallIndex}`}
              onClick={() => navigate(`/hall/${floorIndex}/${hallIndex}`)}
            >
              <img
                src={hall.images?.[0] || floor.image || museumImages.halls}
                alt={hall.title}
              />
              <span>{floor.name}</span>
              <h3>{hall.title}</h3>
              <p>{hall.shortDesc || hall.desc}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="sectionWrap">
        <div className="sectionHeader">
          <div>
            <span className="sectionKicker">Education</span>
            <h2>Боловсролын хөтөлбөр</h2>
          </div>
          <button className="textButton" onClick={() => navigate("/education")}>
            Хөтөлбөрүүд
            <ChevronRight size={18} />
          </button>
        </div>
        <EducationGrid programs={data.educationPrograms} />
      </section>

      <section className="sectionWrap compactTop">
        <div className="sectionHeader">
          <div>
            <span className="sectionKicker">Immersive</span>
            <h2>VR/AR үзмэр</h2>
          </div>
          <button className="textButton" onClick={() => navigate("/vr-ar")}>
            Үзмэр нээх
            <ChevronRight size={18} />
          </button>
        </div>
        <ArVrGrid items={data.arVrItems} compact />
      </section>

      <VisitSection visit={data.visit} />
      <NewsSection news={data.news} />
    </main>
  );
}

function Metric({ value, label, icon: Icon }) {
  return (
    <div className="metricItem">
      <Icon size={22} />
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function PageHero({ title, text, image, eyebrow = "Smart Museum" }) {
  return (
    <section
      className="pageHero"
      style={{ backgroundImage: `url("${image || museumImages.halls}")` }}
    >
      <div>
        <span className="eyebrow">
          <Sparkles size={16} />
          {eyebrow}
        </span>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
    </section>
  );
}

function sortPublished(items) {
  return safeArray(items)
    .filter((item) => item?.published !== false)
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
}

function RichText({ text }) {
  return (
    <div className="richText">
      {textValue(text)
        .split(/\n{2,}/)
        .filter(Boolean)
        .map((paragraph, index) => (
          <p key={`${paragraph.slice(0, 18)}-${index}`}>{paragraph}</p>
        ))}
    </div>
  );
}

function AboutMedia({ content }) {
  const images = mediaList(content.images);
  return (
    <>
      {content.video && (
        <div className="aboutVideo">
          {isYoutube(content.video) ? (
            <iframe
              title={content.title}
              src={youtubeEmbed(content.video)}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <video src={content.video} controls playsInline />
          )}
        </div>
      )}
      {images.length > 0 && (
        <div className="aboutImageGrid">
          {images.map((image, index) => (
            <img src={image} alt={`${content.title} ${index + 1}`} key={`${image}-${index}`} />
          ))}
        </div>
      )}
    </>
  );
}

function AboutPage({ data, section, navigate }) {
  const current = section || "greeting";
  const content = data.aboutPages[current] || data.aboutPages.greeting;
  if (content?.published === false) {
    return <NotFound navigate={navigate} title="Мэдээлэл нийтлэгдээгүй байна" />;
  }
  if (current === "structure") {
    return <StructurePage content={data.aboutPages.structure} />;
  }
  if (current === "organization") {
    return <OrganizationPage content={data.aboutPages.organization} />;
  }
  if (current === "intro") {
    return (
      <IntroTimelinePage
        content={data.aboutPages.intro}
        slides={data.timelineSlides}
        navigate={navigate}
      />
    );
  }
  return <GreetingPage content={data.aboutPages.greeting} />;
}

function GreetingPage({ content }) {
  return (
    <main>
      <PageHero
        title={content.title}
        text={content.subtitle || "Музейн алсын хараа, үнэт зүйл, олон нийтэд чиглэсэн үйл ажиллагааны мэндчилгээ."}
        image={content.image || museumImages.gallery}
        eyebrow="Бидний тухай"
      />
      <section className="directorLayout">
        <div className="directorImage">
          <img src={content.image || museumImages.gallery} alt={content.directorName} />
        </div>
        <article className="articlePanel">
          <span className="sectionKicker">{content.role}</span>
          <h2>{content.directorName}</h2>
          <RichText text={content.body} />
        </article>
      </section>
      <section className="articleShell compactTop">
        <AboutMedia content={content} />
      </section>
    </main>
  );
}

function StructurePage({ content }) {
  return (
    <main>
      <section className="articleHero">
        <span className="sectionKicker">Бидний тухай</span>
        <h1>{content.title || "МУЗЕЙН БҮТЭЦ"}</h1>
        {content.subtitle && <p>{content.subtitle}</p>}
      </section>
      <section className="articleShell">
        <article className="articlePanel largeText">
          <RichText text={content.body} />
        </article>
        <AboutMedia content={content} />
      </section>
    </main>
  );
}

function OrganizationPage({ content }) {
  return (
    <main>
      <section className="articleHero">
        <span className="sectionKicker">Бидний тухай</span>
        <h1>{content.title}</h1>
        <p>{content.subtitle || content.description}</p>
      </section>
      <section className="sectionWrap compactTop">
        <article className="articlePanel orgIntro">
          <RichText text={content.description} />
        </article>
        <div className="departmentGrid">
          {safeArray(content.departments).map((department, index) => (
            <article className="departmentCard" key={`${department}-${index}`}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{department}</h3>
            </article>
          ))}
        </div>
        <AboutMedia content={content} />
      </section>
    </main>
  );
}

function IntroTimelinePage({ content, slides, navigate }) {
  const timeline = safeArray(slides).length
    ? safeArray(slides)
    : defaultData.timelineSlides;
  const [current, setCurrent] = useState(0);
  const active = timeline[current] || timeline[0];

  useEffect(() => {
    if (timeline.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setCurrent((value) => (value + 1) % timeline.length);
    }, 15000);
    return () => window.clearInterval(timer);
  }, [timeline.length]);

  const move = (direction) => {
    setCurrent((value) => {
      const next = value + direction;
      if (next < 0) return timeline.length - 1;
      if (next >= timeline.length) return 0;
      return next;
    });
  };

  return (
    <main>
      <section className="articleHero">
        <span className="sectionKicker">Бидний тухай</span>
        <h1>{content.title}</h1>
        <p>{content.subtitle}</p>
      </section>
      <section className="articleShell introCopy">
        <article className="articlePanel">
          <RichText text={content.body} />
        </article>
        <AboutMedia content={content} />
      </section>
      <section className="timelineShell">
        <div className="timelineSlide">
          <div className="timelineMedia">
            <img src={active.image || museumImages.halls} alt={active.title} />
          </div>
          <article>
            <span className="timelineYear">{active.year}</span>
            <h2>{active.title}</h2>
            <p>{active.desc}</p>
            <button className="textButton" onClick={() => navigate("/halls")}>
              Танхим үзэх
              <ChevronRight size={18} />
            </button>
          </article>
        </div>
        <div className="timelineControls">
          <button onClick={() => move(-1)} type="button" aria-label="Өмнөх слайд">
            <ArrowLeft size={18} />
          </button>
          <div className="timelineDots">
            {timeline.map((slide, index) => (
              <button
                key={`${slide.year}-${index}`}
                className={index === current ? "active" : ""}
                onClick={() => setCurrent(index)}
                type="button"
                aria-label={`${slide.year} слайд`}
              />
            ))}
          </div>
          <button onClick={() => move(1)} type="button" aria-label="Дараагийн слайд">
            <ChevronRight size={18} />
          </button>
        </div>
      </section>
    </main>
  );
}

function PublicationsPage({ data, navigate }) {
  const publications = sortPublished(data.publications);
  return (
    <main>
      <PageHero
        title="Ном хэвлэл"
        text="Судалгааны эмхэтгэл, үзэсгэлэнгийн каталог, боловсролын материал болон музейн хэвлэмэл эх сурвалж."
        image={museumImages.gallery}
        eyebrow="Publications"
      />
      <section className="sectionWrap compactTop">
        <div className="publicationGrid">
          {publications.map((item, index) => (
            <button
              className="publicationCard"
              key={item.id || `${item.title}-${index}`}
              onClick={() => navigate(`/publication/${encodeURIComponent(item.id)}`)}
            >
              <img src={item.coverImage || museumImages.gallery} alt={item.title} />
              <span>{item.year || item.date || "Ном хэвлэл"}</span>
              <h2>{item.title}</h2>
              <strong>{item.category}</strong>
              <p>{item.desc}</p>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

function PublicationDetailPage({ item, navigate }) {
  if (!item || item.published === false) {
    return <NotFound navigate={navigate} title="Ном хэвлэл олдсонгүй" />;
  }

  const primaryPdf = safeArray(item.files).find((file) => file.type === "pdf");

  return (
    <main>
      <DetailHero
        eyebrow={item.category}
        title={item.title}
        text={`${item.year || item.date || ""} ${item.author ? `• ${item.author}` : ""}`}
        image={item.coverImage || museumImages.gallery}
        navigate={navigate}
      />
      <section className="publicationDetail">
        <div className="publicationCover">
          <img src={item.coverImage || museumImages.gallery} alt={item.title} />
        </div>
        <article className="articlePanel">
          <span className="sectionKicker">{item.category}</span>
          <h2>{item.title}</h2>
          <div className="metaGrid">
            <Meta label="Он" value={item.year || item.date} />
            <Meta label="Зохиогч / редактор" value={item.author} />
            <Meta label="Ангилал" value={item.category} />
          </div>
          <RichText text={item.fullDesc || item.desc} />
          <PublicationActions files={item.files} primaryPdf={primaryPdf} />
        </article>
      </section>
    </main>
  );
}

function PublicationActions({ files, primaryPdf }) {
  const list = safeArray(files);
  return (
    <div className="publicationFiles">
      <div className="qrActions">
        {primaryPdf && (
          <a className="primaryButton" href={primaryPdf.url} target="_blank" rel="noreferrer">
            <Eye size={17} />
            PDF харах
          </a>
        )}
        {list[0] && (
          <a className="ghostButton" href={list[0].url} download>
            <Download size={17} />
            Татах
          </a>
        )}
        {list[0] && (
          <a className="ghostButton" href={list[0].url} target="_blank" rel="noreferrer">
            <ExternalLink size={17} />
            Баримт нээх
          </a>
        )}
      </div>
      <DocumentLinks items={list} title="Хавсралт файлууд" />
    </div>
  );
}

function TransparencyPage({ data }) {
  const items = sortPublished(data.transparency);
  return (
    <main>
      <PageHero
        title="Ил тод байдал"
        text="Музейн үйл ажиллагаа, тайлан, зар, худалдан авалт болон олон нийтэд нээлттэй мэдээлэл."
        image={museumImages.halls}
        eyebrow="Transparency"
      />
      <section className="sectionWrap compactTop">
        <div className="transparencyGrid">
          {items.map((item, index) => (
            <article className="transparencyCard" key={`${item.title}-${index}`}>
              <span>{item.category || String(index + 1).padStart(2, "0")}</span>
              <h2>{item.title}</h2>
              <time>{item.date}</time>
              <p>{item.desc}</p>
              <DocumentLinks items={item.files} title="Файлууд" />
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function HallsPage({ data, selectedFloor, setSelectedFloor, navigate }) {
  const floor = data.floors[selectedFloor] || data.floors[0];

  return (
    <main>
      <PageHero
        title="Танхим ба үзмэрийн аялал"
        text="Давхар бүрийн танхим, үзмэр, зураг, видео, аудио болон баримт бичгийн мэдээлэлтэй танилцана уу."
        image={data.hallsHeroImage || museumImages.halls}
      />

      <section className="sectionWrap compactTop">
        <div className="floorTabs" role="tablist">
          {data.floors.map((item, index) => (
            <button
              key={item.name + index}
              className={selectedFloor === index ? "active" : ""}
              onClick={() => setSelectedFloor(index)}
            >
              <Building2 size={17} />
              {item.name}
            </button>
          ))}
        </div>

        {floor ? (
          <div className="floorFeature">
            <div className="floorMedia">
              <img src={floor.image || data.hallsHeroImage} alt={floor.title} />
            </div>
            <div className="floorText">
              <span className="sectionKicker">{floor.name}</span>
              <h2>{floor.title}</h2>
              <p>{floor.desc}</p>
              <div className="miniStats">
                <span>{safeArray(floor.halls).length} танхим</span>
                <span>
                  {safeArray(floor.halls).reduce(
                    (sum, hall) => sum + safeArray(hall.exhibits).length,
                    0
                  )}{" "}
                  үзмэр
                </span>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState title="Давхар бүртгэгдээгүй байна." />
        )}

        <div className="hallGrid wide">
          {safeArray(floor?.halls).map((hall, hallIndex) => (
            <button
              className="hallCard"
              key={hall.title + hallIndex}
              onClick={() => navigate(`/hall/${selectedFloor}/${hallIndex}`)}
            >
              <img
                src={hall.images?.[0] || floor.image || museumImages.halls}
                alt={hall.title}
              />
              <span>{safeArray(hall.exhibits).length} үзмэр</span>
              <h3>{hall.title}</h3>
              <p>{hall.shortDesc || hall.desc}</p>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

function EducationPage({ data, navigate }) {
  return (
    <main>
      <PageHero
        title="Боловсролын хөтөлбөр"
        text="Музейн хичээл, сургуулийн хамтын ажиллагаа, сургалтын хэрэглэгдэхүүн, багшийн сургалт, дижитал өвийн хичээлүүд."
        image={data.educationHeroImage || museumImages.education}
        eyebrow="Education"
      />
      <section className="sectionSplit educationIntro">
        <div>
          <span className="sectionKicker">Museum Learning</span>
          <h2>Сургуулийн хөтөлбөрийг музейн бодит эх сурвалжтай холбож өгнө</h2>
        </div>
        <div>
          <p>
            Хэнтий аймгийн музей нь багш, сурагч, эцэг эх, судлаачдад зориулсан
            танхимын болон цахим сургалтын хэлбэрүүдийг санал болгодог.
          </p>
          <div className="educationPillGrid">
            <span>Сургуулийн хамтын ажиллагаа</span>
            <span>Музейн хичээл</span>
            <span>Сургалтын хэрэглэгдэхүүн</span>
            <span>Дижитал өвийн хичээл</span>
            <span>Багшийн сургалт</span>
          </div>
        </div>
      </section>
      <section className="sectionWrap compactTop">
        <div className="sectionHeader">
          <div>
            <span className="sectionKicker">Programs</span>
            <h2>Хөтөлбөрүүд</h2>
          </div>
          <button className="textButton" onClick={() => navigate("/ticket")}>
            Хүсэлт илгээх
            <ChevronRight size={18} />
          </button>
        </div>
        <EducationGrid programs={data.educationPrograms} detailed />
      </section>
    </main>
  );
}

function EducationGrid({ programs, detailed = false }) {
  return (
    <div className="educationGrid">
      {safeArray(programs).map((program, index) => (
        <article className="programCard" key={`${program.title}-${index}`}>
          <span>
            <BookOpen size={18} />
            {program.type || "Хөтөлбөр"}
          </span>
          <h3>{program.title}</h3>
          <p>{program.desc}</p>
          <strong>{program.audience}</strong>
          {detailed && (
            <>
              <DocumentLinks items={program.resources} title="Хэрэглэгдэхүүн" />
              <MediaSection videos={program.videos} title="Сургалтын видео" />
            </>
          )}
        </article>
      ))}
    </div>
  );
}

function ArVrPage({ data }) {
  const hasModels = safeArray(data.arVrItems).some((item) => isModel3d(item.url));

  useEffect(() => {
    if (!hasModels || typeof window === "undefined") return;
    if (window.customElements?.get("model-viewer")) return;
    if (document.querySelector("script[data-model-viewer]")) return;
    const script = document.createElement("script");
    script.type = "module";
    script.src = "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";
    script.dataset.modelViewer = "true";
    document.head.appendChild(script);
  }, [hasModels]);

  return (
    <main>
      <PageHero
        title="VR/AR үзмэр"
        text="360 видео, VR аялал, AR загвар, YouTube болон Cloudinary медиа холбоосыг нэг дор үзэх боломжтой."
        image={data.arVrHeroImage || museumImages.vr}
        eyebrow="Immersive Heritage"
      />
      <section className="sectionWrap compactTop">
        <div className="sectionHeader">
          <div>
            <span className="sectionKicker">VR/AR</span>
            <h2>VR/AR үзмэр</h2>
          </div>
        </div>
        <div className="vrHeadsetGuide">
          <div>
            <span>Meta Quest / Pico Browser</span>
            <h3>VR төхөөрөмжийн Browser дээр site link-ээр орж үзнэ.</h3>
            <p>
              YouTube 360 холбоосыг headset browser дээр нээж, direct 360 видео эсвэл 360 зургийг
              fullscreen горимоор томруулан үзнэ. Desktop болон mobile дээр энгийн fallback view
              автоматаар ажиллана.
            </p>
          </div>
          <div className="vrGuideSteps">
            <span>1. Site link нээх</span>
            <span>2. VR төхөөрөмжөөр үзэх</span>
            <span>3. Fullscreen асаах</span>
          </div>
        </div>
        <ArVrGrid items={data.arVrItems} />
      </section>
    </main>
  );
}

function ArVrGrid({ items, compact = false }) {
  const playableItems = safeArray(items).filter((item) => item.url || item.fallbackVideo);
  return (
    <div className={compact ? "arVrGrid compact" : "arVrGrid"}>
      {playableItems.map((item, index) => (
        <ArVrCard item={item} index={index} key={`${item.title}-${index}`} />
      ))}
    </div>
  );
}

function ArVrCard({ item, index }) {
  const rawId = useId().replace(/:/g, "");
  const mediaId = `vr-media-${rawId}-${index}`;
  const mediaUrl = textValue(item.url);
  const openUrl = mediaUrl || textValue(item.fallbackVideo);
  const model3d = isModel3d(mediaUrl);
  const directVideo = Boolean(item.fallbackVideo || isDirectVideo(mediaUrl));
  const directImage = isDirectImage(mediaUrl);
  const youtube = isYoutube(mediaUrl);
  const mediaLabel = model3d
    ? "AR GLB model"
    : youtube
    ? "YouTube 360"
    : directVideo
      ? "Direct 360 video"
      : directImage
        ? "360 image"
        : "Fallback view";

  return (
    <article className="arVrCard headsetCard">
      <div className="arVrMedia headsetMedia" id={mediaId}>
        <span className="vrModePill">{mediaLabel}</span>
        {model3d ? (
          <model-viewer
            class="modelViewer"
            src={mediaUrl}
            poster={item.thumbnail || museumImages.vr}
            camera-controls="true"
            auto-rotate="true"
            ar="true"
            ar-modes="webxr scene-viewer quick-look"
            ar-scale="auto"
            shadow-intensity="1"
            exposure="1"
            interaction-prompt="auto"
            touch-action="pan-y"
          >
            <div className="modelLoading" slot="poster">
              <Sparkles size={22} />
              3D model loading
            </div>
            <button className="arViewButton" slot="ar-button">
              AR view
            </button>
          </model-viewer>
        ) : directVideo ? (
          <video
            src={item.fallbackVideo || mediaUrl}
            controls
            playsInline
            preload="metadata"
            poster={item.thumbnail}
          />
        ) : youtube ? (
          <iframe
            title={item.title}
            src={`${youtubeEmbed(mediaUrl)}?rel=0&playsinline=1`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; xr-spatial-tracking; fullscreen"
            allowFullScreen
          />
        ) : directImage ? (
          <img className="panoramaImage" src={mediaUrl} alt={item.title} />
        ) : (
          <img src={item.thumbnail || museumImages.vr} alt={item.title} />
        )}
      </div>
      <div className="headsetContent">
        <span>{item.type}</span>
        <h3>{item.title}</h3>
        <p>{item.desc}</p>
        <p className="vrFallbackNote">
          Desktop/mobile дээр энгийн view ажиллана. Meta Quest Browser болон Pico Browser дээр том
          товчоор media-г нээгээд fullscreen горим ашиглана.
        </p>
        <div className="vrActionRow">
          {model3d && (
            <button className="primaryButton vrBigButton" onClick={() => activateModelAr(mediaId)}>
              <Sparkles size={20} />
              AR view
            </button>
          )}
          {openUrl && (
            <a className="primaryButton vrBigButton" href={openUrl} target="_blank" rel="noreferrer">
              <Globe2 size={20} />
              VR төхөөрөмжөөр үзэх
            </a>
          )}
          <button className="ghostButton vrBigButton" onClick={() => requestFullscreen(mediaId)}>
            <Maximize2 size={20} />
            Fullscreen
          </button>
        </div>
      </div>
    </article>
  );
}

function HallDetailPage({ detail, navigate }) {
  const initialImage =
    detail?.hall?.images?.[0] || detail?.floor?.image || museumImages.halls;
  const [mainImage, setMainImage] = useState(initialImage);

  useEffect(() => setMainImage(initialImage), [initialImage]);

  if (!detail) {
    return <NotFound navigate={navigate} title="Танхим олдсонгүй" />;
  }

  const { floor, hall, floorIndex, hallIndex } = detail;
  const url = `${window.location.origin}/hall/${floorIndex}/${hallIndex}`;

  return (
    <main>
      <DetailHero
        eyebrow={floor.name}
        title={hall.title}
        text={hall.desc || hall.shortDesc}
        image={mainImage}
        navigate={navigate}
      />

      <section className="detailLayout">
        <article className="detailMain">
          <Gallery
            images={hall.images}
            title={hall.title}
            mainImage={mainImage}
            setMainImage={setMainImage}
          />
          <div className="contentBlock">
            <h2>Танхимын тухай</h2>
            <p>{hall.desc || hall.shortDesc}</p>
          </div>
          <AudioList items={hall.audios} />
          <MediaSection videos={hall.videos} title="Танхимын видео" />
          <DocumentLinks items={hall.documents} title="Танхимын материал" />

          <div className="sectionHeader">
            <div>
              <span className="sectionKicker">Collection</span>
              <h2>Үзмэрүүд</h2>
            </div>
          </div>

          <div className="exhibitGrid">
            {safeArray(hall.exhibits).map((exhibit, exhibitIndex) => (
              <button
                className="exhibitCard"
                key={exhibit.id || exhibit.title + exhibitIndex}
                onClick={() =>
                  navigate(exhibitPublicPath(exhibit, floorIndex, hallIndex, exhibitIndex))
                }
              >
                <img
                  src={exhibit.images?.[0] || hall.images?.[0] || floor.image}
                  alt={exhibit.title}
                />
                <span>{exhibit.period || "Үзмэр"}</span>
                <h3>{exhibit.title}</h3>
                <p>{exhibit.shortDesc || exhibit.desc}</p>
              </button>
            ))}
          </div>
        </article>

        <aside className="detailAside">
          <QrBox url={url} />
          <button className="primaryButton full" onClick={() => navigate("/ticket")}>
            <Ticket size={18} />
            Аялал захиалах
          </button>
        </aside>
      </section>
    </main>
  );
}

function ExhibitDetailPage({ detail, navigate }) {
  const initialImage =
    detail?.exhibit?.images?.[0] ||
    detail?.hall?.images?.[0] ||
    detail?.floor?.image ||
    museumImages.artifact;
  const [mainImage, setMainImage] = useState(initialImage);

  useEffect(() => setMainImage(initialImage), [initialImage]);

  if (!detail) {
    return <NotFound navigate={navigate} title="Үзмэр олдсонгүй" />;
  }

  const { floor, hall, exhibit, floorIndex, hallIndex, exhibitIndex } = detail;
  const url = exhibitPublicUrl(exhibit, floorIndex, hallIndex, exhibitIndex);

  return (
    <main>
      <DetailHero
        eyebrow={`${floor.name} • ${hall.title}`}
        title={exhibit.title}
        text={exhibit.shortDesc || exhibit.desc}
        image={mainImage}
        navigate={navigate}
      />

      <section className="detailLayout">
        <article className="detailMain">
          <Gallery
            images={exhibit.images}
            title={exhibit.title}
            mainImage={mainImage}
            setMainImage={setMainImage}
          />
          <div className="contentBlock">
            <h2>Үзмэрийн тайлбар</h2>
            <p>{exhibit.desc || exhibit.shortDesc}</p>
          </div>

          <div className="metaGrid">
            <Meta label="Ангилал" value={exhibit.category} />
            <Meta label="Он цаг" value={exhibit.period} />
            <Meta label="Материал" value={exhibit.material} />
            <Meta label="Олдсон газар" value={exhibit.foundPlace} />
          </div>

          {safeArray(exhibit.sidePhotos).length > 0 && (
            <div className="contentBlock">
              <h2>4 талын зураг</h2>
              <div className="sidePhotoGrid">
                {safeArray(exhibit.sidePhotos).map((image, index) => (
                  <img src={image} alt={`${exhibit.title} тал ${index + 1}`} key={image + index} />
                ))}
              </div>
            </div>
          )}

          <AudioList items={exhibit.audios} />
          <MediaSection videos={exhibit.videos} title="Үзмэрийн видео" />
          <DocumentLinks items={exhibit.documents} title="Үзмэрийн материал" />
        </article>

        <aside className="detailAside">
          <QrBox url={url} />
          <button
            className="ghostButton full"
            onClick={() => navigate(`/hall/${floorIndex}/${hallIndex}`)}
          >
            <ArrowLeft size={18} />
            Танхим руу буцах
          </button>
        </aside>
      </section>
    </main>
  );
}

function DetailHero({ eyebrow, title, text, image, navigate }) {
  return (
    <section
      className="detailHero"
      style={{ backgroundImage: `url("${image || museumImages.halls}")` }}
    >
      <button className="backButton" onClick={() => navigate("/halls")}>
        <ArrowLeft size={18} />
        Танхимууд
      </button>
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
    </section>
  );
}

function Gallery({ images, title, mainImage, setMainImage }) {
  const safeImages = safeArray(images);
  const current = mainImage || safeImages[0] || museumImages.halls;

  return (
    <div className="gallery">
      <img className="galleryMain" src={current} alt={title} />
      {safeImages.length > 1 && (
        <div className="galleryThumbs">
          {safeImages.map((image, index) => (
            <button
              key={image + index}
              className={image === current ? "active" : ""}
              onClick={() => setMainImage(image)}
            >
              <img src={image} alt={`${title} ${index + 1}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MediaSection({ videos, title }) {
  if (!safeArray(videos).length) return null;
  return (
    <div className="contentBlock">
      <h2>{title}</h2>
      <div className="videoGrid">
        {safeArray(videos).map((video) =>
          isYoutube(video) ? (
            <iframe
              key={video}
              title={video}
              src={youtubeEmbed(video)}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <video key={video} src={video} controls playsInline />
          )
        )}
      </div>
    </div>
  );
}

function AudioList({ items }) {
  if (!safeArray(items).length) return null;
  return (
    <div className="audioPanel stacked">
      <Headphones size={22} />
      <div>
        <h3>Аудио тайлбар</h3>
        {safeArray(items).map((item) => (
          <audio src={item} controls key={item} />
        ))}
      </div>
    </div>
  );
}

function DocumentLinks({ items, title }) {
  if (!safeArray(items).length) return null;
  const files = safeArray(items).map(normalizeFileItem).filter((item) => item.url);
  return (
    <div className="docBlock">
      <h3>{title}</h3>
      <div className="docList">
        {files.map((item, index) => (
          <a href={item.url} target="_blank" rel="noreferrer" key={item.url + index}>
            <FileText size={18} />
            {item.title || `Материал ${index + 1}`}
            <ExternalLink size={15} />
          </a>
        ))}
      </div>
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div className="metaItem">
      <span>{label}</span>
      <strong>{value || "Тодорхойгүй"}</strong>
    </div>
  );
}

function TicketPage({ data, subPage, addTicketRequest, markTicketPaid, navigate }) {
  const existingOrder = subPage
    ? safeArray(data.ticketRequests).find((order) => order.id === subPage)
    : null;
  const [sent, setSent] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [submitting, setSubmitting] = useState(false);
  const [activeOrder, setActiveOrder] = useState(existingOrder);
  const ticketTypes = safeArray(data.paymentSettings.ticketTypes);
  const defaultTicket = ticketTypes[0] || normalizeTicketType({});
  const [form, setForm] = useState({
    ticketTypeId: defaultTicket.id,
    quantity: "1",
    name: "",
    phone: "",
    email: "",
    date: "",
    note: "",
  });

  useEffect(() => setActiveOrder(existingOrder), [existingOrder?.id]);

  const selectedTicket =
    ticketTypes.find((item) => item.id === form.ticketTypeId) || defaultTicket;
  const total = Number(selectedTicket.price || 0) * Math.max(1, Number(form.quantity || 1));

  const setField = (field, value) =>
    setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.date) {
      setMessageType("error");
      setSent("Нэр, утас, огноо заавал бөглөнө үү.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await addTicketRequest({
        ...form,
        ticketType: selectedTicket.name,
        unitPrice: selectedTicket.price,
      });
      if (result.order) setActiveOrder(result.order);
      setMessageType("success");
      setSent(
        result.fallback
          ? "Захиалга амжилттай үүслээ. Firebase түр ажиллахгүй байгаа тул localStorage-д хадгаллаа."
          : "Захиалга амжилттай үүслээ. Төлбөрийн QR кодыг уншуулна уу."
      );
      setForm((current) => ({ ...current, name: "", phone: "", email: "", note: "" }));
    } catch (error) {
      console.error("Ticket order error:", error);
      setMessageType("error");
      setSent("Захиалга үүсгэх явцад алдаа гарлаа. Түр хүлээгээд дахин оролдоно уу.");
    } finally {
      setSubmitting(false);
    }
  };

  const markDemoPaid = async () => {
    if (!activeOrder?.id) return;
    await markTicketPaid(activeOrder.id);
    setActiveOrder({ ...activeOrder, paymentStatus: "paid", status: "paid", paidAt: new Date().toISOString() });
    setMessageType("success");
    setSent("Demo төлбөр төлөгдсөн гэж тэмдэглэлээ. E-ticket QR үүслээ.");
  };

  if (subPage && !existingOrder) {
    return <NotFound navigate={navigate} title="Тасалбар олдсонгүй" />;
  }

  return (
    <main>
      <PageHero
        title="Цахим тасалбар"
        text="Тасалбарын төрөл, тоо, үзэх өдөр болон холбоо барих мэдээллээ бөглөж QPay QR-ээр төлбөрөө баталгаажуулна уу."
        image={museumImages.halls}
        eyebrow="Tickets"
      />
      <section className="ticketLayout checkoutLayout">
        {!subPage && (
          <form className="ticketForm" onSubmit={submit}>
            {sent && <div className={messageType === "error" ? "successNote error" : "successNote"}>{sent}</div>}
            <label className="field">
              <span>Тасалбарын төрөл</span>
              <select
                value={form.ticketTypeId}
                onChange={(event) => setField("ticketTypeId", event.target.value)}
              >
                {ticketTypes.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.name} - {Number(item.price).toLocaleString()} MNT
                  </option>
                ))}
              </select>
            </label>
            <TextField label="Тоо ширхэг" type="number" min="1" value={form.quantity} onChange={(value) => setField("quantity", value)} required />
            <TextField label="Үзэх өдөр" type="date" value={form.date} onChange={(value) => setField("date", value)} required />
            <TextField label="Нэр" value={form.name} onChange={(value) => setField("name", value)} required />
            <TextField label="Утас" value={form.phone} onChange={(value) => setField("phone", value)} required />
            <TextField label="Email" value={form.email} onChange={(value) => setField("email", value)} />
            <TextArea label="Нэмэлт тэмдэглэл" value={form.note} onChange={(value) => setField("note", value)} />
            <div className="checkoutTotal">
              <span>Нийт дүн</span>
              <strong>{total.toLocaleString()} MNT</strong>
            </div>
            <button className="primaryButton" type="submit" disabled={submitting}>
              <CalendarCheck size={18} />
              {submitting ? "Захиалга үүсгэж байна..." : "Захиалга үүсгэх"}
            </button>
          </form>
        )}

        <aside className={activeOrder ? "ticketAside paymentPanel" : "ticketAside"}>
          {activeOrder ? (
            <TicketPaymentPanel
              order={activeOrder}
              paymentMode={data.paymentSettings.mode}
              onMarkPaid={markDemoPaid}
            />
          ) : (
            <>
              <h2>QPay төлбөр</h2>
              <p>
                Demo горимд бодит QPay credential шаардлагагүй. Live горим нь backend/serverless
                QPay холболт бэлэн болсны дараа ашиглагдана.
              </p>
              <button className="ghostButton full" onClick={() => navigate("/education")}>
                <GraduationCap size={18} />
                Боловсролын хөтөлбөр
              </button>
            </>
          )}
        </aside>
      </section>
    </main>
  );
}

function TicketPaymentPanel({ order, paymentMode, onMarkPaid }) {
  const paid = order.paymentStatus === "paid";
  const eTicketUrl = `${window.location.origin}/ticket/${order.id}`;
  const hasPaymentQr = paid || paymentMode !== "live" || order.qpayPayload || order.paymentUrl;
  return (
    <>
      <h2>{paid ? "E-ticket бэлэн" : paymentMode === "live" && !hasPaymentQr ? "QPay Live бэлтгэл" : "QPay QR"}</h2>
      <p>
        {order.ticketType} • {order.quantity} ширхэг •{" "}
        {Number(order.totalAmount).toLocaleString()} MNT
      </p>
      {hasPaymentQr && (
        <div className="qpayCard">
          <span>{paymentMode === "live" ? "QPay Live" : "QPay Demo"}</span>
          <img
            src={qrUrl(paid ? eTicketUrl : order.qpayPayload || order.paymentUrl || eTicketUrl)}
            alt={paid ? "E-ticket QR" : "QPay QR"}
          />
          <strong>{paid ? "Төлбөр төлөгдсөн" : "Төлбөр хүлээгдэж байна"}</strong>
        </div>
      )}
      {paymentMode === "demo" && !paid && (
        <button className="primaryButton full" onClick={onMarkPaid}>
          <ShieldCheck size={18} />
          Mark as paid
        </button>
      )}
      {paymentMode === "live" && !paid && (
        <div className="adminNotice">
          QPay Live-д backend/serverless invoice болон payment check endpoint шаардлагатай.
        </div>
      )}
      {paid && (
        <a className="ghostButton full" href={eTicketUrl} target="_blank" rel="noreferrer">
          <ExternalLink size={18} />
          E-ticket нээх
        </a>
      )}
    </>
  );
}

function VisitSection({ visit }) {
  return (
    <section className="visitSection" id="visit">
      <div className="visitInfo">
        <span className="sectionKicker">Visit</span>
        <h2>{visit.title}</h2>
        <InfoLine icon={Clock} text={visit.time} />
        <InfoLine icon={Ticket} text={visit.ticket} />
        <InfoLine icon={MapPin} text={visit.address} />
      </div>
      <iframe title="museum map" src={visit.mapEmbed} loading="lazy" />
    </section>
  );
}

function InfoLine({ icon: Icon, text }) {
  return (
    <p className="infoLine">
      <Icon size={19} />
      {text}
    </p>
  );
}

function NewsSection({ news }) {
  return (
    <section className="sectionWrap" id="news">
      <div className="sectionHeader">
        <div>
          <span className="sectionKicker">News</span>
          <h2>Мэдээ, зарлал</h2>
        </div>
      </div>
      <div className="newsGrid">
        {safeArray(news).map((item, index) => (
          <article className="newsCard" id={`news-${index}`} key={item.title + index}>
            <time>{item.date}</time>
            <h3>{item.title}</h3>
            <p>{item.desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function QrBox({ url }) {
  return (
    <div className="qrBox">
      <QrCode size={24} />
      <h3>QR тайлбар</h3>
      <img src={qrUrl(url)} alt="QR код" />
      <p>Энэ хуудсыг зочин утсаараа нээж тайлбартай танилцана.</p>
    </div>
  );
}

function AdminQrSection({ title, exhibitId, url }) {
  return (
    <section className="adminQrPanel">
      <div>
        <span className="sectionKicker">Permanent QR</span>
        <h3>Үзмэрийн QR код</h3>
        <p>
          QR нь одоогийн домэйнээс автоматаар үүсэж, үзмэрийн public detail
          хуудас руу заана. Үзмэр устгагдаагүй, домэйн идэвхтэй байгаа үед QR
          ажиллана.
        </p>
        <div className="qrMeta">
          <span>ID: {exhibitId || "Автоматаар үүснэ"}</span>
          <a href={url} target="_blank" rel="noreferrer">
            {url}
          </a>
        </div>
        <div className="qrActions">
          <a className="ghostButton" href={url} target="_blank" rel="noreferrer">
            <ExternalLink size={17} />
            Preview
          </a>
          <button className="ghostButton" onClick={() => downloadQrCode(url, title)}>
            <Download size={17} />
            Татах
          </button>
          <button className="primaryButton" onClick={() => printQrCode(url, title)}>
            <QrCode size={17} />
            Хэвлэх
          </button>
        </div>
      </div>
      <img src={qrUrl(url)} alt={`${title} QR код`} />
    </section>
  );
}

function Footer({ data, navigate }) {
  return (
    <footer className="footer" id="contact">
      <div>
        <strong>{data.museumName}</strong>
        <p>{data.slogan}</p>
      </div>
      <div>
        <button onClick={() => navigate("/halls")}>Танхим</button>
        <button onClick={() => navigate("/education")}>Боловсролын хөтөлбөр</button>
        <button onClick={() => navigate("/vr-ar")}>VR/AR үзмэр</button>
        <button onClick={() => navigate("/ticket")}>Цахим тасалбар</button>
      </div>
      <address>
        <span>
          <MapPin size={16} />
          {data.contact.address}
        </span>
        <span>
          <Mail size={16} />
          {data.contact.email}
        </span>
        <span>
          <Phone size={16} />
          {data.contact.phone}
        </span>
      </address>
    </footer>
  );
}

function NotFound({ navigate, title }) {
  return (
    <main className="notFound">
      <h1>{title}</h1>
      <p>Админ хэсгээс мэдээлэл устсан эсвэл холбоос өөрчлөгдсөн байж болно.</p>
      <button className="primaryButton" onClick={() => navigate("/halls")}>
        <Layers3 size={18} />
        Танхим руу очих
      </button>
    </main>
  );
}

function EmptyState({ title }) {
  return (
    <div className="emptyState">
      <Database size={26} />
      <p>{title}</p>
    </div>
  );
}

function AdminPage(props) {
  const {
    data,
    adminLoggedIn,
    unreadNotifications,
    authUser,
    email,
    password,
    setEmail,
    setPassword,
    loginWithRole,
    logout,
    saving,
    uploading,
    dbStatus,
    dbError,
    navigate,
    totalHalls,
    totalExhibits,
    updateField,
    updateNested,
    uploadLogo,
    uploadHero,
    uploadLoaderMedia,
    addFloor,
    updateFloor,
    deleteFloor,
    addHall,
    updateHall,
    deleteHall,
    addExhibit,
    updateExhibit,
    deleteExhibit,
    uploadFloorImage,
    uploadFloorVideos,
    uploadHallMedia,
    uploadExhibitMedia,
    deleteMedia,
    addUrlMedia,
    addItem,
    updateItem,
    deleteItem,
    markTicketPaid,
    cancelTicketOrder,
    markNotificationRead,
    uploadEducationMedia,
    uploadArVrMedia,
    uploadSeoImage,
    uploadTimelineImage,
    updateAboutPage,
    uploadAboutImages,
    uploadAboutVideo,
    uploadAboutDirectorImage,
    deleteAboutImage,
    uploadPublicationCover,
    uploadPublicationFiles,
    uploadTransparencyFiles,
    createBackup,
    restoreBackup,
    downloadBackup,
  } = props;

  const [tab, setTab] = useState("dashboard");
  const [openHall, setOpenHall] = useState("0-0");
  const [ticketFilter, setTicketFilter] = useState("all");
  const [browserNotifyEnabled, setBrowserNotifyEnabled] = useState(false);

  useEffect(() => {
    if (!adminLoggedIn || typeof Notification === "undefined") return;
    setBrowserNotifyEnabled(Notification.permission === "granted");
  }, [adminLoggedIn]);

  useEffect(() => {
    if (
      !adminLoggedIn ||
      typeof Notification === "undefined" ||
      Notification.permission !== "granted"
    ) {
      return;
    }
    const latest = safeArray(data.notifications).find((item) => !item.read);
    if (!latest) return;
    const key = `notified-${latest.id}`;
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, "1");
    new Notification("Шинэ тасалбарын захиалга", {
      body: `${latest.customerName} • ${latest.ticketType} • ${latest.totalAmount.toLocaleString()} MNT`,
    });
  }, [adminLoggedIn, data.notifications]);

  const requestBrowserNotifications = async () => {
    if (typeof Notification === "undefined") return;
    const permission = await Notification.requestPermission();
    setBrowserNotifyEnabled(permission === "granted");
  };

  const ticketTypes = safeArray(data.paymentSettings?.ticketTypes);
  const ticketOrders = safeArray(data.ticketRequests);
  const filteredTicketOrders =
    ticketFilter === "all"
      ? ticketOrders
      : ticketOrders.filter(
          (order) => paymentStatusKey(order.paymentStatus || order.status) === ticketFilter
        );
  const ticketNotifications = safeArray(data.notifications);

  const updatePaymentMode = (mode) =>
    updateNested("paymentSettings", "mode", mode === "live" ? "live" : "demo");

  const updateTicketTypeSetting = (index, field, value) => {
    updateNested(
      "paymentSettings",
      "ticketTypes",
      ticketTypes.map((item, itemIndex) =>
        itemIndex === index
          ? normalizeTicketType({
              ...item,
              [field]: field === "price" ? Number(value || 0) : value,
            })
          : item
      )
    );
  };

  const addTicketTypeSetting = () =>
    updateNested("paymentSettings", "ticketTypes", [
      ...ticketTypes,
      normalizeTicketType({
        id: createId(),
        name: "Шинэ тасалбар",
        price: 0,
        description: "",
      }),
    ]);

  const deleteTicketTypeSetting = (index) =>
    updateNested(
      "paymentSettings",
      "ticketTypes",
      ticketTypes.filter((_, itemIndex) => itemIndex !== index)
    );

  if (!adminLoggedIn) {
    return (
      <main className="adminLoginPage">
        <form
          className="adminLogin"
          onSubmit={(event) => {
            event.preventDefault();
            loginWithRole("admin");
          }}
        >
          <span className="adminBadge">
            <Lock size={18} />
            Admin access
          </span>
          <h1>Админ нэвтрэх</h1>
          <p>
            Удирдлагын самбар зөвхөн баталгаажсан админ хэрэглэгч нэвтэрсний дараа нээгдэнэ.
          </p>
          {authUser && <div className="adminNotice">Firebase хэрэглэгч идэвхтэй боловч админ session идэвхгүй байна.</div>}
          {dbError && <div className="adminNotice error">{dbError}</div>}
          <TextField
            label="Email"
            value={email}
            onChange={setEmail}
            autoComplete="username"
          />
          <TextField
            label="Password"
            value={password}
            onChange={setPassword}
            type="password"
            autoComplete="current-password"
          />
          <button className="primaryButton full" type="submit">
            <ShieldCheck size={18} />
            Админ нэвтрэх
          </button>
          <button className="ghostButton full" type="button" onClick={() => navigate("/")}>
            <Home size={18} />
            Нүүр рүү буцах
          </button>
        </form>
      </main>
    );
  }

  const tabs = [
    { key: "dashboard", label: "Overview", icon: LayoutDashboard },
    { key: "halls", label: "Halls", icon: Layers3 },
    { key: "exhibits", label: "Exhibits", icon: Sparkles },
    { key: "about", label: "About pages", icon: Building2 },
    { key: "education", label: "Education", icon: GraduationCap },
    { key: "publications", label: "Publications", icon: BookOpen },
    { key: "transparency", label: "Transparency", icon: FileText },
    { key: "tickets", label: "Tickets", icon: Ticket },
    { key: "arvr", label: "VR/AR", icon: Globe2 },
    { key: "seo", label: "SEO", icon: Globe2 },
    { key: "media", label: "Media library", icon: ImageIcon },
    { key: "site", label: "General site", icon: Settings },
    { key: "loading", label: "Loading", icon: Loader2 },
    { key: "news", label: "Мэдээ", icon: Newspaper },
    { key: "backup", label: "Backup", icon: Database },
  ];

  return (
    <main className="adminPage">
      <aside className="adminSidebar">
        <button className="brand adminBrand" onClick={() => navigate("/")}>
          <span className="brandMark" style={{ background: data.logoBg }}>
            {data.logo ? <img src={data.logo} alt={data.museumName} /> : "ХМ"}
          </span>
          <span>
            <strong>Admin</strong>
            <small>{data.museumName}</small>
          </span>
        </button>

        <nav>
          {tabs.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                className={tab === item.key ? "active" : ""}
                onClick={() => setTab(item.key)}
              >
                <Icon size={18} />
                {item.label}
                {item.key === "tickets" && unreadNotifications > 0 && (
                  <span className="navBadge">{unreadNotifications}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="adminSidebarActions">
          <button onClick={() => navigate("/")}>
            <Eye size={18} />
            Сайт харах
          </button>
          <button onClick={logout}>
            <LogOut size={18} />
            Гарах
          </button>
        </div>
      </aside>

      <section className="adminContent">
        <div className="adminTop">
          <div>
            <span className="sectionKicker">Control Center</span>
            <h1>{data.museumName}</h1>
            <p>
              {uploading
                ? `${uploading} байршуулж байна...`
                : saving
                  ? "Өөрчлөлт хадгалж байна..."
                  : dbStatus || "Өөрчлөлт Firebase database руу хадгалагдана."}
            </p>
          </div>
          <span className={saving || uploading ? "savePill busy" : "savePill"}>
            <Save size={16} />
            {saving || uploading ? "Working" : "Ready"}
          </span>
        </div>

        {dbError && <div className="adminNotice error">{dbError}</div>}

        {tab === "dashboard" && (
          <div className="adminStack">
            <div className="adminStats">
              <AdminMetric label="Давхар" value={data.floors.length} icon={Building2} />
              <AdminMetric label="Танхим" value={totalHalls} icon={Layers3} />
              <AdminMetric label="Үзмэр" value={totalExhibits} icon={Sparkles} />
              <AdminMetric label="Хүсэлт" value={safeArray(data.ticketRequests).length} icon={Ticket} />
              <AdminMetric label="Шинэ мэдэгдэл" value={unreadNotifications} icon={Bell} />
            </div>
            <div className="adminBlock">
              <h2>Firebase тохиргооны зөвлөмж</h2>
              <div className="statusGrid">
                <Status label="Auth" value="Admin login шаардлагатай" />
                <Status label="Database rules" value="Read public, write admin байх хэрэгтэй" />
                <Status label="Ticket fallback" value="localStorage enabled" />
                <Status label="Media upload" value="Cloudinary preset ашиглана" />
              </div>
            </div>
          </div>
        )}

        {tab === "site" && (
          <div className="adminGrid">
            <div className="adminBlock">
              <h2>Ерөнхий мэдээлэл</h2>
              <TextField label="Музейн нэр" value={data.museumName} onChange={(value) => updateField("museumName", value)} />
              <TextField label="Slogan" value={data.slogan} onChange={(value) => updateField("slogan", value)} />
              <TextField label="Logo background color" value={data.logoBg} onChange={(value) => updateField("logoBg", value)} />
              <UploadBox title="Logo upload" accept="image/*" onUpload={uploadLogo} preview={data.logo} />
            </div>
            <div className="adminBlock">
              <h2>Hero ба танилцуулга</h2>
              <TextField label="Hero гарчиг" value={data.heroTitle} onChange={(value) => updateField("heroTitle", value)} />
              <TextArea label="Hero тайлбар" value={data.heroText} onChange={(value) => updateField("heroText", value)} />
              <UploadBox title="Home hero зураг" accept="image/*" onUpload={(file) => uploadHero("heroImage", file)} preview={data.heroImage} />
              <UploadBox title="Halls hero зураг" accept="image/*" onUpload={(file) => uploadHero("hallsHeroImage", file)} preview={data.hallsHeroImage} />
              <UploadBox title="Education hero зураг" accept="image/*" onUpload={(file) => uploadHero("educationHeroImage", file)} preview={data.educationHeroImage} />
              <UploadBox title="VR/AR үзмэр hero зураг" accept="image/*" onUpload={(file) => uploadHero("arVrHeroImage", file)} preview={data.arVrHeroImage} />
              <TextArea label="Музейн тухай" value={data.about} onChange={(value) => updateField("about", value)} />
            </div>
            <div className="adminBlock">
              <h2>Зочлох мэдээлэл</h2>
              <TextField label="Цагийн хуваарь" value={data.visit.time} onChange={(value) => updateNested("visit", "time", value)} />
              <TextArea label="Тасалбарын мэдээлэл" value={data.visit.ticket} onChange={(value) => updateNested("visit", "ticket", value)} />
              <TextField label="Байршил" value={data.visit.address} onChange={(value) => updateNested("visit", "address", value)} />
              <TextField label="Google map embed URL" value={data.visit.mapEmbed} onChange={(value) => updateNested("visit", "mapEmbed", value)} />
              <TextField label="Email" value={data.contact.email} onChange={(value) => updateNested("contact", "email", value)} />
              <TextField label="Утас" value={data.contact.phone} onChange={(value) => updateNested("contact", "phone", value)} />
            </div>
          </div>
        )}

        {tab === "loading" && (
          <div className="adminBlock">
            <h2>Loading дэлгэц</h2>
            <label className="checkRow">
              <input
                type="checkbox"
                checked={data.loader.enabled}
                onChange={(event) => updateNested("loader", "enabled", event.target.checked)}
              />
              Loading дэлгэц асаах
            </label>
            <TextField label="Loading гарчиг" value={data.loader.text} onChange={(value) => updateNested("loader", "text", value)} />
            <TextField label="Loading дэд бичвэр" value={data.loader.subText} onChange={(value) => updateNested("loader", "subText", value)} />
            <UploadBox
              title="Loading зураг"
              accept="image/*"
              onUpload={(file) => uploadLoaderMedia("image", file, "image")}
              preview={data.loader.image}
            />
            <UploadBox
              title="Loading видео"
              accept="video/*"
              onUpload={(file) => uploadLoaderMedia("video", file, "video")}
              preview={data.loader.video}
              video
            />
          </div>
        )}

        {(tab === "halls" || tab === "exhibits") && (
          <div className="adminStack">
            <div className="adminActionBar">
              <h2>{tab === "exhibits" ? "Үзмэрийн удирдлага" : "Танхимын удирдлага"}</h2>
              <button className="primaryButton" onClick={addFloor}>
                <Plus size={18} />
                Давхар нэмэх
              </button>
            </div>

            {data.floors.map((floor, floorIndex) => (
              <div className="adminBlock floorEditor" key={`${floor.name}-${floorIndex}`}>
                <div className="adminBlockHead">
                  <div>
                    <span className="sectionKicker">{floor.name}</span>
                    <h2>{floor.title}</h2>
                  </div>
                  <button className="dangerButton" onClick={() => deleteFloor(floorIndex)}>
                    <Trash2 size={17} />
                    Давхар устгах
                  </button>
                </div>
                <div className="formGrid">
                  <TextField label="Давхар нэр" value={floor.name} onChange={(value) => updateFloor(floorIndex, "name", value)} />
                  <TextField label="Давхар гарчиг" value={floor.title} onChange={(value) => updateFloor(floorIndex, "title", value)} />
                </div>
                <TextArea label="Давхар тайлбар" value={floor.desc} onChange={(value) => updateFloor(floorIndex, "desc", value)} />
                <div className="mediaAdminGrid">
                  <UploadBox title="Давхрын зураг" accept="image/*" onUpload={(file) => uploadFloorImage(floorIndex, file)} preview={floor.image} />
                  <UploadBox title="Давхрын видео" accept="video/*" onUpload={(files) => uploadFloorVideos(floorIndex, files)} multiple video />
                </div>
                <MediaList items={floor.videos} video onDelete={(index) => deleteMedia("floor", [floorIndex], "videos", index)} />
                <UrlAdd label="Давхрын видео URL" onAdd={(url) => addUrlMedia("floor", [floorIndex], "videos", url)} />

                <div className="nestedAction">
                  <button onClick={() => addHall(floorIndex)}>
                    <Plus size={17} />
                    Танхим нэмэх
                  </button>
                </div>

                {safeArray(floor.halls).map((hall, hallIndex) => {
                  const key = `${floorIndex}-${hallIndex}`;
                  const isOpen = openHall === key;
                  return (
                    <div className="hallEditor" key={key}>
                      <div className="hallEditorHead">
                        <button onClick={() => setOpenHall(isOpen ? "" : key)}>
                          <ChevronRight size={18} className={isOpen ? "rotated" : ""} />
                          <span>
                            <strong>{hall.title}</strong>
                            <small>{safeArray(hall.exhibits).length} үзмэр</small>
                          </span>
                        </button>
                        <button className="dangerMini" onClick={() => deleteHall(floorIndex, hallIndex)}>
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {isOpen && (
                        <div className="adminEditor">
                          <TextField label="Танхим нэр" value={hall.title} onChange={(value) => updateHall(floorIndex, hallIndex, "title", value)} />
                          <TextField label="Ангилал" value={hall.category} onChange={(value) => updateHall(floorIndex, hallIndex, "category", value)} />
                          <TextArea label="Товч тайлбар" value={hall.shortDesc} onChange={(value) => updateHall(floorIndex, hallIndex, "shortDesc", value)} />
                          <TextArea label="Дэлгэрэнгүй тайлбар" value={hall.desc} onChange={(value) => updateHall(floorIndex, hallIndex, "desc", value)} />
                          <MediaEditor
                            title="Танхимын медиа"
                            scope="hall"
                            indexes={[floorIndex, hallIndex]}
                            item={hall}
                            uploadMedia={uploadHallMedia}
                            deleteMedia={deleteMedia}
                            addUrlMedia={addUrlMedia}
                          />
                          <div className="nestedAction">
                            <button onClick={() => addExhibit(floorIndex, hallIndex)}>
                              <Plus size={17} />
                              Үзмэр нэмэх
                            </button>
                          </div>
                          {safeArray(hall.exhibits).map((exhibit, exhibitIndex) => (
                            <div className="exhibitEditor" key={`${key}-${exhibitIndex}`}>
                              <div className="adminBlockHead">
                                <h3>{exhibit.title}</h3>
                                <button className="dangerMini" onClick={() => deleteExhibit(floorIndex, hallIndex, exhibitIndex)}>
                                  <Trash2 size={16} />
                                </button>
                              </div>
                              <div className="formGrid">
                                <TextField label="Үзмэр нэр" value={exhibit.title} onChange={(value) => updateExhibit(floorIndex, hallIndex, exhibitIndex, "title", value)} />
                                <TextField label="Ангилал" value={exhibit.category} onChange={(value) => updateExhibit(floorIndex, hallIndex, exhibitIndex, "category", value)} />
                                <TextField label="Он цаг" value={exhibit.period} onChange={(value) => updateExhibit(floorIndex, hallIndex, exhibitIndex, "period", value)} />
                                <TextField label="Материал" value={exhibit.material} onChange={(value) => updateExhibit(floorIndex, hallIndex, exhibitIndex, "material", value)} />
                                <TextField label="Олдсон газар" value={exhibit.foundPlace} onChange={(value) => updateExhibit(floorIndex, hallIndex, exhibitIndex, "foundPlace", value)} />
                              </div>
                              <TextArea label="Товч тайлбар" value={exhibit.shortDesc} onChange={(value) => updateExhibit(floorIndex, hallIndex, exhibitIndex, "shortDesc", value)} />
                              <TextArea label="Дэлгэрэнгүй тайлбар" value={exhibit.desc} onChange={(value) => updateExhibit(floorIndex, hallIndex, exhibitIndex, "desc", value)} />
                              <AdminQrSection
                                title={exhibit.title}
                                exhibitId={exhibit.id}
                                url={exhibitPublicUrl(
                                  exhibit,
                                  floorIndex,
                                  hallIndex,
                                  exhibitIndex
                                )}
                              />
                              <MediaEditor
                                title="Үзмэрийн медиа"
                                scope="exhibit"
                                indexes={[floorIndex, hallIndex, exhibitIndex]}
                                item={exhibit}
                                uploadMedia={uploadExhibitMedia}
                                deleteMedia={deleteMedia}
                                addUrlMedia={addUrlMedia}
                                sidePhotos
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {tab === "about" && (
          <div className="adminStack">
            <div className="adminActionBar">
              <h2>Бидний тухай хуудас</h2>
            </div>
            {[
              ["greeting", "Мэндчилгээ"],
              ["structure", "Музейн бүтэц"],
              ["organization", "Зохион байгуулалт"],
              ["intro", "Товч танилцуулга"],
            ].map(([sectionKey, label]) => {
              const pageData = data.aboutPages[sectionKey] || {};
              return (
                <div className="adminBlock" key={sectionKey}>
                  <div className="adminBlockHead">
                    <div>
                      <span className="sectionKicker">{label}</span>
                      <h2>{pageData.title}</h2>
                    </div>
                    <label className="checkRow compact">
                      <input
                        type="checkbox"
                        checked={pageData.published !== false}
                        onChange={(event) =>
                          updateAboutPage(sectionKey, "published", event.target.checked)
                        }
                      />
                      Нийтлэх
                    </label>
                  </div>
                  <div className="formGrid">
                    <TextField
                      label="Гарчиг"
                      value={pageData.title}
                      onChange={(value) => updateAboutPage(sectionKey, "title", value)}
                    />
                    <TextField
                      label="Дэд гарчиг"
                      value={pageData.subtitle}
                      onChange={(value) => updateAboutPage(sectionKey, "subtitle", value)}
                    />
                    <TextField
                      label="Sort order"
                      type="number"
                      value={pageData.sortOrder}
                      onChange={(value) => updateAboutPage(sectionKey, "sortOrder", value)}
                    />
                    <TextField
                      label="Видео URL"
                      value={pageData.video}
                      onChange={(value) => updateAboutPage(sectionKey, "video", value)}
                    />
                  </div>
                  {sectionKey === "greeting" && (
                    <>
                      <div className="formGrid">
                        <TextField
                          label="Захирлын нэр"
                          value={pageData.directorName}
                          onChange={(value) =>
                            updateAboutPage(sectionKey, "directorName", value)
                          }
                        />
                        <TextField
                          label="Албан тушаал"
                          value={pageData.role}
                          onChange={(value) => updateAboutPage(sectionKey, "role", value)}
                        />
                      </div>
                      <UploadBox
                        title="Захирлын зураг"
                        accept="image/*"
                        onUpload={(file) => uploadAboutDirectorImage(sectionKey, file)}
                        preview={pageData.image}
                      />
                    </>
                  )}
                  <TextArea
                    label={sectionKey === "organization" ? "Байгууллагын тайлбар" : "Дэлгэрэнгүй текст"}
                    value={sectionKey === "organization" ? pageData.description : pageData.body}
                    onChange={(value) =>
                      updateAboutPage(
                        sectionKey,
                        sectionKey === "organization" ? "description" : "body",
                        value
                      )
                    }
                  />
                  {sectionKey === "organization" && (
                    <TextArea
                      label="Алба, нэгжүүд (мөр бүр нэг нэгж)"
                      value={safeArray(pageData.departments).join("\n")}
                      onChange={(value) =>
                        updateAboutPage(
                          sectionKey,
                          "departments",
                          value.split("\n").map((item) => item.trim()).filter(Boolean)
                        )
                      }
                    />
                  )}
                  <div className="mediaAdminGrid">
                    <UploadBox
                      title="Зураг нэмэх"
                      accept="image/*"
                      multiple
                      onUpload={(files) => uploadAboutImages(sectionKey, files)}
                      preview={pageData.images?.[0]}
                    />
                    <UploadBox
                      title="Видео upload"
                      accept="video/*"
                      video
                      onUpload={(file) => uploadAboutVideo(sectionKey, file)}
                      preview={pageData.video}
                    />
                  </div>
                  <MediaList
                    items={pageData.images}
                    onDelete={(index) => deleteAboutImage(sectionKey, index)}
                  />
                  <UrlAdd
                    label="Зураг URL"
                    onAdd={(url) =>
                      updateAboutPage(sectionKey, "images", [
                        ...safeArray(pageData.images),
                        url,
                      ])
                    }
                  />
                </div>
              );
            })}
          </div>
        )}

        {tab === "education" && (
          <div className="adminBlock">
            <div className="adminBlockHead">
              <h2>Боловсролын ажил</h2>
              <button className="primaryButton" onClick={() => addItem("educationPrograms", normalizeEducation({ title: "Шинэ хөтөлбөр" }))}>
                <Plus size={18} />
                Хөтөлбөр нэмэх
              </button>
            </div>
            {safeArray(data.educationPrograms).map((program, index) => (
              <div className="listEditor" key={`${program.title}-${index}`}>
                <div className="formGrid">
                  <TextField label="Гарчиг" value={program.title} onChange={(value) => updateItem("educationPrograms", index, "title", value)} />
                  <TextField label="Ангилал" value={program.type} onChange={(value) => updateItem("educationPrograms", index, "type", value)} />
                  <TextField label="Зорилтот бүлэг" value={program.audience} onChange={(value) => updateItem("educationPrograms", index, "audience", value)} />
                </div>
                <TextArea label="Тайлбар" value={program.desc} onChange={(value) => updateItem("educationPrograms", index, "desc", value)} />
                <div className="mediaAdminGrid">
                  <UploadBox title="Сургалтын материал" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,image/*" multiple document onUpload={(files) => uploadEducationMedia(index, "resources", files, "raw")} />
                  <UploadBox title="Сургалтын видео" accept="video/*" multiple video onUpload={(files) => uploadEducationMedia(index, "videos", files, "video")} />
                </div>
                <MediaList items={program.resources} document onDelete={(i) => updateItem("educationPrograms", index, "resources", safeArray(program.resources).filter((_, n) => n !== i))} />
                <UrlAdd label="Материал URL" onAdd={(url) => updateItem("educationPrograms", index, "resources", [...safeArray(program.resources), url])} />
                <MediaList items={program.videos} video onDelete={(i) => updateItem("educationPrograms", index, "videos", safeArray(program.videos).filter((_, n) => n !== i))} />
                <UrlAdd label="Видео URL" onAdd={(url) => updateItem("educationPrograms", index, "videos", [...safeArray(program.videos), url])} />
                <button className="dangerButton" onClick={() => deleteItem("educationPrograms", index)}>
                  <Trash2 size={17} />
                  Устгах
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === "publications" && (
          <div className="adminBlock">
            <div className="adminBlockHead">
              <h2>Ном хэвлэл</h2>
              <button
                className="primaryButton"
                onClick={() =>
                  addItem(
                    "publications",
                    normalizePublication({
                      id: createId(),
                      title: "Шинэ ном хэвлэл",
                      year: new Date().getFullYear().toString(),
                      author: "Хэнтий аймгийн музей",
                      category: "Ном хэвлэл",
                      published: true,
                    })
                  )
                }
              >
                <Plus size={18} />
                Ном хэвлэл нэмэх
              </button>
            </div>
            {safeArray(data.publications).map((item, index) => (
              <div className="listEditor" key={item.id || index}>
                <div className="adminBlockHead">
                  <h3>{item.title}</h3>
                  <label className="checkRow compact">
                    <input
                      type="checkbox"
                      checked={item.published !== false}
                      onChange={(event) =>
                        updateItem("publications", index, "published", event.target.checked)
                      }
                    />
                    Нийтлэх
                  </label>
                </div>
                <div className="formGrid">
                  <TextField label="Гарчиг" value={item.title} onChange={(value) => updateItem("publications", index, "title", value)} />
                  <TextField label="Он" value={item.year} onChange={(value) => updateItem("publications", index, "year", value)} />
                  <TextField label="Зохиогч / редактор" value={item.author} onChange={(value) => updateItem("publications", index, "author", value)} />
                  <TextField label="Ангилал" value={item.category} onChange={(value) => updateItem("publications", index, "category", value)} />
                  <TextField label="Sort order" type="number" value={item.sortOrder} onChange={(value) => updateItem("publications", index, "sortOrder", value)} />
                </div>
                <TextArea label="Товч тайлбар" value={item.desc} onChange={(value) => updateItem("publications", index, "desc", value)} />
                <TextArea label="Дэлгэрэнгүй тайлбар" value={item.fullDesc} onChange={(value) => updateItem("publications", index, "fullDesc", value)} />
                <div className="mediaAdminGrid">
                  <UploadBox title="Cover image" accept="image/*" onUpload={(file) => uploadPublicationCover(index, file)} preview={item.coverImage} />
                  <UploadBox title="PDF / DOCX / ZIP / зураг" accept=".pdf,.doc,.docx,.zip,image/*" multiple document onUpload={(files) => uploadPublicationFiles(index, files)} />
                </div>
                <MediaList
                  items={safeArray(item.files).map((file) => file.url || file)}
                  document
                  onDelete={(fileIndex) =>
                    updateItem(
                      "publications",
                      index,
                      "files",
                      safeArray(item.files).filter((_, n) => n !== fileIndex)
                    )
                  }
                />
                <UrlAdd
                  label="Файл URL"
                  onAdd={(url) =>
                    updateItem("publications", index, "files", [
                      ...safeArray(item.files),
                      normalizeFileItem(url),
                    ])
                  }
                />
                <button className="dangerButton" onClick={() => deleteItem("publications", index)}>
                  <Trash2 size={17} />
                  Устгах
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === "transparency" && (
          <div className="adminBlock">
            <div className="adminBlockHead">
              <h2>Ил тод байдал</h2>
              <button
                className="primaryButton"
                onClick={() =>
                  addItem(
                    "transparency",
                    normalizeTransparency({
                      id: createId(),
                      title: "Шинэ ил тод мэдээлэл",
                      date: new Date().toISOString().slice(0, 10),
                      category: "Мэдээлэл",
                      published: true,
                    })
                  )
                }
              >
                <Plus size={18} />
                Мэдээлэл нэмэх
              </button>
            </div>
            {safeArray(data.transparency).map((item, index) => (
              <div className="listEditor" key={item.id || index}>
                <div className="adminBlockHead">
                  <h3>{item.title}</h3>
                  <label className="checkRow compact">
                    <input
                      type="checkbox"
                      checked={item.published !== false}
                      onChange={(event) =>
                        updateItem("transparency", index, "published", event.target.checked)
                      }
                    />
                    Нийтлэх
                  </label>
                </div>
                <div className="formGrid">
                  <TextField label="Гарчиг" value={item.title} onChange={(value) => updateItem("transparency", index, "title", value)} />
                  <TextField label="Огноо" type="date" value={item.date} onChange={(value) => updateItem("transparency", index, "date", value)} />
                  <TextField label="Ангилал" value={item.category} onChange={(value) => updateItem("transparency", index, "category", value)} />
                  <TextField label="Sort order" type="number" value={item.sortOrder} onChange={(value) => updateItem("transparency", index, "sortOrder", value)} />
                  <TextField label="Үндсэн файл URL" value={item.fileUrl} onChange={(value) => updateItem("transparency", index, "fileUrl", value)} />
                </div>
                <TextArea label="Тайлбар" value={item.desc} onChange={(value) => updateItem("transparency", index, "desc", value)} />
                <UploadBox title="Тайлан / санхүү / зарын файл" accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,image/*" multiple document onUpload={(files) => uploadTransparencyFiles(index, files)} />
                <MediaList
                  items={safeArray(item.files).map((file) => file.url || file)}
                  document
                  onDelete={(fileIndex) =>
                    updateItem(
                      "transparency",
                      index,
                      "files",
                      safeArray(item.files).filter((_, n) => n !== fileIndex)
                    )
                  }
                />
                <UrlAdd
                  label="Файл URL"
                  onAdd={(url) =>
                    updateItem("transparency", index, "files", [
                      ...safeArray(item.files),
                      normalizeFileItem(url),
                    ])
                  }
                />
                <button className="dangerButton" onClick={() => deleteItem("transparency", index)}>
                  <Trash2 size={17} />
                  Устгах
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === "timeline" && (
          <div className="adminBlock">
            <div className="adminBlockHead">
              <h2>Товч танилцуулгын timeline слайд</h2>
              <button
                className="primaryButton"
                onClick={() =>
                  addItem(
                    "timelineSlides",
                    normalizeTimelineSlide({
                      year: "Шинэ он",
                      title: "Шинэ түүхэн үе",
                      image: museumImages.halls,
                      desc: "",
                    })
                  )
                }
              >
                <Plus size={18} />
                Слайд нэмэх
              </button>
            </div>
            {safeArray(data.timelineSlides).map((slide, index) => (
              <div className="listEditor" key={`${slide.year}-${index}`}>
                <div className="formGrid">
                  <TextField
                    label="Он / огноо"
                    value={slide.year}
                    onChange={(value) => updateItem("timelineSlides", index, "year", value)}
                  />
                  <TextField
                    label="Гарчиг"
                    value={slide.title}
                    onChange={(value) => updateItem("timelineSlides", index, "title", value)}
                  />
                </div>
                <TextArea
                  label="Тайлбар"
                  value={slide.desc}
                  onChange={(value) => updateItem("timelineSlides", index, "desc", value)}
                />
                <UploadBox
                  title="Слайдын зураг"
                  accept="image/*"
                  onUpload={(file) => uploadTimelineImage(index, file)}
                  preview={slide.image}
                />
                <TextField
                  label="Зураг URL"
                  value={slide.image}
                  onChange={(value) => updateItem("timelineSlides", index, "image", value)}
                />
                <button className="dangerButton" onClick={() => deleteItem("timelineSlides", index)}>
                  <Trash2 size={17} />
                  Слайд устгах
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === "seo" && (
          <div className="adminGrid">
            <div className="adminBlock">
              <h2>SEO тохиргоо</h2>
              <TextField
                label="SEO title"
                value={data.seo.title}
                onChange={(value) => updateNested("seo", "title", value)}
              />
              <TextArea
                label="Meta description"
                value={data.seo.description}
                onChange={(value) => updateNested("seo", "description", value)}
              />
              <TextArea
                label="Keywords"
                value={data.seo.keywords}
                onChange={(value) => updateNested("seo", "keywords", value)}
              />
            </div>
            <div className="adminBlock">
              <h2>Social preview</h2>
              <TextField
                label="Open Graph title"
                value={data.seo.ogTitle}
                onChange={(value) => updateNested("seo", "ogTitle", value)}
              />
              <TextArea
                label="Open Graph description"
                value={data.seo.ogDescription}
                onChange={(value) => updateNested("seo", "ogDescription", value)}
              />
              <UploadBox
                title="Social preview зураг"
                accept="image/*"
                onUpload={uploadSeoImage}
                preview={data.seo.ogImage}
              />
              <TextField
                label="Social preview image URL"
                value={data.seo.ogImage}
                onChange={(value) => updateNested("seo", "ogImage", value)}
              />
            </div>
          </div>
        )}

        {tab === "arvr" && (
          <div className="adminBlock">
            <div className="adminBlockHead">
              <h2>VR/AR үзмэр медиа</h2>
              <button className="primaryButton" onClick={() => addItem("arVrItems", normalizeArVr({ title: "Шинэ VR/AR үзмэр" }))}>
                <Plus size={18} />
                Үзмэр нэмэх
              </button>
            </div>
            {safeArray(data.arVrItems).map((item, index) => (
              <div className="listEditor" key={`${item.title}-${index}`}>
                <div className="formGrid">
                  <TextField label="Гарчиг" value={item.title} onChange={(value) => updateItem("arVrItems", index, "title", value)} />
                  <TextField label="Төрөл" value={item.type} onChange={(value) => updateItem("arVrItems", index, "type", value)} />
                </div>
                <TextArea label="Тайлбар" value={item.desc} onChange={(value) => updateItem("arVrItems", index, "desc", value)} />
                <TextField label="360 зураг / 360 видео / VR/AR / YouTube / Cloudinary URL" value={item.url} onChange={(value) => updateItem("arVrItems", index, "url", value)} />
                <TextField label="Fallback video URL" value={item.fallbackVideo} onChange={(value) => updateItem("arVrItems", index, "fallbackVideo", value)} />
                <div className="mediaAdminGrid three">
                  <UploadBox title="Thumbnail зураг" accept="image/*" onUpload={(file) => uploadArVrMedia(index, "thumbnail", file, "image")} preview={item.thumbnail} />
                  <UploadBox title="360/VR видео" accept="video/*" onUpload={(file) => uploadArVrMedia(index, "url", file, "video")} video />
                  <UploadBox title="AR model/document" accept=".glb,.gltf,.usdz,.obj,.fbx,.zip,.pdf" onUpload={(file) => uploadArVrMedia(index, "url", file, "raw")} document />
                </div>
                <button className="dangerButton" onClick={() => deleteItem("arVrItems", index)}>
                  <Trash2 size={17} />
                  Устгах
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === "news" && (
          <div className="adminBlock">
            <div className="adminBlockHead">
              <h2>Мэдээ</h2>
              <button className="primaryButton" onClick={() => addItem("news", { title: "Шинэ мэдээ", desc: "", date: new Date().toISOString().slice(0, 10) })}>
                <Plus size={18} />
                Мэдээ нэмэх
              </button>
            </div>
            {safeArray(data.news).map((item, index) => (
              <div className="listEditor" key={`${item.title}-${index}`}>
                <TextField label="Гарчиг" value={item.title} onChange={(value) => updateItem("news", index, "title", value)} />
                <TextField label="Огноо" type="date" value={item.date} onChange={(value) => updateItem("news", index, "date", value)} />
                <TextArea label="Тайлбар" value={item.desc} onChange={(value) => updateItem("news", index, "desc", value)} />
                <button className="dangerButton" onClick={() => deleteItem("news", index)}>
                  <Trash2 size={17} />
                  Устгах
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === "tickets" && (
          <div className="adminStack">
            <div className="adminBlock">
              <div className="adminBlockHead">
                <div>
                  <span className="sectionKicker">QPay-ready checkout</span>
                  <h2>Тасалбар ба төлбөр</h2>
                </div>
                <button className="primaryButton" onClick={() => exportOrdersCsv(ticketOrders)}>
                  <Download size={18} />
                  CSV экспорт
                </button>
              </div>

              <div className="paymentModeGrid">
                <label className={data.paymentSettings.mode === "demo" ? "modeCard active" : "modeCard"}>
                  <input
                    type="radio"
                    name="paymentMode"
                    checked={data.paymentSettings.mode !== "live"}
                    onChange={() => updatePaymentMode("demo")}
                  />
                  <span>Demo mode</span>
                  <p>Бодит QPay credential шаардахгүй. QR үзүүлж, admin эсвэл тест товчоор төлөгдсөн болгоно.</p>
                </label>
                <label className={data.paymentSettings.mode === "live" ? "modeCard active" : "modeCard"}>
                  <input
                    type="radio"
                    name="paymentMode"
                    checked={data.paymentSettings.mode === "live"}
                    onChange={() => updatePaymentMode("live")}
                  />
                  <span>QPay Live</span>
                  <p>Backend/serverless endpoint болон merchant env credentials холбосны дараа идэвхжинэ. Нууц мэдээлэл frontend-д хадгалахгүй.</p>
                </label>
              </div>

              <div className="adminSubHead">
                <h3>Тасалбарын төрөл</h3>
                <button className="ghostButton" onClick={addTicketTypeSetting}>
                  <Plus size={17} />
                  Төрөл нэмэх
                </button>
              </div>
              <div className="ticketTypeEditor">
                {ticketTypes.map((ticketType, index) => (
                  <div className="ticketTypeRow" key={ticketType.id || index}>
                    <TextField
                      label="Нэр"
                      value={ticketType.name}
                      onChange={(value) => updateTicketTypeSetting(index, "name", value)}
                    />
                    <TextField
                      label="Үнэ (MNT)"
                      type="number"
                      value={ticketType.price}
                      onChange={(value) => updateTicketTypeSetting(index, "price", value)}
                    />
                    <TextField
                      label="Тайлбар"
                      value={ticketType.description}
                      onChange={(value) => updateTicketTypeSetting(index, "description", value)}
                    />
                    <button className="dangerMini" onClick={() => deleteTicketTypeSetting(index)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="adminGrid">
              <div className="adminBlock">
                <div className="adminBlockHead">
                  <div>
                    <span className="sectionKicker">New ticket request</span>
                    <h2>Мэдэгдэл</h2>
                  </div>
                  <button className="ghostButton" onClick={requestBrowserNotifications}>
                    <Bell size={17} />
                    {browserNotifyEnabled ? "Browser notification идэвхтэй" : "Browser notification асаах"}
                  </button>
                </div>
                <div className="notificationList">
                  {ticketNotifications.length ? (
                    ticketNotifications.slice(0, 8).map((notification) => (
                      <article
                        className={notification.read ? "notificationCard" : "notificationCard unread"}
                        key={notification.id}
                      >
                        <div>
                          <strong>{notification.title}</strong>
                          <span>
                            {notification.customerName} • {notification.ticketType} • {notification.quantity}ш
                          </span>
                          <p>
                            {notification.contact} • {Number(notification.totalAmount || 0).toLocaleString()} MNT •{" "}
                            {paymentStatusLabel(notification.paymentStatus)}
                          </p>
                          <time>{formatDate(notification.createdAt)}</time>
                        </div>
                        {!notification.read && (
                          <button className="ghostButton" onClick={() => markNotificationRead(notification.id)}>
                            Уншсан
                          </button>
                        )}
                      </article>
                    ))
                  ) : (
                    <EmptyState title="Одоогоор шинэ мэдэгдэл алга." />
                  )}
                </div>
              </div>

              <div className="adminBlock">
                <h2>Төлбөрийн төлөв</h2>
                <div className="statusGrid">
                  <Status
                    label="Хүлээгдэж буй"
                    value={ticketOrders.filter((order) => paymentStatusKey(order.paymentStatus || order.status) === "pending").length}
                  />
                  <Status
                    label="Төлөгдсөн"
                    value={ticketOrders.filter((order) => paymentStatusKey(order.paymentStatus || order.status) === "paid").length}
                  />
                  <Status
                    label="Цуцалсан"
                    value={ticketOrders.filter((order) => paymentStatusKey(order.paymentStatus || order.status) === "cancelled").length}
                  />
                  <Status label="Нийт дүн" value={`${ticketOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0).toLocaleString()} MNT`} />
                </div>
                <p className="adminHint">
                  QPay Live горимд бодит invoice, payment check, webhook нь backend/serverless function дээр хэрэгжинэ.
                </p>
              </div>
            </div>

            <div className="adminBlock">
              <div className="adminBlockHead">
                <div>
                  <span className="sectionKicker">Orders</span>
                  <h2>Тасалбарын захиалга</h2>
                </div>
                <div className="filterTabs">
                  {[
                    ["all", "Бүгд"],
                    ["pending", "Хүлээгдэж буй"],
                    ["paid", "Төлөгдсөн"],
                    ["cancelled", "Цуцалсан"],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      className={ticketFilter === key ? "active" : ""}
                      onClick={() => setTicketFilter(key)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="requestList">
                {filteredTicketOrders.length ? (
                  filteredTicketOrders.map((request) => (
                    <article className="requestCard orderCard" key={request.id}>
                      <div>
                        <strong>{request.name || "Нэргүй захиалагч"}</strong>
                        <span>
                          {request.ticketType} • {request.quantity || request.guests}ш •{" "}
                          {Number(request.totalAmount || 0).toLocaleString()} {request.currency || "MNT"}
                        </span>
                        <p>
                          {request.phone || "утасгүй"} {request.email ? `• ${request.email}` : ""} •{" "}
                          {request.date || "огноо сонгоогүй"}
                        </p>
                        <em>
                          ID: {request.id} • {request.source === "local" ? "localStorage fallback" : "Firebase/local sync"} •{" "}
                          {paymentStatusLabel(request.paymentStatus || request.status)}
                        </em>
                        {request.note && <em>{request.note}</em>}
                      </div>
                      <div className="requestActions">
                        <span className={`statusPill ${paymentStatusKey(request.paymentStatus || request.status)}`}>
                          {paymentStatusLabel(request.paymentStatus || request.status)}
                        </span>
                        {paymentStatusKey(request.paymentStatus || request.status) !== "paid" && (
                          <button className="primaryButton" onClick={() => markTicketPaid(request.id)}>
                            <CheckCircle2 size={17} />
                            Төлөгдсөн
                          </button>
                        )}
                        {paymentStatusKey(request.paymentStatus || request.status) !== "cancelled" && (
                          <button className="ghostButton" onClick={() => cancelTicketOrder(request.id)}>
                            Цуцлах
                          </button>
                        )}
                        <button
                          className="dangerMini"
                          onClick={() =>
                            deleteItem(
                              "ticketRequests",
                              ticketOrders.findIndex((order) => order.id === request.id)
                            )
                          }
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </article>
                  ))
                ) : (
                  <EmptyState title="Энэ төлөвтэй захиалга одоогоор алга." />
                )}
              </div>
            </div>
          </div>
        )}

        {tab === "media" && (
          <div className="adminBlock">
            <h2>Media library</h2>
            <p className="adminHint">
              Танхим, үзмэр, боловсрол, ном хэвлэл, ил тод байдал, VR/AR хэсэгт ашиглаж буй бүх медиа холбоос.
            </p>
            <MediaLibrary data={data} />
          </div>
        )}

        {tab === "backup" && (
          <div className="adminBlock">
            <h2>Backup ба сэргээх</h2>
            <div className="backupActions">
              <button className="primaryButton" onClick={createBackup}>
                <Database size={18} />
                Browser backup
              </button>
              <button className="ghostButton" onClick={restoreBackup}>
                <FileUp size={18} />
                Backup сэргээх
              </button>
              <button className="ghostButton" onClick={downloadBackup}>
                <Download size={18} />
                JSON татах
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function MediaEditor({
  title,
  scope,
  indexes,
  item,
  uploadMedia,
  deleteMedia,
  addUrlMedia,
  sidePhotos = false,
}) {
  const upload = (field, type) => (files) =>
    uploadMedia(...indexes, field, files, type);
  const remove = (field) => (index) => deleteMedia(scope, indexes, field, index);
  const addUrl = (field) => (url) => addUrlMedia(scope, indexes, field, url);

  return (
    <div className="mediaEditorBlock">
      <h3>{title}</h3>
      <div className="mediaAdminGrid three">
        <UploadBox title="Зураг" accept="image/*" multiple preview={item.images?.[0]} onUpload={upload("images", "image")} />
        <UploadBox title="Видео" accept="video/*" multiple video onUpload={upload("videos", "video")} />
        <UploadBox title="Аудио" accept="audio/*" multiple audio onUpload={upload("audios", "video")} />
        <UploadBox title="Баримт бичиг" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,image/*" multiple document onUpload={upload("documents", "raw")} />
        {sidePhotos && (
          <UploadBox title="4 талын зураг" accept="image/*" multiple preview={item.sidePhotos?.[0]} onUpload={upload("sidePhotos", "image")} />
        )}
      </div>
      <MediaList items={item.images} onDelete={remove("images")} />
      <UrlAdd label="Зураг URL" onAdd={addUrl("images")} />
      {sidePhotos && (
        <>
          <MediaList items={item.sidePhotos} onDelete={remove("sidePhotos")} />
          <UrlAdd label="4 талын зураг URL" onAdd={addUrl("sidePhotos")} />
        </>
      )}
      <MediaList items={item.videos} video onDelete={remove("videos")} />
      <UrlAdd label="Видео URL" onAdd={addUrl("videos")} />
      <MediaList items={item.audios} audio onDelete={remove("audios")} />
      <UrlAdd label="Аудио URL" onAdd={addUrl("audios")} />
      <MediaList items={item.documents} document onDelete={remove("documents")} />
      <UrlAdd label="Баримт бичиг URL" onAdd={addUrl("documents")} />
    </div>
  );
}

function AdminMetric({ label, value, icon: Icon }) {
  return (
    <div className="adminMetric">
      <Icon size={22} />
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function Status({ label, value }) {
  return (
    <div className="statusItem">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function collectMediaItems(data) {
  const items = [];
  const push = (url, type, owner) => {
    if (!url) return;
    items.push({ url, type, owner });
  };

  push(data.logo, "image", "Logo");
  push(data.heroImage, "image", "Home hero");
  push(data.hallsHeroImage, "image", "Halls hero");
  push(data.educationHeroImage, "image", "Education hero");
  push(data.arVrHeroImage, "image", "VR/AR hero");
  push(data.seo?.ogImage, "image", "SEO preview");

  Object.values(data.aboutPages || {}).forEach((page) => {
    push(page.image, "image", page.title);
    push(page.video, "video", page.title);
    safeArray(page.images).forEach((url) => push(url, "image", page.title));
  });

  safeArray(data.timelineSlides).forEach((slide) => push(slide.image, "image", slide.title));
  safeArray(data.educationPrograms).forEach((program) => {
    safeArray(program.resources).forEach((url) => push(url, "document", program.title));
    safeArray(program.videos).forEach((url) => push(url, "video", program.title));
  });
  safeArray(data.arVrItems).forEach((item) => {
    push(item.thumbnail, "image", item.title);
    push(item.url, item.type || "VR/AR", item.title);
    push(item.fallbackVideo, "video", item.title);
  });
  safeArray(data.publications).forEach((item) => {
    push(item.coverImage, "image", item.title);
    safeArray(item.files).forEach((file) => push(file.url || file, "document", item.title));
  });
  safeArray(data.transparency).forEach((item) => {
    push(item.fileUrl, "document", item.title);
    safeArray(item.files).forEach((file) => push(file.url || file, "document", item.title));
  });
  safeArray(data.floors).forEach((floor) => {
    push(floor.image, "image", floor.title);
    safeArray(floor.videos).forEach((url) => push(url, "video", floor.title));
    safeArray(floor.halls).forEach((hall) => {
      [...safeArray(hall.images), ...safeArray(hall.sidePhotos)].forEach((url) =>
        push(url, "image", hall.title)
      );
      safeArray(hall.videos).forEach((url) => push(url, "video", hall.title));
      safeArray(hall.audios).forEach((url) => push(url, "audio", hall.title));
      safeArray(hall.documents).forEach((url) => push(url, "document", hall.title));
      safeArray(hall.exhibits).forEach((exhibit) => {
        [...safeArray(exhibit.images), ...safeArray(exhibit.sidePhotos)].forEach((url) =>
          push(url, "image", exhibit.title)
        );
        safeArray(exhibit.videos).forEach((url) => push(url, "video", exhibit.title));
        safeArray(exhibit.audios).forEach((url) => push(url, "audio", exhibit.title));
        safeArray(exhibit.documents).forEach((url) => push(url, "document", exhibit.title));
      });
    });
  });

  const seen = new Set();
  return items.filter((item) => {
    if (!item.url || seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}

function MediaLibrary({ data }) {
  const items = collectMediaItems(data);
  if (!items.length) return <EmptyState title="Одоогоор медиа бүртгэгдээгүй байна." />;

  return (
    <div className="mediaLibraryGrid">
      {items.map((item, index) => (
        <a href={item.url} target="_blank" rel="noreferrer" key={`${item.url}-${index}`}>
          {item.type === "image" ? (
            <img src={item.url} alt={item.owner} />
          ) : item.type === "video" ? (
            <Video size={26} />
          ) : item.type === "audio" ? (
            <Music size={26} />
          ) : (
            <FileText size={26} />
          )}
          <strong>{item.type}</strong>
          <span>{item.owner}</span>
        </a>
      ))}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  required,
  min,
  autoComplete,
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        value={value || ""}
        min={min}
        required={required}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea
        value={value || ""}
        rows={5}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function UploadBox({
  title,
  accept,
  onUpload,
  preview,
  video = false,
  audio = false,
  document = false,
  multiple = false,
}) {
  const id = useId();
  const Icon = document ? FileText : audio ? Music : video ? Video : ImageIcon;

  return (
    <label className="uploadBox" htmlFor={id}>
      <input
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(event) => {
          const files = event.target.files;
          onUpload(multiple ? files : files?.[0]);
          event.target.value = "";
        }}
      />
      {preview ? (
        video ? (
          <video src={preview} muted playsInline />
        ) : (
          <img src={preview} alt={title} />
        )
      ) : (
        <span className="uploadIcon">
          <Icon size={24} />
        </span>
      )}
      <strong>{title}</strong>
      <small>
        <Upload size={14} />
        {multiple ? "Олон файл сонгох" : "Файл сонгох"}
      </small>
    </label>
  );
}

function UrlAdd({ label, onAdd }) {
  const [url, setUrl] = useState("");

  return (
    <div className="urlAdd">
      <input
        value={url}
        placeholder={label}
        onChange={(event) => setUrl(event.target.value)}
      />
      <button
        onClick={() => {
          onAdd(url);
          setUrl("");
        }}
      >
        <Plus size={16} />
        URL
      </button>
    </div>
  );
}

function MediaList({ items, onDelete, video = false, audio = false, document = false }) {
  const list = safeArray(items);
  if (!list.length) return null;

  return (
    <div className="mediaList">
      {list.map((item, index) => (
        <div className={document || audio ? "mediaChip fileChip" : "mediaChip"} key={`${item}-${index}`}>
          {video ? (
            <video src={item} muted playsInline />
          ) : audio ? (
            <Music size={22} />
          ) : document ? (
            <FileText size={22} />
          ) : (
            <img src={item} alt={`media-${index + 1}`} />
          )}
          <button onClick={() => onDelete(index)} aria-label="Устгах">
            <Trash2 size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}
