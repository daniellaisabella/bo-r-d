package org.example.boograad.restController;

import jakarta.servlet.http.HttpSession;
import org.example.boograad.model.Role;
import org.example.boograad.model.User;
import org.example.boograad.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@CrossOrigin("*")
public class UserRestController {

    @Autowired
    private UserService userService;

    @PostMapping("/register-customer")
    public ResponseEntity<?> registerCustomer(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String password = request.get("password");
            String name = request.get("name");
            String phoneNumber = request.get("phoneNumber");


            User savedUser = userService.registerUser(email, password, name, phoneNumber, Role.CUSTOMER);


            Map<String, Object> response = new HashMap<>();
            response.put("id", savedUser.getUserId());
            response.put("email", savedUser.getEmail());
            response.put("role", savedUser.getRole());

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Registration failed");
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request, HttpSession session) {
        try {
            String email = request.get("email");
            String password = request.get("password");

            Optional<User> userOptional = userService.loginUser(email, password);

            if (userOptional.isEmpty()) {
                return ResponseEntity.status(401).body("Invalid credentials");
            }

            User user = userOptional.get();

            session.setAttribute("userId", user.getUserId());
            session.setAttribute("email", user.getEmail());
            session.setAttribute("name", user.getName());
            session.setAttribute("role", user.getRole().toString());


            // Opret Authentication-objekt med roller
            List<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority("ROLE_"+user.getRole().toString()));
            Authentication auth = new UsernamePasswordAuthenticationToken(
                    user.getEmail(),
                    null,
                    authorities
            );

            // Sæt Authentication i SecurityContext
            SecurityContextHolder.getContext().setAuthentication(auth);
            session.setAttribute("SPRING_SECURITY_CONTEXT", SecurityContextHolder.getContext());

            Map<String, Object> response = new HashMap<>();
            response.put("id", user.getUserId());
            response.put("email", user.getEmail());
            response.put("username", user.getName());
            response.put("role", user.getRole());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Login failed");
        }
    }

    @GetMapping("/session")
    public ResponseEntity<?> checkSession(HttpSession session) {
        Integer userId = (Integer) session.getAttribute("userId");

        if (userId == null) {
            return ResponseEntity.status(401).body("Not logged in");
        }

        Map<String, Object> response = new HashMap<>();
        response.put("id", userId);
        response.put("name", session.getAttribute("name"));
        response.put("role", session.getAttribute("role"));
        response.put("email", session.getAttribute("email"));

        return ResponseEntity.ok(response);

    }


    @PostMapping("/logoutuser")
    public ResponseEntity<?> logoutUser(HttpSession session) {
        SecurityContextHolder.clearContext();
        session.invalidate();
        return ResponseEntity.ok("Logged out successfully");
    }
}
