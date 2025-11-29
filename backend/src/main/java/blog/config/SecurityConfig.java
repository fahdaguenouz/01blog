// src/main/java/blog/config/SecurityConfig.java
package blog.config;

import blog.security.JwtAuthFilter;
import blog.security.JwtService;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.*;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.util.List;

@Configuration
public class SecurityConfig {

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http, JwtService jwtService) throws Exception {
    http
        .csrf(csrf -> csrf.disable())
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/error").permitAll()
            .requestMatchers("/uploads/**").permitAll()
            .requestMatchers("/api/public/**").permitAll()
            .requestMatchers("/api/auth/**").permitAll()

            // Public profile view (so GET /api/users/by-username/{username} won't 401)
            .requestMatchers("/api/users/by-username/**").permitAll()

            // Protect actions that change subscription
            .requestMatchers("/api/users/*/subscribe").authenticated()
            .requestMatchers("/api/users/me/**").authenticated()

            // public posts/categories
            .requestMatchers("/api/categories/**").permitAll()
            .requestMatchers("/api/posts/user/*/posts").permitAll()
            .requestMatchers("/api/posts/user/*/liked").permitAll()
            .requestMatchers("/api/posts/user/*/saved").permitAll()

            // other authenticated endpoints
            .requestMatchers("/api/posts/**").authenticated()
            .anyRequest().authenticated())
        .addFilterBefore(new JwtAuthFilter(jwtService), UsernamePasswordAuthenticationFilter.class);

    return http.build();
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
