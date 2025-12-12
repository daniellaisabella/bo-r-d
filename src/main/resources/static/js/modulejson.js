const baseurl = "http://localhost:8080/"

async function postObjectAsJson(path, object) {
    const objectAsJsonString = JSON.stringify(object)
    const fetchOptions = {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: objectAsJsonString
    }
    const response = await fetch(baseurl+path, fetchOptions)
    return response
}

async function updateObjectAsJson(path, object) {
    const objectAsJsonString = JSON.stringify(object)
    const fetchOptions = {
        method: "PUT",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: objectAsJsonString
    }
    const response = await fetch(baseurl+path, fetchOptions)
    return response
}



async function deleteObjectAsJson(path) {

    const fetchOptions = {
        method: "DELETE",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: ""
    }
    const response = await fetch(baseurl+path, fetchOptions)
    return response
}


async function fetchAnyUrl(path) {
    const response = await fetch(baseurl + path, { credentials: "include" });

    if (!response.ok) {
        throw new Error("HTTP " + response.status);
    }

    return response.json();
}

async function fetchSession() {
    const urlSession = baseurl + "session";
    try {
        const response = await fetch(urlSession, {
            method: "GET",
            credentials: "include" // vigtige for cookies/session
        });

        if (!response.ok) {
            console.log("User not signed in");
            return null;
        }

        const user = await response.json();
        console.log("Session user:", user);
        return user;
    } catch (err) {
        console.error("Error fetching session:", err);
        return null;
    }
}

async function deleteOldSlots(){
    const fetchOptions = {
        method: "DELETE",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: ""
    }
    const response = await fetch(baseurl+"deleteOldSlots", fetchOptions)
    return response
}



export {postObjectAsJson, fetchAnyUrl, updateObjectAsJson, deleteObjectAsJson, fetchSession, deleteOldSlots, baseurl}