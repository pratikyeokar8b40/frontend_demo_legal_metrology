import React, { Component, useEffect, useMemo, useState } from "react";
import { Link, Redirect, Route, Switch, useLocation } from "wouter";
import {
  AlertTriangle, ArrowRight, BarChart3, Bell, Camera, Check, Link2,
  ChevronRight, CircleHelp, ClipboardList, Clock3, Database, Download,
  Eye, FileCheck2, FileText, Image as ImageIcon, LayoutDashboard, LogIn,
  MapPin, Menu, MoreHorizontal, Printer, RefreshCw, Search, Settings as SettingsIcon,
  SlidersHorizontal, UploadCloud, X,
} from "lucide-react";
import { audits as seedAudits, evidence as seedEvidence, featureGroups, navItems, reports as seedReports, violations } from "./data";
import ScannerPage from "./ScannerPage";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Legal Metrology Scanner caught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "40px", maxWidth: "600px", margin: "60px auto", fontFamily: "sans-serif", background: "#fff", borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
          <h2 style={{ color: "#ad4b43", marginTop: 0 }}>Application Error</h2>
          <p style={{ color: "#4a5568" }}>Something went wrong while rendering the register.</p>
          <pre style={{ background: "#f4f7fa", padding: "12px", borderRadius: "4px", fontSize: "12px", overflowX: "auto" }}>
            {this.state.error?.toString()}
          </pre>
          <button style={{ marginTop: "16px", padding: "8px 16px", background: "#008ba3", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }} onClick={() => { localStorage.clear(); window.location.href = "/"; }}>
            Reset & Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const iconMap = { LayoutDashboard, ClipboardList, Image: ImageIcon, FileText, ChartNoAxesCombined: BarChart3, Camera };
const iconFor = (name) => iconMap[name] || FileText;
const formatDate = (value) => new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const readStore = (key, fallback) => {
  try {
    const val = localStorage.getItem(key);
    return val !== null ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
};

function ProductVisual({ kind = "can", small = false }) {
  return (
    <div className={`thumb-scene ${small ? "small" : ""} ${kind === "origin" || kind === "listing" ? "alt" : ""}`}>
      {kind === "can" || kind === "origin" || kind === "listing" ? (
        <div className="product-can">
          <div className="can-copy"><b>sparkle</b><em>HYDRATION</em><span>750 ml · ENERGY DRINK</span></div>
          {!small && <><div className="box-mark origin">ORIGIN</div><div className="box-mark usp">USP</div></>}
        </div>
      ) : (
        <div className={`product-can ${kind}`}>
          <div className="can-copy">
            <b>{kind === "rice" ? "kaveri" : kind === "flask" ? "homepro" : "veda"}</b>
            <em>{kind === "rice" ? "BASMATI" : kind === "flask" ? "STEEL" : "HERBAL"}</em>
            <span>{kind === "rice" ? "5 kg" : kind === "flask" ? "1000 ml" : "200 ml"}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const type = status === "Violation" || status === "Mismatch" ? "violation" : status === "Compliant" || status === "Clear" ? "compliant" : status === "Needs review" || status === "Flagged" ? "review" : "neutral";
  return <span className={`status-badge ${type}`} data-testid={`status-${(status || "").toLowerCase().replaceAll(" ", "-")}`}>{status}</span>;
}

function IntakeDrawer({ open, onClose }) {
  const [intakeChoice, setIntakeChoice] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [intakeStatus, setIntakeStatus] = useState("");
  const queueIntake = (intake) => {
    localStorage.setItem("lm-pending-intake", JSON.stringify({ ...intake, queuedAt: new Date().toISOString() }));
    setIntakeStatus(intake.type === "field" ? "Field capture queued for review." : intake.type === "package" ? "Package image queued for review." : "Image URL saved for marketplace review.");
  };
  const openFilePicker = (type) => {
    document.getElementById(type === "field" ? "field-capture-input" : "package-image-input")?.click();
  };
  const handleFile = (event, type) => {
    const file = event.target.files?.[0];
    if (!file) return;
    queueIntake({ type, name: file.name, size: file.size, mimeType: file.type });
    event.target.value = "";
  };
  const handleUrl = () => {
    try {
      const parsed = new URL(imageUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Invalid protocol");
      queueIntake({ type: "url", url: parsed.href });
      setImageUrl("");
      setIntakeChoice(null);
    } catch {
      setIntakeStatus("Enter a valid http or https image URL.");
    }
  };
  return (
    <>
      <div className={`drawer-backdrop ${open ? "visible" : ""}`} onClick={onClose} aria-hidden="true" />
      <aside id="intake-drawer" className={`intake-drawer ${open ? "open" : ""}`} aria-label="Audit intake sidebar" aria-hidden={!open}>
        <div className="drawer-header">
          <div>
            <p className="eyebrow">Evidence intake</p>
            <h2>Start a new review</h2>
            <p>Bring in a package or marketplace image. The register keeps every source tied to its audit record.</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close intake panel" data-testid="button-close-intake"><X size={18} /></button>
        </div>
        <div className="drawer-section">
          <span className="drawer-label">Choose a source</span>
          <div className="drawer-actions">
            <button className={`drawer-action ${intakeChoice === "url" ? "selected" : ""}`} onClick={() => { setIntakeChoice(intakeChoice === "url" ? null : "url"); setIntakeStatus(""); }} aria-pressed={intakeChoice === "url"} data-testid="button-intake-image-url">
              <Link2 size={17} />
              <span><strong>Image URL</strong><small>Review a marketplace listing image</small></span>
            </button>
            <button className="drawer-action" onClick={() => openFilePicker("package")} data-testid="button-intake-package-image">
              <UploadCloud size={17} />
              <span><strong>Package image</strong><small>Upload a label or package photo</small></span>
            </button>
            <button className="drawer-action" onClick={() => openFilePicker("field")} data-testid="button-intake-field-capture">
              <Camera size={17} />
              <span><strong>Field capture</strong><small>Use the device camera in the field</small></span>
            </button>
          </div>
          {intakeChoice === "url" && (
            <div className="intake-url-form drawer-url-form">
              <label htmlFor="image-url-input">Image URL</label>
              <div className="intake-url-row">
                <input id="image-url-input" type="url" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://marketplace.example/label.jpg" onKeyDown={(event) => event.key === "Enter" && handleUrl()} data-testid="input-intake-image-url" />
                <button className="button primary" onClick={handleUrl} data-testid="button-save-image-url">Use URL</button>
              </div>
            </div>
          )}
          <input id="package-image-input" type="file" accept="image/*" hidden onChange={(event) => handleFile(event, "package")} />
          <input id="field-capture-input" type="file" accept="image/*" capture="environment" hidden onChange={(event) => handleFile(event, "field")} />
          {intakeStatus && <p className="intake-status drawer-status" role="status"><Check size={14} /> {intakeStatus}</p>}
        </div>
        <div className="drawer-note">
          <Check size={16} />
          <div>
            <strong>Evidence stays review-ready</strong>
            <p>Each capture is queued with its source, timestamp, and officer record for the next compliance check.</p>
          </div>
        </div>
      </aside>
    </>
  );
}

function Shell({ children, onLogout }) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [intakeOpen, setIntakeOpen] = useState(false);
  const current = navItems.find((item) => item.href !== "/" && location.startsWith(item.href)) || navItems[0];
  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <button className="brand brand-trigger" onClick={() => setIntakeOpen(!intakeOpen)} aria-expanded={intakeOpen} aria-controls="intake-drawer" aria-label="Open audit intake sidebar" data-testid="button-open-intake">
          <span className="brand-mark">LM</span>
          <span><h1>Metrology Register</h1><small>Click LM to add evidence</small></span>
        </button>
        <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open navigation" data-testid="button-mobile-menu">
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
        <nav className="nav">
          <div className="nav-section">Working register</div>
          {navItems.filter((item) => item.icon !== "Image").map((item) => {
            const Icon = iconFor(item.icon);
            return (
              <Link key={item.href} href={item.href} className={`nav-link ${current.href === item.href ? "active" : ""}`} onClick={() => setMenuOpen(false)} data-testid={`link-${item.label.toLowerCase().replaceAll(" ", "-")}`}>
                <Icon className="nav-icon" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="nav-section">Administration</div>
          <Link href="/features" className={`nav-link ${location === "/features" ? "active" : ""}`} onClick={() => setMenuOpen(false)} data-testid="link-system-features">
            <SlidersHorizontal className="nav-icon" />
            <span>System features</span>
          </Link>
          <Link href="/settings" className={`nav-link ${location === "/settings" ? "active" : ""}`} onClick={() => setMenuOpen(false)} data-testid="link-settings">
            <SettingsIcon className="nav-icon" />
            <span>Settings</span>
          </Link>
        </nav>
        <div className="sidebar-footer">
          <div className="officer">
            <div className="avatar">AK</div>
            <div><strong>Asha Kulkarni</strong><span>Field officer · Pune</span></div>
            <button className="signout-button" onClick={onLogout} aria-label="Sign out" data-testid="button-sign-out">
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div className="crumb">Legal Metrology / <b>{current.label}</b></div>
          <div className="top-actions">
            <span className="sync-label"><i className="sync-dot" /> Register synced 2 min ago</span>
            <button className="icon-button" aria-label="Help" data-testid="button-help"><CircleHelp size={17} /></button>
            <button className="icon-button" aria-label="Notifications" data-testid="button-notifications"><Bell size={17} /></button>
          </div>
        </header>
        {children}
      </main>
      <IntakeDrawer open={intakeOpen} onClose={() => setIntakeOpen(false)} />
    </div>
  );
}

function PageHeading({ eyebrow, title, subtitle, action }) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="page-title">{title}</h2>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function Dashboard() {
  const [, setLocation] = useLocation();
  return (
    <div className="content dashboard-page">
      <PageHeading eyebrow="Officer overview · 18 June 2025" title="Good morning, Asha." subtitle="Your register is current. Three audits need an enforcement decision before the afternoon field round." action={<button className="button primary" onClick={() => setLocation("/scan")} data-testid="button-open-demo-audit"><Camera size={15} /> Launch AI Scanner</button>} />
      <div className="grid stats">
        <div className="card stat-card"><span className="stat-rule" /><span className="stat-label">Audits this month</span><strong className="stat-number">47</strong><span className="stat-note good">↑ 12 from May</span></div>
        <div className="card stat-card"><span className="stat-rule" /><span className="stat-label">Average compliance</span><strong className="stat-number">71.4</strong><span className="stat-note">out of 100 points</span></div>
        <div className="card stat-card"><span className="stat-rule" style={{ background: "var(--red)" }} /><span className="stat-label">Open violations</span><strong className="stat-number">12</strong><span className="stat-note warn">3 critical findings</span></div>
        <div className="card stat-card"><span className="stat-rule" style={{ background: "var(--green)" }} /><span className="stat-label">Evidence integrity</span><strong className="stat-number">100%</strong><span className="stat-note good">All hashes verified</span></div>
      </div>
      <div className="grid two" style={{ marginTop: 18 }}>
        <div className="card intake">
          <div className="intake-copy">
            <p className="eyebrow">Audit intake</p>
            <h3>Start with the evidence. The register does the rest.</h3>
            <p>Click the LM mark in the upper-left to open the intake panel. Choose a marketplace URL, package image, or field capture without leaving your register.</p>
            <div className="intake-launch-note"><span className="brand-mark mini">LM</span><span><strong>Open intake from the logo</strong><small>Available from every register view</small></span></div>
          </div>
          <div className="intake-meta">
            <div className="meta-line"><span>Field queue</span><strong>4 captures ready</strong></div>
            <div className="meta-line"><span>Last capture</span><strong>18 Jun · Pune</strong></div>
            <div className="meta-line"><span>Offline queue</span><strong>0 pending uploads</strong></div>
            <div className="meta-line"><span>Rule set</span><strong>PCR 2011 · v2.4</strong></div>
          </div>
        </div>
        <div className="card score-panel">
          <div className="section-head">
            <div><h3>Compliance index</h3><p>Current month, all source types</p></div>
            <BarChart3 size={18} color="var(--blue)" />
          </div>
          <div className="score-layout">
            <div className="score-ring">
              <div className="score-ring-content"><strong>71.4</strong><span>/ 100</span></div>
            </div>
            <div className="score-copy">
              <h4>Stable, with a clear gap</h4>
              <p>Origin declarations and unit sale price remain the two most common causes of deduction.</p>
            </div>
          </div>
          <div className="score-caption">Deduction model: critical −35 · major −20 · minor −5</div>
        </div>
      </div>
      <div className="grid two" style={{ marginTop: 18 }}>
        <div className="card activity-card">
          <div className="section-head">
            <div><h3>Recent activity</h3><p>Immutable events from your register</p></div>
            <Link href="/audits" className="button ghost" data-testid="link-view-register">View register <ArrowRight size={14} /></Link>
          </div>
          <div className="activity-list">
            <div className="activity-row"><i className="activity-marker red" /><div className="activity-main"><strong>Violation recorded · Sparkle Hydration Energy Drink</strong><span>4 findings · QuickBite Global Retail Pvt. Ltd.</span></div><span className="activity-time">10:44</span></div>
            <div className="activity-row"><i className="activity-marker green" /><div className="activity-main"><strong>Audit cleared · Kaveri Basmati Rice</strong><span>Score 92 · Batch catalog · Nashik</span></div><span className="activity-time">11:06</span></div>
            <div className="activity-row"><i className="activity-marker" /><div className="activity-main"><strong>Evidence synced from field device</strong><span>2 images · Satara inspection route</span></div><span className="activity-time">09:31</span></div>
          </div>
        </div>
        <div className="card activity-card">
          <div className="section-head">
            <div><h3>Attention today</h3><p>Items requiring an officer decision</p></div>
            <AlertTriangle size={18} color="var(--ochre)" />
          </div>
          <div className="callout">
            <strong>Show Cause Notice ready</strong>
            <p>Sparkle Hydration Energy Drink has 4 findings and a verified evidence chain. Generate the Section 15 / Rule 32 report when ready.</p>
            <Link href="/reports" className="button ghost" style={{ paddingLeft: 0, marginTop: 10 }} data-testid="link-review-reports">Review report queue <ChevronRight size={14} /></Link>
          </div>
          <div style={{ marginTop: 18 }} className="meta-line"><span>Next field route</span><strong>Camp, Pune · 14:00</strong></div>
        </div>
      </div>
    </div>
  );
}

function ScanLineIcon() { return <FileCheck2 size={15} />; }

function AuditsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [source, setSource] = useState("All sources");
  const [, setLocation] = useLocation();
  const auditData = useMemo(() => readStore("lm-audits", seedAudits), []);
  const filtered = auditData.filter((audit) => {
    const haystack = `${audit.product} ${audit.id} ${audit.location} ${audit.sku}`.toLowerCase();
    return haystack.includes(search.toLowerCase()) && (status === "All statuses" || audit.status === status) && (source === "All sources" || audit.source === source);
  });
  return (
    <div className="content">
      <PageHeading eyebrow="Working register" title="Audit register" subtitle="Search every inspection, marketplace check, and catalog review held in this officer account." action={<button className="button primary" onClick={() => setLocation("/audits/demo-energy-drink")} data-testid="button-new-audit"><Camera size={15} /> New audit</button>} />
      <div className="card" style={{ padding: 17 }}>
        <div className="toolbar">
          <div className="search-field">
            <Search />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search product, audit ID, location" data-testid="input-audit-search" />
          </div>
          <select className="filter-select" value={status} onChange={(e) => setStatus(e.target.value)} data-testid="select-audit-status">
            <option>All statuses</option>
            <option>Violation</option>
            <option>Needs review</option>
            <option>Compliant</option>
          </select>
          <select className="filter-select" value={source} onChange={(e) => setSource(e.target.value)} data-testid="select-audit-source">
            <option>All sources</option>
            <option>Field capture</option>
            <option>Marketplace scan</option>
            <option>Batch catalog</option>
          </select>
          <button className="button secondary" onClick={() => { setSearch(""); setStatus("All statuses"); setSource("All sources"); }} data-testid="button-clear-filters">
            <RefreshCw size={14} /> Reset
          </button>
        </div>
        <div className="register-summary"><strong>{filtered.length}</strong> records match the current view <span>·</span> last sync 18 Jun 2025</div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Audit / product</th><th>Source</th><th>Captured</th><th>Location</th><th>Score</th><th>Status</th><th /></tr>
            </thead>
            <tbody>
              {filtered.map((audit) => (
                <tr key={audit.id}>
                  <td><div className="product-cell"><strong>{audit.product}</strong><span>{audit.id} · {audit.sku}</span></div></td>
                  <td>{audit.source}</td>
                  <td className="mono">{formatDate(audit.capturedAt)}</td>
                  <td>{audit.location}</td>
                  <td><strong className="mono" style={{ color: audit.score < 60 ? "var(--red)" : audit.score < 80 ? "var(--ochre)" : "var(--green)" }}>{audit.score}</strong></td>
                  <td><StatusBadge status={audit.status} /></td>
                  <td><button className="button ghost" onClick={() => setLocation(audit.id === "AUD-2025-0047" ? "/audits/demo-energy-drink" : "/audits")} data-testid={`button-open-audit-${audit.id}`}><Eye size={14} /> Open</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && (
            <div className="empty">
              <Search size={22} />
              <h3>No audit records match</h3>
              <p>Try a broader product name or reset the filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailPage() {
  const [, setLocation] = useLocation();
  const [reportCreated, setReportCreated] = useState(readStore("lm-report-created", false));
  const createReport = () => { localStorage.setItem("lm-report-created", "true"); setReportCreated(true); setLocation("/reports"); };
  return (
    <div className="content">
      <PageHeading eyebrow="Audit AUD-2025-0047 · Field capture" title={<span className="audit-title-row">Sparkle Hydration Energy Drink <StatusBadge status="Violation" /></span>} subtitle="A 750 ml can reviewed against Packaged Commodities Rules, 2011. Captured in Pune on 18 June 2025 by Asha Kulkarni." action={<button className="button primary" onClick={createReport} data-testid="button-generate-detail-report"><FileText size={15} /> {reportCreated ? "Open report queue" : "Generate report"}</button>} />
      <div className="detail-grid">
        <div className="card product-evidence">
          <div className="section-head">
            <div><h3>Annotated evidence</h3><p>Front panel · Tier 1 field capture</p></div>
            <button className="button ghost" onClick={() => setLocation("/evidence")} data-testid="link-all-evidence">All evidence <ArrowRight size={14} /></button>
          </div>
          <div className="evidence-visual"><ProductVisual /></div>
          <div className="visual-caption"><span><span className="status-badge violation">2 flagged regions</span></span><span className="mono">EV-0047-01 · 10:42:18</span></div>
        </div>
        <div className="detail-side">
          <div className="card identity-card">
            <h3>Pack and listing identity</h3>
            <div className="identity-grid">
              <div><div className="field-label">Respondent</div><div className="field-value">QuickBite Global Retail Pvt. Ltd.</div></div>
              <div><div className="field-label">Inspector</div><div className="field-value">Asha Kulkarni</div></div>
              <div><div className="field-label">Pack origin</div><div className="field-value" style={{ color: "var(--red)" }}>Vietnam</div></div>
              <div><div className="field-label">Listing origin</div><div className="field-value" style={{ color: "var(--red)" }}>India</div></div>
              <div><div className="field-label">Quantity</div><div className="field-value">750 ml</div></div>
              <div><div className="field-label">MRP</div><div className="field-value">₹125.00</div></div>
              <div><div className="field-label">Unit sale price</div><div className="field-value" style={{ color: "var(--red)" }}>Not declared</div></div>
              <div><div className="field-label">Batch</div><div className="field-value mono">SHD-VN-2405</div></div>
            </div>
          </div>
          <div className="hash-strip"><span>Evidence hash</span><span className="mono">sha256:4d61c48a2f90…a8c2</span><Check size={15} color="var(--green)" /></div>
        </div>
      </div>
      <div className="card finding-card" style={{ marginTop: 18 }}>
        <div className="section-head"><div><h3>Statutory findings</h3><p>Four checks recorded. One declaration meets the measured standard.</p></div><span className="mono" style={{ color: "var(--red)" }}>45 / 100</span></div>
        <div className="finding-list">
          {violations.map((item, index) => (
            <div className="finding" key={item.rule}>
              <div className="finding-head"><strong>{index + 1}. {item.requirement}</strong><StatusBadge status={item.status} /></div>
              <p>{item.finding}</p>
              <div className="finding-meta"><span>{item.rule}</span><span style={{ color: item.deduction !== "0" ? "var(--red)" : "var(--green)" }}>{item.deduction === "0" ? "No deduction" : `${item.deduction} points`}</span></div>
            </div>
          ))}
        </div>
      </div>
      <div className="card" style={{ padding: 22, marginTop: 18 }}>
        <div className="section-head"><div><h3>Cross-audit mismatches</h3><p>Listing metadata compared with OCR-derived pack declarations</p></div><StatusBadge status="Mismatch" /></div>
        <div className="grid two">
          <div className="callout"><strong>Origin discrepancy · Rule 6(10)</strong><p>QuickBite listing says “Made in India”; the physical can reads “Product of Vietnam”. Registered importer detail was not found in the visible panel.</p></div>
          <div className="callout" style={{ borderColor: "var(--red)", background: "var(--red-soft)" }}><strong style={{ color: "#823c36" }}>Declaration gap · Rule 6(11)</strong><p style={{ color: "#823c36" }}>MRP and quantity allow a calculated USP of ₹0.17/ml, but no unit sale price appears on pack.</p></div>
        </div>
      </div>
    </div>
  );
}

function ReportsPage() {
  const [reports, setReports] = useState(() => readStore("lm-reports", seedReports));
  const [selected, setSelected] = useState(reports[0] || seedReports[0]);
  const [generated, setGenerated] = useState(false);
  useEffect(() => { localStorage.setItem("lm-reports", JSON.stringify(reports)); }, [reports]);
  const generate = () => { setGenerated(true); const next = reports.find((item) => item.auditId === "AUD-2025-0047") || seedReports[0]; setSelected(next); };
  const download = () => {
    const rows = violations.map((item) => `<tr><td>${item.requirement}</td><td>${item.finding}</td><td>${item.rule}</td><td>${item.status}</td></tr>`).join("");
    const body = `<!doctype html><html><head><meta charset="utf-8"><title>${selected.reference} · Show Cause Notice</title><style>body{font-family:Arial,sans-serif;color:#26333a;max-width:900px;margin:48px auto;line-height:1.5}h1{font-size:26px;text-align:center;border:2px solid #c8564f;padding:14px}h2{font-size:18px;border-bottom:1px solid #d7ddd9;padding-bottom:8px;margin-top:28px}table{border-collapse:collapse;width:100%;font-size:13px}th,td{border:1px solid #b8c4c2;padding:9px;text-align:left;vertical-align:top}th{background:#264a62;color:white}.meta{display:grid;grid-template-columns:1fr 1fr;gap:14px;border-bottom:1px solid #d7ddd9;padding-bottom:18px}.meta b{display:block;color:#64747a;font-size:11px;text-transform:uppercase;letter-spacing:.08em}.footer{display:flex;justify-content:space-between;border-top:2px solid #3f8b6c;margin-top:30px;padding-top:16px;font-size:13px}</style></head><body><p style="text-align:center;font-weight:bold">GOVERNMENT OF MAHARASHTRA · OFFICE OF THE CONTROLLER OF LEGAL METROLOGY</p><h1>SHOW CAUSE NOTICE UNDER SECTION 15 OF THE LEGAL METROLOGY ACT, 2009</h1><p style="text-align:center">Read with Rule 32 of the Legal Metrology (Packaged Commodities) Rules, 2011</p><div class="meta"><div><b>Notice reference</b>${selected.reference}</div><div><b>Issued at</b>18 June 2025 · 11:04 IST</div><div><b>Respondent</b>${selected.respondent}</div><div><b>Audit record</b>${selected.auditId}</div><div><b>Product</b>${selected.product} · 750 ml can</div><div><b>Place of inspection</b>Pune, Maharashtra</div></div><h2>Subject</h2><p>Notice to show cause why action should not be initiated for non-compliance with declarations required under the Legal Metrology Act, 2009 and the Packaged Commodities Rules, 2011.</p><h2>Findings recorded</h2><table><thead><tr><th>Declaration / check</th><th>Observation</th><th>Provision</th><th>Result</th></tr></thead><tbody>${rows}</tbody></table><h2>Automated compliance scorecard</h2><table><tr><td>Overall LMPC compliance index</td><td><strong>${selected.score} / 100</strong></td><td>Critical deductions −35 · Major deductions −20</td></tr><tr><td>Evidence tier</td><td>Tier 1 · Field</td><td>Two source images and one marketplace record</td></tr></table><h2>Evidence and verification</h2><p>Evidence chain: sha256:4d61c48a2f90f1d85b77…a8c2. The hash was verified against the immutable field capture at the time of report generation.</p><div class="footer"><div><b>Prepared by</b><br>Asha Kulkarni<br>Legal Metrology Officer, Pune</div><div><b>Verification</b><br>Digital register signature on file<br>LM-PUN-AK-2025</div></div></body></html>`;
    const blob = new Blob([body], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selected.reference}.html`;
    a.click();
    URL.revokeObjectURL(url);
    setGenerated(true);
  };
  return (
    <div className="content">
      <PageHeading eyebrow="Enforcement desk" title="Reports" subtitle="Prepare, verify, and print statutory notices from a preserved audit record." action={<button className="button primary" onClick={generate} data-testid="button-generate-report"><FileText size={15} /> Generate report</button>} />
      <div className="report-list print-hide">
        {reports.map((report) => (
          <div className={`report-row ${selected.id === report.id ? "selected" : ""}`} key={report.id}>
            <div><strong>{report.product}</strong><span>{report.reference} · {report.respondent}</span></div>
            <div><span>Issued</span><strong>{report.issuedAt}</strong></div>
            <div><StatusBadge status={report.status === "Ready" ? "Compliant" : "Needs review"} /><strong className="mono" style={{ marginTop: 4 }}>{report.score}/100</strong></div>
            <div className="report-actions"><button className="button secondary" onClick={() => setSelected(report)} data-testid={`button-view-report-${report.id}`}><Eye size={14} /> View</button></div>
          </div>
        ))}
      </div>
      <div className="notice" style={{ marginTop: 19 }}>
        <div className="notice-head">
          <small>Government of Maharashtra · Department of Legal Metrology</small>
          <h2>Show Cause Notice</h2>
          <p>Issued under Section 15 of the Legal Metrology Act, 2009 read with Rule 32 of the Packaged Commodities Rules, 2011</p>
        </div>
        <div className="notice-meta">
          <div><span>Notice reference</span><br /><strong>{selected.reference}</strong></div>
          <div><span>Issued at</span><br /><strong>18 June 2025 · 11:04 IST</strong></div>
          <div><span>Respondent</span><br /><strong>{selected.respondent}</strong></div>
          <div><span>Audit record</span><br /><strong>{selected.auditId}</strong></div>
          <div><span>Product</span><br /><strong>{selected.product} · 750 ml can</strong></div>
          <div><span>Place of inspection</span><br /><strong>Pune, Maharashtra</strong></div>
        </div>
        <h3>Subject</h3>
        <p>Notice to show cause why action should not be initiated for non-compliance with declarations required under the Legal Metrology Act, 2009 and the Packaged Commodities Rules, 2011.</p>
        <h3>Findings recorded</h3>
        <table className="notice-table">
          <thead><tr><th>Declaration / check</th><th>Observation</th><th>Provision</th><th>Result</th></tr></thead>
          <tbody>
            {violations.map((item) => (
              <tr key={item.rule}><td>{item.requirement}</td><td>{item.finding}</td><td>{item.rule}</td><td>{item.status}</td></tr>
            ))}
          </tbody>
        </table>
        <h3>Compliance scorecard</h3>
        <table className="notice-table">
          <tbody>
            <tr><td>Overall LMPC compliance index</td><td><strong>45 / 100</strong></td><td>Critical deductions −35 · Major deductions −20</td></tr>
            <tr><td>Evidence tier</td><td>Tier 1 · Field</td><td>Two source images and one marketplace record</td></tr>
          </tbody>
        </table>
        <h3>Evidence and verification</h3>
        <p>Evidence chain: <span className="mono">sha256:4d61c48a2f90f1d85b77…a8c2</span>. The hash was verified against the immutable field capture at the time of report generation. This document reflects the register as recorded on 18 June 2025.</p>
        <div className="notice-footer">
          <div><strong>Prepared by</strong><br />Asha Kulkarni<br />Legal Metrology Officer, Pune</div>
          <div><strong>Verification</strong><br />Digital register signature on file<br /><span className="mono">LM-PUN-AK-2025</span></div>
        </div>
      </div>
      <div className="print-hide" style={{ display: "flex", gap: 10, marginTop: 17 }}>
        <button className="button primary" onClick={download} data-testid="button-download-report"><Download size={15} /> Download notice</button>
        <button className="button secondary" onClick={() => window.print()} data-testid="button-print-report"><Printer size={15} /> Print notice</button>
        {generated && <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--green)", fontSize: 12 }}><Check size={15} /> Report generated and ready</span>}
      </div>
    </div>
  );
}

function EvidencePage() {
  const [tab, setTab] = useState("All evidence");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(seedEvidence[0]);
  const tabs = ["All evidence", "Field captures", "Marketplace", "Flagged only"];
  const filtered = seedEvidence.filter((item) => {
    const matchesTab = tab === "All evidence" || (tab === "Field captures" && item.source === "Field capture") || (tab === "Marketplace" && item.source === "Marketplace") || (tab === "Flagged only" && item.flag !== "Clear");
    return matchesTab && `${item.label} ${item.location} ${item.id}`.toLowerCase().includes(query.toLowerCase());
  });
  return (
    <div className="content">
      <PageHeading eyebrow="Chain of custody" title="Evidence" subtitle="Review image sources before a finding becomes a report. Every selected item remains tied to its audit and capture time." action={<button className="button secondary" onClick={() => document.getElementById("evidence-upload").click()} data-testid="button-upload-evidence"><UploadCloud size={15} /> Upload evidence</button>} />
      <input id="evidence-upload" type="file" hidden onChange={() => {}} />
      <div className="toolbar">
        <div className="search-field">
          <Search />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search evidence, location, ID" data-testid="input-evidence-search" />
        </div>
        {tabs.map((item) => (
          <button key={item} className={`button ${tab === item ? "primary" : "secondary"}`} onClick={() => setTab(item)} data-testid={`button-evidence-tab-${item.toLowerCase().replaceAll(" ", "-")}`}>
            {item}
          </button>
        ))}
      </div>
      <div className="evidence-layout">
        <div className="card" style={{ padding: 17 }}>
          <div className="gallery">
            {filtered.map((item) => (
              <button key={item.id} className={`evidence-thumb ${selected.id === item.id ? "selected" : ""}`} onClick={() => setSelected(item)} data-testid={`button-evidence-${item.id}`}>
                <ProductVisual kind={item.image} small />
                <span className="thumb-tag">{item.flag}</span>
                <div className="thumb-info">
                  <strong>{item.label}</strong>
                  <span>{item.source} · {item.capturedAt}</span>
                </div>
              </button>
            ))}
          </div>
          {!filtered.length && (
            <div className="empty">
              <ImageIcon size={23} />
              <h3>No evidence in this view</h3>
              <p>Use another source tab or clear the search.</p>
            </div>
          )}
        </div>
        <div className="card viewer">
          <div className="section-head">
            <div><h3>Selected evidence</h3><p>Viewer · source preserved</p></div>
            <button className="icon-button" aria-label="Evidence details" data-testid="button-evidence-details"><MoreHorizontal size={17} /></button>
          </div>
          <div className="viewer-stage"><ProductVisual kind={selected.image} /></div>
          <h3>{selected.label}</h3>
          <p>{selected.id} · linked to {selected.auditId}</p>
          <div className="viewer-meta">
            <span><MapPin size={13} style={{ verticalAlign: "middle" }} /> {selected.location}</span>
            <span><Clock3 size={13} style={{ verticalAlign: "middle" }} /> {selected.capturedAt}</span>
          </div>
          <div style={{ marginTop: 16 }}>
            <StatusBadge status={selected.flag === "Clear" ? "Compliant" : selected.flag} />
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsPage() {
  return (
    <div className="content">
      <PageHeading eyebrow="Register intelligence" title="Analytics" subtitle="Patterns across 47 audits in the Pune division. Use the evidence register to decide where the next field round should start." action={<button className="button secondary" onClick={() => window.print()} data-testid="button-export-analytics"><Download size={15} /> Export view</button>} />
      <div className="chart-grid">
        <div className="card chart-card">
          <h3>Compliance trend</h3>
          <p className="muted">Average score by fortnight · April to June 2025</p>
          <div className="line-chart">
            <i className="chart-gridline one" /><i className="chart-gridline two" /><i className="chart-gridline three" /><i className="chart-gridline four" />
            <span className="chart-label a">100</span><span className="chart-label b">75</span><span className="chart-label c">50</span><span className="chart-label d">25</span>
            <svg className="chart-svg" viewBox="0 0 700 180" preserveAspectRatio="none">
              <polyline points="0,80 105,70 210,98 315,61 420,70 525,45 630,58 700,35" fill="none" stroke="var(--blue)" strokeWidth="3" />
              <polyline points="0,80 105,70 210,98 315,61 420,70 525,45 630,58 700,35" fill="none" stroke="var(--blue)" strokeWidth="7" strokeOpacity=".08" />
              <circle cx="700" cy="35" r="5" fill="var(--blue)" />
            </svg>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted)", fontSize: 10, paddingLeft: 31 }}>
            <span>Apr 01</span><span>Apr 15</span><span>May 01</span><span>May 15</span><span>Jun 01</span><span>Jun 18</span>
          </div>
        </div>
        <div className="card chart-card">
          <h3>Violation severity</h3>
          <p className="muted">Open findings by statutory weight</p>
          <div className="bar-chart">
            <div className="bar-col"><span className="bar-value">3</span><i className="bar red" style={{ height: "74%" }} /><span className="bar-name">Critical</span></div>
            <div className="bar-col"><span className="bar-value">6</span><i className="bar ochre" style={{ height: "100%" }} /><span className="bar-name">Major</span></div>
            <div className="bar-col"><span className="bar-value">3</span><i className="bar" style={{ height: "52%" }} /><span className="bar-name">Minor</span></div>
          </div>
        </div>
      </div>
      <div className="chart-grid" style={{ marginTop: 18 }}>
        <div className="card chart-card">
          <h3>Category error rates</h3>
          <p className="muted">Share of audits with at least one finding</p>
          <div className="hotspots">
            <div className="hotspot"><span className="hotspot-rank">01</span><div><strong>Household</strong><span>7 of 9 audits · 77.8%</span><div className="mini-bar"><i style={{ width: "78%" }} /></div></div><span className="hotspot-score">77.8%</span></div>
            <div className="hotspot"><span className="hotspot-rank">02</span><div><strong>Food & Beverage</strong><span>12 of 22 audits · 54.5%</span><div className="mini-bar"><i style={{ width: "55%" }} /></div></div><span className="hotspot-score">54.5%</span></div>
            <div className="hotspot"><span className="hotspot-rank">03</span><div><strong>Cosmetics</strong><span>5 of 11 audits · 45.4%</span><div className="mini-bar"><i style={{ width: "45%" }} /></div></div><span className="hotspot-score">45.4%</span></div>
          </div>
        </div>
        <div className="card chart-card">
          <h3>Repeat-offender & batch escalation</h3>
          <p className="muted">Entities appearing in more than one reviewed record</p>
          <div className="hotspots">
            <div className="hotspot"><span className="hotspot-rank">01</span><div><strong>QuickBite Global Retail</strong><span>2 findings · origin declaration repeated</span></div><span className="hotspot-score">2x</span></div>
            <div className="hotspot"><span className="hotspot-rank">02</span><div><strong>HomePro Retail India</strong><span>Batch HP-APR25 · quantity gap</span></div><span className="hotspot-score">1x</span></div>
            <div className="hotspot"><span className="hotspot-rank">03</span><div><strong>NaturaGlow Labs</strong><span>USP arithmetic review pending</span></div><span className="hotspot-score">1x</span></div>
          </div>
          <div className="callout" style={{ marginTop: 19 }}>
            <strong>Geographic hotspot · Pune east</strong>
            <p>9 open findings across 14 audits. Prioritise Camp and Hadapsar marketplace routes.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeaturesPage() {
  return (
    <div className="content">
      <PageHeading eyebrow="System reference" title="Features and operating scope" subtitle="A practical inventory of the scanner’s architecture, mapped to the way officers collect, review, and enforce evidence." action={<span className="status-badge neutral">PCR 2011 · v2.4</span>} />
      <div className="feature-grid">
        {featureGroups.map((group) => (
          <div className={`feature-card ${group.color}`} key={group.title}>
            <h3>{group.title}</h3>
            <span className="feature-kicker">{group.kicker}</span>
            <ul>{group.items.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
        ))}
      </div>
      <div className="card pad" style={{ marginTop: 18 }}>
        <div className="section-head">
          <div><h3>Delivery phases</h3><p>The register is designed to grow without changing the officer’s working surface.</p></div>
          <Database size={18} color="var(--blue)" />
        </div>
        <div className="grid" style={{ gridTemplateColumns: "repeat(4,1fr)", gap: 1, background: "var(--line)" }}>
          {["Foundation & auth", "Deterministic rules", "Vision & OCR", "Enforcement & analytics"].map((phase, index) => (
            <div key={phase} style={{ padding: 16, background: "var(--surface)" }}>
              <span className="mono" style={{ color: "var(--blue)" }}>0{index + 1}</span>
              <strong style={{ display: "block", marginTop: 7, fontSize: 12 }}>{phase}</strong>
              <span style={{ display: "block", marginTop: 4, color: "var(--muted)", fontSize: 11 }}>
                {["Role-based shell, local queue, audit store", "Rule 6 declarations, USP, SI guardrails", "OCR bounding boxes, dimension checks", "Notices, cross-audit, regulator insights"][index]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SettingsPage() {
  const [toggles, setToggles] = useState(() => readStore("lm-settings", { ocr: true, offline: true, retention: false }));
  const setToggle = (key) => setToggles((current) => { const next = { ...current, [key]: !current[key] }; localStorage.setItem("lm-settings", JSON.stringify(next)); return next; });
  return (
    <div className="content">
      <PageHeading eyebrow="Administration" title="Settings" subtitle="Officer profile, permissions, readiness, and the controls that keep an evidentiary register dependable." action={<button className="button primary" onClick={() => localStorage.setItem("lm-settings", JSON.stringify(toggles))} data-testid="button-save-settings"><Check size={15} /> Save settings</button>} />
      <div className="settings-grid">
        <div className="card settings-card">
          <div className="profile-block">
            <div className="profile-avatar">AK</div>
            <div><h3>Asha Kulkarni</h3><p>Field officer · Pune Division</p></div>
          </div>
          <div className="setting-row">
            <div className="setting-copy"><strong>Role</strong><span>Can capture, review, and draft enforcement reports</span></div>
            <span className="status-badge neutral">Field officer</span>
          </div>
          <div className="setting-row">
            <div className="setting-copy"><strong>Assigned jurisdiction</strong><span>Pune, Satara, Nashik</span></div>
            <MapPin size={17} color="var(--blue)" />
          </div>
          <div className="setting-row">
            <div className="setting-copy"><strong>Last sign-in</strong><span>18 June 2025 · 08:17 IST</span></div>
            <span className="mono">PUN-04</span>
          </div>
        </div>
        <div className="card settings-card">
          <h3>Readiness and retention</h3>
          <div className="setting-row">
            <div className="setting-copy"><strong>Offline OCR readiness</strong><span>PaddleOCR model cached on this device</span></div>
            <button className={`toggle ${toggles.ocr ? "on" : ""}`} onClick={() => setToggle("ocr")} aria-label="Toggle offline OCR" data-testid="toggle-offline-ocr" />
          </div>
          <div className="setting-row">
            <div className="setting-copy"><strong>Field sync queue</strong><span>Uploads pause when the connection is unavailable</span></div>
            <button className={`toggle ${toggles.offline ? "on" : ""}`} onClick={() => setToggle("offline")} aria-label="Toggle field sync" data-testid="toggle-field-sync" />
          </div>
          <div className="setting-row">
            <div className="setting-copy"><strong>Extended evidence retention</strong><span>Keep source images beyond the default 180 days</span></div>
            <button className={`toggle ${toggles.retention ? "on" : ""}`} onClick={() => setToggle("retention")} aria-label="Toggle evidence retention" data-testid="toggle-evidence-retention" />
          </div>
        </div>
        <div className="card settings-card">
          <h3>System health</h3>
          <div className="health">
            <div className="health-row"><span>Rule engine</span><span className="health-status">Operational</span></div>
            <div className="health-row"><span>Evidence hashing</span><span className="health-status">Verified</span></div>
            <div className="health-row"><span>Marketplace connectors</span><span className="health-status">3 of 3 available</span></div>
            <div className="health-row"><span>Last backup</span><span className="mono">18 Jun · 06:00</span></div>
          </div>
        </div>
        <div className="card settings-card">
          <h3>Role permissions</h3>
          <div className="setting-row"><div className="setting-copy"><strong>Field capture</strong><span>Create evidence and submit an audit</span></div><Check size={17} color="var(--green)" /></div>
          <div className="setting-row"><div className="setting-copy"><strong>Statutory override</strong><span>Requires regulator role and dual verification</span></div><X size={17} color="var(--red)" /></div>
          <div className="setting-row"><div className="setting-copy"><strong>Report generation</strong><span>Allowed for flagged audits only</span></div><Check size={17} color="var(--green)" /></div>
        </div>
      </div>
    </div>
  );
}

function LoginPage({ onSuccess }) {
  const [email, setEmail] = useState("asha.kulkarni@metrology.gov.in");
  const [password, setPassword] = useState("demo123");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const submit = (event) => {
    event.preventDefault();
    if (!email.trim()) {
      setError("Enter your officer email to continue.");
      return;
    }
    localStorage.setItem("lm-authenticated", JSON.stringify(true));
    if (remember) localStorage.setItem("lm-remembered-officer", email.trim());
    onSuccess();
  };
  return (
    <main className="login-shell">
      <section className="login-visual">
        <div className="login-brand"><span className="brand-mark">LM</span><span><strong>Metrology Register</strong><small>Field compliance desk</small></span></div>
        <div className="login-visual-copy">
          <p className="eyebrow">Legal Metrology · Officer access</p>
          <h1>Turn every package check into a defensible record.</h1>
          <p>Review declarations, preserve evidence, and prepare statutory action from one trusted register.</p>
          <div className="login-proof">
            <div><strong>100%</strong><span>evidence hashes verified</span></div>
            <div><strong>71.4</strong><span>current compliance index</span></div>
          </div>
        </div>
        <div className="login-footer">PCR 2011 · v2.4 <span>·</span> Pune Division</div>
      </section>
      <section className="login-panel">
        <div className="login-panel-inner">
          <div className="login-kicker"><span className="login-icon"><FileCheck2 size={17} /></span><span>Secure officer sign-in</span></div>
          <h2>Welcome back.</h2>
          <p className="login-subtitle">Sign in to access your working register and field intake queue.</p>
          <form className="login-form" onSubmit={submit}>
            <label htmlFor="login-email">Officer email</label>
            <input id="login-email" type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError(""); }} placeholder="officer@metrology.gov.in" autoComplete="email" data-testid="input-login-email" />
            <label htmlFor="login-password">Password</label>
            <input id="login-password" type="password" value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} placeholder="Enter your password" autoComplete="current-password" data-testid="input-login-password" />
            <div className="login-options">
              <label className="remember-option"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /> <span>Remember this device</span></label>
              <button type="button" className="text-button" onClick={() => setError("Contact your register administrator to reset access.")}>Forgot password?</button>
            </div>
            {error && <p className="login-error" role="alert">{error}</p>}
            <button type="submit" className="button primary login-submit" data-testid="button-login"><LogIn size={16} /> Sign in to register</button>
          </form>
          <p className="login-help">Demo access is enabled for this workspace. Click "Sign in to register" with any credentials to continue.</p>
        </div>
      </section>
    </main>
  );
}

function NotFound() {
  return (
    <div className="content">
      <div className="card empty">
        <AlertTriangle size={28} />
        <h3>Register page not found</h3>
        <p>The requested register view does not exist.</p>
        <Link className="button primary" href="/" data-testid="link-return-overview">Return to overview</Link>
      </div>
    </div>
  );
}

export default function App() {
  const [location, setLocation] = useLocation();
  const [authenticated, setAuthenticated] = useState(() => readStore("lm-authenticated", true));

  if (!authenticated) {
    return (
      <ErrorBoundary>
        <LoginPage onSuccess={() => { setAuthenticated(true); setLocation("/"); }} />
      </ErrorBoundary>
    );
  }

  if (location === "/login") {
    return <Redirect to="/" />;
  }

  return (
    <ErrorBoundary>
      <Shell onLogout={() => { localStorage.setItem("lm-authenticated", "false"); setAuthenticated(false); setLocation("/"); }}>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/scan" component={ScannerPage} />
          <Route path="/audits" component={AuditsPage} />
          <Route path="/audits/demo-energy-drink" component={DetailPage} />
          <Route path="/reports" component={ReportsPage} />
          <Route path="/evidence" component={EvidencePage} />
          <Route path="/analytics" component={AnalyticsPage} />
          <Route path="/features" component={FeaturesPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route component={NotFound} />
        </Switch>
      </Shell>
    </ErrorBoundary>
  );
}