package blog.models;

import jakarta.persistence.*;
import java.util.UUID;
import lombok.*;
@Entity
@Table(name = "likes", uniqueConstraints = {@UniqueConstraint(columnNames = {"post_id", "user_id"})})
public class Like {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  @Column(columnDefinition = "uuid")
  private UUID id;

  @Column(name = "user_id", nullable = false, columnDefinition = "uuid")
  private UUID userId;

  @Column(name = "post_id", nullable = false, columnDefinition = "uuid")
  private UUID postId;



  public UUID getId() { return id; }
  public void setId(UUID id) { this.id = id; }
  
  public UUID getUserId() { return userId; }
  public void setUserId(UUID userId) { this.userId = userId; }
  
  public UUID getPostId() { return postId; }
  public void setPostId(UUID postId) { this.postId = postId; }
}
