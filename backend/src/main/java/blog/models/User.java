package blog.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Getter
@Setter
@Table(name = "users")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID) // or remove and rely on DB default
  private UUID id;

  @Column(nullable = false, length = 100)
  private String name;

  @Column(nullable = false, unique = true, length = 50)
  private String username;

  @Column(nullable = false, unique = true, length = 100)
  private String email;

  @Column(nullable = false)
  @JsonIgnore
  private String password;

  @Column(nullable = false, length = 20)
  private String status;

  @Column(nullable = false, length = 50)
  @Enumerated(EnumType.STRING)
  @Builder.Default // ← ADD THIS to fix warning
  private Role role = Role.USER;

  public enum Role {
    USER, ADMIN
  }

  @Column(name = "avatar_media_id")
  private UUID avatarMediaId;

  @Column(name = "impressions_count")
  private Integer impressionsCount;
  @Column(columnDefinition = "text")
  private String bio; 

  @Column(nullable = false)
  private Integer age;

  @Column(name = "posts_count")
  private Integer postsCount;

  @Column(name = "readme")
  private String readme;

  @Column(name = "created_at", nullable = false)
  private OffsetDateTime createdAt;

 

}
