// blog/models/User.java
package blog.models;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID) // or remove and rely on DB default
  private UUID id;

  @Column(nullable = false, unique = true)
  private String username;

  @Column(nullable = false, unique = true)
  private String email;

  @Column(nullable = false)
  private String password;

  @Column(nullable = false)
  private String name;

  @Column(nullable = false)
  private String status;

  @Column(nullable = false)
  private String role;

  @Column(name = "avatar_media_id")
  private UUID avatarMediaId;

  @Column(name = "impressions_count")
  private Integer impressionsCount;

  @Column(name = "posts_count")
  private Integer postsCount;

  @Column(name = "readme")
  private String readme;

  @Column(name = "created_at", nullable = false)
  private OffsetDateTime createdAt;
}
