const SUPABASE_URL = "https://rhulfbjsswkspdivwcuh.supabase.co";
const SUPABASE_KEY = "sb_publishable_bRMI_UbmyBXGCNjOLfliKw_AC-MHska";

// ============================
// DATE
// ============================

function updateDate() {
const now = new Date();

const date = now.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
});

const dateElement = document.getElementById("date");

if (dateElement) {
    dateElement.textContent = date;
}

}

updateDate();

// ============================
// FORMULAIRE
// ============================

function openForm() {
const form = document.getElementById("form-container");

if (form) {
    form.style.display = "block";
}

}

function closeForm() {
const form = document.getElementById("form-container");

if (form) {
    form.style.display = "none";
}

}

// ============================
// CHARGER LES PUBLICATIONS
// ============================

async function loadPosts() {

const container = document.getElementById("posts");

if (!container) {
    return;
}

container.innerHTML = `
    <div class="post">
        <p>⏳ Chargement des publications...</p>
    </div>
`;

try {

    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/publications?select=*&order=created_at.desc`,
        {
            headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${SUPABASE_KEY}`
            }
        }
    );

    if (!response.ok) {
        throw new Error("Erreur Supabase");
    }

    const posts = await response.json();

    displayPosts(posts);

} catch (error) {

    console.error(error);

    container.innerHTML = `
        <div class="post">
            <h3>❌ Impossible de charger les publications</h3>
            <p>Vérifie la connexion à Supabase.</p>
        </div>
    `;
}

}

// ============================
// AFFICHER LES PUBLICATIONS
// ============================

function displayPosts(posts) {

const container = document.getElementById("posts");

if (!container) {
    return;
}

container.innerHTML = "";

if (posts.length === 0) {

    container.innerHTML = `
        <div class="post">
            <h3>📌 Aucune publication</h3>
            <p>Sois le premier à publier quelque chose !</p>
        </div>
    `;

    return;
}

posts.forEach(post => {

    const article = document.createElement("article");

    article.className = "post";

    const date = new Date(post.created_at);

    article.innerHTML = `
        <h3>📌 ${escapeHTML(post.title)}</h3>
        <p>${escapeHTML(post.content)}</p>
        <small>
            Publié le ${date.toLocaleString("fr-FR")}
        </small>
    `;

    container.appendChild(article);
});

}

// ============================
// AJOUTER UNE PUBLICATION
// ============================

async function addPost() {

const titleInput = document.getElementById("title");
const contentInput = document.getElementById("content");

const title = titleInput.value.trim();
const content = contentInput.value.trim();

if (title === "" || content === "") {
    alert("⚠️ Remplis le titre et le message !");
    return;
}

try {

    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/publications`,
        {
            method: "POST",

            headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${SUPABASE_KEY}`,
                "Content-Type": "application/json",
                "Prefer": "return=minimal"
            },

            body: JSON.stringify({
                title: title,
                content: content
            })
        }
    );

    if (!response.ok) {
        throw new Error("Impossible de publier");
    }

    titleInput.value = "";
    contentInput.value = "";

    closeForm();

    loadPosts();

} catch (error) {

    console.error(error);

    alert(
        "❌ Impossible de publier.\n\n" +
        "Vérifie ta connexion à Supabase."
    );
}

}

// ============================
// SÉCURITÉ HTML
// ============================

function escapeHTML(text) {

const div = document.createElement("div");

div.textContent = text;

return div.innerHTML;

}

// ============================
// DÉMARRAGE
// ============================

loadPosts();