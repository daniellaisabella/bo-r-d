import { fetchAnyUrl } from './moduleJSON.js';

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

    let selectedEvent = null;

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
            confirmBtn.style.display = "none";
            updateBtn.style.display = "none";
            deleteBtn.style.display = "none";

            // CASE 1: BRUGERENS EGEN BOOKING
            if (slot.isBooked && slot.bookedByMe) {
                modalInfo.textContent =
                    `Din booking\nTidspunkt: ${info.event.start.toLocaleString()}\nVarighed: ${slot.duration}`;

                locationInput.value = slot.location || "";
                notesInput.value = slot.notes || "";

                updateBtn.style.display = "inline-block";
                deleteBtn.style.display = "inline-block";
            }
            // CASE 2: BOOKET AF ANDEN PERSON
            else if (slot.isBooked) {
                modalInfo.textContent = "Dette tidspunkt er allerede booket af en anden.";
            }
            // CASE 3: LEDIG TID
            else {
                modalInfo.textContent =
                    `Vil du booke denne tid?\nTidspunkt: ${info.event.start.toLocaleString()}\nVarighed: ${slot.duration}`;
                confirmBtn.style.display = "inline-block";
            }
        }
    });

    // Luk modal
    const closeModalHandler = () => {
        modal.style.display = "none";
        selectedEvent = null;
        locationInput.value = "";
        notesInput.value = "";
    };

    closeModal.onclick = closeModalHandler;
    cancelBtn.onclick = closeModalHandler;
    window.onclick = (event) => { if(event.target === modal) closeModalHandler(); };

    // BEKRÆFT NY BOOKING
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
            alert("Fejl ved booking. Prøv igen senere.");
        }

        closeModalHandler();
    };

    // OPDATER BOOKING
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
            alert("Fejl ved opdatering. Prøv igen senere.");
        }

        closeModalHandler();
    };

    // SLET / ANNULLER BOOKING
    deleteBtn.onclick = async () => {
        if (!selectedEvent) return;

        if (!confirm("Er du sikker på, at du vil annullere din booking?")) return;

        try {
            const slotId = selectedEvent.extendedProps.slotId;

            const response = await fetch(`/booking/${slotId}`, {
                method: "DELETE",
                credentials: "include"
            });

            if(response.ok){
                alert("Booking annulleret!");
                selectedEvent.setProp("color", "green");
                selectedEvent.setProp("title", "Ledig tid");
                selectedEvent.setExtendedProp("isBooked", false);
                selectedEvent.setExtendedProp("bookedByMe", false);
                selectedEvent.setExtendedProp("location", null);
                selectedEvent.setExtendedProp("notes", null);
            } else {
                const data = await response.json();
                alert("Kunne ikke annullere booking: " + data.message);
            }
        } catch(e){
            console.error(e);
            alert("Fejl ved annullering. Prøv igen senere.");
        }

        closeModalHandler();
    };

    // HENT LEDIGE SLOTS
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

    // HENT EGNE BOOKINGS
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
        console.error("Fejl ved hentning af egne bookings", e);
    }

    calendar.render();
});
