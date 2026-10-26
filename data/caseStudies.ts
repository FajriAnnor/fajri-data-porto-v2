/**
 * Case-study content for the three featured projects.
 * Facts, figures and wording are migrated from Portfolio V1 (data/portfolio.ts,
 * WedisonAnalyticsCaseStudy.tsx, SalesReportingCaseStudy.tsx). All datasets are synthetic demonstrations.
 */
import type { Localized } from "./portfolio";

const L = (en: string, id: string = en): Localized => ({ en, id });

export type Figure = { src: string; width: number; height: number; alt: Localized; caption: Localized };

export type WorkflowIcon = "collect" | "prepare" | "storage" | "chart" | "dashboard" | "file" | "validate" | "aggregate" | "spreadsheet";

export type Block =
  | { type: "figure"; figure: Figure; narrow?: boolean }
  | { type: "figures"; figures: Figure[] }
  | { type: "split"; figure: Figure; side?: "left" | "right"; blocks: Block[] }
  | { type: "metrics"; cols?: 2 | 3; items: Array<{ label: Localized; value: Localized; note?: Localized }> }
  | { type: "workflow"; items: Array<{ title: Localized; text?: Localized; icon: WorkflowIcon }> }
  | { type: "rank"; items: Array<{ label: string; value: string }> }
  | { type: "cards"; cols?: 1 | 2 | 3; items: Array<{ title: Localized; text?: Localized; tag?: string; figure?: Figure }> }
  | { type: "steps"; items: Localized[] }
  | { type: "chips"; items: Localized[] }
  | { type: "list"; items: Localized[] }
  | { type: "callout"; text: Localized }
  | { type: "code"; label: string; text: string }
  | { type: "link"; label: Localized; href: string };

export type CaseSection = { title: Localized; body?: Localized[]; blocks: Block[] };

export type CaseStudy = {
  slug: string;
  index: string;
  eyebrow: Localized;
  title: Localized;
  intro: Localized;
  meta: Array<{ label: Localized; value: Localized }>;
  tags: string[];
  notice: Localized;
  cta: { label: Localized; href: string };
  heroFigure: Figure;
  sections: CaseSection[];
  final: { eyebrow: Localized; title: Localized; cta?: Localized };
  next: string;
};

const fig = (
  src: string,
  width: number,
  height: number,
  alt: Localized,
  caption: Localized,
): Figure => ({ src, width, height, alt, caption });

/* ========================================================================== WEDISON */

const TABLEAU =
  "https://public.tableau.com/app/profile/fajri.annor/viz/WEDISON_Synthetic_Portfolio/WEDISONEXECUTIVEDASHBOARD";
const W = "/images/projects/wedison";

const wedison: CaseStudy = {
  slug: "wedison-operations-analytics",
  index: "01",
  eyebrow: L("PROJECT 01 / BUSINESS INTELLIGENCE", "PROYEK 01 / BUSINESS INTELLIGENCE"),
  title: L("WEDISON Operations Analytics", "WEDISON Operations Analytics"),
  intro: L(
    "A Tableau-based business intelligence dashboard for sales performance, customer acquisition, product distribution, and branch performance, built on a synthetic demonstration dataset.",
    "Dashboard business intelligence berbasis Tableau untuk performa penjualan, akuisisi pelanggan, distribusi produk, dan performa cabang, dibangun dari dataset demonstrasi sintetis.",
  ),
  meta: [
    { label: L("Tools", "Perangkat"), value: L("Tableau, PostgreSQL, Excel") },
    { label: L("Category", "Kategori"), value: L("Business Intelligence / Data Visualization", "Business Intelligence / Visualisasi Data") },
    { label: L("Dataset", "Dataset"), value: L("Synthetic Demonstration", "Demonstrasi Sintetis") },
    { label: L("Period", "Periode"), value: L("September 2026") },
  ],
  tags: ["Tableau", "PostgreSQL", "Excel"],
  notice: L(
    "All customer information and business performance figures shown in this case study come from a synthetic demonstration dataset. The Tableau dashboard is publicly accessible, but it does not contain real-time company transactions.",
    "Seluruh informasi pelanggan dan angka performa bisnis dalam studi kasus ini berasal dari dataset demonstrasi sintetis. Dashboard Tableau dapat diakses publik, tetapi tidak memuat transaksi perusahaan secara waktu nyata.",
  ),
  cta: { label: L("VIEW LIVE DASHBOARD", "LIHAT DASHBOARD LIVE"), href: TABLEAU },
  heroFigure: fig(
    `${W}/executive-dashboard.png`,
    1411,
    814,
    L("WEDISON executive Tableau dashboard showing synthetic sales KPIs and performance charts", "Dashboard eksekutif Tableau WEDISON yang menampilkan KPI dan grafik performa sintetis"),
    L("Executive dashboard — September 2026 synthetic demonstration dataset", "Dashboard eksekutif — dataset demonstrasi sintetis September 2026"),
  ),
  sections: [
    {
      title: L("Overview", "Ringkasan"),
      body: [
        L(
          "WEDISON Operations Analytics is an interactive Tableau dashboard for exploring synthetic electric motorcycle sales records in one place. It was created so sales performance, customer acquisition, product distribution, and branch results can be reviewed together instead of in separate reports. Key indicators include units sold, down payment collected, average DP per unit, estimated revenue, and purchase scheme mix.",
          "WEDISON Operations Analytics adalah dashboard Tableau interaktif untuk mengeksplorasi catatan penjualan sepeda motor listrik sintetis dalam satu tempat. Dashboard ini dibuat agar performa penjualan, akuisisi pelanggan, distribusi produk, dan hasil cabang dapat ditinjau bersama, bukan dalam laporan terpisah. Indikator utamanya mencakup unit terjual, uang muka terkumpul, rata-rata DP per unit, estimasi pendapatan, dan komposisi skema pembelian.",
        ),
      ],
      blocks: [],
    },
    {
      title: L("Business Problem", "Masalah Bisnis"),
      body: [
        L(
          "Questions about products, branches, and customer sources are hard to answer when each sits in a separate report. The dashboard was designed to answer four of them from one view:",
          "Pertanyaan tentang produk, cabang, dan sumber pelanggan sulit dijawab ketika masing-masing berada di laporan terpisah. Dashboard ini dirancang untuk menjawab empat di antaranya dari satu tampilan:",
        ),
      ],
      blocks: [
        {
          type: "list",
          items: [
            L("How is sales performance distributed across branches and regions?", "Bagaimana performa penjualan terdistribusi antar-cabang dan wilayah?"),
            L("Which vehicle models contribute the most sales volume?", "Model kendaraan mana yang menyumbang volume penjualan terbanyak?"),
            L("Which customer acquisition channels perform best?", "Saluran akuisisi pelanggan mana yang berkinerja terbaik?"),
            L("How can operational reporting be made easier to read and compare?", "Bagaimana pelaporan operasional dapat dibuat lebih mudah dibaca dan dibandingkan?"),
          ],
        },
      ],
    },
    {
      title: L("Data & Analytical Workflow", "Data & Alur Analisis"),
      body: [
        L(
          "The published workbook uses a packaged Tableau extract of synthetic data. The workflow below illustrates the reporting approach; it is not a live database connection or a real-time ETL pipeline.",
          "Workbook yang dipublikasikan menggunakan ekstrak Tableau terpaket dari data sintetis. Alur di bawah menggambarkan pendekatan pelaporan; ini bukan koneksi basis data langsung maupun pipeline ETL waktu nyata.",
        ),
      ],
      blocks: [
        {
          type: "workflow",
          items: [
            { icon: "collect", title: L("Data Collection", "Pengumpulan Data"), text: L("Synthetic transaction records", "Catatan transaksi sintetis") },
            { icon: "prepare", title: L("Data Preparation", "Persiapan Data"), text: L("Cleaning and metric definitions", "Pembersihan dan definisi metrik") },
            { icon: "storage", title: L("PostgreSQL"), text: L("Structured storage and SQL queries", "Penyimpanan terstruktur dan kueri SQL") },
            { icon: "chart", title: L("Tableau"), text: L("Packaged extract and calculated metrics", "Ekstrak terpaket dan metrik terhitung") },
            { icon: "dashboard", title: L("Interactive Dashboard", "Dashboard Interaktif"), text: L("Filters by branch, model, source, scheme", "Filter cabang, model, sumber, skema") },
          ],
        },
      ],
    },
    {
      title: L("Dashboard Snapshot", "Cuplikan Dashboard"),
      body: [
        L(
          "Key indicators from the executive dashboard. All values come from the synthetic September 2026 dataset and only illustrate the reporting approach.",
          "Indikator utama dari dashboard eksekutif. Seluruh nilai berasal dari dataset sintetis September 2026 dan hanya menggambarkan pendekatan pelaporan.",
        ),
      ],
      blocks: [
        {
          type: "metrics",
          cols: 3,
          items: [
            { label: L("Total Units Sold", "Total Unit Terjual"), value: L("135"), note: L("Synthetic units in the reporting period", "Unit sintetis dalam periode pelaporan") },
            { label: L("Total DP Collected", "Total DP Terkumpul"), value: L("Rp 56.409.000"), note: L("Aggregate down payments collected", "Agregat uang muka yang terkumpul") },
            { label: L("Average DP / Unit", "Rata-rata DP / Unit"), value: L("Rp 417.844"), note: L("Total DP divided by total units", "Total DP dibagi jumlah unit") },
            { label: L("Estimated Revenue", "Estimasi Pendapatan"), value: L("Rp 3,88 Miliar"), note: L("Estimated gross vehicle value; not DP or recognized revenue", "Estimasi nilai kendaraan bruto; bukan DP atau pendapatan diakui") },
            { label: L("RTO Units", "Unit RTO"), value: L("121"), note: L("Rental-to-own purchase scheme", "Skema pembelian rental-to-own") },
            { label: L("Cash Units", "Unit Tunai"), value: L("14"), note: L("Cash purchase scheme", "Skema pembelian tunai") },
          ],
        },
      ],
    },
    {
      title: L("Key Insights & Outcome", "Temuan Utama & Hasil"),
      body: [
        L(
          "What the dashboard helps someone see. These observations come from the synthetic dataset and are not verified WEDISON business results.",
          "Hal yang dibantu terlihat oleh dashboard ini. Observasi berasal dari dataset sintetis dan bukan hasil bisnis WEDISON yang terverifikasi.",
        ),
      ],
      blocks: [
        {
          type: "cards",
          cols: 3,
          items: [
            {
              title: L("Volume is not value", "Volume bukan nilai"),
              text: L(
                "VICTORY-REG leads with 30 units, yet VICTORY-EXT has the highest model-level DP contribution (Rp 12.575.000). Units and DP answer different questions.",
                "VICTORY-REG memimpin dengan 30 unit, tetapi VICTORY-EXT memiliki kontribusi DP tingkat model tertinggi (Rp 12.575.000). Unit dan DP menjawab pertanyaan yang berbeda.",
              ),
            },
            {
              title: L("Branch & source concentration", "Konsentrasi cabang & sumber"),
              text: L(
                "Jakarta contributes Rp 26.534.000 in DP, the most of four branches. Referral leads customer sources with Rp 16.979.000 (30,1% of DP).",
                "Jakarta berkontribusi Rp 26.534.000 dalam DP, terbesar dari empat cabang. Referral memimpin sumber pelanggan dengan Rp 16.979.000 (30,1% DP).",
              ),
            },
            {
              title: L("One monitoring view", "Satu tampilan pemantauan"),
              text: L(
                "Filters for branch, unit type, customer source, and purchase scheme update the KPIs and charts together for executive-style monitoring.",
                "Filter cabang, tipe unit, sumber pelanggan, dan skema pembelian memperbarui KPI dan grafik secara bersamaan untuk pemantauan ala eksekutif.",
              ),
            },
          ],
        },
      ],
    },
  ],
  final: {
    eyebrow: L("LIVE TABLEAU DASHBOARD", "DASHBOARD TABLEAU LIVE"),
    title: L("EXPLORE THE SALES DASHBOARD", "JELAJAHI DASHBOARD PENJUALAN"),
    cta: L("OPEN LIVE TABLEAU", "BUKA TABLEAU LIVE"),
  },
  next: "sales-operational-reporting",
};

/* ========================================================================== SALES REPORTING */

const REPO = "https://github.com/FajriAnnor/automated-sales-reporting";
const S = "/images/projects/sales";

const sales: CaseStudy = {
  slug: "sales-operational-reporting",
  index: "02",
  eyebrow: L("DATA AUTOMATION / BUSINESS REPORTING", "OTOMASI DATA / PELAPORAN BISNIS"),
  title: L("Automated Sales Reporting", "Pelaporan Penjualan Otomatis"),
  intro: L(
    "A JavaScript and Node.js pipeline that automates sales data validation, cleaning, transformation, and structured Excel reporting from intentionally imperfect synthetic records.",
    "Pipeline JavaScript dan Node.js yang mengotomatiskan validasi, pembersihan, transformasi data penjualan, dan pelaporan Excel terstruktur dari catatan sintetis yang sengaja dibuat tidak sempurna.",
  ),
  meta: [
    { label: L("Tools", "Perangkat"), value: L("JavaScript, Node.js, ExcelJS") },
    { label: L("Category", "Kategori"), value: L("Data Automation / Business Reporting", "Otomasi Data / Pelaporan Bisnis") },
    { label: L("Dataset", "Dataset"), value: L("Synthetic · 255 source rows", "Sintetis · 255 baris sumber") },
    { label: L("Output", "Output"), value: L("Excel workbook · 7 sheets", "Workbook Excel · 7 sheet") },
  ],
  tags: ["JavaScript", "Node.js", "ExcelJS", "Microsoft Excel", "Data Validation"],
  notice: L(
    "All records used in this public case study are synthetic and intentionally include data-quality issues for demonstration purposes.",
    "Seluruh catatan dalam studi kasus publik ini bersifat sintetis dan sengaja memuat masalah kualitas data untuk keperluan demonstrasi.",
  ),
  cta: { label: L("VIEW GITHUB PROJECT", "LIHAT PROYEK GITHUB"), href: REPO },
  heroFigure: fig(`${S}/overview-report.png`, 862, 556, L("Excel executive summary generated by the automated sales reporting pipeline", "Executive summary Excel yang dihasilkan pipeline pelaporan penjualan otomatis"), L("Generated Excel Executive Summary — synthetic demonstration data", "Executive Summary Excel yang dihasilkan — data demonstrasi sintetis")),
  sections: [
    {
      title: L("Overview", "Ringkasan"),
      body: [
        L(
          "Automated Sales Reporting replaces repetitive manual report preparation with a repeatable pipeline. It validates and cleans synthetic sales records, flags duplicates, calculates standardized metrics, and exports a structured multi-sheet Excel workbook. Consistent data quality matters because a report is only as reliable as its records: one invalid date, price, or duplicate order can distort every aggregated figure.",
          "Automated Sales Reporting menggantikan penyusunan laporan manual yang berulang dengan pipeline yang dapat diulang. Pipeline ini memvalidasi dan membersihkan catatan penjualan sintetis, menandai duplikat, menghitung metrik standar, dan mengekspor workbook Excel multi-sheet yang terstruktur. Kualitas data yang konsisten penting karena laporan hanya seandal catatannya: satu tanggal, harga, atau pesanan duplikat yang keliru dapat mengubah setiap angka agregat.",
        ),
      ],
      blocks: [],
    },
    {
      title: L("Business Problem", "Masalah Bisnis"),
      body: [
        L(
          "Sales files often arrive with duplicate orders, missing or inconsistent fields, and totals that do not add up. Fixing them by hand is repetitive, and a missed issue can quietly corrupt aggregated metrics. The synthetic dataset deliberately includes three kinds of problems:",
          "File penjualan sering datang dengan pesanan duplikat, field yang hilang atau tidak konsisten, dan total yang tidak sesuai. Memperbaikinya secara manual berulang-ulang, dan satu masalah yang terlewat dapat diam-diam merusak metrik agregat. Dataset sintetis ini sengaja memuat tiga jenis masalah:",
        ),
      ],
      blocks: [
        {
          type: "cards",
          cols: 3,
          items: [
            { tag: "DUPLICATE_ORDER", title: L("Duplicate Orders", "Pesanan Duplikat"), text: L("Several records share one order ID, sometimes with conflicting values.", "Beberapa catatan memakai satu ID pesanan, kadang dengan nilai yang berkonflik.") },
            { tag: "INVALID_DATE / PRICE", title: L("Missing or Invalid Fields", "Field Hilang atau Tidak Valid"), text: L("Impossible dates, missing prices, and inconsistent IDR formats cannot be validated.", "Tanggal mustahil, harga kosong, dan format IDR tidak konsisten tidak dapat divalidasi.") },
            { tag: "TOTAL_MISMATCH", title: L("Total Mismatch", "Total Tidak Sesuai"), text: L("Reported totals differ from the expected calculation, risking incorrect aggregates.", "Total yang dilaporkan berbeda dari hasil perhitungan, berisiko membuat agregat keliru.") },
          ],
        },
      ],
    },
    {
      title: L("Automated Reporting Workflow", "Alur Pelaporan Otomatis"),
      body: [
        L(
          "One command runs the full path from raw CSV to a review-ready Excel report.",
          "Satu perintah menjalankan seluruh alur dari CSV mentah hingga laporan Excel yang siap ditinjau.",
        ),
      ],
      blocks: [
        {
          type: "workflow",
          items: [
            { icon: "file", title: L("Raw Data", "Data Mentah"), text: L("255 synthetic source rows", "255 baris sumber sintetis") },
            { icon: "validate", title: L("Validate", "Validasi"), text: L("Check dates, prices, totals, IDs", "Cek tanggal, harga, total, ID") },
            { icon: "prepare", title: L("Clean & Deduplicate", "Bersihkan & Deduplikasi"), text: L("Standardize valid rows, isolate the rest", "Standarkan baris valid, pisahkan sisanya") },
            { icon: "aggregate", title: L("Aggregate", "Agregasi"), text: L("Monthly and branch summaries", "Ringkasan bulanan dan cabang") },
            { icon: "spreadsheet", title: L("Export Excel", "Ekspor Excel"), text: L("Seven-sheet workbook via ExcelJS", "Workbook tujuh sheet via ExcelJS") },
          ],
        },
      ],
    },
    {
      title: L("Reporting Snapshot", "Cuplikan Pelaporan"),
      body: [
        L(
          "Results from the synthetic demonstration dataset — not company performance figures.",
          "Hasil dari dataset demonstrasi sintetis — bukan angka kinerja perusahaan.",
        ),
      ],
      blocks: [
        {
          type: "metrics",
          cols: 3,
          items: [
            { label: L("Raw Input Rows", "Baris Input Mentah"), value: L("255"), note: L("Synthetic source records", "Catatan sumber sintetis") },
            { label: L("Valid Orders", "Pesanan Valid"), value: L("228"), note: L("Accepted into the reporting layer", "Diterima ke lapisan pelaporan") },
            { label: L("Rejected Rows", "Baris Ditolak"), value: L("27"), note: L("Held back for review", "Ditahan untuk ditinjau") },
            { label: L("Duplicate / Conflicting IDs", "ID Duplikat / Berkonflik"), value: L("15"), note: L("Included in the 27 rejected rows", "Termasuk dalam 27 baris ditolak") },
            { label: L("Validation Rate", "Tingkat Validasi"), value: L("89.41%", "89,41%"), note: L("228 of 255 rows accepted", "228 dari 255 baris diterima") },
            { label: L("Recognized Sales", "Penjualan Diakui"), value: L("Rp 86.406.000"), note: L("Paid, non-cancelled orders; not gross order value", "Pesanan lunas tidak dibatalkan; bukan nilai pesanan bruto") },
          ],
        },
      ],
    },
    {
      title: L("Outcome & Reproducibility", "Hasil & Reproduktibilitas"),
      body: [
        L(
          "What the automation demonstrates. This is a synthetic demonstration; no time savings, ROI, or business impact is claimed.",
          "Hal yang didemonstrasikan oleh otomasi ini. Ini adalah demonstrasi sintetis; tidak ada klaim penghematan waktu, ROI, atau dampak bisnis.",
        ),
      ],
      blocks: [
        {
          type: "cards",
          cols: 3,
          items: [
            {
              title: L("Repeatable", "Dapat Diulang"),
              text: L(
                "npm run demo rebuilds the data, validation, summaries, and workbook locally, and the repository includes automated tests.",
                "npm run demo membangun ulang data, validasi, ringkasan, dan workbook secara lokal, dan repositori menyertakan pengujian otomatis.",
              ),
            },
            {
              title: L("Quality-controlled", "Terkendali Kualitasnya"),
              text: L(
                "Validation and duplicate detection keep rejected rows visible instead of letting them distort standardized sales metrics.",
                "Validasi dan deteksi duplikat menjaga baris yang ditolak tetap terlihat, bukan membiarkannya mengubah metrik penjualan standar.",
              ),
            },
            {
              title: L("Business-ready", "Siap Digunakan"),
              text: L(
                "Exports a seven-sheet Excel report: Executive Summary, Monthly and Branch Reports, Clean Orders, Quality Review, Raw Inputs, and Definitions.",
                "Mengekspor laporan Excel tujuh sheet: Executive Summary, Laporan Bulanan dan Cabang, Clean Orders, Quality Review, Raw Inputs, dan Definitions.",
              ),
            },
          ],
        },
        { type: "link", label: L("Browse the source code and documentation", "Jelajahi kode sumber dan dokumentasi"), href: REPO },
      ],
    },
  ],
  final: {
    eyebrow: L("SOURCE CODE / AUTOMATION", "KODE SUMBER / OTOMASI"),
    title: L("EXPLORE THE REPORTING PIPELINE", "JELAJAHI PIPELINE PELAPORAN"),
    cta: L("VIEW GITHUB PROJECT", "LIHAT PROYEK GITHUB"),
  },
  next: "rto-request-monitoring",
};

/* ========================================================================== RTO */

const RTO_DEMO = "https://rto-request-monitoring.vercel.app";

const rto: CaseStudy = {
  slug: "rto-request-monitoring",
  index: "03",
  eyebrow: L("PROJECT 03 / OPERATIONS ANALYTICS", "PROYEK 03 / ANALITIK OPERASIONAL"),
  title: L("RTO Request Monitoring", "RTO Request Monitoring"),
  intro: L(
    "An interactive operational dashboard for tracking rental-to-own requests, approval stages, document completeness, processing backlog, and request aging using synthetic data.",
    "Dashboard operasional interaktif untuk melacak pengajuan rental-to-own, tahapan persetujuan, kelengkapan dokumen, backlog proses, dan usia pengajuan menggunakan data sintetis.",
  ),
  meta: [
    { label: L("Tools", "Perangkat"), value: L("Excel, PostgreSQL, SQL, JavaScript") },
    { label: L("Category", "Kategori"), value: L("Operations Analytics / Process Monitoring", "Analitik Operasional / Pemantauan Proses") },
    { label: L("Dataset", "Dataset"), value: L("Synthetic · 623 requests", "Sintetis · 623 pengajuan") },
    { label: L("Status", "Status"), value: L("Live portfolio demo", "Demo portofolio live") },
  ],
  tags: ["Excel", "PostgreSQL", "SQL", "JavaScript", "Reporting", "Process Monitoring"],
  notice: L(
    "Live portfolio demo using synthetic data only. This is not an official production system and does not contain confidential WEDISON or customer data.",
    "Demo portofolio live yang hanya menggunakan data sintetis. Ini bukan sistem produksi resmi dan tidak memuat data rahasia WEDISON maupun pelanggan.",
  ),
  cta: { label: L("OPEN LIVE DEMO", "BUKA DEMO LIVE"), href: RTO_DEMO },
  heroFigure: fig(
    "/images/projects/rto/dashboard.png",
    1918,
    946,
    L("RTO Request Monitoring dashboard demo showing synthetic request KPIs", "Demo dashboard RTO Request Monitoring yang menampilkan KPI pengajuan sintetis"),
    L("RTO Request Monitoring dashboard — synthetic demonstration data", "Dashboard RTO Request Monitoring — data demonstrasi sintetis"),
  ),
  sections: [
    {
      title: L("Overview", "Ringkasan"),
      body: [
        L(
          "RTO Request Monitoring is an interactive operational analytics demo for monitoring the flow of rental-to-own requests from submission through document review and approval. It brings request volume, workflow stage, backlog, and aging signals into one monitoring view.",
          "RTO Request Monitoring adalah demo analitik operasional interaktif untuk memantau alur pengajuan rental-to-own sejak pengajuan, pemeriksaan dokumen, hingga persetujuan. Dashboard ini menyatukan volume pengajuan, tahapan alur kerja, backlog, dan indikator usia proses dalam satu tampilan pemantauan.",
        ),
      ],
      blocks: [],
    },
    {
      title: L("Business Problem", "Masalah Bisnis"),
      body: [
        L(
          "Operational requests can become difficult to track when approval status, document completeness, and backlog are spread across manual files or separate records. This can limit day-to-day visibility into which requests need review or follow-up.",
          "Pengajuan operasional dapat sulit dilacak ketika status persetujuan, kelengkapan dokumen, dan backlog tersebar di file manual atau catatan terpisah. Kondisi ini dapat membatasi visibilitas harian atas pengajuan yang perlu ditinjau atau ditindaklanjuti.",
        ),
      ],
      blocks: [],
    },
    {
      title: L("Data Structure", "Struktur Data"),
      body: [
        L(
          "The dataset uses dummy request-level fields to model the workflow without exposing customer identities or confidential operational records.",
          "Dataset menggunakan field dummy pada tingkat pengajuan untuk memodelkan alur kerja tanpa mengekspos identitas pelanggan atau catatan operasional rahasia.",
        ),
      ],
      blocks: [
        {
          type: "chips",
          items: ["request_id", "request_date", "branch", "vehicle_model", "customer_code", "rto_status", "approval_stage", "document_status", "aging_days", "processed_by", "approval_date"].map((f) => L(f)),
        },
      ],
    },
    {
      title: L("Dashboard Snapshot", "Cuplikan Dashboard"),
      body: [
        L(
          "Key indicators visible in the live demo's overview. All values come from the synthetic dataset and are shown only to illustrate the monitoring approach.",
          "Indikator utama yang terlihat pada ringkasan demo live. Seluruh nilai berasal dari dataset sintetis dan hanya untuk menggambarkan pendekatan pemantauan.",
        ),
      ],
      blocks: [
        {
          type: "metrics",
          items: [
            { label: L("Total Requests", "Total Pengajuan"), value: L("623"), note: L("All synthetic submissions", "Seluruh pengajuan sintetis") },
            { label: L("Pending Approval", "Menunggu Persetujuan"), value: L("20"), note: L("3.2% of total volume", "3,2% dari total volume") },
            { label: L("Approved Requests", "Pengajuan Disetujui"), value: L("553"), note: L("88.8% of total volume", "88,8% dari total volume") },
            { label: L("Need Revision", "Perlu Revisi"), value: L("6"), note: L("Requires follow-up", "Perlu tindak lanjut") },
            { label: L("Overdue Requests", "Pengajuan Terlambat"), value: L("2"), note: L("Active cases beyond H+1", "Kasus aktif melewati H+1") },
            { label: L("Avg Processing Days", "Rata-rata Hari Proses"), value: L("0.9", "0,9"), note: L("Resolved requests · business days", "Pengajuan selesai · hari kerja") },
          ],
        },
      ],
    },
    {
      title: L("Dashboard Goals", "Tujuan Dashboard"),
      body: [L("The monitoring view is designed around practical workflow questions for operations teams.", "Tampilan pemantauan dirancang berdasarkan pertanyaan alur kerja yang praktis bagi tim operasional.")],
      blocks: [
        {
          type: "list",
          items: [
            L("Monitor total incoming requests", "Memantau total pengajuan masuk"),
            L("Track pending approvals", "Melacak persetujuan yang tertunda"),
            L("Identify processing backlog", "Mengidentifikasi backlog proses"),
            L("Highlight aging requests", "Menyoroti pengajuan yang menua"),
            L("Improve visibility of document completeness", "Meningkatkan visibilitas kelengkapan dokumen"),
            L("Support faster follow-up", "Mendukung tindak lanjut yang lebih cepat"),
          ],
        },
      ],
    },
    {
      title: L("Tools", "Perangkat"),
      body: [L("The toolset supports a staged path from initial tracking to structured querying and dashboard monitoring.", "Perangkat mendukung tahapan dari pelacakan awal hingga kueri terstruktur dan pemantauan dashboard.")],
      blocks: [
        {
          type: "list",
          items: [
            L("Excel for initial tracking and reporting", "Excel untuk pelacakan dan pelaporan awal"),
            L("PostgreSQL for the structured data storage concept", "PostgreSQL untuk konsep penyimpanan data terstruktur"),
            L("SQL for querying request status", "SQL untuk mengueri status pengajuan"),
            L("JavaScript for potential data cleaning or integration", "JavaScript untuk potensi pembersihan atau integrasi data"),
            L("Dashboard visualization for operational monitoring", "Visualisasi dashboard untuk pemantauan operasional"),
          ],
        },
      ],
    },
    {
      title: L("Status", "Status"),
      body: [],
      blocks: [
        {
          type: "callout",
          text: L(
            "This project is a deployed interactive portfolio demo, not an official production system. All displayed values are synthetic and are included only to demonstrate the monitoring approach; no business outcomes are claimed.",
            "Proyek ini merupakan demo portofolio interaktif yang telah di-deploy, bukan sistem produksi resmi. Seluruh nilai yang ditampilkan bersifat sintetis dan hanya digunakan untuk menunjukkan pendekatan pemantauan; tidak ada klaim hasil bisnis.",
          ),
        },
        { type: "link", label: L("Open the live demo", "Buka demo live"), href: RTO_DEMO },
      ],
    },
  ],
  final: { eyebrow: L("Live Demo"), title: L("TRY THE MONITORING DASHBOARD", "COBA DASHBOARD PEMANTAUAN") },
  next: "wedison-operations-analytics",
};

export const caseStudies: CaseStudy[] = [wedison, sales, rto];
export const getCaseStudy = (slug: string) => caseStudies.find((c) => c.slug === slug);
