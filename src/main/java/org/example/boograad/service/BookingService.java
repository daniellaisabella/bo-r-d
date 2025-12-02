package org.example.boograad.service;

import org.example.boograad.model.AvailableSlot;
import org.example.boograad.model.Booking;
import org.example.boograad.model.User;
import org.example.boograad.repository.AvailableSlotRepository;
import org.example.boograad.repository.BookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class BookingService {


    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private AvailableSlotRepository slotRepository;

    public Booking bookSlot(int slotId, User user) throws Exception {
        // Find slot
        Optional<AvailableSlot> optionalSlot = slotRepository.findById(slotId);
        if(optionalSlot.isEmpty()) {
            throw new Exception("Slot not found");
        }

        AvailableSlot slot = optionalSlot.get();

        // Tjek om slot allerede er booket
        if(Boolean.TRUE.equals(slot.getIsBooked())) {
            throw new Exception("Slot is already booked");
        }

        // Opret booking
        Booking booking = new Booking();
        booking.setSlot(slot);
        booking.setUser(user);

        // Marker slot som booket
        slot.setIsBooked(true);

        // Gem booking og opdater slot
        slotRepository.save(slot);
        return bookingRepository.save(booking);
    }

    public List<Booking> getBookingsForUser(User user) {
        return bookingRepository.findByUser(user);

    }
}
