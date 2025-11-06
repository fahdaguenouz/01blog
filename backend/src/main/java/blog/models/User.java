// blog/models/User.java
package blog.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
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
  @JsonIgnore
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

   public UUID getId() { return id; }
  public void setId(UUID id) { this.id = id; }
  public String getName() { return name; }
  public void setName(String name) { this.name = name; }
  public String getUsername() { return username; }
  public void setUsername(String username) { this.username = username; }
  public String getEmail() { return email; }
  public void setEmail(String email) { this.email = email; }
  public String getPassword() { return password; }
  public void setPassword(String password) { this.password = password; }
  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }
  public String getRole() { return role; }
  public void setRole(String role) { this.role = role; }
  public UUID getAvatarMediaId() { return avatarMediaId; }
  public void setAvatarMediaId(UUID avatarMediaId) { this.avatarMediaId = avatarMediaId; }
  public Integer getImpressionsCount() { return impressionsCount; }
  public void setImpressionsCount(Integer impressionsCount) { this.impressionsCount = impressionsCount; }
  public Integer getPostsCount() { return postsCount; }
  public void setPostsCount(Integer postsCount) { this.postsCount = postsCount; }
  public String getReadme() { return readme; }
  public void setReadme(String readme) { this.readme = readme; }
  public OffsetDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
