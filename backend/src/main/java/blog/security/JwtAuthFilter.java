package blog.security;

import blog.repository.SessionRepository;
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

  public JwtAuthFilter(JwtService jwtService, SessionRepository sessions) {
    this.jwtService = jwtService;
    this.sessions = sessions;
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

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
      throws ServletException, IOException {

    String header = request.getHeader("Authorization");

    if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
      String token = header.substring(7);

      try {
        // Parse JWT
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

          // ✅ enforce "one active session per user"
          var sessionOpt = sessions.findByUserId(uid);
          if (sessionOpt.isEmpty()) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
          }

          var session = sessionOpt.get();

          // Optional: also respect DB expires_at (in addition to JWT exp)
          if (session.getExpiresAt() != null && session.getExpiresAt().isBefore(Instant.now())) {
            sessions.deleteByUserId(uid);
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
          }

          // Compare hashed token with stored hashed token
          if (!session.getToken().equals(sha256(token))) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
          }

          List<GrantedAuthority> authorities = role != null
              ? List.of(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
              : List.of(new SimpleGrantedAuthority("ROLE_USER"));

          Authentication auth =
              new UsernamePasswordAuthenticationToken(username, null, authorities);

          SecurityContextHolder.getContext().setAuthentication(auth);
        }
      } catch (Exception e) {
        // invalid token -> leave anonymous
      }
    }

    chain.doFilter(request, response);
  }
}
