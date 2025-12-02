package org.example.boograad.service;

import org.example.boograad.model.AvailableSlot;
import org.example.boograad.repository.AvailableSlotRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AvailableSlotService {

    @Autowired
    AvailableSlotRepository availableSlotRepository;

    public List<AvailableSlot> getAvailableSlots() {
        return availableSlotRepository.findByIsBookedFalse();
    }


    public AvailableSlot saveSlot(AvailableSlot slot) {
        return availableSlotRepository.save(slot);    }
}
