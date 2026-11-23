# Wunderwerk Papier auf Netlify

Das ZIP enthält Galerie, Verwaltung, Kontaktformular, Beispielbilder und die Netlify-Konfiguration. Nach dem Deployment ist die Galerie öffentlich. Änderungen erfordern die Anmeldung unter **Verwaltung**.

## 1. Speicherung

Netlify Blobs speichert Werke, Preise und Bilder direkt im Netlify-Projekt. Beim ersten Speichern legt die Serverfunktion den Speicher automatisch an. Du brauchst weder Neon noch SQL, ein Datenbank-Passwort oder einen separaten Bildspeicher. Das Limit beträgt 3,5 MB pro Bild nach der automatischen Verkleinerung.

## 2. Kontaktformular einrichten

1. Füge bei [Resend](https://resend.com/docs/dashboard/domains/introduction) eine Absenderdomain hinzu, zum Beispiel `mail.wunderwerk-papier.de`. Übernimm die dafür angezeigten DNS-Einträge bei IONOS und warte auf den Status **Verified**. Die Anmeldung bei WEB.DE und dessen Passwort werden für den Versand nicht benötigt.
2. Erstelle einen Resend-API-Schlüssel mit Sendeberechtigung für diese Domain.
3. Wähle auf der verifizierten Domain eine Absenderadresse, zum Beispiel `kontakt@mail.wunderwerk-papier.de`. Die WEB.DE-Zieladresse wird separat als Empfänger hinterlegt. Im Browser bleibt sie verborgen. Antworten auf eine erhaltene Anfrage gehen an die Adresse, die der Besucher im Formular eingetragen hat.
4. Bis zur Einrichtung zeigt das Formular eine Meldung mit Verweis auf Instagram. Es bestätigt keine Zustellung bei einem Fehler.

## 3. Auf Netlify veröffentlichen

1. Entpacke das ZIP. Lade den Inhalt des Projektordners einschließlich `netlify.toml`, `package-lock.json` und `netlify/functions` in ein eigenes Git-Repository, zum Beispiel bei GitHub. Ein privates Repository reicht.
2. Importiere dieses Repository unter [Netlify → Add new project → Import an existing project](https://docs.netlify.com/manage/projects/add-new-project/). Netlify liest die Einstellungen aus `netlify.toml`. Build-Befehl ist `npm run build`, Ausgabeordner ist `dist` und der Funktionsordner ist `netlify/functions`. Ein reiner Drag-and-drop-Upload der statischen Dateien stellt die API für Anmeldung, Upload und Kontakt nicht bereit.
3. Hinterlege unter **Project configuration → Environment variables** die folgenden Werte für **Production**. Wenn dein Tarif eine Auswahl des Geltungsbereichs anbietet, reicht **Functions**. Veröffentliche danach einen neuen Deploy.

| Variable | Wert |
| --- | --- |
| `ATELIER_ADMIN_EMAIL` | E-Mail-Adresse für die Verwaltung |
| `ATELIER_ADMIN_PASSWORD` | Eigenes, starkes Atelier-Passwort mit mindestens 12 Zeichen. Verwende für den öffentlichen Start ein neues Passwort. |
| `ATELIER_CONTACT_TO` | Gewünschte WEB.DE-Empfängeradresse |
| `RESEND_API_KEY` | Resend-Schlüssel mit Sendeberechtigung |
| `ATELIER_MAIL_FROM` | Vollständige verifizierte Absenderadresse, zum Beispiel `Wunderwerk Papier <kontakt@mail.wunderwerk-papier.de>` |

Zugangsdaten gehören in die Netlify-Umgebungsvariablen. `.env.example` enthält nur die Variablennamen.

## 4. Testen und IONOS-Domain verbinden

1. Öffne die von Netlify bereitgestellte Adresse in einem privaten Browserfenster. Die Galerie muss ohne Anmeldung laden.
2. Melde dich unter **Verwaltung** an. Lege eine Karte mit Foto und Preis an, lade die Seite neu und prüfe Bild, Preis und Status. Ändere anschließend den Status und entferne bei Bedarf den Testeintrag über **Aus Galerie nehmen**.
3. Sende über **Kontakt** eine Nachricht an das Atelier und kontrolliere den tatsächlichen Eingang im WEB.DE-Postfach. Prüfe auch, ob die Antwortadresse zur Testanfrage passt.
4. Erst danach die eigene Adresse unter **Domain management** hinzufügen. Folge den DNS-Vorgaben, die Netlify für genau deine Domain anzeigt. Bei IONOS nur die für die Website erforderlichen DNS-Einträge umstellen. Bestehende E-Mail-Einträge beibehalten und die alte MyWebsite erst nach erfolgreicher Prüfung ablösen.

## Bestehende Werke aus ChatGPT Work

Das ZIP enthält die Beispielbilder, aber keinen Export der bisherigen Werke, hochgeladenen Fotos oder Sitzungen. Bereits eingestellte Werke können in der neuen Verwaltung erneut angelegt werden. Die bestehende Work-Seite und die IONOS-Domain wurden für dieses Paket nicht umgestellt.

## Impressum und mehrere Fotos

Die öffentliche Impressumsadresse ist in `public/impressum.html` hinterlegt. Prüfe den E-Mail-Empfang und das Kontaktformular nach dem Deploy.

Beim Anlegen oder Bearbeiten eines Werks lassen sich bis zu zehn Fotos auswählen. Beim Bearbeiten ersetzt eine neue Auswahl die bisherige Bildreihe. Ohne neue Auswahl bleiben die bisherigen Fotos erhalten. Besucher können in der Werkansicht zwischen den Fotos wechseln.
