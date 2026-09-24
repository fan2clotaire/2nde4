// ===============================
// CONFIGURATION SUPABASE
// ===============================

const SUPABASE_URL = "https://rhulfbjsswkspdivwcuh.supabase.co";
const SUPABASE_KEY = "sb_publishable_bRMI_UbmyBXGCNjOLfliKw_AC-MHska";

// ===============================
// DATE
// ===============================

const dateElement = document.getElementById("date");

if (dateElement) {
    const today = new Date();

    dateElement.textContent = today.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

// ===============================
// OUVRIR LE FORMULAIRE
// ===============================

function openForm() {
    const form = document.getElementById("form-container");

    if (form) {
        form.style.display = "block";
    }
}

// ===============================
// FERMER LE FORMULAIRE
// ===============================

function closeForm() {
    const form = document.getElementById("form-container");

    if (form) {
        form.style.display = "none";
    }

    const author = document.getElementById("author");
    const title = document.getElementById("title");
    const content = document.getElementById("content");

    if (author) author.value = "";
    if (title) title.value = "";
    if (content) content.value = "";
}

// ===============================
// ÉCHAPPER LE HTML
// ===============================

function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// ===============================
// COMPTER LES LIKES
// ===============================

async function getLikeCount(publicationId) {

    try {

        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/likes?publication_id=eq.${publicationId}&select=id`,
            {
                method: "GET",
                headers: {
                    "apikey": SUPABASE_KEY,
                    "Authorization": `Bearer ${SUPABASE_KEY}`
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Erreur HTTP ${response.status}`);
        }

        const likes = await response.json();

        return likes.length;

    } catch (error) {

        console.error("Erreur lors du chargement des likes :", error);

        return 0;
    }
}

// ===============================
// AJOUTER UN LIKE
// ===============================

async function likePost(publicationId, button) {

    // Empêcher plusieurs clics pendant l'envoi
    button.disabled = true;

    try {

        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/likes`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "apikey": SUPABASE_KEY,
                    "Authorization": `Bearer ${SUPABASE_KEY}`,
                    "Prefer": "return=representation"
                },

                body: JSON.stringify({
                    publication_id: publicationId
                })
            }
        );

        if (!response.ok) {

            const errorText = await response.text();

            console.error("Erreur Supabase :", errorText);

            throw new Error(`Erreur HTTP ${response.status}`);
        }

        // Récupérer le nouveau nombre de likes
        const count = await getLikeCount(publicationId);

        button.innerHTML = `❤️ ${count}`;

        // Empêcher de reliker immédiatement
        button.classList.add("liked");

    } catch (error) {

        console.error("Erreur lors du like :", error);

        alert("❌ Impossible d'ajouter le like.");

        button.disabled = false;
    }
}

// ===============================
// CHARGER LES PUBLICATIONS
// ===============================

async function loadPosts() {

    const postsContainer = document.getElementById("posts");

    if (!postsContainer) {
        return;
    }

    try {

        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/publications?select=*&order=created_at.desc`,
            {
                method: "GET",
                headers: {
                    "apikey": SUPABASE_KEY,
                    "Authorization": `Bearer ${SUPABASE_KEY}`
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Erreur HTTP ${response.status}`);
        }

        const posts = await response.json();

        postsContainer.innerHTML = "";

        if (posts.length === 0) {

            postsContainer.innerHTML = `
                <p class="announcement">
                    Aucune publication pour le moment.
                </p>
            `;

            return;
        }

        for (const post of posts) {

            const article = document.createElement("article");

            article.className = "post";

            const date = new Date(post.created_at);

            // Récupérer le nombre de likes
            const likeCount = await getLikeCount(post.id);

            article.innerHTML = `
                <div class="post-author">
                    👤 <strong>${escapeHTML(post.author || "Anonyme")}</strong>
                </div>

                <h3>
                    📢 ${escapeHTML(post.title)}
                </h3>

                <p>
                    ${escapeHTML(post.content)}
                </p>

                <small>
                    Publié le ${date.toLocaleDateString("fr-FR")}
                    à ${date.toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit"
                    })}
                </small>

                <div class="post-actions">
                    <button
                        class="like-button"
                        onclick="likePost(${post.id}, this)"
                    >
                        ❤️ ${likeCount}
                    </button>
                </div>
            `;

            postsContainer.appendChild(article);
        }

    } catch (error) {

        console.error("Erreur lors du chargement :", error);

        postsContainer.innerHTML = `
            <p class="announcement">
                ❌ Impossible de charger les publications.
            </p>
        `;
    }
}

// ===============================
// AJOUTER UNE PUBLICATION
// ===============================

async function addPost() {

    const authorInput = document.getElementById("author");
    const titleInput = document.getElementById("title");
    const contentInput = document.getElementById("content");

    const author = authorInput.value.trim();
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();

    if (!author || !title || !content) {

        alert("⚠️ Merci de remplir tous les champs.");

        return;
    }

    try {

        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/publications`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "apikey": SUPABASE_KEY,
                    "Authorization": `Bearer ${SUPABASE_KEY}`,
                    "Prefer": "return=representation"
                },

                body: JSON.stringify({
                    author: author,
                    title: title,
                    content: content
                })
            }
        );

        if (!response.ok) {

            const errorText = await response.text();

            console.error("Erreur Supabase :", errorText);

            throw new Error(`Erreur HTTP ${response.status}`);
        }

        authorInput.value = "";
        titleInput.value = "";
        contentInput.value = "";

        closeForm();

        await loadPosts();

    } catch (error) {

        console.error("Erreur lors de la publication :", error);

        alert(
            "❌ Impossible de publier la publication."
        );
    }
}

// ===============================
// CHARGEMENT INITIAL
// ===============================

loadPosts();