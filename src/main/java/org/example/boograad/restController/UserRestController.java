package org.example.boograad.restController;

import jakarta.servlet.http.HttpSession;
import org.example.boograad.model.Role;
import org.example.boograad.model.User;
import org.example.boograad.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
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
}
