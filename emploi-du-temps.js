const CALENDAR_URL =
    "https://rhulfbjsswkspdivwcuh.supabase.co/functions/v1/emploi-du-temps";

let tousLesCours = [];
let semaineActuelle = getLundi(new Date());


// ===============================
// CHARGEMENT DU CALENDRIER
// ===============================

async function chargerEmploiDuTemps() {

    const container = document.getElementById("emploi-du-temps");

    container.innerHTML = `
        <p>⏳ Chargement de l'emploi du temps...</p>
    `;

    try {

        const response = await fetch(CALENDAR_URL);

        if (!response.ok) {
            throw new Error("Erreur lors de la récupération du calendrier");
        }

        const ical = await response.text();

        tousLesCours = parserCalendrier(ical);

        afficherSemaine();

    } catch (error) {

        console.error(error);

        container.innerHTML = `
            <p>❌ Impossible de charger l'emploi du temps.</p>
        `;
    }
}


// ===============================
// PARSEUR ICAL
// ===============================

function parserCalendrier(ical) {

    const cours = [];

    const evenements =
        ical.split("BEGIN:VEVENT").slice(1);

    evenements.forEach(event => {

        const dateDebut = recupererValeur(event, "DTSTART");
        const dateFin = recupererValeur(event, "DTEND");
        const matiere = recupererValeur(event, "SUMMARY");
        const salle = recupererValeur(event, "LOCATION");

        if (!dateDebut || !dateFin || !matiere) {
            return;
        }

        cours.push({

            debut: convertirDate(dateDebut),

            fin: convertirDate(dateFin),

            matiere: nettoyerMatiere(matiere),

            salle: salle || "Salle non indiquée"

        });

    });

    cours.sort((a, b) => a.debut - b.debut);

    return cours;
}


// ===============================
// RÉCUPÉRER UNE VALEUR ICAL
// ===============================

function recupererValeur(event, nom) {

    const lignes = event.split(/\r?\n/);

    for (let ligne of lignes) {

        if (ligne.startsWith(nom + ":")) {

            return ligne
                .substring(nom.length + 1)
                .trim();

        }

        if (ligne.startsWith(nom + ";")) {

            const index = ligne.indexOf(":");

            if (index !== -1) {

                return ligne
                    .substring(index + 1)
                    .trim();

            }
        }
    }

    return null;
}


// ===============================
// CONVERSION DES DATES
// ===============================

function convertirDate(dateString) {

    // Pronote fournit les dates en UTC avec un "Z"
    // Exemple :
    // 20260901T080000Z

    const annee = Number(dateString.substring(0, 4));
    const mois = Number(dateString.substring(4, 6)) - 1;
    const jour = Number(dateString.substring(6, 8));

    const heure = Number(dateString.substring(9, 11));
    const minute = Number(dateString.substring(11, 13));
    const seconde = Number(dateString.substring(13, 15));

    // On crée la date comme une vraie date UTC.
    // Le navigateur la convertira ensuite automatiquement
    // vers l'heure locale française.
    return new Date(Date.UTC(
        annee,
        mois,
        jour,
        heure,
        minute,
        seconde || 0
    ));
}


// ===============================
// NETTOYAGE MATIÈRE
// ===============================

function nettoyerMatiere(matiere) {

    return matiere
        .split(" - ")[0]
        .trim();
}


// ===============================
// TROUVER LE LUNDI
// ===============================

function getLundi(date) {

    const resultat = new Date(date);

    resultat.setHours(0, 0, 0, 0);

    const jour = resultat.getDay();

    const difference =
        jour === 0 ? -6 : 1 - jour;

    resultat.setDate(
        resultat.getDate() + difference
    );

    return resultat;
}


// ===============================
// AFFICHAGE DE LA SEMAINE
// ===============================

function afficherSemaine() {

    const container =
        document.getElementById("emploi-du-temps");

    container.innerHTML = "";

    const dimanche =
        new Date(semaineActuelle);

    dimanche.setDate(
        dimanche.getDate() + 6
    );

    // Titre de la semaine

    const titre =
        document.createElement("h2");

    titre.className =
        "semaine-titre";

    titre.textContent =
        `📅 ${formaterDate(semaineActuelle)}
        → ${formaterDate(dimanche)}`;

    container.appendChild(titre);


    // Jours de la semaine

    for (let i = 0; i < 5; i++) {

        const dateJour =
            new Date(semaineActuelle);

        dateJour.setDate(
            dateJour.getDate() + i
        );

        afficherJour(
            dateJour,
            container
        );
    }

    mettreAJourBoutons();
}


// ===============================
// AFFICHER UN JOUR
// ===============================

function afficherJour(dateJour, container) {

    const maintenant = new Date();

    const coursJour = tousLesCours.filter(cours => {
        return memeJour(cours.debut, dateJour);
    });

    const blocJour = document.createElement("section");
    blocJour.className = "jour-emploi";

    const titre = document.createElement("h3");

    titre.className = "jour-titre";

    titre.textContent =
        dateJour.toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long"
        });

    blocJour.appendChild(titre);

    if (coursJour.length === 0) {

        blocJour.innerHTML += `
            <p class="aucun-cours">
                😴 Aucun cours
            </p>
        `;

    } else {

        // Cherche le premier cours qui n'est pas encore terminé
        const prochainCours = coursJour.find(cours => {
            return cours.fin > maintenant;
        });

        coursJour.forEach(cours => {

            const coursElement =
                document.createElement("div");

            coursElement.className = "cours";

            // -------------------------
            // ÉTAT DU COURS
            // -------------------------

            if (
                maintenant >= cours.debut &&
                maintenant < cours.fin
            ) {

                // 🟢 Cours en cours
                coursElement.classList.add("cours-en-cours");

            } else if (
                prochainCours &&
                cours === prochainCours
            ) {

                // 🟠 Prochain cours
                coursElement.classList.add("cours-prochain");

            } else if (
                maintenant >= cours.fin
            ) {

                // 🔴 Cours terminé
                coursElement.classList.add("cours-passe");

            }


            const heureDebut =
                cours.debut.toLocaleTimeString(
                    "fr-FR",
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                );

            const heureFin =
                cours.fin.toLocaleTimeString(
                    "fr-FR",
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                );


            coursElement.innerHTML = `

                <div class="cours-heure">
                    🕐 ${heureDebut} → ${heureFin}
                </div>

                <div class="cours-matiere">
                    📚 ${escapeHTML(cours.matiere)}
                </div>

                <div class="cours-salle">
                    🚪 ${escapeHTML(cours.salle)}
                </div>

            `;

            blocJour.appendChild(coursElement);

        });
    }

    container.appendChild(blocJour);
}


// ===============================
// COMPARER LES JOURS
// ===============================

function memeJour(date1, date2) {

    return (
        date1.getFullYear() ===
        date2.getFullYear()

        &&

        date1.getMonth() ===
        date2.getMonth()

        &&

        date1.getDate() ===
        date2.getDate()
    );
}


// ===============================
// NAVIGATION
// ===============================

function semainePrecedente() {

    semaineActuelle.setDate(
        semaineActuelle.getDate() - 7
    );

    afficherSemaine();
}


function semaineSuivante() {

    semaineActuelle.setDate(
        semaineActuelle.getDate() + 7
    );

    afficherSemaine();
}


function semaineCourante() {

    semaineActuelle =
        getLundi(new Date());

    afficherSemaine();
}


// ===============================
// BOUTONS
// ===============================

function mettreAJourBoutons() {

    const precedent =
        document.getElementById(
            "semaine-precedente"
        );

    const suivant =
        document.getElementById(
            "semaine-suivante"
        );

    const actuelle =
        document.getElementById(
            "semaine-actuelle"
        );

    if (precedent)
        precedent.onclick =
            semainePrecedente;

    if (suivant)
        suivant.onclick =
            semaineSuivante;

    if (actuelle)
        actuelle.onclick =
            semaineCourante;
}


// ===============================
// DATE
// ===============================

function formaterDate(date) {

    return date.toLocaleDateString(
        "fr-FR",
        {
            day: "numeric",
            month: "long"
        }
    );
}


// ===============================
// SÉCURITÉ HTML
// ===============================

function escapeHTML(texte) {

    return texte
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ===============================
// LANCEMENT
// ===============================

chargerEmploiDuTemps();