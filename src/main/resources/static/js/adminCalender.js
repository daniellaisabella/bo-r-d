import {fetchAnyUrl, fetchSession} from "./moduleJSON.js";

document.addEventListener("DOMContentLoaded", async function () {
    const calendarEl = document.getElementById("calendar");

    const modal = document.getElementById("bookingModal");
    const closeModal = document.getElementById("closeModal");
    const updateBtn = document.getElementById("updateBookingBtn");
    const deleteBtn = document.getElementById("deleteBookingBtn");
    const cancelBtn = document.getElementById("cancelBookingBtn");

    const locationInput = document.getElementById("bookingLocation");
    const notesInput = document.getElementById("bookingNotes");
    const bookingDate = document.getElementById("bookingDate");
    const bookingTime = document.getElementById("bookingTime");
    const bookingDuration = document.getElementById("bookingDuration");
    const adminUserInfo = document.getElementById("adminUserInfo");

    const createSlotModal = document.getElementById("createSlotModal");
    const closeSlotModal = document.getElementById("closeSlotModal");
    const dateSlot = document.getElementById("dateSlot");
    const timeSlot = document.getElementById("timeSlot");
    const durationSlot = document.getElementById("durationSlot");
    const confirmSlotBtn = document.getElementById("confirmSlotBtn");
    const cancelSlotBtn = document.getElementById("cancelSlotBtn");

    let selectedEvent = null;

    // Hent session
    const session = await fetchSession();
    calendarEl.dataset.sessionRole = session.role;

    // FullCalendar
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: "dayGridMonth",
        locale: "da",
        height: "auto",
        eventClick(info) {
            const slot = info.event.extendedProps;
            selectedEvent = info.event;

            modal.style.display = "block";

            // Udfyld felter
            locationInput.value = slot.location || "";
            notesInput.value = slot.notes || "";
            bookingDate.value = selectedEvent.start.toISOString().slice(0, 10);
            bookingTime.value = selectedEvent.start.toTimeString().slice(0, 5);
            bookingDuration.value = slot.duration || 60;
            adminUserInfo.textContent = slot.userName
                ? `Bruger: ${slot.userName}\nEmail: ${slot.userEmail}\nTelefon: ${slot.userPhone || "Ikke angivet"}`
                : "";
            // Knapper
            updateBtn.style.display = "inline-block";
            deleteBtn.style.display = slot.isBooked ? "none" : "inline-block";

            // Admin kan redigere
            if (selectedEvent.extendedProps.isBooked) {
                // Hvis booket: admin kan ændre lokation og noter
                locationInput.readOnly = false;
                notesInput.readOnly = false;
            } else {
                // Hvis ikke booket: admin kan IKKE ændre lokation og noter
                locationInput.readOnly = true;
                notesInput.readOnly = true;
            }
            bookingDate.disabled = false;
            bookingTime.disabled = false;
            bookingDuration.disabled = false;
        }
    });

    // ADMIN: Tilføj "+" knap til oprettelse af slot
    calendar.on("datesSet", () => {
        const toolbar = calendarEl.querySelector(".fc-toolbar-chunk:last-child");
        if (toolbar && !document.getElementById("addSlotBtn")) {
            const btn = document.createElement("button");
            btn.id = "addSlotBtn";
            btn.innerHTML = "+";
            btn.style.marginLeft = "10px";
            btn.style.padding = "5px 10px";
            btn.style.fontSize = "18px";
            btn.style.cursor = "pointer";
            toolbar.appendChild(btn);
            btn.addEventListener("click", () => (createSlotModal.style.display = "block"));
        }
    });

    /*** MODAL LUK ***/
    const closeModalHandler = () => {
        modal.style.display = "none";
        selectedEvent = null;
        locationInput.value = "";
        notesInput.value = "";
        bookingDate.value = "";
        bookingTime.value = "";
        bookingDuration.value = "";
        adminUserInfo.textContent = "";
        deleteBtn.style.display = "none";
    };
    closeModal.onclick = closeModalHandler;
    cancelBtn.onclick = closeModalHandler;
    window.onclick = (e) => {
        if (e.target === modal) closeModalHandler();
        if (e.target === createSlotModal) createSlotModal.style.display = "none";
    };

    /*** OPDATER BOOKING / SLOT ***/
    updateBtn.onclick = async () => {
        if (!selectedEvent) return;

        const location = locationInput.value;
        const notes = notesInput.value;
        const date = bookingDate.value;
        const time = bookingTime.value;
        const duration = parseInt(bookingDuration.value);

        if (!date || !time || !duration) return alert("Udfyld alle felter.");

        try {
            const slotId = selectedEvent.extendedProps.slotId;

            let response;
            if (selectedEvent.extendedProps.isBooked) {
                if (!location || !notes) return alert("Udfyld lokation og noter.");
                response = await fetch("/booking", {
                    method: "PUT",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({slotId, location, notes})
                });
            }

            const startTime = `${date}T${time}:00`;
            response = await fetch("/updateslot", {
                method: "PUT",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({slotId, startTime, durationMinutes: duration, location, notes})
            });


            if (response.ok) {
                alert("Opdatering gennemført!");
                selectedEvent.setExtendedProp("location", location);
                selectedEvent.setExtendedProp("notes", notes);
                selectedEvent.setExtendedProp("duration", duration);
                selectedEvent.setStart(new Date(`${date}T${time}:00`));
            } else {
                const data = await response.json().catch(() => ({message: "Ukendt fejl"}));
                alert("Kunne ikke opdatere: " + (data.message || data));
            }
        } catch (e) {
            console.error(e);
            alert("Fejl ved opdatering.");
        }

        closeModalHandler();
    };

    /*** SLET SLOT ***/
    deleteBtn.onclick = async () => {
        const slotId = selectedEvent?.extendedProps?.slotId;
        if (!slotId) return;
        if (!confirm("Er du sikker på, at du vil slette denne tid?")) return;

        try {
            const response = await fetch(`/deleteslot/${slotId}`, {method: "DELETE"});
            if (response.ok) {
                alert("Slot slettet!");
                selectedEvent.remove();
                closeModalHandler();
            } else {
                alert("Fejl: " + await response.text());
            }
        } catch (e) {
            console.error(e);
            alert("Fejl ved sletning.");
        }
    };

    /*** HENT ALLE BOOKINGS ***/
    try {
        const allBookings = await fetchAnyUrl("allbookings");
        const isPast = (d) => new Date(d) < new Date();

        allBookings.forEach(slot => {
            const start = slot.startTime;
            const end = new Date(new Date(start).getTime() + slot.durationMinutes * 60000);

            calendar.addEvent({
                title: "Booking",
                start,
                end,
                color: isPast(start) ? "gray" : "blue",
                extendedProps: {
                    slotId: slot.slotId,
                    duration: slot.durationMinutes,
                    location: slot.location,
                    notes: slot.notes,
                    isBooked: true,
                    bookedByMe: false,
                    userName: slot.name,
                    userEmail: slot.email,
                    userPhone: slot.phonenumber
                }
            });
        });
    } catch (e) {
        console.error("Fejl ved hentning af bookings:", e);
    }

    /*** HENT LEDIGE SLOTS ***/
    try {
        const slots = await fetchAnyUrl("availableslots");
        const isPast = (d) => new Date(d) < new Date();

        slots.forEach(slot => {
            const start = slot.startTime;
            const end = new Date(new Date(start).getTime() + slot.durationMinutes * 60000);
            const color = slot.isBooked ? "blue" : "green";

            calendar.addEvent({
                title: slot.isBooked ? "Booking" : "Ledig tid",
                start,
                end,
                color,
                extendedProps: {
                    slotId: slot.slotId,
                    duration: slot.durationMinutes,
                    location: slot.location,
                    notes: slot.notes,
                    isBooked: slot.isBooked,
                    bookedByMe: slot.bookedByMe || false,
                    userName: slot.name,
                    userEmail: slot.email,
                    userPhone: slot.phonenumber
                }
            });
        });
    } catch (e) {
        console.error("Fejl ved hentning af slots:", e);
    }

    calendar.render();

    /*** CREATE SLOT MODAL ***/
    closeSlotModal.onclick = () => (createSlotModal.style.display = "none");
    cancelSlotBtn.onclick = () => (createSlotModal.style.display = "none");

    confirmSlotBtn.onclick = async () => {
        const date = dateSlot.value;
        const time = timeSlot.value;
        const duration = parseInt(durationSlot.value);
        if (!date || !time || !duration) return alert("Udfyld dato, tid og varighed.");

        const startTime = `${date}T${time}:00`;
        try {
            const response = await fetch("/createslot", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({startTime, durationMinutes: duration})
            });

            if (response.ok) {
                const slot = await response.json();
                const end = new Date(new Date(slot.startTime).getTime() + slot.durationMinutes * 60000);
                calendar.addEvent({
                    title: "Ledig tid",
                    start: slot.startTime,
                    end: end,
                    color: "green",
                    extendedProps: {
                        slotId: slot.slotId,
                        duration: slot.durationMinutes,
                        location: null,
                        notes: null,
                        isBooked: false,
                        bookedByMe: false
                    }
                });
                alert("Tid oprettet!");
                createSlotModal.style.display = "none";
                dateSlot.value = "";
                timeSlot.value = "";
                durationSlot.value = "";
            } else {
                const txt = await response.text();
                alert(txt);
            }
        } catch (e) {
            console.error(e);
            alert("Fejl ved oprettelse af slot: " + e.message);
        }
    };
});
