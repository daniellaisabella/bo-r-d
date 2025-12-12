import { fetchAnyUrl, fetchSession } from "./moduleJSON.js";

document.addEventListener("DOMContentLoaded", async function () {

    const calendarEl = document.getElementById("calendar");

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

    // Hent session
    const session = await fetchSession();
    calendarEl.dataset.sessionRole = session.role;

    // FullCalendar config
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: "dayGridMonth",
        locale: "da",
        height: "auto",

        eventClick(info) {
            const slot = info.event.extendedProps;
            selectedEvent = info.event;

            modal.style.display = "block";
            modalInfo.innerHTML = "";
            locationInput.disabled = false;
            notesInput.disabled = false;

            // Reset knapper
            confirmBtn.style.display = "none";
            updateBtn.style.display = "none";
            deleteBtn.style.display = "none";

            locationInput.value = slot.location || "";
            notesInput.value = slot.notes || "";

            if (slot.isBooked && slot.bookedByMe) {
                modalInfo.textContent = `Din booking – ${selectedEvent.start.toLocaleString()}`;
                updateBtn.style.display = "inline-block";
                deleteBtn.style.display = "inline-block";

            } else if (slot.isBooked) {
                modalInfo.textContent = "Dette tidspunkt er allerede booket af en anden.";
                locationInput.disabled = true;
                notesInput.disabled = true;

            } else {
                modalInfo.textContent =
                    `Vil du booke denne tid?\n${selectedEvent.start.toLocaleString()}`;
                confirmBtn.style.display = "inline-block";
            }
        }
    });

    /*** MODAL LUK FUNKTION ***/
    const closeModalHandler = () => {
        modal.style.display = "none";
        selectedEvent = null;
        locationInput.value = "";
        notesInput.value = "";
    };
    closeModal.onclick = closeModalHandler;
    cancelBtn.onclick = closeModalHandler;
    window.onclick = (e) => { if (e.target === modal) closeModalHandler(); };

    /*** NY BOOKING ***/
    confirmBtn.onclick = async () => {
        if (!selectedEvent) return;
        const location = locationInput.value;
        const notes = notesInput.value;
        if (!location || !notes) return alert("Udfyld alle felter.");

        try {
            const slotId = selectedEvent.extendedProps.slotId;
            const response = await fetch("/booking", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ slotId, location, notes })
            });

            if (response.ok) {
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

        } catch (e) {
            console.error(e);
            alert("Fejl ved booking.");
        }

        closeModalHandler();
    };

    /*** OPDATER BOOKING ***/
    updateBtn.onclick = async () => {
        if (!selectedEvent) return;
        const location = locationInput.value;
        const notes = notesInput.value;

        if (!location || !notes) return alert("Udfyld alle felter.");

        try {
            const slotId = selectedEvent.extendedProps.slotId;

            const response = await fetch("/booking", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slotId, location, notes })
            });

            if (response.ok) {
                alert("Opdateret!");
                selectedEvent.setExtendedProp("location", location);
                selectedEvent.setExtendedProp("notes", notes);
            } else {
                const data = await response.json();
                alert("Kunne ikke opdatere: " + data.message);
            }

        } catch (e) {
            console.error(e);
            alert("Fejl ved opdatering.");
        }

        closeModalHandler();
    };

    /*** SLET BOOKING ***/
    deleteBtn.onclick = async () => {
        const slotId = selectedEvent?.extendedProps?.slotId;
        if (!slotId) return;
        if (!confirm("Er du sikker?")) return;

        try {
            const response = await fetch(`/booking/${slotId}`, { method: "DELETE" });
            if (response.ok) {
                alert("Booking slettet!");

                // Gem start/end tid før removal
                const start = selectedEvent.start;
                const end = selectedEvent.end;
                const duration = selectedEvent.extendedProps.duration;

                // Fjern den gamle booked event
                selectedEvent.remove();

                // Tilføj ny "ledig tid" event
                calendar.addEvent({
                    title: "Ledig tid",
                    start: start,
                    end: end,
                    color: "green",
                    extendedProps: {
                        slotId: slotId,
                        duration: duration,
                        isBooked: false,
                        bookedByMe: false,
                        location: null,
                        notes: null
                    }
                });

                closeModalHandler();
            } else {
                alert("Fejl: " + await response.text());
            }
        } catch (e) {
            console.error(e);
            alert("Fejl ved sletning.");
        }
    };

    // HENT BRUGERENS BOOKINGS
    try {
        const myBookings = await fetchAnyUrl("mybookings");
        const isPast = (d) => new Date(d) < new Date();

        myBookings.forEach(slot => {
            const start = slot.startTime;
            const end = new Date(new Date(start).getTime() + slot.durationMinutes * 60000);

            calendar.addEvent({
                title: "Din booking",
                start,
                end,
                color: isPast(start) ? "gray" : "blue",
                extendedProps: {
                    slotId: slot.slotId,
                    duration: slot.durationMinutes,
                    location: slot.location,
                    notes: slot.notes,
                    isBooked: true,
                    bookedByMe: true
                }
            });
        });

    } catch (e) {
        console.error("Fejl ved hentning af dine bookings:", e);
    }


    /*** LOAD SLOTS ***/
    try {
        const slots = await fetchAnyUrl("availableslots");
        const isPast = (d) => new Date(d) < new Date();

        slots.forEach(slot => {
            const start = slot.startTime;
            const end = new Date(new Date(start).getTime() + slot.durationMinutes * 60000);

            calendar.addEvent({
                title: slot.bookedByMe ? "Din booking" : "Ledig tid",
                start,
                end,
                color: slot.bookedByMe ? "blue" : "green",
                extendedProps: {
                    slotId: slot.slotId,
                    duration: slot.durationMinutes,
                    location: slot.location,
                    notes: slot.notes,
                    isBooked: slot.isBooked,
                    bookedByMe: slot.bookedByMe
                }
            });
        });
    } catch (e) {
        console.error("Fejl ved hentning af slots:", e);
    }

    calendar.render();
});
