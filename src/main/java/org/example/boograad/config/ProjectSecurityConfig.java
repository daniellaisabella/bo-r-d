package org.example.boograad.config;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class ProjectSecurityConfig {


    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10);
    }

    @Bean
    public SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/", "/index.html", "/products.html", "/login.html","/css/**", "/js/**",
                                "/images/**","/register-customer", "/login", "/session", "/favicon.ico", "/createslot").permitAll()
                        .requestMatchers("/myProfile.html", "/availableslots", "/logoutuser", "/booking", "/mybookings", "/booking/{*}").authenticated()
                        .requestMatchers("/adminProfile.html").hasRole("ADMIN") // Spring tilføjer automatisk "ROLE_"

                )
                .formLogin(form -> form.disable())
                .httpBasic(httpBasic -> httpBasic.disable());



        return http.build();
    }
}
