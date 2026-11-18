# Kabut Tipis Adventure (KTA) — Full-Stack Web Application

## Struktur Proyek
```text
kabut_tipis_adventure/
├── app.py
├── requirements.txt
├── README.md
├── templates/
│   └── index.html
└── static/
    ├── css/
    │   └── style.css
    └── js/
        └── app.js
```

## Cara Menjalankan
1. Masuk ke folder `kabut_tipis_adventure`:
   ```bash
   cd kabut_tipis_adventure
   ```
2. Pasang dependensi Python:
   ```bash
   pip install -r requirements.txt
   ```
3. Jalankan aplikasi Flask:
   ```bash
   python app.py
   ```
4. Buka browser dan kunjungi `http://127.0.0.1:5000`. Database SQLite (`kta_database.db`) akan dibuat secara otomatis saat server dijalankan pertama kali.
