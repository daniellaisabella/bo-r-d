import { fetchAnyUrl } from './moduleJSON.js';

document.addEventListener('DOMContentLoaded', async function() {

    const calendarEl = document.getElementById('calendar');

    const modal = document.getElementById("bookingModal");
    const modalInfo = document.getElementById("modalInfo");
    const closeModal = document.getElementById("closeModal");
    const confirmBtn = document.getElementById("confirmBookingBtn");
    const cancelBtn = document.getElementById("cancelBookingBtn");

    let selectedEvent = null;

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'da',
        height: 'auto',

        eventClick: function(info) {
            const slot = info.event.extendedProps;
            selectedEvent = info.event;

            // Modal vises som POP-UP
            modal.style.display = "block";

            if(slot.isBooked && slot.bookedByMe){
                modalInfo.textContent =
                    `Din booking\nTidspunkt: ${info.event.start.toLocaleString()}\nVarighed: ${slot.duration}\nLokation: ${slot.location}`;
                confirmBtn.style.display = "none"; // ingen booking
            } else if(slot.isBooked){
                modalInfo.textContent = "Dette tidspunkt er allerede booket af en anden.";
                confirmBtn.style.display = "none";
            } else {
                modalInfo.textContent =
                    `Vil du booke denne tid?\nTidspunkt: ${info.event.start.toLocaleString()}\nVarighed: ${slot.duration}\nLokation: ${slot.location}`;
                confirmBtn.style.display = "inline-block";
            }
        }
    });

    // Luk modal
    closeModal.onclick = () => { modal.style.display = "none"; selectedEvent = null; }
    cancelBtn.onclick = () => { modal.style.display = "none"; selectedEvent = null; }
    window.onclick = (event) => { if(event.target == modal){ modal.style.display = "none"; selectedEvent = null; } }

    // Bekræft booking
    confirmBtn.onclick = async () => {
        if(!selectedEvent) return;

        try {
            const slotId = selectedEvent.extendedProps.slotId;
            const response = await fetch("/booking", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slotId })
            });

            if(response.ok){
                alert("Booking gennemført!");
                selectedEvent.setProp("color", "blue");
                selectedEvent.setProp("title", "Din booking");
                selectedEvent.setExtendedProp("isBooked", true);
                selectedEvent.setExtendedProp("bookedByMe", true);
            } else {
                const data = await response.json();
                alert("Kunne ikke booke: " + data.message);
            }
        } catch(e){
            console.error(e);
            alert("Fejl ved booking. Prøv igen senere.");
        }

        modal.style.display = "none";
        selectedEvent = null;
    }

    // Hent ledige slots
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
                    slotId: slot.slotId,
                    isBooked: slot.isBooked,
                    bookedByMe: slot.bookedByMe || false
                }
            });
        });

    } catch (e) {
        console.error("Fejl ved hentning af slots", e);
    }

    // Hent egne bookings fra /mybookings
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
