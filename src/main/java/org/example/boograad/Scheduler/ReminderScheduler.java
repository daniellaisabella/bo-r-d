package org.example.boograad.Scheduler;

import org.example.boograad.service.ReminderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ReminderScheduler {

    @Autowired
    private ReminderService reminderService;

    // Kører hvert 15. minut
    @Scheduled(cron = "0 */1 * * * *")
    public void sendBookingReminders() {
        reminderService.sendReminders();
    }
}
