package org.example.boograad.repository;

import org.example.boograad.model.AvailableSlot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AvailableSlotRepository extends JpaRepository<AvailableSlot, Integer> {
    List<AvailableSlot> findByIsBookedFalse();
}

