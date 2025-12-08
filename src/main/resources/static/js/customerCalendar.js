import { fetchAnyUrl, fetchSession, deleteOldSlots } from './moduleJSON.js';

document.addEventListener('DOMContentLoaded', async function() {
    await deleteOldSlots();

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

    // ---------------- FÆLLES FARVE-FUNKTION ---------------- //
    function getEventColor(slot, isUserBooking = false) {
        const now = new Date();
        const start = new Date(slot.startTime || slot.start);
        if (start < now) return "gray";
        if (slot.isBooked && isUserBooking) return "blue";
        if (!slot.isBooked) return "green";
        return "blue"; // andres booking
    }

    // ------------ FULLCALENDAR SETUP ------------ //
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'da',
        height: 'auto',
        editable: true,
        eventClick: function(info) {
            const slot = info.event.extendedProps;
            selectedEvent = info.event;

            if (!modal) return;
            modal.style.display = "block";

            if(locationInput) locationInput.value = slot.location || "";
            if(notesInput) notesInput.value = slot.notes || "";

            if(confirmBtn) confirmBtn.style.display = "none";
            if(updateBtn) updateBtn.style.display = "none";
            if(deleteBtn) deleteBtn.style.display = "none";
            if(adminUserInfo) adminUserInfo.textContent = "";

            const sessionRole = calendarEl.dataset.sessionRole || 'USER';

            // ---------------- ADMIN ----------------
            if(sessionRole === "ADMIN") {
                if(locationInput) locationInput.disabled = false;
                if(notesInput) notesInput.disabled = false;
                if(updateBtn) updateBtn.style.display = "inline-block";
                if(deleteBtn && !slot.isBooked) deleteBtn.style.display = "inline-block";

                modalInfo.textContent =
                    `Booking\nTidspunkt: ${info.event.start.toLocaleString()}\nVarighed: ${slot.duration} minutter`;

                // VIS INFO OM BRUGER
                if(slot.userName && slot.userEmail && adminUserInfo){
                    adminUserInfo.textContent =
                        `Bruger: ${slot.userName}\nEmail: ${slot.userEmail}\nTelefon: ${slot.userPhone || "Ikke angivet"}`;
                } else if(adminUserInfo){
                    adminUserInfo.textContent = "Ingen brugerinfo tilgængelig";
                }

                return;
            }

            // ---------------- USER ----------------
            if(slot.isBooked && slot.bookedByMe) {
                modalInfo.textContent =
                    `Din booking\nTidspunkt: ${info.event.start.toLocaleString()}\nVarighed: ${slot.duration}`;
                if(locationInput) locationInput.disabled = false;
                if(notesInput) notesInput.disabled = false;
                if(updateBtn) updateBtn.style.display = "inline-block";
                if(deleteBtn) deleteBtn.style.display = "inline-block";
            } else if(slot.isBooked) {
                modalInfo.textContent = "Dette tidspunkt er allerede booket af en anden.";
                if(locationInput) locationInput.disabled = true;
                if(notesInput) notesInput.disabled = true;
            } else {
                modalInfo.textContent =
                    `Vil du booke denne tid?\nTidspunkt: ${info.event.start.toLocaleString()}\nVarighed: ${slot.duration}`;
                if(confirmBtn) confirmBtn.style.display = "inline-block";
            }
        }
    });

    // ----------- ADMIN + KNAP TIL OPRETTELSE -----------
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

    const closeModalHandler = () => {
        modal.style.display = "none";
        selectedEvent = null;
        if(locationInput) locationInput.value = "";
        if(notesInput) notesInput.value = "";
        if(deleteBtn) deleteBtn.style.display = "none";
        if(adminUserInfo) adminUserInfo.textContent = "";
    };

    closeModal.onclick = closeModalHandler;
    cancelBtn.onclick = closeModalHandler;
    window.onclick = (event) => { if(event.target === modal) closeModalHandler(); };

    // ----------- USER: BOOKING ----------- //
    confirmBtn.onclick = async () => {
        if (!selectedEvent) return;
        const location = locationInput.value;
        const notes = notesInput.value;
        if (!location || !notes) { alert("Du skal udfylde både lokation og noter."); return; }

        try {
            const slotId = selectedEvent.extendedProps.slotId;
            const response = await fetch("/booking", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slotId, location, notes })
            });

            if(response.ok){
                alert("Booking gennemført!");
                selectedEvent.setExtendedProp("isBooked", true);
                selectedEvent.setExtendedProp("bookedByMe", true);
                selectedEvent.setExtendedProp("location", location);
                selectedEvent.setExtendedProp("notes", notes);
                selectedEvent.setProp("color", getEventColor(selectedEvent.extendedProps, true));
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

    // ----------- OPDATER BOOKING (USER & ADMIN) -----------
    updateBtn.onclick = async () => {
        if (!selectedEvent) return;

        const location = locationInput.value;
        const notes = notesInput.value;
        if (!location || !notes) { alert("Du skal udfylde både lokation og noter."); return; }

        try {
            const slotId = selectedEvent.extendedProps.slotId;
            const startTime = selectedEvent.start.toISOString();
            const durationMinutes = selectedEvent.extendedProps.duration;

            const response = await fetch("/booking", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slotId, startTime, durationMinutes, location, notes })
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

    // ----------- SLET TID (ADMIN) ----------- //
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

    // ------------------- HENT ALLE SLOTS ------------------- //
    const fetchAndAddSlots = async () => {
        const session = await fetchSession();
        calendarEl.dataset.sessionRole = session.role;

        let slots = [];
        try {
            const availableSlots = await fetchAnyUrl("availableslots");
            availableSlots.forEach(slot => {
                const end = new Date(new Date(slot.startTime).getTime() + slot.durationMinutes * 60000);
                calendar.addEvent({
                    title: slot.isBooked ? "Booking" : "Ledig tid",
                    start: slot.startTime,
                    end: end,
                    color: getEventColor(slot, slot.bookedByMe),
                    extendedProps: {
                        duration: slot.durationMinutes,
                        location: slot.location,
                        notes: slot.notes,
                        slotId: slot.slotId,
                        isBooked: slot.isBooked,
                        bookedByMe: slot.bookedByMe || false,
                        userName: slot.userName || null,
                        userEmail: slot.userEmail || null,
                        userPhone: slot.userPhone || null
                    }
                });
            });
        } catch(e){
            console.error("Fejl ved hentning af slots", e);
        }

        if(session.role !== "ADMIN") {
            try {
                const myBookings = await fetchAnyUrl("mybookings");
                myBookings.forEach(slot => {
                    const end = new Date(new Date(slot.startTime).getTime() + slot.durationMinutes * 60000);
                    calendar.addEvent({
                        title: "Din booking",
                        start: slot.startTime,
                        end: end,
                        color: getEventColor(slot, true),
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
            } catch(e){ console.error("Fejl ved mybookings", e); }
        } else {
            try {
                const allBookings = await fetchAnyUrl("allbookings");
                allBookings.forEach(slot => {
                    const end = new Date(new Date(slot.startTime).getTime() + slot.durationMinutes * 60000);
                    calendar.addEvent({
                        title: "Booking",
                        start: slot.startTime,
                        end: end,
                        color: getEventColor(slot, false),
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
            } catch(e){ console.error("Fejl ved allbookings", e); }
        }
    };

    await fetchAndAddSlots();
    calendar.render();

});
