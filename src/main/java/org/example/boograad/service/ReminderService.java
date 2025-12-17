package org.example.boograad.service;

import org.example.boograad.model.AvailableSlot;
import org.example.boograad.model.Booking;
import org.example.boograad.model.User;
import org.example.boograad.repository.BookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Service
public class ReminderService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private MailService mailService;

    @Transactional
    public void sendReminders() {

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime from = now.plusHours(0);
        LocalDateTime to = now.plusHours(24);

        List<Booking> bookings =
                bookingRepository.findBookingsForReminder(from, to);

        for (Booking booking : bookings) {

            sendReminderMail(booking);

            booking.setReminderSent(true);
            bookingRepository.save(booking);
        }
    }

    private void sendReminderMail(Booking booking) {
        User user = booking.getUser();
        AvailableSlot slot = booking.getSlot();

        LocalDate date = slot.getStartTime().toLocalDate();
        LocalTime start = slot.getStartTime().toLocalTime();

        DateTimeFormatter dateFormatter =
                DateTimeFormatter.ofPattern("d. MMMM yyyy", new Locale("da", "DK"));
        DateTimeFormatter timeFormatter =
                DateTimeFormatter.ofPattern("HH:mm");

        String text =
                "Kære " + user.getName() + "\n\n" +
                        "Dette er en påmindelse om din booking hos Bo & Råd.\n\n" +
                        "Dato: " + date.format(dateFormatter) + "\n" +
                        "Tid: " + start.format(timeFormatter) + "\n" +
                        "Lokation: " + booking.getLocation() + "\n\n" +
                        "Venlig hilsen\nBo & Råd";

        mailService.sendEmail(
                user.getEmail(),
                "Påmindelse om booking i morgen",
                text
        );
    }
}
