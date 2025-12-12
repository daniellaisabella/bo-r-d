import { fetchAnyUrl, fetchSession, deleteOldSlots } from './moduleJSON.js';

document.addEventListener('DOMContentLoaded', async function () {

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

    const bookingDate = document.getElementById("bookingDate");
    const bookingTime = document.getElementById("bookingTime");
    const bookingDuration = document.getElementById("bookingDuration");

    let selectedEvent = null;

    // HENT SESSION
    const session = await fetchSession();
    calendarEl.dataset.sessionRole = session.role;

    // Delete old slots
    await deleteOldSlots()

    // FULLCALENDAR
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'da',
        height: 'auto',
        eventClick: function (info) {
            const slot = info.event.extendedProps;
            selectedEvent = info.event;

            modal.style.display = "block";

            // Udfyld felter
            locationInput.value = slot.location || "";
            notesInput.value = slot.notes || "";
            bookingDate.value = selectedEvent.start.toISOString().slice(0, 10);
            bookingTime.value = selectedEvent.start.toTimeString().slice(0, 5);
            bookingDuration.value = slot.duration || 60;
            if(adminUserInfo) adminUserInfo.textContent = "";

            // Skjul alle knapper først
            confirmBtn.style.display = "none";
            updateBtn.style.display = "none";
            deleteBtn.style.display = "none";

            const sessionRole = calendarEl.dataset.sessionRole || 'USER';

            if(sessionRole === "ADMIN") {
                // ADMIN kan redigere alt
                locationInput.disabled = false;
                notesInput.disabled = false;
                bookingDate.disabled = false;
                bookingTime.disabled = false;
                bookingDuration.disabled = false;

                modalInfo.innerHTML = `Booking\nTidspunkt: ${selectedEvent.start.toLocaleString()}\nVarighed: ${slot.duration} minutter`;

                if(slot.userName && slot.userEmail && adminUserInfo) {
                    adminUserInfo.textContent = `Bruger: ${slot.userName}\nEmail: ${slot.userEmail}\nTelefon: ${slot.userPhone || "Ikke angivet"}`;
                }

                updateBtn.style.display = "inline-block";
                deleteBtn.style.display = slot.isBooked ? "none" : "inline-block";
            } else {
                // USER logik
                if(slot.isBooked && slot.bookedByMe) {
                    modalInfo.innerHTML = `Din booking\nTidspunkt: ${selectedEvent.start.toLocaleString()}\nVarighed: ${slot.duration} minutter`;
                    locationInput.disabled = false;
                    notesInput.disabled = false;
                    updateBtn.style.display = "inline-block";
                    deleteBtn.style.display = "inline-block";
                } else if(slot.isBooked) {
                    modalInfo.innerHTML = "Dette tidspunkt er allerede booket af en anden.";
                    locationInput.disabled = true;
                    notesInput.disabled = true;
                } else {
                    modalInfo.innerHTML = `Vil du booke denne tid?\nTidspunkt: ${selectedEvent.start.toLocaleString()}\nVarighed: ${slot.duration} minutter`;
                    confirmBtn.style.display = "inline-block";
                }
            }
        }
    });

    // ADMIN + KNAP TIL OPRETTELSE
    calendar.on('datesSet', function () {
        if(calendarEl.dataset.sessionRole !== "ADMIN") return;
        const toolbar = calendarEl.querySelector('.fc-toolbar-chunk:last-child');
        if(toolbar && !document.getElementById("addSlotBtn")) {
            const btn = document.createElement("button");
            btn.id = "addSlotBtn";
            btn.innerHTML = "+";
            btn.style.marginLeft = "10px";
            btn.style.padding = "5px 10px";
            btn.style.fontSize = "18px";
            btn.style.cursor = "pointer";
            toolbar.appendChild(btn);
            btn.addEventListener("click", () => document.getElementById("createSlotModal").style.display = "block");
        }
    });

    // LUK MODAL
    const closeModalHandler = () => {
        modal.style.display = "none";
        selectedEvent = null;
        locationInput.value = "";
        notesInput.value = "";
        bookingDate.value = "";
        bookingTime.value = "";
        bookingDuration.value = "";
        deleteBtn.style.display = "none";
        if(adminUserInfo) adminUserInfo.textContent = "";
    };
    closeModal.onclick = closeModalHandler;
    cancelBtn.onclick = closeModalHandler;
    window.onclick = (e) => { if(e.target === modal) closeModalHandler(); };

    // USER: NY BOOKING
    confirmBtn.onclick = async () => {
        if(!selectedEvent) return;
        const location = locationInput.value;
        const notes = notesInput.value;
        if(!location || !notes) { alert("Udfyld lokation og noter."); return; }

        try {
            const slotId = selectedEvent.extendedProps.slotId;
            const response = await fetch("/booking", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({slotId, location, notes}) });
            if(response.ok){
                alert("Booking gennemført!");
                selectedEvent.setProp("color","blue");
                selectedEvent.setProp("title","Din booking");
                selectedEvent.setExtendedProp("isBooked",true);
                selectedEvent.setExtendedProp("bookedByMe",true);
                selectedEvent.setExtendedProp("location",location);
                selectedEvent.setExtendedProp("notes",notes);
            } else {
                const data = await response.json();
                alert("Kunne ikke booke: "+data.message);
            }
        } catch(e) { console.error(e); alert("Fejl ved booking."); }
        closeModalHandler();
    };

    // OPDATER BOOKING / SLOT
    updateBtn.onclick = async () => {
        if(!selectedEvent) return;
        const location = locationInput.value;
        const notes = notesInput.value;
        const date = bookingDate.value;
        const time = bookingTime.value;
        const duration = parseInt(bookingDuration.value);
        if(!location||!notes||!date||!time||!duration){ alert("Udfyld alle felter."); return; }

        try {
            const slotId = selectedEvent.extendedProps.slotId;
            const sessionRole = calendarEl.dataset.sessionRole;
            let response;
            if(sessionRole==="ADMIN"){
                if(selectedEvent.extendedProps.isBooked){
                    response = await fetch("/booking",{ method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({slotId, location, notes}) });
                } else {
                    const startTime = `${date}T${time}:00`;
                    response = await fetch("/updateslot",{ method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({slotId,startTime,durationMinutes:duration,location,notes}) });
                }
            } else {
                response = await fetch("/booking",{ method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({slotId, location, notes}) });
            }

            if(response.ok){
                selectedEvent.setExtendedProp("location",location);
                selectedEvent.setExtendedProp("notes",notes);
                selectedEvent.setExtendedProp("duration",duration);
                selectedEvent.setStart(new Date(`${date}T${time}:00`));
                alert("Opdatering gennemført!");
            } else {
                const data = await response.json().catch(()=>({message:"Ukendt fejl"}));
                alert("Kunne ikke opdatere: "+(data.message||data));
            }
        } catch(e){ console.error(e); alert("Fejl ved opdatering."); }
        closeModalHandler();
    };

    // SLET / ANNULLER BOOKING
    deleteBtn.onclick = async () => {
        const slotId = selectedEvent?.extendedProps?.slotId || deleteBtn.dataset.slotId;
        if(!slotId) return;
        if(!confirm("Er du sikker på, at du vil slette denne tid?")) return;

        try {
            const response = await fetch(`/deleteslot/${slotId}`,{method:"DELETE"});
            if(response.ok){
                alert("Tiden er slettet!");
                const event = calendar.getEvents().find(e=>e.extendedProps.slotId==slotId);
                if(event) event.remove();
                modal.style.display="none";
            } else {
                const txt = await response.text();
                alert("Fejl: "+txt);
            }
        } catch(e){ console.error(e); alert("Fejl ved sletning."); }
    };

    // HENT LEDIGE SLOTS & BOOKINGER
    const isPast = (date) => new Date(date)<new Date();
    try {
        if(session.role !== "ADMIN"){
            // User: hent kun egne bookings
            const myBookings = await fetchAnyUrl("mybookings");
            myBookings.forEach(slot => {
                const start = slot.startTime;
                const end = new Date(new Date(start).getTime() + slot.durationMinutes * 60000);
                calendar.addEvent({
                    title: "Din booking",
                    start: start,
                    end: end,
                    color: isPast(start) ? "gray" : "blue",
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
        } else {
            // Admin: hent alle bookings
            const allBookings = await fetchAnyUrl("allbookings");
            allBookings.forEach(slot => {
                const start = slot.startTime;
                const end = new Date(new Date(start).getTime() + slot.durationMinutes * 60000);
                calendar.addEvent({
                    title: "Booking",
                    start: start,
                    end: end,
                    color: isPast(start) ? "gray" : "blue",
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
        }
    } catch(e){
        console.error("Fejl ved hentning af bookings", e);
    }

    try{
        const slots = await fetchAnyUrl("availableslots");
        slots.forEach(slot=>{
            const start = slot.startTime;
            const end = new Date(new Date(start).getTime()+slot.durationMinutes*60000);
            const color = slot.bookedByMe?"blue":"green";
            calendar.addEvent({
                title: slot.bookedByMe?"Din booking":"Ledig tid",
                start:start,
                end:end,
                color:color,
                extendedProps:{
                    duration:slot.durationMinutes,
                    location:slot.location,
                    notes:slot.notes,
                    slotId:slot.slotId,
                    isBooked:slot.isBooked,
                    bookedByMe:slot.bookedByMe||false,
                    userName:slot.name,
                    userEmail:slot.email,
                    userPhone:slot.phonenumber
                }
            });
        });
    }catch(e){ console.error("Fejl ved hentning af slots",e); }


    calendar.render();

    // ADMIN CREATE SLOT MODAL
    const createSlotModal = document.getElementById("createSlotModal");
    const closeSlotModal = document.getElementById("closeSlotModal");
    const dateSlot = document.getElementById("dateSlot");
    const timeSlot = document.getElementById("timeSlot");
    const durationSlot = document.getElementById("durationSlot");
    const confirmSlotBtn = document.getElementById("confirmSlotBtn");
    const cancelSlotBtn = document.getElementById("cancelSlotBtn");

    closeSlotModal.onclick = () => createSlotModal.style.display="none";
    cancelSlotBtn.onclick = () => createSlotModal.style.display="none";
    window.addEventListener("click",(e)=>{if(e.target===createSlotModal) createSlotModal.style.display="none";});

    confirmSlotBtn.onclick = async () => {
        const date = dateSlot.value;
        const time = timeSlot.value;
        const duration = durationSlot.value;
        if(!date||!time||!duration){ alert("Udfyld dato, tid og varighed."); return; }
        const startTime = `${date}T${time}:00`;
        try{
            const response = await fetch("/createslot",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({startTime,durationMinutes:parseInt(duration)}) });
            if(response.ok){
                const slot = await response.json();
                const end = new Date(new Date(slot.startTime).getTime()+slot.durationMinutes*60000);
                calendar.addEvent({
                    title:"Ledig tid",
                    start:slot.startTime,
                    end:end,
                    color:"green",
                    extendedProps:{
                        duration:slot.durationMinutes,
                        location:null,
                        notes:null,
                        slotId:slot.slotId,
                        isBooked:false,
                        bookedByMe:false
                    }
                });
                alert("Tid oprettet!");
                createSlotModal.style.display="none";
                dateSlot.value=""; timeSlot.value=""; durationSlot.value="";
            } else {
                const txt = await response.text(); alert(txt);
            }
        }catch(e){ console.error(e); alert("Fejl ved oprettelse af slot."+e.message);}
    };
});
