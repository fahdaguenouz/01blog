// src/main/java/blog/security/JwtAuthFilter.java
package blog.security;

import blog.repository.SessionRepository;
import blog.repository.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
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
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

public class JwtAuthFilter extends OncePerRequestFilter {

  private final JwtService jwtService;
  private final SessionRepository sessions;
  private final UserRepository users;

  public JwtAuthFilter(JwtService jwtService, SessionRepository sessions, UserRepository users) {
    this.jwtService = jwtService;
    this.sessions = sessions;
    this.users = users;
  }

  private String sha256(String value) {
    try {
      MessageDigest md = MessageDigest.getInstance("SHA-256");
      byte[] digest = md.digest(value.getBytes(StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(digest);
    } catch (Exception e) {
      throw new RuntimeException(e);
    }
  }

  private void writeJson(HttpServletResponse response, int status, String message) throws IOException {
    response.setStatus(status);
    response.setContentType("application/json");
    response.setCharacterEncoding("UTF-8");
    response.getWriter().write("{\"message\":\"" + message.replace("\"", "\\\"") + "\"}");
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
      throws ServletException, IOException {

    String header = request.getHeader("Authorization");

    if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
      String token = header.substring(7);

      try {
        Jws<Claims> jws = Jwts.parserBuilder()
            .setSigningKey(jwtService.getSecretKey())
            .build()
            .parseClaimsJws(token);

        Claims claims = jws.getBody();
        String username = claims.getSubject();
        String role = claims.get("role", String.class);
        String uidStr = claims.get("uid", String.class);

        if (username != null && uidStr != null) {
          UUID uid = UUID.fromString(uidStr);

          // ✅ BAN CHECK (kick out immediately)
          var uOpt = users.findById(uid);
          if (uOpt.isEmpty() || (uOpt.get().getStatus() != null && uOpt.get().getStatus().equalsIgnoreCase("banned"))) {
            sessions.deleteByUserId(uid); // kill session
            writeJson(response, HttpServletResponse.SC_FORBIDDEN,
                "Your account has been banned. Please contact support.");
            return;
          }

          // ✅ enforce "one active session per user"
          var sessionOpt = sessions.findByUserId(uid);
          if (sessionOpt.isEmpty()) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
          }

          var session = sessionOpt.get();

          // Expired in DB
          if (session.getExpiresAt() != null && session.getExpiresAt().isBefore(Instant.now())) {
            sessions.deleteByUserId(uid);
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
          }
          String jti = claims.getId(); // ✅ jti from token
          if (jti == null || jti.isBlank()) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
          }

          if (!session.getToken().equals(sha256(jti))) { // ✅ compare hashed jti
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
          }

          List<GrantedAuthority> authorities = role != null
              ? List.of(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
              : List.of(new SimpleGrantedAuthority("ROLE_USER"));

          Authentication auth = new UsernamePasswordAuthenticationToken(username, null, authorities);
          SecurityContextHolder.getContext().setAuthentication(auth);
        }
      } catch (Exception e) {
        // invalid token => anonymous
      }
    }

    chain.doFilter(request, response);
  }
}
