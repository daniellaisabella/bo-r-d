package org.example.boograad.restController;


import jakarta.servlet.http.HttpSession;
import org.example.boograad.model.AvailableSlot;
import org.example.boograad.model.Booking;
import org.example.boograad.model.Role;
import org.example.boograad.model.User;
import org.example.boograad.service.AvailableSlotService;
import org.example.boograad.service.BookingService;
import org.example.boograad.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@CrossOrigin("*")
public class AvailableSlotRestController {

    @Autowired
    UserService userService;
    @Autowired
    BookingService bookingService;
    @Autowired
    AvailableSlotService availableSlotService;

    @GetMapping("/availableslots")
    public ResponseEntity<?> getAvailableSlots() {
        try {
            List<AvailableSlot> slots = availableSlotService.getAvailableSlots();
            return ResponseEntity.ok(slots);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(error);
        }

    }

    @PostMapping("/createslot")
    public ResponseEntity<?> createSlot(@RequestBody Map<String, String> request) {
        try {
            // Hent værdier fra request
            LocalDateTime startTime = LocalDateTime.parse(request.get("startTime"));
            int durationMinutes = Integer.parseInt(request.get("durationMinutes"));

            // Opret AvailableSlot objekt
            AvailableSlot slot = new AvailableSlot();
            slot.setStartTime(startTime);
            slot.setDurationMinutes(durationMinutes);
            slot.setIsBooked(false); // altid ledig ved oprettelse

            // Gem slot via service
            AvailableSlot savedSlot = availableSlotService.saveSlot(slot);

            return ResponseEntity.ok(savedSlot);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to create slot");
        }
    }



}
