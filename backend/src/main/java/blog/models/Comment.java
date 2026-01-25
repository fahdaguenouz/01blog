package blog.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.*;
@Entity
@Table(name = "comments", indexes = {
  @Index(name = "idx_comments_post_created", columnList = "post_id, created_at DESC")
})
public class Comment {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  @Column(columnDefinition = "uuid")
  private UUID id;

  @Column(name = "user_id", nullable = false, columnDefinition = "uuid")
  private UUID userId;

  @Column(name = "post_id", nullable = false, columnDefinition = "uuid")
  private UUID postId;

  @Column(name = "text", nullable = false, columnDefinition = "text")
  private String text;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @PrePersist
  void pre() {
    if (createdAt == null) createdAt = LocalDateTime.now();
  }

  // Getters/setters
  public UUID getId() { return id; }
  public void setId(UUID id) { this.id = id; }

  public UUID getUserId() { return userId; }
  public void setUserId(UUID userId) { this.userId = userId; }

  public UUID getPostId() { return postId; }
  public void setPostId(UUID postId) { this.postId = postId; }

  public String getText() { return text; }
  public void setText(String text) { this.text = text; }

  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
