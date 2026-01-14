// src/main/java/blog/config/SecurityConfig.java
package blog.config;

import blog.repository.SessionRepository;
import blog.repository.UserRepository;
import blog.security.JwtAuthFilter;
import blog.security.JwtService;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.*;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.http.HttpMethod;
import java.util.*;

@Configuration
public class SecurityConfig {

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http, JwtService jwtService, SessionRepository sessions,
      UserRepository users) throws Exception {
    http
        .csrf(csrf -> csrf.disable())
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/error").permitAll()
            .requestMatchers("/uploads/**").permitAll()
            .requestMatchers("/api/auth/**").permitAll()

            // ✅ PUBLIC USERS
            .requestMatchers(HttpMethod.GET, "/api/users/by-username/**").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/users/search").permitAll()

            // ✅ AUTH USERS
            .requestMatchers("/api/users/me/**").authenticated()
            .requestMatchers("/api/users/*/subscribe").authenticated()
            .requestMatchers(HttpMethod.GET, "/api/users/*/followers").authenticated()
            .requestMatchers(HttpMethod.GET, "/api/users/*/following").authenticated()

            // ADMIN
            .requestMatchers("/api/admin/**").hasRole("ADMIN")
            .requestMatchers("/api/reports/**").hasRole("ADMIN")

            .requestMatchers("/api/notifications/**").authenticated()

            // Public categories
            .requestMatchers("/api/categories/**").permitAll()

            // Public user posts
            .requestMatchers("/api/posts/user/**").permitAll()

            .anyRequest().authenticated())
        .addFilterBefore(new JwtAuthFilter(jwtService, sessions, users), UsernamePasswordAuthenticationFilter.class);

    return http.build();
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration cfg = new CorsConfiguration();
    cfg.setAllowedOrigins(List.of("http://localhost:4200"));
    cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    cfg.setAllowedHeaders(List.of("Authorization", "Content-Type"));
    cfg.setAllowCredentials(true);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", cfg);
    return source;
  }
}
