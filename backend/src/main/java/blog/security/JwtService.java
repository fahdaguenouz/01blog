package blog.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
public class JwtService {

  private final SecretKey secretKey;
  private final long expirationMs;

  public JwtService(
      @Value("${jwt.secret}") String secret,
      @Value("${jwt.expirationMs}") long expirationMs
  ) {
    this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    this.expirationMs = expirationMs;
  }

  /** ✅ returns both token + jti so we can persist jti in DB */
  public TokenBundle generateToken(UUID userId, String username, String role) {
    Date now = new Date();
    Date exp = new Date(now.getTime() + expirationMs);

    String jti = UUID.randomUUID().toString(); // ✅ uniqueness

    Map<String, Object> claims = new HashMap<>();
    claims.put("uid", userId.toString());
    claims.put("role", role);

    String token = Jwts.builder()
        .setClaims(claims)
        .setSubject(username)
        .setId(jti)                 // ✅ standard JWT ID field
        .setIssuedAt(now)
        .setExpiration(exp)
        .signWith(secretKey, SignatureAlgorithm.HS256)
        .compact();

    return new TokenBundle(token, jti, exp);
  }

  public SecretKey getSecretKey() { return secretKey; }
  public long getExpirationMs() { return expirationMs; }

  public Claims parseClaims(String token) {
    return Jwts.parserBuilder()
        .setSigningKey(secretKey)
        .build()
        .parseClaimsJws(token)
        .getBody();
  }

  public UUID extractUserId(String token) {
    String uid = parseClaims(token).get("uid", String.class);
    return UUID.fromString(uid);
  }

  public String extractJti(String token) {
    return parseClaims(token).getId(); // ✅ reads `jti`
  }

  // small record helper
  public record TokenBundle(String token, String jti, Date exp) {}
}





// {
//   "uid": "770e8400-e29b-41d4-a716-446655440003",
//   "role": "ADMIN",
//   "sub": "fahd",
//   "jti": "1d3f5c9e-....",
//   "iat": 1768940000,
//   "exp": 1769026400
// }