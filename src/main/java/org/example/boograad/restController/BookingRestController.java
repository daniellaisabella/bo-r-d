package org.example.boograad.restController;


import org.example.boograad.model.Booking;
import org.example.boograad.model.User;
import org.example.boograad.service.BookingService;
import org.example.boograad.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.Map;
import java.util.Optional;

@RestController
@CrossOrigin("*")
public class BookingRestController {

    @Autowired
    BookingService bookingService;
    @Autowired
    private UserService userService;

    @PostMapping("/booking")
    public ResponseEntity<?> bookSlot(@RequestBody Map<String, Integer> payload, Principal principal) {
        try {
            int slotId = payload.get("slotId");

            // Hent den logged-in bruger via Principal
            Optional<User> user = userService.findByEmail(principal.getName());
            if (user.isEmpty()) {
                return ResponseEntity.status(401).body(Map.of("message", "User not found"));
            } else {

                // Forsøg at booke slot
                Booking booking = bookingService.bookSlot(slotId, user.get());
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
}
