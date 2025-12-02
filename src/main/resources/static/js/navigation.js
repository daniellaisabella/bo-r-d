console.log("hej fra navigation")

import {fetchSession, baseurl} from './modulejson.js';



let loginBtn = document.getElementById("loginBtn")

checkSession()

async function checkSession() {

    try {
        let user = await fetchSession()
        if (user != null) {
            loginBtn.textContent = "Min Profil"
            if (user.role !== "ADMIN") {
                loginBtn.href = "myProfile.html"
            } else {
                loginBtn.href = "adminProfile.html"
            }
        }
    } catch
        (error) {
        console.log("Error fetching session " + error)
    }

}

/*------------------ LOGOUT--------------*/
document.getElementById('logoutBtn').addEventListener('click', async function(e) {
    e.preventDefault(); // forhindre at <a> navigerer

    try {
        // Kald backend for at invalidere session
        const response = await fetch(baseurl +"logoutuser", { method: 'POST', credentials: 'include' });

        if (response.ok) {
            // Redirect til index.html
            window.location.href = baseurl +"index.html";
        } else {
            console.error('Logout fejlede');
        }
    } catch (err) {
        console.error('Fejl ved logout:', err);
    }
});
