package org.example.boograad.repository;

import org.example.boograad.model.Booking;
import org.example.boograad.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Integer> {
    List<Booking> findByUser(User user);
}
