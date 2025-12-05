import { fetchAnyUrl, fetchSession } from './moduleJSON.js';

document.addEventListener('DOMContentLoaded', async function() {

    const calendarEl = document.getElementById('calendar');

    const modal = document.getElementById("bookingModal");
    const modalInfo = document.getElementById("modalInfo");
    const closeModal = document.getElementById("closeModal");
    const confirmBtn = document.getElementById("confirmBookingBtn");
    const updateBtn = document.getElementById("updateBookingBtn");
    const deleteBtn = document.getElementById("deleteBookingBtn");
    const cancelBtn = document.getElementById("cancelBookingBtn");

    const locationInput = document.getElementById("bookingLocation");
    const notesInput = document.getElementById("bookingNotes");
    const adminUserInfo = document.getElementById("adminUserInfo");

    let selectedEvent = null;

    // ------------ FULLCALENDAR SETUP ------------ //
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'da',
        height: 'auto',

        eventClick: function(info) {
            const slot = info.event.extendedProps;
            selectedEvent = info.event;

            modal.style.display = "block";

            // Nulstil felter og skjul alle knapper
            locationInput.value = "";
            notesInput.value = "";
            if(adminUserInfo) adminUserInfo.textContent = "";

            confirmBtn.style.display = "none";
            updateBtn.style.display = "none";
            deleteBtn.style.display = "none";

            let sessionRole = calendarEl.dataset.sessionRole || 'USER';

            // ----------- ADMIN VIEW BOOKING ----------- //
            if(sessionRole === "ADMIN") {
                locationInput.value = slot.location || "";
                notesInput.value = slot.notes || "";
                locationInput.disabled = true;
                notesInput.disabled = true;

                modalInfo.textContent =
                    `Booking\nTidspunkt: ${info.event.start.toLocaleString()}\nVarighed: ${slot.duration} minutter`;

                if(slot.userName && slot.userEmail && adminUserInfo){
                    adminUserInfo.textContent =
                        `Bruger: ${slot.userName}\nEmail: ${slot.userEmail}\nTelefon: ${slot.userPhone || "Ikke angivet"}`;
                }

                // --- Slet knap kun hvis slot ikke er booket ---
                if (!slot.isBooked) {
                    deleteBtn.style.display = "inline-block";
                    deleteBtn.dataset.slotId = slot.slotId;
                } else {
                    deleteBtn.style.display = "none";
                }

                return; // Admin kan ikke ændre bookings
            }

            // ----------- USER: EGEN BOOKING ----------- //
            if (slot.isBooked && slot.bookedByMe) {
                modalInfo.textContent =
                    `Din booking\nTidspunkt: ${info.event.start.toLocaleString()}\nVarighed: ${slot.duration}`;

                locationInput.value = slot.location || "";
                notesInput.value = slot.notes || "";

                updateBtn.style.display = "inline-block";
                deleteBtn.style.display = "inline-block";
            }
            else if (slot.isBooked) {
                modalInfo.textContent = "Dette tidspunkt er allerede booket af en anden.";
            }
            else {
                modalInfo.textContent =
                    `Vil du booke denne tid?\nTidspunkt: ${info.event.start.toLocaleString()}\nVarighed: ${slot.duration}`;
                confirmBtn.style.display = "inline-block";
            }
        }
    });

    // ----------- + KNAP TIL OPRETTELSE (ADMIN) ----------- //
    calendar.on('datesSet', function() {

        let sessionRole = calendarEl.dataset.sessionRole;
        if (sessionRole !== "ADMIN") return;

        const toolbar = calendarEl.querySelector('.fc-toolbar-chunk:last-child');

        if (toolbar && !document.getElementById("addSlotBtn")) {

            const btn = document.createElement("button");
            btn.id = "addSlotBtn";
            btn.innerHTML = "+";
            btn.style.marginLeft = "10px";
            btn.style.padding = "5px 10px";
            btn.style.fontSize = "18px";
            btn.style.cursor = "pointer";

            toolbar.appendChild(btn);

            btn.addEventListener("click", () => {
                document.getElementById("createSlotModal").style.display = "block";
            });
        }
    });

    // ----------- LUK BOOKING MODAL ----------- //
    const closeModalHandler = () => {
        modal.style.display = "none";
        selectedEvent = null;
        locationInput.value = "";
        notesInput.value = "";
        deleteBtn.style.display = "none";
        if(adminUserInfo) adminUserInfo.textContent = "";
    };

    closeModal.onclick = closeModalHandler;
    cancelBtn.onclick = closeModalHandler;
    window.onclick = (event) => { if(event.target === modal) closeModalHandler(); };

    // ----------- USER: BEKRÆFT NY BOOKING ----------- //
    confirmBtn.onclick = async () => {
        if (!selectedEvent) return;

        const location = locationInput.value;
        const notes = notesInput.value;

        if (!location || !notes) {
            alert("Du skal udfylde både lokation og noter.");
            return;
        }

        try {
            const slotId = selectedEvent.extendedProps.slotId;

            const response = await fetch("/booking", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slotId, location, notes })
            });

            if(response.ok){
                alert("Booking gennemført!");

                selectedEvent.setProp("color", "blue");
                selectedEvent.setProp("title", "Din booking");
                selectedEvent.setExtendedProp("isBooked", true);
                selectedEvent.setExtendedProp("bookedByMe", true);
                selectedEvent.setExtendedProp("location", location);
                selectedEvent.setExtendedProp("notes", notes);

            } else {
                const data = await response.json();
                alert("Kunne ikke booke: " + data.message);
            }
        } catch(e){
            console.error(e);
            alert("Fejl ved booking.");
        }

        closeModalHandler();
    };

    // ----------- USER: OPDATER BOOKING ----------- //
    updateBtn.onclick = async () => {
        if (!selectedEvent) return;

        const location = locationInput.value;
        const notes = notesInput.value;

        if (!location || !notes) {
            alert("Du skal udfylde både lokation og noter.");
            return;
        }

        try {
            const slotId = selectedEvent.extendedProps.slotId;

            const response = await fetch("/booking", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slotId, location, notes })
            });

            if(response.ok){
                alert("Booking opdateret!");
                selectedEvent.setExtendedProp("location", location);
                selectedEvent.setExtendedProp("notes", notes);
            } else {
                const data = await response.json();
                alert("Kunne ikke opdatere booking: " + data.message);
            }
        } catch(e){
            console.error(e);
            alert("Fejl ved opdatering.");
        }

        closeModalHandler();
    };

    // ----------- SLET / ANNULLER BOOKING (USER) ----------- //
    deleteBtn.onclick = async () => {
        const slotId = deleteBtn.dataset.slotId;

        if (!slotId) return;

        if (!confirm("Er du sikker på, at du vil slette denne ledige tid?")) return;

        try {
            const response = await fetch(`/deleteslot/${slotId}`, { method: "DELETE" });

            if(response.ok){
                alert("Tiden er slettet!");

                const event = calendar.getEvents().find(e => e.extendedProps.slotId == slotId);
                if(event) event.remove();

                modal.style.display = "none";

            } else {
                const txt = await response.text();
                alert("Fejl: " + txt);
            }
        } catch(e){
            console.error(e);
            alert("Fejl ved sletning.");
        }
    };

    // ----------- HENT LEDIGE SLOTS ----------- //
    try {
        const slots = await fetchAnyUrl("availableslots");

        slots.forEach(slot => {
            const start = slot.startTime;
            const end = new Date(new Date(start).getTime() + slot.durationMinutes * 60000);

            const color = slot.bookedByMe ? "blue" : "green";

            calendar.addEvent({
                title: slot.bookedByMe ? "Din booking" : "Ledig tid",
                start: start,
                end: end,
                color: color,
                extendedProps: {
                    duration: slot.durationMinutes,
                    location: slot.location,
                    notes: slot.notes,
                    slotId: slot.slotId,
                    isBooked: slot.isBooked,
                    bookedByMe: slot.bookedByMe || false
                }
            });
        });
    } catch(e){
        console.error("Fejl ved hentning af slots", e);
    }

    // ----------- TJEK SESSION ROLE ----------- //
    let session = await fetchSession();
    calendarEl.dataset.sessionRole = session.role;

    // ----------- HENT BOOKINGER ----------- //
    if(session.role !== "ADMIN"){
        try {
            const myBookings = await fetchAnyUrl("mybookings");

            myBookings.forEach(slot => {
                const start = slot.startTime;
                const end = new Date(new Date(start).getTime() + slot.durationMinutes * 60000);

                calendar.addEvent({
                    title: "Din booking",
                    start: start,
                    end: end,
                    color: "blue",
                    extendedProps: {
                        duration: slot.durationMinutes,
                        location: slot.location,
                        notes: slot.notes,
                        slotId: slot.slotId,
                        isBooked: true,
                        bookedByMe: true
                    }
                });
            });
        } catch(e){
            console.error("Fejl ved mybookings", e);
        }

    } else {
        try {
            const allBookings = await fetchAnyUrl("allbookings");

            allBookings.forEach(slot => {
                const start = slot.startTime;
                const end = new Date(new Date(start).getTime() + slot.durationMinutes * 60000);

                calendar.addEvent({
                    title: "Booking",
                    start: start,
                    end: end,
                    color: "blue",
                    extendedProps: {
                        duration: slot.durationMinutes,
                        location: slot.location,
                        notes: slot.notes,
                        slotId: slot.slotId,
                        isBooked: true,
                        bookedByMe: false,
                        userName: slot.name,
                        userEmail: slot.email,
                        userPhone: slot.phonenumber
                    }
                });
            });
        } catch(e){
            console.error("Fejl ved allbookings", e);
        }
    }

    calendar.render();

    // ------------------ ADMIN: CREATE SLOT MODAL -------------------- //
    const createSlotModal = document.getElementById("createSlotModal");
    const closeSlotModal = document.getElementById("closeSlotModal");

    const dateSlot = document.getElementById("dateSlot");
    const timeSlot = document.getElementById("timeSlot");
    const durationSlot = document.getElementById("durationSlot");

    const confirmSlotBtn = document.getElementById("confirmSlotBtn");
    const cancelSlotBtn = document.getElementById("cancelSlotBtn");

    closeSlotModal.onclick = () => createSlotModal.style.display = "none";
    cancelSlotBtn.onclick = () => createSlotModal.style.display = "none";

    window.addEventListener("click", (e) => {
        if (e.target === createSlotModal) createSlotModal.style.display = "none";
    });

    confirmSlotBtn.onclick = async () => {
        const date = dateSlot.value;
        const time = timeSlot.value;
        const duration = durationSlot.value;

        if (!date || !time || !duration) {
            alert("Udfyld dato, tid og varighed.");
            return;
        }

        const startTime = `${date}T${time}:00`;

        try {
            const response = await fetch("/createslot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    startTime: startTime,
                    durationMinutes: parseInt(duration)
                })
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
                        duration: slot.durationMinutes,
                        location: null,
                        notes: null,
                        slotId: slot.slotId,
                        isBooked: false,
                        bookedByMe: false
                    }
                });

                alert("Tid oprettet!");
                createSlotModal.style.display = "none";

                // Nulstil inputs
                dateSlot.value = "";
                timeSlot.value = "";
                durationSlot.value = "";

            } else {
                const data = await response.json().catch(() => null);
                if(data && data.error){
                    alert("Kunne ikke oprette slot: " + data.error);
                } else {
                    alert("Kunne ikke oprette slot.");
                }
            }
        } catch (e) {
            console.error(e);
            alert("Fejl ved oprettelse af slot.");
        }
    };

});
