package com.canvasearth.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.ArrayList;
import java.util.List;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Autowired
    private Environment environment;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Simple in-memory message broker
        config.enableSimpleBroker("/topic");

        // Application destination prefix for messages from clients
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Register WebSocket endpoint at "/ws"
        // Read allowed origins from application.yml (spring.web.cors.allowed-origins)
        List<String> allowedOriginsList = new ArrayList<>();

        // Read from environment variables (consistent with application.yml)
        String origin1 = environment.getProperty("ALLOWED_ORIGIN_1", "http://localhost:5173");
        String origin2 = environment.getProperty("ALLOWED_ORIGIN_2", "http://localhost:3000");
        String origin3 = environment.getProperty("ALLOWED_ORIGIN_3", "http://localhost:80");

        allowedOriginsList.add(origin1);
        allowedOriginsList.add(origin2);
        allowedOriginsList.add(origin3);

        // SECURITY: NEVER use setAllowedOriginPatterns("*") in production
        registry.addEndpoint("/ws")
                .setAllowedOrigins(allowedOriginsList.toArray(new String[0]))
                .withSockJS();
    }

}
