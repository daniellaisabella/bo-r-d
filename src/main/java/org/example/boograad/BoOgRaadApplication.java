package org.example.boograad;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class BoOgRaadApplication {

    public static void main(String[] args) {
        SpringApplication.run(BoOgRaadApplication.class, args);
    }

}
