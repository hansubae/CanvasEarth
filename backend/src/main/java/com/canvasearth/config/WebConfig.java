package com.canvasearth.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.ArrayList;
import java.util.List;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Autowired
    private Environment environment;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // Read allowed origins from environment variables (consistent with application.yml)
        List<String> allowedOriginsList = new ArrayList<>();
        String origin1 = environment.getProperty("ALLOWED_ORIGIN_1", "http://localhost:5173");
        String origin2 = environment.getProperty("ALLOWED_ORIGIN_2", "http://localhost:3000");
        String origin3 = environment.getProperty("ALLOWED_ORIGIN_3", "http://localhost:80");

        allowedOriginsList.add(origin1);
        allowedOriginsList.add(origin2);
        allowedOriginsList.add(origin3);

        String[] origins = allowedOriginsList.toArray(new String[0]);

        // SECURITY: NEVER use allowedOriginPatterns("*") with allowCredentials(true)
        registry.addMapping("/api/**")
                .allowedOrigins(origins)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);

        registry.addMapping("/ws/**")
                .allowedOrigins(origins)
                .allowedMethods("GET", "POST", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);

        registry.addMapping("/uploads/**")
                .allowedOrigins(origins)
                .allowedMethods("GET")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Serve uploaded files from absolute path
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:/app/uploads/");
    }


}
