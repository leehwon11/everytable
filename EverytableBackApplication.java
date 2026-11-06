package com.everytable.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class EverytableBackApplication {

    public static void main(String[] args) {
        SpringApplication.run(EverytableBackApplication.class, args);
    }

}
