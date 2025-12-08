package org.example.boograad.service;

import org.example.boograad.model.AvailableSlot;
import org.example.boograad.repository.AvailableSlotRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AvailableSlotService {

    @Autowired
    AvailableSlotRepository availableSlotRepository;

    public List<AvailableSlot> getAvailableSlots() {
        return availableSlotRepository.findByIsBookedFalse();
    }


    public AvailableSlot saveSlot(AvailableSlot slot) {
        return availableSlotRepository.save(slot);
    }

    public void deleteSlot(int slotId) {
        availableSlotRepository.deleteById(slotId);
    }

    public Optional<AvailableSlot> findById(int slotId) {
        return availableSlotRepository.findById(slotId);
    }
}
