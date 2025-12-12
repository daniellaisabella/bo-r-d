import { postObjectAsJson, fetchAnyUrl, updateObjectAsJson, deleteObjectAsJson, fetchSession }
    from './moduleJSON.js';

async function loadAvailableSlots() {
    try {
        const slots = await fetchAnyUrl("availableslots")
        const tbody = document.querySelector('#slotsTable tbody');
        tbody.innerHTML = '';

        slots.forEach(slot => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(slot.startTime).toLocaleString()}</td>
                <td>${slot.durationMinutes}</td>
                <td>${slot.location}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (err) {
        console.error('Fejl ved hentning af ledige slots:', err);
    }
}

loadAvailableSlots();
