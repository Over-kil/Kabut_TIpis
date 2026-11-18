const { useState, useEffect, useRef } = React;

/* ============================================================================
   STATIC REFERENCE DATA (GALLERY, TESTIMONIALS, FAQ, TIMELINE)
   ============================================================================ */
const GALLERY_ITEMS = [
  { id: 1, title: "Dawn Mist Above Segara Anak Crater, Lombok", category: "Alpine", url: "https://picsum.photos/seed/ktagal1/900/650" },
  { id: 2, title: "Phinisi Schooner Anchored Off Padar Island", category: "Marine", url: "https://picsum.photos/seed/ktagal2/900/650" },
  { id: 3, title: "Tengger Caldera Sea of Sand at First Light", category: "Volcanic", url: "https://picsum.photos/seed/ktagal3/900/650" },
  { id: 4, title: "Kayaking Through Wayag Karst Lagoons, Raja Ampat", category: "Marine", url: "https://picsum.photos/seed/ktagal4/900/650" },
  { id: 5, title: "Ranu Kumbolo Lakeside Basecamp Reflections", category: "Alpine", url: "https://picsum.photos/seed/ktagal5/900/650" },
  { id: 6, title: "Golden Savannah Ridges of Wairinding, Sumba", category: "Overland", url: "https://picsum.photos/seed/ktagal6/900/650" },
  { id: 7, title: "Kawah Ijen Sulfur Crater Turquoise Dawn", category: "Volcanic", url: "https://picsum.photos/seed/ktagal7/900/650" },
  { id: 8, title: "KTA Alpine Safety Briefing Before Summit Push", category: "Expedition", url: "https://picsum.photos/seed/ktagal8/900/650" }
];

const TESTIMONIALS = [
  {
    name: "Nadia Kusumawardani",
    role: "Rinjani 4D3N Summit Finisher",
    quote: "Kabut Tipis Adventure handled every detail—from satellite weather checks to hot ginger tea waiting at Plawangan rim. Watching sunrise pierce the morning mist at 3,726m felt completely safe and unforgettable."
  },
  {
    name: "Marcus Lindqvist",
    role: "Komodo & Padar Phinisi Charter",
    quote: "Our marine guide timed Padar Ridge and Manta Point to perfection so we avoided crowds and swam alongside four giant reef mantas. Easily the best-organized expedition operator in Indonesia."
  },
  {
    name: "dr. Hendra Wijaya",
    role: "Bromo–Ijen Private Overland",
    quote: "Traveling with my parents required thoughtful pacing. KTA's 4x4 crew, respirator gear at Ijen, and warm lodge stops made every kilometer effortless."
  }
];

const FAQ_ITEMS = [
  {
    q: "What safety certifications do Kabut Tipis Adventure guides hold?",
    a: "All KTA lead mountain and marine guides hold active APGI (Indonesian Mountain Guide Association) or POSSI/SSI marine certifications, Wilderness First Responder (WFR) medical training, and carry Garmin inReach satellite communicators on remote routes."
  },
  {
    q: "Are national park permits (SIMAKSI) and insurance included?",
    a: "Yes. Every KTA expedition package includes official national park entry permits, conservation fees, local porter/crew welfare coverage, and comprehensive outdoor adventure evacuation insurance."
  },
  {
    q: "Can beginners join KTA alpine or liveaboard trips?",
    a: "Absolutely. Each expedition displays a clear difficulty rating (Easy, Moderate, Challenging). Upon booking, you receive a tailored 4-week conditioning checklist and gear briefing from our Malang Basecamp team."
  },
  {
    q: "What is your weather rescheduling & refund policy?",
    a: "If BMKG or National Park authorities close a summit or harbor due to extreme weather, KTA offers 100% free date rescheduling or a full credit transfer valid for 18 months."
  }
];

const TIMELINE_STEPS = [
  { phase: "Stage 01 · Pre-Expedition", title: "Route Intelligence & Gear Audit", desc: "7 days before departure, our coordinators share micro-climate forecasts, acclimatization tips, and verify your technical layering." },
  { phase: "Stage 02 · Basecamp Arrival", title: "Malang / Gateway Briefing & Health Check", desc: "Meet your certified expedition leader for pulse-oximeter baseline screening, SIMAKSI permit verification, and eco-pack distribution." },
  { phase: "Stage 03 · Into the Thin Mist", title: "Paced Ascent & Zero-Trace Camp", desc: "Move in small 1:4 guide-to-explorer ratios with freshly cooked highland nutrition and Leave-No-Trace waste pack-out." },
  { phase: "Stage 04 · Summit & Horizon", title: "Golden Dawn Push & Safe Return", desc: "Reach the summit ridge or coral lagoon at optimal light, followed by recovery transfers and digital expedition logbooks." }
];

const formatIDR = (amount) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);

/* ============================================================================
   ANIMATED COUNTER COMPONENT
   ============================================================================ */
function AnimatedCounter({ target, suffix = "" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const duration = 1400;
          const stepTime = 20;
          const increment = target / (duration / stepTime);
          const timer = setInterval(() => {
            start += increment;
            if (start >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, stepTime);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref}>
      {count.toLocaleString("en-US")}
      {suffix}
    </span>
  );
}

/* ============================================================================
   MAIN APPLICATION
   ============================================================================ */
function App() {
  const [activePage, setActivePage] = useState("home");
  const [theme, setTheme] = useState(() => localStorage.getItem("kta_theme") || "light");
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showBackTop, setShowBackTop] = useState(false);
  const [parallaxOffset, setParallaxOffset] = useState(0);

  // Custom Cursor State
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [cursorHover, setCursorHover] = useState(false);

  // Backend Data States
  const [destinations, setDestinations] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDestModal, setSelectedDestModal] = useState(null);

  // Lightbox & Carousel & FAQ
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [openFaqIdx, setOpenFaqIdx] = useState(0);

  // Auth State
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ full_name: "", email: "", phone: "", password: "" });
  const [authStatus, setAuthStatus] = useState(null);
  const [myBookings, setMyBookings] = useState([]);
  const [lookupCode, setLookupCode] = useState("");

  // Booking State
  const [bookingForm, setBookingForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    destination_id: 1,
    package_tier: "Explorer Standard",
    departure_date: "",
    guests: 2,
    gear_addons: [],
    notes: ""
  });
  const [bookingResult, setBookingResult] = useState(null);
  const [bookingError, setBookingError] = useState("");

  // Contact & Newsletter State
  const [contactForm, setContactForm] = useState({ name: "", email: "", subject: "Custom Private Expedition", message: "" });
  const [contactStatus, setContactStatus] = useState(null);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState(null);

  // Apply Theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("kta_theme", theme);
  }, [theme]);

  // Preloader Dismissal
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 650);
    return () => clearTimeout(timer);
  }, []);

  // Load Initial Data from Python Flask API
  useEffect(() => {
    fetch("/api/destinations")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.destinations.length > 0) {
          setDestinations(data.destinations);
          setBookingForm((prev) => ({ ...prev, destination_id: data.destinations[0].id }));
        }
      })
      .catch(() => {});

    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.user) {
          setCurrentUser(data.user);
          setBookingForm((prev) => ({
            ...prev,
            full_name: data.user.full_name,
            email: data.user.email,
            phone: data.user.phone || ""
          }));
          fetchUserBookings();
        }
      })
      .catch(() => {});
  }, []);

  // Scroll Listener (Parallax + Back to Top + Reveal)
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setParallaxOffset(y * 0.32);
      setShowBackTop(y > 420);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // IntersectionObserver for Scroll Reveal
  useEffect(() => {
    const elements = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.12 }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [activePage, destinations, categoryFilter]);

  // Custom Cursor Tracking
  useEffect(() => {
    const move = (e) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
      const target = e.target;
      const interactive = target && (target.closest("button") || target.closest("a") || target.closest(".gallery-item"));
      setCursorHover(Boolean(interactive));
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  // Lightbox Keyboard Controls
  useEffect(() => {
    if (lightboxIdx === null) return;
    const onKey = (e) => {
      if (e.key === "Escape") setLightboxIdx(null);
      if (e.key === "ArrowRight") setLightboxIdx((prev) => (prev + 1) % GALLERY_ITEMS.length);
      if (e.key === "ArrowLeft") setLightboxIdx((prev) => (prev - 1 + GALLERY_ITEMS.length) % GALLERY_ITEMS.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIdx]);

  const navigateTo = (page, destId = null) => {
    setActivePage(page);
    setMobileMenuOpen(false);
    if (destId) {
      setBookingForm((prev) => ({ ...prev, destination_id: destId }));
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const fetchUserBookings = async (codeOverride = "") => {
    const query = codeOverride ? `?code=${encodeURIComponent(codeOverride)}` : "";
    const res = await fetch(`/api/bookings/lookup${query}`);
    const data = await res.json();
    if (data.ok) setMyBookings(data.bookings);
  };

  // Dynamic Booking Price Calculation
  const selectedDestination = destinations.find((d) => Number(d.id) === Number(bookingForm.destination_id)) || destinations[0];
  const tierMultiplier =
    bookingForm.package_tier === "Private Summit Charter"
      ? 1.45
      : bookingForm.package_tier === "Alpine Pro + Media"
      ? 1.22
      : 1.0;
  const addonCostPerGuest = bookingForm.gear_addons.length * 175000;
  const groupDiscount = Number(bookingForm.guests) >= 4 ? 0.92 : 1.0;
  const calculatedTotal = selectedDestination
    ? Math.round((selectedDestination.price * tierMultiplier + addonCostPerGuest) * Number(bookingForm.guests) * groupDiscount)
    : 0;

  const handleToggleAddon = (addon) => {
    setBookingForm((prev) => {
      const exists = prev.gear_addons.includes(addon);
      return {
        ...prev,
        gear_addons: exists ? prev.gear_addons.filter((a) => a !== addon) : [...prev.gear_addons, addon]
      };
    });
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setBookingError("");
    setBookingResult(null);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...bookingForm, total_price: calculatedTotal })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setBookingError(data.message || "Unable to complete booking.");
        return;
      }
      setBookingResult(data.booking);
      fetchUserBookings(data.booking.booking_code);
    } catch {
      setBookingError("Network error while connecting to KTA booking server.");
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthStatus(null);
    const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authForm)
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setAuthStatus({ ok: false, message: data.message });
        return;
      }
      setCurrentUser(data.user);
      setAuthStatus({ ok: true, message: data.message });
      setBookingForm((prev) => ({
        ...prev,
        full_name: data.user.full_name,
        email: data.user.email,
        phone: data.user.phone || ""
      }));
      fetchUserBookings();
    } catch {
      setAuthStatus({ ok: false, message: "Server connection error." });
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setCurrentUser(null);
    setMyBookings([]);
    setAuthStatus({ ok: true, message: "You have been signed out." });
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactStatus(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm)
      });
      const data = await res.json();
      setContactStatus({ ok: res.ok && data.ok, message: data.message });
      if (res.ok && data.ok) {
        setContactForm({ name: "", email: "", subject: "Custom Private Expedition", message: "" });
      }
    } catch {
      setContactStatus({ ok: false, message: "Unable to reach server." });
    }
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    setNewsletterStatus(null);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newsletterEmail })
      });
      const data = await res.json();
      setNewsletterStatus({ ok: res.ok && data.ok, message: data.message });
      if (res.ok && data.ok) setNewsletterEmail("");
    } catch {
      setNewsletterStatus({ ok: false, message: "Subscription failed. Try again." });
    }
  };

  const filteredDestinations = destinations.filter((d) => {
    const matchCat = categoryFilter === "All" || d.category === categoryFilter;
    const matchSearch =
      !searchQuery ||
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.region.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const NAV_ITEMS = [
    { id: "home", label: "Home" },
    { id: "about", label: "About Us" },
    { id: "destinations", label: "Destinations" },
    { id: "gallery", label: "Gallery" },
    { id: "packages", label: "Packages" },
    { id: "booking", label: "Booking" },
    { id: "contact", label: "Contact" }
  ];

  return (
    <>
      {/* PRELOADER */}
      <div className={`preloader ${loading ? "" : "hidden"}`} aria-hidden={!loading}>
        <div className="preloader-ring"></div>
        <strong style={{ letterSpacing: "0.1em", fontSize: "0.95rem" }}>KABUT TIPIS ADVENTURE</strong>
        <small style={{ opacity: 0.8, marginTop: "4px" }}>Preparing Alpine &amp; Marine Telemetry...</small>
      </div>

      {/* CUSTOM DESKTOP CURSOR */}
      <div className="custom-cursor-dot" style={{ left: `${cursorPos.x}px`, top: `${cursorPos.y}px` }} />
      <div
        className={`custom-cursor-ring ${cursorHover ? "hovered" : ""}`}
        style={{ left: `${cursorPos.x}px`, top: `${cursorPos.y}px` }}
      />

      {/* FIXED TOP NAVIGATION BAR */}
      <header className="navbar">
        <div className="container navbar-inner">
          <div className="brand-logo" onClick={() => navigateTo("home")} role="button" tabIndex={0}>
            <div className="brand-badge">
              <i className="fa-solid fa-mountain-sun"></i>
            </div>
            <div className="brand-text">
              <strong>Kabut Tipis</strong>
              <span>Adventure · KTA</span>
            </div>
          </div>

          <nav aria-label="Primary Navigation">
            <ul className="nav-links">
              {NAV_ITEMS.map((item) => (
                <li key={item.id}>
                  <button
                    className={`nav-link-btn ${activePage === item.id ? "active" : ""}`}
                    onClick={() => navigateTo(item.id)}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="nav-actions">
            <button
              className="icon-toggle-btn"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              aria-label="Toggle dark or light theme"
              title="Switch Theme"
            >
              <i className={`fa-solid ${theme === "light" ? "fa-moon" : "fa-sun"}`}></i>
            </button>

            <button
              className="btn btn-outline btn-sm"
              onClick={() => navigateTo("auth")}
            >
              <i className="fa-regular fa-user"></i>
              {currentUser ? currentUser.full_name.split(" ")[0] : "Sign In"}
            </button>

            <button
              className="icon-toggle-btn hamburger-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
              aria-expanded={mobileMenuOpen}
            >
              <i className={`fa-solid ${mobileMenuOpen ? "fa-xmark" : "fa-bars"}`}></i>
            </button>
          </div>
        </div>

        {/* RESPONSIVE HAMBURGER MENU */}
        <div className={`mobile-drawer ${mobileMenuOpen ? "open" : ""}`}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`nav-link-btn ${activePage === item.id ? "active" : ""}`}
              style={{ textAlign: "left" }}
              onClick={() => navigateTo(item.id)}
            >
              {item.label}
            </button>
          ))}
          <button className="btn btn-primary btn-sm" onClick={() => navigateTo("auth")}>
            {currentUser ? `Explorer Portal (${currentUser.full_name})` : "Sign In / Sign Up"}
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main id="main-content">
        {/* ================================================================
            PAGE 1: HOME
           ================================================================ */}
        {activePage === "home" && (
          <>
            <section className="hero-section">
              <div
                className="hero-parallax-bg"
                style={{ transform: `translate3d(0, ${parallaxOffset}px, 0) scale(1.08)` }}
              />
              <div className="hero-mist-layer" />
              <div className="hero-glass-box">
                <div className="hero-eyebrow">
                  <i className="fa-solid fa-compass"></i> Certified Indonesian Expedition Outfitters
                </div>
                <h1 className="hero-title">Step Above the Morning Mist, Sail Beyond the Horizon</h1>
                <p className="hero-subtitle">
                  From volcanic ridges at 3,726 meters to sapphire coral channels in Eastern Indonesia, Kabut Tipis Adventure engineers small-group journeys led by certified mountain and marine specialists.
                </p>
                <div className="hero-cta-group">
                  <button className="btn btn-primary" onClick={() => navigateTo("destinations")}>
                    <i className="fa-solid fa-map-location-dot"></i> Explore Expeditions
                  </button>
                  <button
                    className="btn btn-outline"
                    style={{ background: "rgba(255,255,255,0.16)", color: "#fff", borderColor: "#fff" }}
                    onClick={() => navigateTo("booking")}
                  >
                    <i className="fa-solid fa-calendar-check"></i> Reserve a Slot
                  </button>
                </div>
              </div>
            </section>

            {/* ANIMATED STATISTICS COUNTER */}
            <section className="section">
              <div className="container">
                <div className="stats-grid reveal">
                  <div className="glass-card stat-card">
                    <div className="stat-number"><AnimatedCounter target={4850} suffix="+" /></div>
                    <div className="stat-label">Safe Summit &amp; Sea Finishers</div>
                  </div>
                  <div className="glass-card stat-card">
                    <div className="stat-number"><AnimatedCounter target={28} /></div>
                    <div className="stat-label">Curated Archipelago Routes</div>
                  </div>
                  <div className="glass-card stat-card">
                    <div className="stat-number"><AnimatedCounter target={100} suffix="%" /></div>
                    <div className="stat-label">WFR &amp; APGI Certified Leaders</div>
                  </div>
                  <div className="glass-card stat-card">
                    <div className="stat-number"><AnimatedCounter target={49} suffix="/50" /></div>
                    <div className="stat-label">Verified Explorer Rating</div>
                  </div>
                </div>
              </div>
            </section>

            {/* FEATURED DESTINATIONS PREVIEW */}
            <section className="section section-alt">
              <div className="container">
                <div className="section-header reveal">
                  <span className="section-tag">Signature Departures</span>
                  <h2 className="section-title">Curated Volcano &amp; Ocean Expeditions</h2>
                  <p className="section-desc">Small-group departures capped at 10 explorers for authentic wilderness immersion and strict safety ratios.</p>
                </div>
                <div className="cards-grid">
                  {destinations.slice(0, 3).map((dest) => (
                    <article key={dest.id} className="glass-card dest-card reveal">
                      <div className="dest-img-wrap">
                        <img src={dest.image_url} alt={dest.title} loading="lazy" />
                        <span className="dest-badge">{dest.category}</span>
                        <span className="dest-rating">
                          <i className="fa-solid fa-star" style={{ color: "#f59e0b" }}></i> {dest.rating}
                        </span>
                      </div>
                      <div className="dest-body">
                        <div className="dest-region"><i className="fa-solid fa-location-dot"></i> {dest.region}</div>
                        <h3 className="dest-title">{dest.title}</h3>
                        <div className="dest-meta">
                          <span><i className="fa-regular fa-clock"></i> {dest.duration}</span>
                          <span><i className="fa-solid fa-mountain"></i> {dest.elevation}</span>
                        </div>
                        <p className="dest-summary">{dest.summary}</p>
                        <div className="dest-footer">
                          <div className="dest-price">
                            <small>Starting from</small>
                            <strong>{formatIDR(dest.price)}</strong>
                          </div>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button className="btn btn-outline btn-sm" onClick={() => setSelectedDestModal(dest)}>
                              Itinerary
                            </button>
                            <button className="btn btn-primary btn-sm" onClick={() => navigateTo("booking", dest.id)}>
                              Book
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            {/* TIMELINE STORYTELLING */}
            <section className="section">
              <div className="container">
                <div className="section-header reveal">
                  <span className="section-tag">The KTA Field Protocol</span>
                  <h2 className="section-title">How Every Expedition Unfolds</h2>
                </div>
                <div className="timeline reveal">
                  {TIMELINE_STEPS.map((step, i) => (
                    <div key={i} className="glass-card timeline-item">
                      <span className="timeline-dot"></span>
                      <div className="timeline-phase">{step.phase}</div>
                      <h3>{step.title}</h3>
                      <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>{step.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* TESTIMONIALS CAROUSEL & FAQ ACCORDION */}
            <section className="section section-alt">
              <div className="container">
                <div className="section-header reveal">
                  <span className="section-tag">Field Dispatches</span>
                  <h2 className="section-title">Stories From Fellow Explorers</h2>
                </div>
                <div className="glass-card testimonial-box reveal">
                  <i className="fa-solid fa-quote-left" style={{ fontSize: "1.8rem", color: "var(--ocean-primary)", marginBottom: "12px" }}></i>
                  <p style={{ fontSize: "1.05rem", fontStyle: "italic", marginBottom: "16px" }}>
                    "{TESTIMONIALS[testimonialIdx].quote}"
                  </p>
                  <strong>{TESTIMONIALS[testimonialIdx].name}</strong>
                  <div style={{ fontSize: "0.82rem", color: "var(--ocean-primary)", fontWeight: 600 }}>
                    {TESTIMONIALS[testimonialIdx].role}
                  </div>
                  <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "16px" }}>
                    <button
                      className="icon-toggle-btn"
                      aria-label="Previous testimonial"
                      onClick={() => setTestimonialIdx((testimonialIdx - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
                    >
                      <i className="fa-solid fa-chevron-left"></i>
                    </button>
                    <button
                      className="icon-toggle-btn"
                      aria-label="Next testimonial"
                      onClick={() => setTestimonialIdx((testimonialIdx + 1) % TESTIMONIALS.length)}
                    >
                      <i className="fa-solid fa-chevron-right"></i>
                    </button>
                  </div>
                </div>

                <div className="section-header reveal" style={{ marginTop: "42px" }}>
                  <span className="section-tag">Preparation &amp; Safety</span>
                  <h2 className="section-title">Frequently Asked Questions</h2>
                </div>
                <div className="faq-list reveal">
                  {FAQ_ITEMS.map((item, idx) => (
                    <div key={idx} className="glass-card faq-item">
                      <button
                        className="faq-question"
                        aria-expanded={openFaqIdx === idx}
                        onClick={() => setOpenFaqIdx(openFaqIdx === idx ? -1 : idx)}
                      >
                        <span>{item.q}</span>
                        <i className={`fa-solid ${openFaqIdx === idx ? "fa-minus" : "fa-plus"}`} style={{ color: "var(--ocean-primary)" }}></i>
                      </button>
                      {openFaqIdx === idx && <div className="faq-answer">{item.a}</div>}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        {/* ================================================================
            PAGE 2: ABOUT US
           ================================================================ */}
        {activePage === "about" && (
          <section className="section page-top-spacer">
            <div className="container">
              <div className="section-header">
                <span className="section-tag">Our Story &amp; Ethos</span>
                <h2 className="section-title">Born in the Highland Mist of East Java</h2>
                <p className="section-desc">
                  Founded in Malang in 2017 by alpine search-and-rescue volunteers and marine conservationists, Kabut Tipis Adventure bridges high-altitude safety with low-impact eco-tourism.
                </p>
              </div>

              <div className="two-col-grid" style={{ marginBottom: "32px" }}>
                <div className="glass-card form-card">
                  <h3 style={{ color: "var(--dark-blue)", marginBottom: "10px" }}>Why "Kabut Tipis" (Thin Mist)?</h3>
                  <p style={{ color: "var(--text-secondary)", marginBottom: "12px" }}>
                    Every seasoned Indonesian mountaineer knows the quiet magic of <em>kabut tipis</em>—that translucent veil of morning cloud clinging to volcanic ridges just before sunrise breaks over the archipelago.
                  </p>
                  <p style={{ color: "var(--text-secondary)", marginBottom: "16px" }}>
                    We believe great adventure never rushes nature. Every KTA itinerary pairs rigorous meteorological monitoring and fair-wage local porter partnerships with intimate, unhurried wilderness encounters.
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div className="glass-card" style={{ padding: "14px" }}>
                      <strong style={{ color: "var(--ocean-primary)" }}><i className="fa-solid fa-shield-heart"></i> Zero-Incident Focus</strong>
                      <p style={{ fontSize: "0.84rem", color: "var(--text-secondary)" }}>Pulse-oximetry checks, satellite SOS beacons &amp; WFR medics on every summit push.</p>
                    </div>
                    <div className="glass-card" style={{ padding: "14px" }}>
                      <strong style={{ color: "var(--ocean-primary)" }}><i className="fa-solid fa-leaf"></i> Zero-Trace Policy</strong>
                      <p style={{ fontSize: "0.84rem", color: "var(--text-secondary)" }}>100% of non-organic trail waste is weighed and packed back down to basecamp.</p>
                    </div>
                  </div>
                </div>
                <div className="glass-card" style={{ overflow: "hidden" }}>
                  <img src="https://picsum.photos/seed/ktaaboutteam/800/620" alt="KTA Mountain Guide Team" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ================================================================
            PAGE 3: DESTINATIONS CATALOG
           ================================================================ */}
        {activePage === "destinations" && (
          <section className="section page-top-spacer">
            <div className="container">
              <div className="section-header">
                <span className="section-tag">2026 Expedition Calendar</span>
                <h2 className="section-title">Explore All KTA Destinations</h2>
                <p className="section-desc">Filter by terrain discipline or search by island and volcano.</p>
              </div>

              <div className="filter-bar">
                {["All", "Alpine Summit", "Marine & Island", "Volcanic Overland", "Cultural & Overland"].map((cat) => (
                  <button
                    key={cat}
                    className={`filter-pill ${categoryFilter === cat ? "active" : ""}`}
                    onClick={() => setCategoryFilter(cat)}
                  >
                    {cat}
                  </button>
                ))}
                <input
                  type="search"
                  className="form-control"
                  style={{ maxWidth: "240px", borderRadius: "999px" }}
                  placeholder="Search Rinjani, Komodo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search destinations"
                />
              </div>

              <div className="cards-grid">
                {filteredDestinations.map((dest) => (
                  <article key={dest.id} className="glass-card dest-card">
                    <div className="dest-img-wrap">
                      <img src={dest.image_url} alt={dest.title} />
                      <span className="dest-badge">{dest.difficulty}</span>
                      <span className="dest-rating">
                        <i className="fa-solid fa-star" style={{ color: "#f59e0b" }}></i> {dest.rating} ({dest.reviews_count})
                      </span>
                    </div>
                    <div className="dest-body">
                      <div className="dest-region"><i className="fa-solid fa-location-dot"></i> {dest.region}</div>
                      <h3 className="dest-title">{dest.title}</h3>
                      <div className="dest-meta">
                        <span><i className="fa-regular fa-clock"></i> {dest.duration}</span>
                        <span><i className="fa-solid fa-mountain"></i> {dest.elevation}</span>
                      </div>
                      <p className="dest-summary">{dest.summary}</p>
                      <div className="dest-footer">
                        <div className="dest-price">
                          <small>Per explorer</small>
                          <strong>{formatIDR(dest.price)}</strong>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button className="btn btn-outline btn-sm" onClick={() => setSelectedDestModal(dest)}>
                            Day-by-Day
                          </button>
                          <button className="btn btn-primary btn-sm" onClick={() => navigateTo("booking", dest.id)}>
                            Reserve
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ================================================================
            PAGE 4: GALLERY WITH LIGHTBOX
           ================================================================ */}
        {activePage === "gallery" && (
          <section className="section page-top-spacer">
            <div className="container">
              <div className="section-header">
                <span className="section-tag">Visual Chronicles</span>
                <h2 className="section-title">Through the Lens of Our Expeditions</h2>
                <p className="section-desc">Click any frame to open the full-resolution lightbox viewer.</p>
              </div>
              <div className="gallery-grid">
                {GALLERY_ITEMS.map((item, idx) => (
                  <div
                    key={item.id}
                    className="gallery-item glass-card"
                    role="button"
                    tabIndex={0}
                    onClick={() => setLightboxIdx(idx)}
                    onKeyDown={(e) => e.key === "Enter" && setLightboxIdx(idx)}
                  >
                    <img src={item.url} alt={item.title} loading="lazy" />
                    <div className="gallery-caption">{item.title}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ================================================================
            PAGE 5: PRICING & PACKAGES TABLE
           ================================================================ */}
        {activePage === "packages" && (
          <section className="section page-top-spacer">
            <div className="container">
              <div className="section-header">
                <span className="section-tag">Transparent Tiers</span>
                <h2 className="section-title">Choose Your Expedition Style</h2>
                <p className="section-desc">All tiers include certified guides, park permits, safety equipment, and full insurance. Groups of 4+ automatically save 8%.</p>
              </div>
              <div className="pricing-grid">
                <div className="glass-card pricing-card">
                  <h3>Explorer Standard</h3>
                  <p style={{ fontSize: "0.86rem", color: "var(--text-secondary)" }}>Open small-group departure (6–10 guests)</p>
                  <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--ocean-primary)", margin: "12px 0" }}>
                    1.0x Base Rate
                  </div>
                  <ul className="pricing-features">
                    <li><i className="fa-solid fa-check"></i> APGI / Marine Certified Lead Guide</li>
                    <li><i className="fa-solid fa-check"></i> Shared 4-Season Expedition Tents / Cabin</li>
                    <li><i className="fa-solid fa-check"></i> All SIMAKSI Permits &amp; Trip Insurance</li>
                    <li><i className="fa-solid fa-check"></i> 3 Hot Trail Meals Daily + Electrolytes</li>
                  </ul>
                  <button className="btn btn-outline" onClick={() => navigateTo("booking")}>Select Standard</button>
                </div>

                <div className="glass-card pricing-card featured">
                  <span className="popular-ribbon">Most Popular</span>
                  <h3>Alpine Pro + Media</h3>
                  <p style={{ fontSize: "0.86rem", color: "var(--text-secondary)" }}>Enhanced comfort &amp; dedicated expedition photographer</p>
                  <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--ocean-primary)", margin: "12px 0" }}>
                    1.22x Base Rate
                  </div>
                  <ul className="pricing-features">
                    <li><i className="fa-solid fa-check"></i> Everything in Explorer Standard</li>
                    <li><i className="fa-solid fa-check"></i> Personal Porter Allowance (up to 12 kg)</li>
                    <li><i className="fa-solid fa-check"></i> Dedicated Drone &amp; RAW Photo Documentation</li>
                    <li><i className="fa-solid fa-check"></i> Upgraded Insulated Sleeping Pad &amp; Dining Dome</li>
                  </ul>
                  <button className="btn btn-primary" onClick={() => navigateTo("booking")}>Select Alpine Pro</button>
                </div>

                <div className="glass-card pricing-card">
                  <h3>Private Summit Charter</h3>
                  <p style={{ fontSize: "0.86rem", color: "var(--text-secondary)" }}>100% private dates for families, couples &amp; corporate teams</p>
                  <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--ocean-primary)", margin: "12px 0" }}>
                    1.45x Base Rate
                  </div>
                  <ul className="pricing-features">
                    <li><i className="fa-solid fa-check"></i> Flexible Departure Date &amp; Custom Pacing</li>
                    <li><i className="fa-solid fa-check"></i> Private 4x4 / Speedboat Airport Transfers</li>
                    <li><i className="fa-solid fa-check"></i> 1:3 Senior Guide-to-Guest Safety Ratio</li>
                    <li><i className="fa-solid fa-check"></i> Custom Dietary Menu &amp; Satellite Comms</li>
                  </ul>
                  <button className="btn btn-outline" onClick={() => navigateTo("booking")}>Select Private Charter</button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ================================================================
            PAGE 6: INTERACTIVE BOOKING ENGINE (CONNECTED TO SQLITE)
           ================================================================ */}
        {activePage === "booking" && (
          <section className="section page-top-spacer">
            <div className="container">
              <div className="section-header">
                <span className="section-tag">Instant Reservation</span>
                <h2 className="section-title">Book Your KTA Expedition</h2>
                <p className="section-desc">Complete your reservation below to generate an instant booking code stored in our expedition system.</p>
              </div>

              <div className="two-col-grid">
                <form className="glass-card form-card" onSubmit={handleBookingSubmit}>
                  {bookingError && <div className="alert-banner alert-error">{bookingError}</div>}
                  {bookingResult && (
                    <div className="alert-banner alert-success">
                      <strong>Confirmed! Code: {bookingResult.booking_code}</strong> — {bookingResult.destination_title} on {bookingResult.departure_date} for {bookingResult.guests} guest(s).
                    </div>
                  )}

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="bk-name">Lead Explorer Full Name *</label>
                      <input
                        id="bk-name"
                        type="text"
                        className="form-control"
                        required
                        value={bookingForm.full_name}
                        onChange={(e) => setBookingForm({ ...bookingForm, full_name: e.target.value })}
                        placeholder="e.g., Raka Pratama"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="bk-email">Email Address *</label>
                      <input
                        id="bk-email"
                        type="email"
                        className="form-control"
                        required
                        value={bookingForm.email}
                        onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })}
                        placeholder="raka@example.com"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="bk-phone">WhatsApp / Phone Number *</label>
                      <input
                        id="bk-phone"
                        type="tel"
                        className="form-control"
                        required
                        value={bookingForm.phone}
                        onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                        placeholder="+62 812 3456 7890"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="bk-date">Preferred Departure Date *</label>
                      <input
                        id="bk-date"
                        type="date"
                        className="form-control"
                        required
                        value={bookingForm.departure_date}
                        onChange={(e) => setBookingForm({ ...bookingForm, departure_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="bk-dest">Select Expedition *</label>
                      <select
                        id="bk-dest"
                        className="form-control"
                        value={bookingForm.destination_id}
                        onChange={(e) => setBookingForm({ ...bookingForm, destination_id: Number(e.target.value) })}
                      >
                        {destinations.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.title} ({d.duration})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="bk-tier">Package Tier</label>
                      <select
                        id="bk-tier"
                        className="form-control"
                        value={bookingForm.package_tier}
                        onChange={(e) => setBookingForm({ ...bookingForm, package_tier: e.target.value })}
                      >
                        <option value="Explorer Standard">Explorer Standard (1.0x)</option>
                        <option value="Alpine Pro + Media">Alpine Pro + Media (1.22x)</option>
                        <option value="Private Summit Charter">Private Summit Charter (1.45x)</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="bk-guests">Number of Explorers (4+ gets 8% group discount)</label>
                    <input
                      id="bk-guests"
                      type="number"
                      min="1"
                      max="25"
                      className="form-control"
                      value={bookingForm.guests}
                      onChange={(e) => setBookingForm({ ...bookingForm, guests: Math.max(1, Number(e.target.value)) })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Optional Rental Gear Add-ons (IDR 175,000 / item / guest)</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "6px" }}>
                      {["Sub-Zero Down Jacket", "Carbon Trekking Poles", "Underwater GoPro Kit", "Drybag 30L"].map((addon) => {
                        const active = bookingForm.gear_addons.includes(addon);
                        return (
                          <button
                            type="button"
                            key={addon}
                            className={`filter-pill ${active ? "active" : ""}`}
                            onClick={() => handleToggleAddon(addon)}
                          >
                            {active ? "✓ " : "+ "} {addon}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="bk-notes">Dietary Preferences or Medical Notes</label>
                    <textarea
                      id="bk-notes"
                      rows="3"
                      className="form-control"
                      value={bookingForm.notes}
                      onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                      placeholder="Vegetarian meals, altitude history, pickup hotel..."
                    ></textarea>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
                    <i className="fa-solid fa-lock"></i> Confirm Expedition Booking
                  </button>
                </form>

                {/* LIVE COST SUMMARY CARD */}
                <aside className="glass-card form-card">
                  <h3 style={{ color: "var(--dark-blue)", marginBottom: "12px" }}>Live Cost Breakdown</h3>
                  {selectedDestination && (
                    <>
                      <img
                        src={selectedDestination.image_url}
                        alt={selectedDestination.title}
                        style={{ borderRadius: "12px", height: "160px", width: "100%", objectFit: "cover", marginBottom: "12px" }}
                      />
                      <strong>{selectedDestination.title}</strong>
                      <div style={{ fontSize: "0.84rem", color: "var(--text-secondary)", marginBottom: "14px" }}>
                        {selectedDestination.region} · {selectedDestination.duration}
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", marginBottom: "8px" }}>
                        <span>Base Rate × {bookingForm.guests} guest(s)</span>
                        <span>{formatIDR(selectedDestination.price * bookingForm.guests)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", marginBottom: "8px" }}>
                        <span>Tier ({bookingForm.package_tier})</span>
                        <span>×{tierMultiplier}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", marginBottom: "8px" }}>
                        <span>Gear Add-ons ({bookingForm.gear_addons.length})</span>
                        <span>{formatIDR(addonCostPerGuest * bookingForm.guests)}</span>
                      </div>
                      {Number(bookingForm.guests) >= 4 && (
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem", color: "var(--ocean-primary)", fontWeight: 700, marginBottom: "8px" }}>
                          <span>Group Discount (4+ Explorers)</span>
                          <span>-8%</span>
                        </div>
                      )}
                      <hr style={{ border: "none", borderTop: "1px solid var(--glass-border)", margin: "12px 0" }} />
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: 700 }}>Estimated Total</span>
                        <strong style={{ fontSize: "1.35rem", color: "var(--ocean-primary)" }}>{formatIDR(calculatedTotal)}</strong>
                      </div>
                    </>
                  )}
                </aside>
              </div>
            </div>
          </section>
        )}

        {/* ================================================================
            PAGE 7: SIGN IN / SIGN UP & EXPLORER PORTAL
           ================================================================ */}
        {activePage === "auth" && (
          <section className="section page-top-spacer">
            <div className="container">
              <div className="section-header">
                <span className="section-tag">KTA Explorer Portal</span>
                <h2 className="section-title">{currentUser ? `Welcome, ${currentUser.full_name}` : "Sign In or Create an Explorer Account"}</h2>
                <p className="section-desc">Manage your upcoming mountain and marine bookings or look up any reservation by booking code.</p>
              </div>

              <div className="two-col-grid">
                {!currentUser ? (
                  <form className="glass-card form-card" onSubmit={handleAuthSubmit}>
                    <div style={{ display: "flex", gap: "10px", marginBottom: "18px" }}>
                      <button
                        type="button"
                        className={`btn btn-sm ${authMode === "login" ? "btn-primary" : "btn-outline"}`}
                        onClick={() => { setAuthMode("login"); setAuthStatus(null); }}
                      >
                        Sign In
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${authMode === "register" ? "btn-primary" : "btn-outline"}`}
                        onClick={() => { setAuthMode("register"); setAuthStatus(null); }}
                      >
                        Sign Up
                      </button>
                    </div>

                    {authStatus && (
                      <div className={`alert-banner ${authStatus.ok ? "alert-success" : "alert-error"}`}>
                        {authStatus.message}
                      </div>
                    )}

                    {authMode === "register" && (
                      <>
                        <div className="form-group">
                          <label htmlFor="auth-name">Full Name</label>
                          <input
                            id="auth-name"
                            type="text"
                            className="form-control"
                            required
                            value={authForm.full_name}
                            onChange={(e) => setAuthForm({ ...authForm, full_name: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="auth-phone">WhatsApp Number</label>
                          <input
                            id="auth-phone"
                            type="tel"
                            className="form-control"
                            value={authForm.phone}
                            onChange={(e) => setAuthForm({ ...authForm, phone: e.target.value })}
                          />
                        </div>
                      </>
                    )}

                    <div className="form-group">
                      <label htmlFor="auth-email">Email Address</label>
                      <input
                        id="auth-email"
                        type="email"
                        className="form-control"
                        required
                        value={authForm.email}
                        onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="auth-pass">Password (min 6 chars)</label>
                      <input
                        id="auth-pass"
                        type="password"
                        className="form-control"
                        required
                        value={authForm.password}
                        onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                      />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
                      {authMode === "login" ? "Sign In to Portal" : "Create Explorer Account"}
                    </button>
                  </form>
                ) : (
                  <div className="glass-card form-card">
                    <h3>Account Profile</h3>
                    <p style={{ margin: "10px 0", color: "var(--text-secondary)" }}>
                      <strong>Email:</strong> {currentUser.email}<br />
                      <strong>Phone:</strong> {currentUser.phone || "Not set"}
                    </p>
                    <button className="btn btn-outline btn-sm" onClick={handleLogout}>
                      <i className="fa-solid fa-right-from-bracket"></i> Sign Out
                    </button>
                  </div>
                )}

                {/* BOOKING LOOKUP & HISTORY */}
                <div className="glass-card form-card">
                  <h3 style={{ marginBottom: "10px" }}>My Reservations &amp; Code Lookup</h3>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter Booking Code (e.g. KTA-A1B2C3)"
                      value={lookupCode}
                      onChange={(e) => setLookupCode(e.target.value)}
                    />
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => fetchUserBookings(lookupCode)}>
                      Track
                    </button>
                  </div>

                  {myBookings.length === 0 ? (
                    <p style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>
                      No bookings loaded yet. Sign in or search with your 6-character KTA booking code.
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {myBookings.map((b) => (
                        <div key={b.booking_code} className="glass-card" style={{ padding: "14px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <strong style={{ color: "var(--ocean-primary)" }}>{b.booking_code}</strong>
                            <span style={{ fontSize: "0.78rem", fontWeight: 700 }}>{b.status}</span>
                          </div>
                          <div style={{ fontWeight: 700, margin: "4px 0" }}>{b.destination_title}</div>
                          <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                            Date: {b.departure_date} · {b.guests} Guest(s) · {formatIDR(b.total_price)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ================================================================
            PAGE 8: CONTACT & GOOGLE MAPS INTEGRATION
           ================================================================ */}
        {activePage === "contact" && (
          <section className="section page-top-spacer">
            <div className="container">
              <div className="section-header">
                <span className="section-tag">Malang Basecamp HQ</span>
                <h2 className="section-title">Speak With an Expedition Planner</h2>
                <p className="section-desc">Questions about altitude readiness, private phinisi charters, or corporate retreats? Reach our operations desk directly.</p>
              </div>

              <div className="two-col-grid">
                <form className="glass-card form-card" onSubmit={handleContactSubmit}>
                  {contactStatus && (
                    <div className={`alert-banner ${contactStatus.ok ? "alert-success" : "alert-error"}`}>
                      {contactStatus.message}
                    </div>
                  )}
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="ct-name">Your Name *</label>
                      <input
                        id="ct-name"
                        type="text"
                        className="form-control"
                        required
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="ct-email">Email Address *</label>
                      <input
                        id="ct-email"
                        type="email"
                        className="form-control"
                        required
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="ct-subj">Subject</label>
                    <input
                      id="ct-subj"
                      type="text"
                      className="form-control"
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="ct-msg">Message *</label>
                    <textarea
                      id="ct-msg"
                      rows="4"
                      className="form-control"
                      required
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="Tell us your target dates, group size, and dream destination..."
                    ></textarea>
                  </div>
                  <button type="submit" className="btn btn-primary">
                    <i className="fa-solid fa-paper-plane"></i> Send Dispatch
                  </button>
                </form>

                <div className="glass-card form-card">
                  <h3 style={{ marginBottom: "10px" }}>Basecamp Coordinates</h3>
                  <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "14px" }}>
                    <i className="fa-solid fa-location-dot" style={{ color: "var(--ocean-primary)" }}></i> Jl. Ijen Boulevard No. 48, Klojen, Kota Malang, East Java 65119<br />
                    <i className="fa-solid fa-phone" style={{ color: "var(--ocean-primary)" }}></i> +62 341 558 920 · +62 812 8899 4410<br />
                    <i className="fa-solid fa-envelope" style={{ color: "var(--ocean-primary)" }}></i> basecamp@kabuttipis.id
                  </p>
                  <div style={{ borderRadius: "14px", overflow: "hidden", height: "250px", border: "1px solid var(--glass-border)" }}>
                    <iframe
                      title="Kabut Tipis Adventure Malang Basecamp Map"
                      src="https://www.openstreetmap.org/export/embed.html?bbox=112.6150%2C-7.9750%2C112.6350%2C-7.9600&layer=mapnik&marker=-7.9675%2C112.6250"
                      style={{ width: "100%", height: "100%", border: 0 }}
                      loading="lazy"
                    ></iframe>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* DESTINATION ITINERARY MODAL */}
      {selectedDestModal && (
        <div className="modal-backdrop" onClick={() => setSelectedDestModal(null)} role="dialog" aria-modal="true">
          <div className="glass-card modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ color: "var(--dark-blue)" }}>{selectedDestModal.title}</h3>
              <button className="icon-toggle-btn" onClick={() => setSelectedDestModal(null)} aria-label="Close modal">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "14px" }}>
              {selectedDestModal.summary}
            </p>
            <h4 style={{ marginBottom: "8px", color: "var(--ocean-primary)" }}>Day-by-Day Expedition Route</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "18px" }}>
              {selectedDestModal.itinerary.map((step, idx) => (
                <div key={idx} className="glass-card" style={{ padding: "12px" }}>
                  <strong>{step.day}: {step.title}</strong>
                  <p style={{ fontSize: "0.86rem", color: "var(--text-secondary)" }}>{step.desc}</p>
                </div>
              ))}
            </div>
            <button
              className="btn btn-primary"
              style={{ width: "100%" }}
              onClick={() => {
                const id = selectedDestModal.id;
                setSelectedDestModal(null);
                navigateTo("booking", id);
              }}
            >
              Book This Expedition ({formatIDR(selectedDestModal.price)})
            </button>
          </div>
        </div>
      )}

      {/* GALLERY LIGHTBOX MODAL */}
      {lightboxIdx !== null && (
        <div className="modal-backdrop" onClick={() => setLightboxIdx(null)} role="dialog" aria-modal="true">
          <div className="glass-card modal-box" style={{ maxWidth: "860px", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            <img
              src={GALLERY_ITEMS[lightboxIdx].url}
              alt={GALLERY_ITEMS[lightboxIdx].title}
              style={{ borderRadius: "14px", maxHeight: "65vh", margin: "0 auto 12px" }}
            />
            <p style={{ fontWeight: 700, marginBottom: "12px" }}>{GALLERY_ITEMS[lightboxIdx].title}</p>
            <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
              <button className="btn btn-outline btn-sm" onClick={() => setLightboxIdx((lightboxIdx - 1 + GALLERY_ITEMS.length) % GALLERY_ITEMS.length)}>
                <i className="fa-solid fa-arrow-left"></i> Prev
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => setLightboxIdx(null)}>
                Close
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => setLightboxIdx((lightboxIdx + 1) % GALLERY_ITEMS.length)}>
                Next <i className="fa-solid fa-arrow-right"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MULTI-COLUMN FOOTER */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <h4>Kabut Tipis Adventure (KTA)</h4>
              <p style={{ fontSize: "0.86rem", opacity: 0.85 }}>
                Certified Indonesian mountain and marine expedition outfitters crafting safe, small-group journeys across the Ring of Fire and Coral Triangle.
              </p>
              <div className="social-row">
                <a href="#instagram" className="social-icon" aria-label="Instagram" onClick={(e) => e.preventDefault()}><i className="fa-brands fa-instagram"></i></a>
                <a href="#youtube" className="social-icon" aria-label="YouTube" onClick={(e) => e.preventDefault()}><i className="fa-brands fa-youtube"></i></a>
                <a href="#tiktok" className="social-icon" aria-label="TikTok" onClick={(e) => e.preventDefault()}><i className="fa-brands fa-tiktok"></i></a>
                <a href="#whatsapp" className="social-icon" aria-label="WhatsApp" onClick={(e) => e.preventDefault()}><i className="fa-brands fa-whatsapp"></i></a>
              </div>
            </div>

            <div>
              <h4>Navigation</h4>
              <ul className="footer-links">
                <li><button onClick={() => navigateTo("about")}>About KTA</button></li>
                <li><button onClick={() => navigateTo("destinations")}>All Expeditions</button></li>
                <li><button onClick={() => navigateTo("packages")}>Pricing Tiers</button></li>
                <li><button onClick={() => navigateTo("gallery")}>Photo Chronicles</button></li>
              </ul>
            </div>

            <div>
              <h4>Explorer Support</h4>
              <ul className="footer-links">
                <li><button onClick={() => navigateTo("booking")}>Reserve an Expedition</button></li>
                <li><button onClick={() => navigateTo("auth")}>Track Booking Code</button></li>
                <li><button onClick={() => navigateTo("contact")}>Malang Basecamp HQ</button></li>
              </ul>
            </div>

            <div>
              <h4>Trail &amp; Tide Dispatches</h4>
              <p style={{ fontSize: "0.84rem", marginBottom: "10px", opacity: 0.85 }}>
                Receive seasonal summit openings and early-bird phinisi charter alerts.
              </p>
              <form onSubmit={handleNewsletterSubmit} style={{ display: "flex", gap: "8px" }}>
                <input
                  type="email"
                  className="form-control"
                  required
                  placeholder="explorer@email.com"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  aria-label="Newsletter email"
                />
                <button type="submit" className="btn btn-primary btn-sm">Join</button>
              </form>
              {newsletterStatus && (
                <small style={{ display: "block", marginTop: "8px", color: "#90E0EF" }}>
                  {newsletterStatus.message}
                </small>
              )}
            </div>
          </div>

          <div className="footer-bottom">
            <span>© 2026 Kabut Tipis Adventure (PT Kabut Tipis Nusantara). All rights reserved.</span>
            <span>APGI Certified · Zero-Trace Expedition Partner</span>
          </div>
        </div>
      </footer>

      {/* PERSISTENT STICKY CTA BUTTON */}
      {activePage !== "booking" && (
        <button className="btn btn-primary sticky-cta" onClick={() => navigateTo("booking")}>
          <i className="fa-solid fa-compass"></i> Book Expedition
        </button>
      )}

      {/* BACK TO TOP BUTTON */}
      <button
        className={`back-to-top ${showBackTop ? "visible" : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
      >
        <i className="fa-solid fa-arrow-up"></i>
      </button>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
