// src/main/java/blog/security/JwtAuthFilter.java
package blog.security;

import blog.security.*;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.*;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

public class JwtAuthFilter extends OncePerRequestFilter {

  private final JwtService jwtService;

  public JwtAuthFilter(JwtService jwtService) {
    this.jwtService = jwtService;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
      throws ServletException, IOException {

    String header = request.getHeader("Authorization");
    if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
      String token = header.substring(7);

      try {
        // parse using your JwtService secretKey
        Jws<Claims> jws = io.jsonwebtoken.Jwts.parserBuilder()
            .setSigningKey(jwtService.getSecretKey())
            .build()
            .parseClaimsJws(token);

        Claims claims = jws.getBody();
        String username = claims.getSubject();
        String role = claims.get("role", String.class);

        if (username != null) {
          List<GrantedAuthority> authorities = role != null
              ? List.of(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
              : List.of(new SimpleGrantedAuthority("USER"));
          Authentication auth = new UsernamePasswordAuthenticationToken(username, null, authorities);
          SecurityContextHolder.getContext().setAuthentication(auth);
      
        }
      } catch (Exception e) {
        // invalid token -> leave anonymous
      }
    }

    chain.doFilter(request, response);
  }
}
