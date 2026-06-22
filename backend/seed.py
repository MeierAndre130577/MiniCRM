import requests, json, random

BASE = "http://localhost:8000/api"

BERATER = ["Thomas Schmidt", "Tatjana Schmidt", "Markus Maurer", "Silvia Dürst"]

KUNDEN = [
    dict(p1_anrede="Herr", p1_vorname="Max",      p1_nachname="Mustermann",  p1_email="max.mustermann@email.de",   p1_handy="0176 11223344", p1_ort="München",    p1_geburtsdatum="1982-03-12", p1_beruf="Ingenieur",          p1_arbeitgeber="MusterAG",         p1_arbeitsverhaeltnis="Privatwirtschaft",   p1_abschluss="Hochschulabschluss",             p1_gehalt_netto=3200, p1_gehalt_brutto=4800, p1_gkv_anbieter="AOK",             p1_gkv_stand="Arbeitnehmer/in",  p1_raucher=0, p1_familienstand="verheiratet", p2_anrede="Frau",  p2_vorname="Maria",    p2_nachname="Mustermann",  p2_beruf="Lehrerin",     p2_arbeitgeber="Staatl. Gymnasium", p2_arbeitsverhaeltnis="Öffentlicher Dienst", p2_gehalt_netto=2600, p2_gkv_anbieter="TK",  p2_gkv_stand="Arbeitnehmer/in",  p2_raucher=0, berater="Thomas Schmidt",  folgetermin_datum="2026-06-24", hhr_einnahmen_gehalt=5800, hhr_ausgaben_gesamt=5100, hhr_freier_betrag=700, bewertung_google=5),
    dict(p1_anrede="Frau",  p1_vorname="Sandra",   p1_nachname="Bauer",       p1_email="sandra.bauer@web.de",       p1_handy="0151 99887766", p1_ort="Augsburg",   p1_geburtsdatum="1990-07-05", p1_beruf="Krankenpflegerin",   p1_arbeitgeber="Klinikum Augsburg",p1_arbeitsverhaeltnis="Öffentlicher Dienst",p1_abschluss="abgeschl. Berufsausbildung", p1_gehalt_netto=2100, p1_gehalt_brutto=2900, p1_gkv_anbieter="Barmer",          p1_gkv_stand="Arbeitnehmer/in",  p1_raucher=0, p1_familienstand="ledig",       berater="Silvia Dürst",    folgetermin_datum="2026-07-02", hhr_einnahmen_gehalt=2100, hhr_ausgaben_gesamt=1850, hhr_freier_betrag=250, bewertung_google=4),
    dict(p1_anrede="Herr", p1_vorname="Klaus",     p1_nachname="Hofmann",     p1_email="k.hofmann@gmx.de",          p1_handy="0171 44556677", p1_ort="Nürnberg",   p1_geburtsdatum="1975-11-20", p1_beruf="Selbstständig",      p1_arbeitgeber="Hofmann GmbH",     p1_arbeitsverhaeltnis="Privatwirtschaft",   p1_abschluss="Hochschulabschluss",             p1_gehalt_netto=4500, p1_gehalt_brutto=6200, p1_gkv_anbieter="DAK",             p1_gkv_stand="Selbstständige/r", p1_raucher=1, p1_familienstand="verheiratet", p2_anrede="Frau",  p2_vorname="Christine", p2_nachname="Hofmann",     p2_beruf="Buchhalterin", p2_gehalt_netto=2200,                                                                             berater="Thomas Schmidt",  folgetermin_datum="2026-06-30", hhr_einnahmen_gehalt=6700, hhr_ausgaben_gesamt=5900, hhr_freier_betrag=800, bewertung_google=5),
    dict(p1_anrede="Herr", p1_vorname="Stefan",    p1_nachname="Weber",       p1_email="stefan.weber@t-online.de",  p1_handy="0162 77889900", p1_ort="Ingolstadt", p1_geburtsdatum="1988-04-17", p1_beruf="Mechatroniker",      p1_arbeitgeber="Audi AG",          p1_arbeitsverhaeltnis="Privatwirtschaft",   p1_abschluss="abgeschl. Berufsausbildung", p1_gehalt_netto=2800, p1_gehalt_brutto=3900, p1_gkv_anbieter="IKK",             p1_gkv_stand="Arbeitnehmer/in",  p1_raucher=0, p1_familienstand="ledig",       berater="Markus Maurer",   folgetermin_datum="2026-07-10", hhr_einnahmen_gehalt=2800, hhr_ausgaben_gesamt=2400, hhr_freier_betrag=400),
    dict(p1_anrede="Frau",  p1_vorname="Julia",    p1_nachname="Schreiber",   p1_email="julia.schreiber@icloud.com",p1_handy="0175 33221100", p1_ort="Regensburg", p1_geburtsdatum="1993-09-28", p1_beruf="Marketing Managerin",p1_arbeitgeber="Media GmbH",       p1_arbeitsverhaeltnis="Privatwirtschaft",   p1_abschluss="Hochschulabschluss",             p1_gehalt_netto=3100, p1_gehalt_brutto=4400, p1_gkv_anbieter="BKK",             p1_gkv_stand="Arbeitnehmer/in",  p1_raucher=0, p1_familienstand="ledig",       berater="Tatjana Schmidt", folgetermin_datum="2026-07-15", hhr_einnahmen_gehalt=3100, hhr_ausgaben_gesamt=2700, hhr_freier_betrag=400, bewertung_google=4),
    dict(p1_anrede="Herr", p1_vorname="Andreas",   p1_nachname="Keller",      p1_email="a.keller@outlook.de",       p1_handy="0178 55443322", p1_ort="Landshut",   p1_geburtsdatum="1970-02-08", p1_beruf="Polizeibeamter",     p1_arbeitgeber="Polizei Bayern",   p1_arbeitsverhaeltnis="Öffentlicher Dienst",p1_abschluss="staatl. anerkannte Berufsweiterbildung",p1_gehalt_netto=2950,p1_gehalt_brutto=4000,p1_gkv_anbieter="AOK",             p1_gkv_stand="Beamte",           p1_raucher=0, p1_familienstand="verheiratet", p2_anrede="Frau",  p2_vorname="Nicole",   p2_nachname="Keller",      p2_beruf="Erzieherin",   p2_gehalt_netto=1800,                                                                             berater="Silvia Dürst",    folgetermin_datum="2026-08-01", hhr_einnahmen_gehalt=4750, hhr_ausgaben_gesamt=4200, hhr_freier_betrag=550, bewertung_google=5),
    dict(p1_anrede="Frau",  p1_vorname="Monika",   p1_nachname="Braun",       p1_email="monika.braun@gmail.com",    p1_handy="0163 11223344", p1_ort="Straubing",  p1_geburtsdatum="1965-06-14", p1_beruf="Rentnerin",          p1_arbeitgeber="",                 p1_arbeitsverhaeltnis="Privatwirtschaft",   p1_abschluss="abgeschl. Berufsausbildung", p1_gehalt_netto=1400, p1_gehalt_brutto=1400, p1_gkv_anbieter="Barmer",          p1_gkv_stand="Rentner/in",       p1_raucher=0, p1_familienstand="verwitwet",   berater="Tatjana Schmidt", folgetermin_datum="2026-07-20", hhr_einnahmen_gehalt=1400, hhr_ausgaben_gesamt=1100, hhr_freier_betrag=300),
    dict(p1_anrede="Herr", p1_vorname="Tobias",    p1_nachname="Zimmermann",  p1_email="tobias.z@yahoo.de",         p1_handy="0179 66778899", p1_ort="Passau",     p1_geburtsdatum="1995-12-03", p1_beruf="Softwareentwickler", p1_arbeitgeber="Tech Startup GmbH",p1_arbeitsverhaeltnis="Privatwirtschaft",   p1_abschluss="Hochschulabschluss",             p1_gehalt_netto=3800, p1_gehalt_brutto=5200, p1_gkv_anbieter="TK",              p1_gkv_stand="Arbeitnehmer/in",  p1_raucher=0, p1_familienstand="ledig",       berater="Markus Maurer",   folgetermin_datum="2026-06-28", hhr_einnahmen_gehalt=3800, hhr_ausgaben_gesamt=3100, hhr_freier_betrag=700, bewertung_google=5),
    dict(p1_anrede="Herr", p1_vorname="Michael",   p1_nachname="Fischer",     p1_email="m.fischer@freenet.de",      p1_handy="0172 22334455", p1_ort="Rosenheim",  p1_geburtsdatum="1980-08-25", p1_beruf="Elektriker",         p1_arbeitgeber="Fischer Elektro",  p1_arbeitsverhaeltnis="Privatwirtschaft",   p1_abschluss="abgeschl. Berufsausbildung", p1_gehalt_netto=2500, p1_gehalt_brutto=3400, p1_gkv_anbieter="DAK",             p1_gkv_stand="Arbeitnehmer/in",  p1_raucher=1, p1_familienstand="verheiratet", p2_anrede="Frau",  p2_vorname="Anna",     p2_nachname="Fischer",     p2_beruf="Floristin",    p2_gehalt_netto=1600,                                                                             berater="Thomas Schmidt",  folgetermin_datum="2026-07-05", hhr_einnahmen_gehalt=4100, hhr_ausgaben_gesamt=3600, hhr_freier_betrag=500, bewertung_google=4),
    dict(p1_anrede="Frau",  p1_vorname="Laura",    p1_nachname="Schmitt",     p1_email="laura.schmitt@posteo.de",   p1_handy="0160 88776655", p1_ort="Würzburg",   p1_geburtsdatum="1998-01-19", p1_beruf="Studentin",          p1_arbeitgeber="Universität WÜ",   p1_arbeitsverhaeltnis="Öffentlicher Dienst",p1_abschluss="Schulabschluss",             p1_gehalt_netto=850,  p1_gehalt_brutto=850,  p1_gkv_anbieter="AOK",             p1_gkv_stand="Student/in",       p1_raucher=0, p1_familienstand="ledig",       berater="Silvia Dürst",    folgetermin_datum="2026-08-10", hhr_einnahmen_gehalt=850,  hhr_ausgaben_gesamt=780,  hhr_freier_betrag=70),
]

CATEGORIES = ["alter","vermoegen","einkommensschutz","gesundheit","wohnwuensche",
               "todesfall","haftpflicht","hausrat","gebaeude","rechtsschutz",
               "unfall","tier","kfz","kindervorsorge","immobilien"]

STATUS_POOLS = [
    {"besprochen": ["alter","haftpflicht","einkommensschutz"], "offen": ["vermoegen","gesundheit","kfz"]},
    {"besprochen": ["gesundheit","unfall"], "offen": ["einkommensschutz"]},
    {"besprochen": ["alter","vermoegen","wohnwuensche","haftpflicht","kfz"], "offen": ["einkommensschutz","gebaeude","rechtsschutz"]},
    {"besprochen": ["haftpflicht","kfz"], "offen": ["einkommensschutz","hausrat"]},
    {"besprochen": ["gesundheit","alter","haftpflicht"], "offen": ["vermoegen","kfz","rechtsschutz"]},
    {"besprochen": ["alter","einkommensschutz","todesfall","haftpflicht","kfz"], "offen": ["gesundheit","wohnwuensche"]},
    {"besprochen": ["haftpflicht","gesundheit","rechtsschutz"], "offen": ["alter"]},
    {"besprochen": ["kfz","haftpflicht","einkommensschutz","vermoegen"], "offen": ["gesundheit","immobilien"]},
    {"besprochen": ["kfz","hausrat","haftpflicht"], "offen": ["einkommensschutz","gebaeude","alter"]},
    {"besprochen": ["gesundheit","haftpflicht"], "offen": []},
]

NOTIZEN_POOL = {
    "alter":            "Wunschrente 1.500 €, Endalter 67, nachhaltige Fonds bevorzugt",
    "vermoegen":        "Ziel: Eigenheim in 5 Jahren, aktuell 15k Tagesgeld bei DKB",
    "einkommensschutz": "BU läuft bis 67, Höhe 1.200 € – zu niedrig, aufstocken prüfen",
    "gesundheit":       "Wert auf Facharzt + Zweibettzimmer, Zahnzusatz gewünscht",
    "wohnwuensche":     "Eigenheim > 50 %, Bausparvertrag LBS vorhanden",
    "kfz":              "2 Fahrzeuge, SF 10 Jahre, Rabattschutz gewünscht",
    "haftpflicht":      "Familientarif ausreichend, keine Vermietung",
    "rechtsschutz":     "Privat + Beruf + Verkehr, SB 250 €",
}

def seed():
    for i, k in enumerate(KUNDEN):
        resp = requests.post(f"{BASE}/customers", json=k)
        cid = resp.json()["id"]
        pool = STATUS_POOLS[i]
        for cat in CATEGORIES:
            if cat in pool["besprochen"]:
                status, notizen = "besprochen", NOTIZEN_POOL.get(cat, "")
            elif cat in pool["offen"]:
                status, notizen = "offen", ""
            else:
                status, notizen = "nicht_besprochen", ""
            requests.put(f"{BASE}/customers/{cid}/categories/{cat}",
                         json={"status": status, "notizen": notizen})
        # Terminverlauf
        requests.post(f"{BASE}/customers/{cid}/appointments",
                      json={"datum": "2026-06-15", "notizen": "Erstgespräch – Stammdaten + Bedarfsanalyse"})
        print(f"✓ {k['p1_vorname']} {k['p1_nachname']} angelegt (ID {cid})")

if __name__ == "__main__":
    seed()
    print("\nFertig! 10 Kunden mit Kategorien und Terminen angelegt.")
