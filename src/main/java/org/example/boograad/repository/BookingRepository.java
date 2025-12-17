package org.example.boograad.repository;

import org.example.boograad.model.Booking;
import org.example.boograad.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Integer> {
    List<Booking> findByUser(User user);

    Booking findBySlot_SlotId(int slotId);

    @Query("""
        SELECT b FROM Booking b
        WHERE b.reminderSent = false
        AND b.slot.startTime BETWEEN :from AND :to
    """)
    List<Booking> findBookingsForReminder(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to
    );
}
