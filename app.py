import json
import os
import re
import sqlite3
import uuid
from datetime import datetime
from functools import wraps

from flask import Flask, g, jsonify, render_template, request, session
from werkzeug.security import check_password_hash, generate_password_hash

app = Flask(__name__)
app.secret_key = os.environ.get("KTA_SECRET_KEY", "kta-ocean-mist-secret-key-2026")
DATABASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "kta_database.db")


# ==============================================================================
# DATABASE HELPERS & INITIALIZATION
# ==============================================================================
def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(exception=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    db = sqlite3.connect(DATABASE)
    cursor = db.cursor()

    # Users Table (with role: explorer / admin)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT,
            role TEXT NOT NULL DEFAULT 'explorer',
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)

    # Destinations Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS destinations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slug TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            region TEXT NOT NULL,
            category TEXT NOT NULL,
            difficulty TEXT NOT NULL,
            duration TEXT NOT NULL,
            elevation TEXT NOT NULL,
            price INTEGER NOT NULL,
            rating REAL NOT NULL DEFAULT 4.9,
            reviews_count INTEGER NOT NULL DEFAULT 1,
            image_url TEXT NOT NULL,
            summary TEXT NOT NULL,
            highlights_json TEXT NOT NULL,
            itinerary_json TEXT NOT NULL
        )
    """)

    # Bookings Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_code TEXT UNIQUE NOT NULL,
            user_id INTEGER,
            full_name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            destination_id INTEGER NOT NULL,
            destination_title TEXT NOT NULL,
            package_tier TEXT NOT NULL,
            departure_date TEXT NOT NULL,
            guests INTEGER NOT NULL,
            gear_addons_json TEXT NOT NULL,
            notes TEXT,
            total_price INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'Confirmed',
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    """)

    # Contact Messages Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            subject TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)

    # Newsletter Subscribers Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS subscribers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            created_at TEXT NOT NULL
        )
    """)

    # Seed Default Admin Account if missing
    cursor.execute("SELECT id FROM users WHERE email = ?", ("admin@kabuttipis.id",))
    if not cursor.fetchone():
        cursor.execute(
            "INSERT INTO users (full_name, email, phone, role, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (
                "KTA Operations Admin",
                "admin@kabuttipis.id",
                "+62 812 8899 4410",
                "admin",
                generate_password_hash("admin123"),
                datetime.utcnow().isoformat() + "Z",
            ),
        )

    # Seed Initial Destinations if empty
    cursor.execute("SELECT COUNT(*) FROM destinations")
    if cursor.fetchone()[0] == 0:
        seed_destinations = [
            (
                "mount-rinjani-summit",
                "Mount Rinjani Summit & Segara Anak",
                "Lombok, West Nusa Tenggara",
                "Alpine Summit",
                "Challenging",
                "4 Days / 3 Nights",
                "3,726 MASL",
                3850000,
                4.9,
                214,
                "https://picsum.photos/seed/rinjani2026/900/600",
                "Ascend Indonesia's second-highest volcano above a sea of morning mist, descending to the turquoise crater lake of Segara Anak and natural hot springs.",
                json.dumps([
                    "Sembalun crater rim sunrise panorama",
                    "3,726m volcanic summit push with certified alpine guides",
                    "Segara Anak crater lake camp & natural geothermal springs",
                    "Full porter team, 4-season tents & hot mountain meals"
                ]),
                json.dumps([
                    {"day": "Day 1", "title": "Sembalun Trailhead to Plawangan Crater Rim", "desc": "Acclimatization trek across open savannah hills to basecamp at 2,639m."},
                    {"day": "Day 2", "title": "Summit Push (3,726m) & Segara Anak Lake", "desc": "02:00 AM alpine ascent for sunrise over Bali & Sumbawa, followed by descent to the crater lake."},
                    {"day": "Day 3", "title": "Hot Springs & Senaru Rim", "desc": "Morning soak in Aik Kalak thermal springs and ridge traverse overlooking Gili islands."},
                    {"day": "Day 4", "title": "Rainforest Descent to Senaru", "desc": "Trek through lush montane cloud forest and private transfer to Senggigi or airport."}
                ])
            ),
            (
                "komodo-padar-expedition",
                "Komodo, Padar & Manta Liveaboard",
                "Labuan Bajo, East Nusa Tenggara",
                "Marine & Island",
                "Moderate",
                "3 Days / 2 Nights",
                "Sea Level - 350 MASL",
                4650000,
                4.9,
                189,
                "https://picsum.photos/seed/komodo2026/900/600",
                "Sail across sapphire channels aboard a handcrafted wooden phinisi, trekking Padar's iconic three-bay ridge and freediving alongside giant reef mantas.",
                json.dumps([
                    "Private ensuite phinisi schooner with ocean deck",
                    "Sunrise ridge hike on Padar Island",
                    "Guided ranger walk on Komodo & Rinca Islands",
                    "Manta Point drift snorkeling & Pink Beach"
                ]),
                json.dumps([
                    {"day": "Day 1", "title": "Kelor Island & Kalong Sunset", "desc": "Board phinisi in Labuan Bajo, snorkel coral gardens, and watch flying foxes at dusk."},
                    {"day": "Day 2", "title": "Padar Sunrise, Pink Beach & Komodo", "desc": "Dawn hike up Padar, swim at rose-tinted coral sands, and track Komodo dragons."},
                    {"day": "Day 3", "title": "Manta Point & Kanawa Reef", "desc": "Drift snorkel with manta rays before returning to Labuan Bajo harbor."}
                ])
            ),
            (
                "bromo-ijen-bluefire",
                "Bromo Caldera & Ijen Blue Fire Overland",
                "East Java Highlands",
                "Volcanic Overland",
                "Easy-Moderate",
                "3 Days / 2 Nights",
                "2,329 - 2,799 MASL",
                2750000,
                4.8,
                312,
                "https://picsum.photos/seed/bromo2026/900/600",
                "Witness golden dawn breaking through thick Tengger caldera mist and descend into Kawah Ijen's electric-blue sulfur flames and acid turquoise lake.",
                json.dumps([
                    "4x4 vintage Land Cruiser across Sea of Sand",
                    "King Kong Hill & Seruni mist viewpoint",
                    "Industrial-grade respirator masks for Ijen Blue Fire",
                    "Boutique mountain lodge stays & private transport"
                ]),
                json.dumps([
                    {"day": "Day 1", "title": "Malang / Surabaya to Bromo Highlands", "desc": "Scenic highland drive, waterfall stop at Madakaripura, and acclimatization rest."},
                    {"day": "Day 2", "title": "Bromo Sea of Sand Sunrise & Transfer to Banyuwangi", "desc": "03:00 AM 4x4 expedition across the volcanic caldera and transfer east."},
                    {"day": "Day 3", "title": "Kawah Ijen Blue Fire & Turquoise Crater", "desc": "Midnight hike to witness rare blue flames and sunrise over the world's largest acidic crater lake."}
                ])
            ),
            (
                "raja-ampat-wayag",
                "Raja Ampat Wayag & Piaynemo Kayaking",
                "West Papua",
                "Marine & Island",
                "Moderate",
                "5 Days / 4 Nights",
                "Sea Level - 200 MASL",
                7900000,
                5.0,
                142,
                "https://picsum.photos/seed/rajaampat2026/900/600",
                "Paddle through emerald karst labyrinths in the heart of the Coral Triangle, exploring hidden lagoons, endemic Birds-of-Paradise, and vibrant reefs.",
                json.dumps([
                    "Wayag & Piaynemo karst summit viewpoints",
                    "Sea kayaking through hidden turquoise lagoons",
                    "Dawn Bird-of-Paradise forest trek on Waigeo",
                    "Eco-waterfront bungalow & speedboat transfers"
                ]),
                json.dumps([
                    {"day": "Day 1", "title": "Sorong to Waisai & Friwen Wall", "desc": "Fast ferry crossing and afternoon drift snorkel along soft-coral walls."},
                    {"day": "Day 2", "title": "Piaynemo & Telaga Bintang", "desc": "Climb wooden stairways to star-shaped lagoons and visit Arborek marine village."},
                    {"day": "Day 3", "title": "Full-Day Wayag Karst Expedition", "desc": "Speedboat voyage north to Wayag's dramatic limestone islets and shark nursery."},
                    {"day": "Day 4", "title": "Red Bird-of-Paradise Dawn Walk & Kabui Bay", "desc": "Early jungle trek followed by sea kayaking through narrow karst passages."},
                    {"day": "Day 5", "title": "Sorong Return", "desc": "Morning reef swim and transfer back to Sorong airport."}
                ])
            ),
            (
                "semeru-ranukumbolo",
                "Ranu Kumbolo & Mahameru Cloud Trail",
                "Bromo Tengger Semeru, East Java",
                "Alpine Summit",
                "Challenging",
                "3 Days / 2 Nights",
                "3,676 MASL",
                2650000,
                4.9,
                267,
                "https://picsum.photos/seed/semeru2026/900/600",
                "Camp beside the mirror-still alpine waters of Ranu Kumbolo as morning mist rises off the lake, followed by a volcanic scree ascent to Java's highest peak.",
                json.dumps([
                    "Lakeside camping at Ranu Kumbolo (2,400m)",
                    "Oro-oro Ombo lavender & pine savannah crossing",
                    "Summit push to Mahameru (3,676 MASL)",
                    "Official national park SIMAKSI permits handled"
                ]),
                json.dumps([
                    {"day": "Day 1", "title": "Ranu Pani to Ranu Kumbolo", "desc": "Gentle ridge trail through mossy cloud forest to lakeside camp."},
                    {"day": "Day 2", "title": "Kalimati Basecamp Acclimatization", "desc": "Climb Tanjakan Cinta, cross Oro-oro Ombo meadows, and prepare gear at Kalimati."},
                    {"day": "Day 3", "title": "Mahameru Summit & Descent", "desc": "01:00 AM volcanic ash ascent for Java's highest sunrise and return to Ranu Pani."}
                ])
            ),
            (
                "sumba-savannah-waterfall",
                "Sumba Untamed Savannah & Blue Lagoons",
                "East & West Sumba, NTT",
                "Cultural & Overland",
                "Easy",
                "4 Days / 3 Nights",
                "Sea Level - 600 MASL",
                4200000,
                4.8,
                176,
                "https://picsum.photos/seed/sumba2026/900/600",
                "Traverse rolling golden hills, swim in crystal-clear Weekuri saltwater lagoon, and experience living megalithic traditions in ancestral Marapu villages.",
                json.dumps([
                    "Wairinding & Tanarara sunset savannah hills",
                    "Weekuri Lagoon & Mandorak limestone cliffs",
                    "Tanggedu Canyon waterfall trek",
                    "Respectful cultural immersion in Ratenggaro village"
                ]),
                json.dumps([
                    {"day": "Day 1", "title": "Tambolaka to Weekuri & Ratenggaro", "desc": "Swim in crystal tidal pools and visit towering thatched-roof coastal houses."},
                    {"day": "Day 2", "title": "Lapopu Waterfall & Wairinding Hills", "desc": "Jungle walk to terraced cascades and golden hour across rolling savannah."},
                    {"day": "Day 3", "title": "Tanggedu Canyon & Walakiri Mangroves", "desc": "Trek limestone river gorges and photograph dancing mangrove silhouettes at dusk."},
                    {"day": "Day 4", "title": "Waingapu Departure", "desc": "Morning tenun ikat weaving studio visit before flight departure."}
                ])
            )
        ]
        cursor.executemany("""
            INSERT INTO destinations (
                slug, title, region, category, difficulty, duration, elevation,
                price, rating, reviews_count, image_url, summary, highlights_json, itinerary_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, seed_destinations)

    db.commit()
    db.close()


# ==============================================================================
# HELPER UTILITIES & AUTH DECORATORS
# ==============================================================================
EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def slugify(text):
    clean = re.sub(r"[^a-zA-Z0-9]+", "-", text.lower()).strip("-")
    return f"{clean}-{uuid.uuid4().hex[:4]}"


def serialize_destination(row):
    return {
        "id": row["id"],
        "slug": row["slug"],
        "title": row["title"],
        "region": row["region"],
        "category": row["category"],
        "difficulty": row["difficulty"],
        "duration": row["duration"],
        "elevation": row["elevation"],
        "price": row["price"],
        "rating": row["rating"],
        "reviews_count": row["reviews_count"],
        "image_url": row["image_url"],
        "summary": row["summary"],
        "highlights": json.loads(row["highlights_json"]),
        "itinerary": json.loads(row["itinerary_json"]),
    }


def serialize_booking(r):
    return {
        "id": r["id"],
        "booking_code": r["booking_code"],
        "full_name": r["full_name"],
        "email": r["email"],
        "phone": r["phone"],
        "destination_id": r["destination_id"],
        "destination_title": r["destination_title"],
        "package_tier": r["package_tier"],
        "departure_date": r["departure_date"],
        "guests": r["guests"],
        "gear_addons": json.loads(r["gear_addons_json"]),
        "notes": r["notes"],
        "total_price": r["total_price"],
        "status": r["status"],
        "created_at": r["created_at"],
    }


def admin_required_api(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user_id = session.get("user_id")
        if not user_id:
            return jsonify({"ok": False, "message": "Admin sign-in required."}), 401
        db = get_db()
        user = db.execute("SELECT role FROM users WHERE id = ?", (user_id,)).fetchone()
        if not user or user["role"] != "admin":
            return jsonify({"ok": False, "message": "Administrator privileges required."}), 403
        return f(*args, **kwargs)
    return decorated


# ==============================================================================
# WEB PAGE ROUTE
# ==============================================================================
@app.route("/")
def index():
    return render_template("index.html")


# ==============================================================================
# DESTINATIONS CRUD ENDPOINTS (CREATE, READ, UPDATE, DELETE)
# ==============================================================================
@app.route("/api/destinations", methods=["GET"])
def api_get_destinations():
    db = get_db()
    category = request.args.get("category", "").strip()
    search = request.args.get("search", "").strip().lower()

    query = "SELECT * FROM destinations WHERE 1=1"
    params = []

    if category and category.lower() != "all":
        query += " AND category = ?"
        params.append(category)

    if search:
        query += " AND (LOWER(title) LIKE ? OR LOWER(region) LIKE ? OR LOWER(summary) LIKE ?)"
        like_term = f"%{search}%"
        params.extend([like_term, like_term, like_term])

    query += " ORDER BY id ASC"
    rows = db.execute(query, params).fetchall()
    return jsonify({
        "ok": True,
        "destinations": [serialize_destination(r) for r in rows]
    })


@app.route("/api/destinations/<int:dest_id>", methods=["GET"])
def api_get_destination_detail(dest_id):
    db = get_db()
    row = db.execute("SELECT * FROM destinations WHERE id = ?", (dest_id,)).fetchone()
    if not row:
        return jsonify({"ok": False, "message": "Destination not found."}), 404
    return jsonify({"ok": True, "destination": serialize_destination(row)})


@app.route("/api/destinations", methods=["POST"])
@admin_required_api
def api_create_destination():
    data = request.get_json(silent=True) or {}
    title = str(data.get("title", "")).strip()
    region = str(data.get("region", "")).strip()
    category = str(data.get("category", "Alpine Summit")).strip()
    difficulty = str(data.get("difficulty", "Moderate")).strip()
    duration = str(data.get("duration", "3 Days / 2 Nights")).strip()
    elevation = str(data.get("elevation", "2,500 MASL")).strip()
    summary = str(data.get("summary", "")).strip()
    image_url = str(data.get("image_url", "")).strip() or f"https://picsum.photos/seed/{uuid.uuid4().hex[:6]}/900/600"

    try:
        price = int(data.get("price", 0))
    except (TypeError, ValueError):
        price = 0

    if len(title) < 3 or len(region) < 3 or price <= 0 or len(summary) < 10:
        return jsonify({
            "ok": False,
            "message": "Please fill in Title, Region, valid Price (> 0), and Summary (min 10 chars)."
        }), 400

    highlights = data.get("highlights") or [
        "Certified APGI / Marine expedition guide",
        "Official national park permits & safety insurance",
        "Full expedition camp & hot trail meals"
    ]
    itinerary = data.get("itinerary") or [
        {"day": "Day 1", "title": "Basecamp Arrival & Acclimatization", "desc": "Gear inspection, safety briefing, and approach hike."},
        {"day": "Day 2", "title": "Summit / Main Ridge Exploration", "desc": "Early morning push for panoramic sunrise views."},
        {"day": "Day 3", "title": "Descent & Transfer Out", "desc": "Return to basecamp and private transfer."}
    ]

    db = get_db()
    cursor = db.execute("""
        INSERT INTO destinations (
            slug, title, region, category, difficulty, duration, elevation,
            price, rating, reviews_count, image_url, summary, highlights_json, itinerary_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 4.9, 1, ?, ?, ?, ?)
    """, (
        slugify(title),
        title,
        region,
        category,
        difficulty,
        duration,
        elevation,
        price,
        image_url,
        summary,
        json.dumps(highlights),
        json.dumps(itinerary),
    ))
    db.commit()

    created = db.execute("SELECT * FROM destinations WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return jsonify({
        "ok": True,
        "message": f"Destination '{title}' created successfully!",
        "destination": serialize_destination(created)
    }), 201


@app.route("/api/destinations/<int:dest_id>", methods=["PUT"])
@admin_required_api
def api_update_destination(dest_id):
    db = get_db()
    existing = db.execute("SELECT * FROM destinations WHERE id = ?", (dest_id,)).fetchone()
    if not existing:
        return jsonify({"ok": False, "message": "Destination not found."}), 404

    data = request.get_json(silent=True) or {}
    title = str(data.get("title", existing["title"])).strip()
    region = str(data.get("region", existing["region"])).strip()
    category = str(data.get("category", existing["category"])).strip()
    difficulty = str(data.get("difficulty", existing["difficulty"])).strip()
    duration = str(data.get("duration", existing["duration"])).strip()
    elevation = str(data.get("elevation", existing["elevation"])).strip()
    image_url = str(data.get("image_url", existing["image_url"])).strip()
    summary = str(data.get("summary", existing["summary"])).strip()

    try:
        price = int(data.get("price", existing["price"]))
    except (TypeError, ValueError):
        price = existing["price"]

    if len(title) < 3 or len(region) < 3 or price <= 0:
        return jsonify({"ok": False, "message": "Title, Region, and positive Price are required."}), 400

    highlights_json = json.dumps(data["highlights"]) if isinstance(data.get("highlights"), list) else existing["highlights_json"]
    itinerary_json = json.dumps(data["itinerary"]) if isinstance(data.get("itinerary"), list) else existing["itinerary_json"]

    db.execute("""
        UPDATE destinations
        SET title = ?, region = ?, category = ?, difficulty = ?, duration = ?,
            elevation = ?, price = ?, image_url = ?, summary = ?,
            highlights_json = ?, itinerary_json = ?
        WHERE id = ?
    """, (
        title, region, category, difficulty, duration, elevation,
        price, image_url, summary, highlights_json, itinerary_json, dest_id
    ))
    db.commit()

    updated = db.execute("SELECT * FROM destinations WHERE id = ?", (dest_id,)).fetchone()
    return jsonify({
        "ok": True,
        "message": f"Destination '{title}' updated!",
        "destination": serialize_destination(updated)
    })


@app.route("/api/destinations/<int:dest_id>", methods=["DELETE"])
@admin_required_api
def api_delete_destination(dest_id):
    db = get_db()
    existing = db.execute("SELECT title FROM destinations WHERE id = ?", (dest_id,)).fetchone()
    if not existing:
        return jsonify({"ok": False, "message": "Destination not found."}), 404

    db.execute("DELETE FROM destinations WHERE id = ?", (dest_id,))
    db.commit()
    return jsonify({
        "ok": True,
        "message": f"Destination '{existing['title']}' deleted."
    })


# ==============================================================================
# BOOKINGS CRUD ENDPOINTS (CREATE, READ, UPDATE, DELETE)
# ==============================================================================
@app.route("/api/bookings", methods=["POST"])
def api_create_booking():
    data = request.get_json(silent=True) or {}

    full_name = str(data.get("full_name", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    phone = str(data.get("phone", "")).strip()
    destination_id = data.get("destination_id")
    package_tier = str(data.get("package_tier", "Explorer Standard")).strip()
    departure_date = str(data.get("departure_date", "")).strip()
    guests = int(data.get("guests", 1))
    gear_addons = data.get("gear_addons", [])
    notes = str(data.get("notes", "")).strip()
    total_price = int(data.get("total_price", 0))

    if not full_name or len(full_name) < 2:
        return jsonify({"ok": False, "message": "Please enter your full name."}), 400
    if not EMAIL_REGEX.match(email):
        return jsonify({"ok": False, "message": "Please provide a valid email address."}), 400
    if not phone or len(phone) < 7:
        return jsonify({"ok": False, "message": "Please enter a valid WhatsApp/phone number."}), 400
    if not departure_date:
        return jsonify({"ok": False, "message": "Please select a preferred departure date."}), 400
    if guests < 1 or guests > 25:
        return jsonify({"ok": False, "message": "Group size must be between 1 and 25 explorers."}), 400

    db = get_db()
    dest = db.execute("SELECT * FROM destinations WHERE id = ?", (destination_id,)).fetchone()
    if not dest:
        return jsonify({"ok": False, "message": "Selected expedition destination was not found."}), 404

    booking_code = f"KTA-{uuid.uuid4().hex[:6].upper()}"
    user_id = session.get("user_id")
    created_at = datetime.utcnow().isoformat() + "Z"

    db.execute("""
        INSERT INTO bookings (
            booking_code, user_id, full_name, email, phone, destination_id,
            destination_title, package_tier, departure_date, guests,
            gear_addons_json, notes, total_price, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed', ?)
    """, (
        booking_code,
        user_id,
        full_name,
        email,
        phone,
        dest["id"],
        dest["title"],
        package_tier,
        departure_date,
        guests,
        json.dumps(gear_addons),
        notes,
        total_price,
        created_at
    ))
    db.commit()

    return jsonify({
        "ok": True,
        "message": "Expedition reservation confirmed!",
        "booking": {
            "booking_code": booking_code,
            "full_name": full_name,
            "email": email,
            "destination_title": dest["title"],
            "package_tier": package_tier,
            "departure_date": departure_date,
            "guests": guests,
            "total_price": total_price,
            "status": "Confirmed"
        }
    }), 201


@app.route("/api/bookings", methods=["GET"])
@admin_required_api
def api_admin_list_bookings():
    db = get_db()
    rows = db.execute("SELECT * FROM bookings ORDER BY id DESC").fetchall()
    return jsonify({
        "ok": True,
        "bookings": [serialize_booking(r) for r in rows]
    })


@app.route("/api/bookings/<int:booking_id>", methods=["PUT"])
@admin_required_api
def api_update_booking(booking_id):
    db = get_db()
    existing = db.execute("SELECT * FROM bookings WHERE id = ?", (booking_id,)).fetchone()
    if not existing:
        return jsonify({"ok": False, "message": "Booking record not found."}), 404

    data = request.get_json(silent=True) or {}
    status = str(data.get("status", existing["status"])).strip()
    departure_date = str(data.get("departure_date", existing["departure_date"])).strip()
    package_tier = str(data.get("package_tier", existing["package_tier"])).strip()
    guests = int(data.get("guests", existing["guests"]))
    notes = str(data.get("notes", existing["notes"] or "")).strip()

    db.execute("""
        UPDATE bookings
        SET status = ?, departure_date = ?, package_tier = ?, guests = ?, notes = ?
        WHERE id = ?
    """, (status, departure_date, package_tier, guests, notes, booking_id))
    db.commit()

    updated = db.execute("SELECT * FROM bookings WHERE id = ?", (booking_id,)).fetchone()
    return jsonify({
        "ok": True,
        "message": f"Booking {updated['booking_code']} updated to '{status}'.",
        "booking": serialize_booking(updated)
    })


@app.route("/api/bookings/<int:booking_id>", methods=["DELETE"])
@admin_required_api
def api_delete_booking(booking_id):
    db = get_db()
    existing = db.execute("SELECT booking_code FROM bookings WHERE id = ?", (booking_id,)).fetchone()
    if not existing:
        return jsonify({"ok": False, "message": "Booking record not found."}), 404

    db.execute("DELETE FROM bookings WHERE id = ?", (booking_id,))
    db.commit()
    return jsonify({
        "ok": True,
        "message": f"Booking {existing['booking_code']} deleted."
    })


@app.route("/api/bookings/lookup", methods=["GET"])
def api_lookup_bookings():
    db = get_db()
    user_id = session.get("user_id")
    code = request.args.get("code", "").strip().upper()
    email = request.args.get("email", "").strip().lower()

    if code:
        rows = db.execute("SELECT * FROM bookings WHERE booking_code = ? ORDER BY id DESC", (code,)).fetchall()
    elif email:
        rows = db.execute("SELECT * FROM bookings WHERE LOWER(email) = ? ORDER BY id DESC", (email,)).fetchall()
    elif user_id:
        user = db.execute("SELECT email FROM users WHERE id = ?", (user_id,)).fetchone()
        rows = db.execute(
            "SELECT * FROM bookings WHERE user_id = ? OR LOWER(email) = ? ORDER BY id DESC",
            (user_id, user["email"].lower() if user else "")
        ).fetchall()
    else:
        return jsonify({"ok": True, "bookings": []})

    return jsonify({"ok": True, "bookings": [serialize_booking(r) for r in rows]})


# ==============================================================================
# CONTACT & NEWSLETTER ENDPOINTS (+ ADMIN READ/DELETE)
# ==============================================================================
@app.route("/api/contact", methods=["POST"])
def api_contact():
    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    subject = str(data.get("subject", "General Expedition Inquiry")).strip()
    message = str(data.get("message", "")).strip()

    if len(name) < 2:
        return jsonify({"ok": False, "message": "Please enter your name."}), 400
    if not EMAIL_REGEX.match(email):
        return jsonify({"ok": False, "message": "Please enter a valid email address."}), 400
    if len(message) < 10:
        return jsonify({"ok": False, "message": "Please write a message of at least 10 characters."}), 400

    db = get_db()
    db.execute(
        "INSERT INTO contacts (name, email, subject, message, created_at) VALUES (?, ?, ?, ?, ?)",
        (name, email, subject, message, datetime.utcnow().isoformat() + "Z")
    )
    db.commit()

    return jsonify({
        "ok": True,
        "message": "Thank you! Our Malang Basecamp expedition specialist will reply within 4 business hours."
    }), 201


@app.route("/api/newsletter", methods=["POST"])
def api_newsletter():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()

    if not EMAIL_REGEX.match(email):
        return jsonify({"ok": False, "message": "Please enter a valid email address."}), 400

    db = get_db()
    existing = db.execute("SELECT id FROM subscribers WHERE email = ?", (email,)).fetchone()
    if existing:
        return jsonify({
            "ok": True,
            "message": "You are already subscribed to Kabut Tipis Adventure trail dispatches!"
        })

    db.execute(
        "INSERT INTO subscribers (email, created_at) VALUES (?, ?)",
        (email, datetime.utcnow().isoformat() + "Z")
    )
    db.commit()

    return jsonify({
        "ok": True,
        "message": "Welcome aboard! Seasonal trail reports and early-bird expedition slots are headed to your inbox."
    }), 201


@app.route("/api/admin/inquiries", methods=["GET"])
@admin_required_api
def api_admin_inquiries():
    db = get_db()
    contacts = [dict(r) for r in db.execute("SELECT * FROM contacts ORDER BY id DESC").fetchall()]
    subscribers = [dict(r) for r in db.execute("SELECT * FROM subscribers ORDER BY id DESC").fetchall()]
    return jsonify({"ok": True, "contacts": contacts, "subscribers": subscribers})


@app.route("/api/contacts/<int:contact_id>", methods=["DELETE"])
@admin_required_api
def api_delete_contact(contact_id):
    db = get_db()
    db.execute("DELETE FROM contacts WHERE id = ?", (contact_id,))
    db.commit()
    return jsonify({"ok": True, "message": "Contact inquiry removed."})


@app.route("/api/subscribers/<int:sub_id>", methods=["DELETE"])
@admin_required_api
def api_delete_subscriber(sub_id):
    db = get_db()
    db.execute("DELETE FROM subscribers WHERE id = ?", (sub_id,))
    db.commit()
    return jsonify({"ok": True, "message": "Subscriber removed."})


# ==============================================================================
# AUTHENTICATION ENDPOINTS (SIGN UP / SIGN IN / DEMO ADMIN / SESSION)
# ==============================================================================
@app.route("/api/auth/register", methods=["POST"])
def api_register():
    data = request.get_json(silent=True) or {}
    full_name = str(data.get("full_name", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    phone = str(data.get("phone", "")).strip()
    password = str(data.get("password", ""))

    if len(full_name) < 2:
        return jsonify({"ok": False, "message": "Full name must be at least 2 characters."}), 400
    if not EMAIL_REGEX.match(email):
        return jsonify({"ok": False, "message": "Please enter a valid email address."}), 400
    if len(password) < 6:
        return jsonify({"ok": False, "message": "Password must be at least 6 characters long."}), 400

    db = get_db()
    if db.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone():
        return jsonify({"ok": False, "message": "An account with this email already exists."}), 409

    pw_hash = generate_password_hash(password)
    cursor = db.execute(
        "INSERT INTO users (full_name, email, phone, role, password_hash, created_at) VALUES (?, ?, ?, 'explorer', ?, ?)",
        (full_name, email, phone, pw_hash, datetime.utcnow().isoformat() + "Z")
    )
    db.commit()

    user_id = cursor.lastrowid
    session["user_id"] = user_id

    return jsonify({
        "ok": True,
        "message": "Explorer account created successfully!",
        "user": {"id": user_id, "full_name": full_name, "email": email, "phone": phone, "role": "explorer"}
    }), 201


@app.route("/api/auth/login", methods=["POST"])
def api_login():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))

    db = get_db()
    user = db.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify({"ok": False, "message": "Invalid email or password."}), 401

    session["user_id"] = user["id"]
    return jsonify({
        "ok": True,
        "message": f"Welcome back, {user['full_name']}!",
        "user": {
            "id": user["id"],
            "full_name": user["full_name"],
            "email": user["email"],
            "phone": user["phone"],
            "role": user["role"]
        }
    })


@app.route("/api/auth/demo-admin", methods=["POST"])
def api_demo_admin_login():
    db = get_db()
    admin = db.execute("SELECT * FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1").fetchone()
    if not admin:
        return jsonify({"ok": False, "message": "Admin account not initialized."}), 500
    session["user_id"] = admin["id"]
    return jsonify({
        "ok": True,
        "message": "Signed in as KTA Operations Admin.",
        "user": {
            "id": admin["id"],
            "full_name": admin["full_name"],
            "email": admin["email"],
            "phone": admin["phone"],
            "role": admin["role"]
        }
    })


@app.route("/api/auth/logout", methods=["POST"])
def api_logout():
    session.pop("user_id", None)
    return jsonify({"ok": True, "message": "Signed out safely."})


@app.route("/api/auth/me", methods=["GET"])
def api_me():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"ok": True, "user": None})

    db = get_db()
    user = db.execute("SELECT id, full_name, email, phone, role FROM users WHERE id = ?", (user_id,)).fetchone()
    if not user:
        session.pop("user_id", None)
        return jsonify({"ok": True, "user": None})

    return jsonify({
        "ok": True,
        "user": {
            "id": user["id"],
            "full_name": user["full_name"],
            "email": user["email"],
            "phone": user["phone"],
            "role": user["role"]
        }
    })


if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5000, debug=True)
