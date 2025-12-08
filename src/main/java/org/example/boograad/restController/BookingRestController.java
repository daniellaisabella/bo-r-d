package org.example.boograad.restController;


import jakarta.servlet.http.HttpSession;
import org.example.boograad.model.AvailableSlot;
import org.example.boograad.model.Booking;
import org.example.boograad.model.User;
import org.example.boograad.service.AvailableSlotService;
import org.example.boograad.service.BookingService;
import org.example.boograad.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.time.ZoneId;

import java.security.Principal;
import java.util.*;

@RestController
@CrossOrigin("*")
public class BookingRestController {

    @Autowired
    BookingService bookingService;
    @Autowired
    private UserService userService;
    @Autowired
    AvailableSlotService availableSlotService;

    DateTimeFormatter isoFormatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    @PostMapping("/booking")
    public ResponseEntity<?> bookSlot(@RequestBody Map<String, String> payload, Principal principal) {
        try {
            int slotId = Integer.parseInt(payload.get("slotId"));
            String location = payload.get("location");
            String notes = payload.get("notes");

            if (location == null || location.isBlank() ||
                    notes == null || notes.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Location og notes skal udfyldes"));
            }

            // Hent den logged-in bruger via Principal
            Optional<User> user = userService.findByEmail(principal.getName());
            if (user.isEmpty()) {
                return ResponseEntity.status(401).body(Map.of("message", "User not found"));
            } else {

                // Forsøg at booke slot
                Booking booking = bookingService.bookSlot(slotId, user.get(), location, notes);
                return ResponseEntity.ok(Map.of(
                        "message", "Booking successful",
                        "bookingId", booking.getBookingId()
                ));
            }

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", e.getMessage()
            ));
        }
    }

    @PutMapping("/booking")
    public ResponseEntity<?> updateBooking(@RequestBody Map<String, String> request, HttpSession session) {
        try {
            // Hent bruger-id fra session
            Integer userId = (Integer) session.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("message", "Du skal være logget ind"));
            }

            // Hent værdier fra request
            int slotId = Integer.parseInt(request.get("slotId"));
            String location = request.get("location");
            String notes = request.get("notes");

            if (location == null || location.isBlank() || notes == null || notes.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Location og notes skal udfyldes"));
            }

            // Find booking
            Booking booking = bookingService.getBookingBySlotId(slotId);

            if (booking == null) {
                return ResponseEntity.status(404).body(Map.of("message", "Booking ikke fundet"));
            }

            // Check om booking tilhører den loggede bruger
            if (booking.getUser().getUserId() != userId) {
                return ResponseEntity.status(403).body(Map.of("message", "Du kan kun ændre dine egne bookings"));
            }

            // Opdater booking
            booking.setLocation(location);
            booking.setNotes(notes);

            Booking updatedBooking = bookingService.updateBooking(booking);

            return ResponseEntity.ok(updatedBooking);

        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/booking/{slotId}")
    public ResponseEntity<?> deleteBooking(@PathVariable int slotId, HttpSession session) {
        try {
            // Hent bruger-id fra session
            Integer userId = (Integer) session.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("message", "Du skal være logget ind"));
            }

            // Hent booking via slotId
            Booking booking = bookingService.getBookingBySlotId(slotId);

            if (booking == null) {
                return ResponseEntity.status(404).body(Map.of("message", "Booking ikke fundet"));
            }

            // Check at booking tilhører logget bruger
            if (booking.getUser().getUserId() != userId) {
                return ResponseEntity.status(403).body(Map.of("message", "Du kan kun slette dine egne bookings"));
            }

            // Opdater slot til ledig
            AvailableSlot slot = booking.getSlot();
            slot.setIsBooked(false);
            slot.setBooking(null);
            availableSlotService.saveSlot(slot);

            // Slet booking
            bookingService.deleteBooking(booking);

            return ResponseEntity.ok(Map.of("message", "Booking annulleret"));

        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        }
    }


    @GetMapping("/mybookings")
    public ResponseEntity<?> getMyBookings(Principal principal) {
        try {
            // Hent den logged-in bruger
            Optional<User> userOpt = userService.findByEmail(principal.getName());
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(401).body(Map.of("message", "User not found"));
            }
            User user = userOpt.get();

            // Hent alle bookings for brugeren
            List<Booking> userBookings = bookingService.getBookingsForUser(user);

            // Konverter til JSON-format til frontend
            List<Map<String, Object>> bookingsForFrontend = new ArrayList<>();
            for (Booking booking : userBookings) {
                AvailableSlot slot = booking.getSlot();
                Map<String, Object> map = new HashMap<>();
                map.put("slotId", slot.getSlotId());
                // Hvis startTime er LocalDateTime
                map.put("startTime", slot.getStartTime().format(isoFormatter));
                map.put("durationMinutes", slot.getDurationMinutes());
                map.put("location", booking.getLocation());
                map.put("notes", booking.getNotes());
                map.put("isBooked", true);
                map.put("bookedByMe", true); // Blå i kalenderen
                bookingsForFrontend.add(map);
            }

            return ResponseEntity.ok(bookingsForFrontend);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/allbookings")
    public ResponseEntity<?> getAllBookings(Principal principal) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin) {
            return ResponseEntity.status(403).body(Map.of("message", "User is not Admin"));
        }

        // Hent alle bookings
        List<Booking> allBookings = bookingService.getAllBooking();
        List<Map<String, Object>> allBookingsFrontend = new ArrayList<>();

        for (Booking booking : allBookings) {
            AvailableSlot slot = booking.getSlot();
            Map<String, Object> map = new HashMap<>();
            map.put("slotId", slot.getSlotId());
            map.put("startTime", slot.getStartTime().format(isoFormatter));
            map.put("durationMinutes", slot.getDurationMinutes());
            map.put("location", booking.getLocation());
            map.put("notes", booking.getNotes());
            map.put("isBooked", true);
            map.put("userId", booking.getUser().getUserId());
            map.put("name", booking.getUser().getName());
            map.put("email", booking.getUser().getEmail());
            map.put("phonenumber", booking.getUser().getPhoneNumber());

            allBookingsFrontend.add(map);
        }

        return ResponseEntity.ok(allBookingsFrontend);
    }

}
