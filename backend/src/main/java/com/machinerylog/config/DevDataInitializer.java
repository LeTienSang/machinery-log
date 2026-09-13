package com.machinerylog.config;

import com.machinerylog.entity.User;
import com.machinerylog.entity.UserRole;
import com.machinerylog.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@Profile("local")
public class DevDataInitializer {
    @Bean
    CommandLineRunner seedLocalUsers(UserRepository users, PasswordEncoder encoder,
                                     @Value("${DEV_OPERATOR_PASSWORD:operator-local-change-me}") String operatorPassword,
                                     @Value("${DEV_ACCOUNTANT_PASSWORD:accountant-local-change-me}") String accountantPassword) {
        return args -> {
            if (users.findByUsername("operator").isEmpty()) {
                users.save(new User("operator", encoder.encode(operatorPassword), "Site Operator", UserRole.OPERATOR));
            }
            if (users.findByUsername("accountant").isEmpty()) {
                users.save(new User("accountant", encoder.encode(accountantPassword), "Accountant Admin", UserRole.ACCOUNTANT_ADMIN));
            }
        };
    }
}
