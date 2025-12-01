console.log("hej fra navigation")

import { fetchSession } from './modulejson.js';

let loginBtn = document.getElementById("loginBtn")

checkSession()

async function checkSession() {

    try {
        let response = await fetchSession()
        if (response != null){
            console.log("Jeg aendrer login knap")
            loginBtn.href = "myProfile.html"
            loginBtn.textContent = "Min Profil"
        }
    } catch (error){
        console.log("Error fetching session " + error)
    }

}