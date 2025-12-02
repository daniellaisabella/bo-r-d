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

            for(AvailableSlot slot : slots){
                System.out.println(slot);
            }
            return ResponseEntity.ok(slots);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(error);
        }

    }

    @GetMapping("/mybookings")
    public ResponseEntity<?> getMyBookings(Principal principal) {
        try {
            // Hent den logged-in bruger
            Optional<User> userOpt = userService.findByEmail(principal.getName());
            if(userOpt.isEmpty()){
                return ResponseEntity.status(401).body(Map.of("message", "User not found"));
            }
            User user = userOpt.get();

            // Hent alle bookings for brugeren
            List<Booking> userBookings = bookingService.getBookingsForUser(user);

            // Konverter til JSON-format til frontend
            List<Map<String,Object>> bookingsForFrontend = new ArrayList<>();
            for(Booking booking : userBookings){
                AvailableSlot slot = booking.getSlot();
                Map<String,Object> map = new HashMap<>();
                map.put("slotId", slot.getSlotId());
                map.put("startTime", slot.getStartTime());
                map.put("durationMinutes", slot.getDurationMinutes());
                map.put("location", slot.getLocation());
                map.put("notes", slot.getNotes());
                map.put("isBooked", true);
                map.put("bookedByMe", true); // Blå i kalenderen
                bookingsForFrontend.add(map);
            }

            return ResponseEntity.ok(bookingsForFrontend);

        } catch(Exception e){
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/createslot")
    public ResponseEntity<?> createSlot(@RequestBody Map<String, String> request) {
        try {
            // Hent værdier fra request
            LocalDateTime startTime = LocalDateTime.parse(request.get("startTime"));
            int durationMinutes = Integer.parseInt(request.get("durationMinutes"));
            String location = request.get("location");
            String notes = request.getOrDefault("notes", "");

            // Opret AvailableSlot objekt
            AvailableSlot slot = new AvailableSlot();
            slot.setStartTime(startTime);
            slot.setDurationMinutes(durationMinutes);
            slot.setLocation(location);
            slot.setNotes(notes);
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
