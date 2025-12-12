console.log("hej fra navigation")

import {fetchSession, baseurl} from './modulejson.js';

document.addEventListener("DOMContentLoaded", async () => {


    // --- CHECK SESSION ---
    await checkSession();

    // --- LOGOUT BUTTON ---
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function(e) {
            e.preventDefault();

            try {
                const response = await fetch(baseurl + "logoutuser", {
                    method: 'POST',
                    credentials: 'include'
                });

                if (response.ok) {
                    window.location.href = baseurl + "index.html";
                } else {
                    console.error('Logout fejlede');
                }
            } catch (err) {
                console.error('Fejl ved logout:', err);
            }
        });
    }

});


// ------------ FUNCTIONS ------------
async function checkSession() {
    try {
        let user = await fetchSession();
        const loginBtn = document.getElementById("loginBtn");

        if (loginBtn && user != null) {
            loginBtn.textContent = "Min Profil";
            loginBtn.href = user.role !== "ADMIN"
                ? "myProfile.html"
                : "adminProfile.html";
            return user.role
        }
    } catch (error) {
        console.log("Error fetching session " + error);
    }
}

export {checkSession};
