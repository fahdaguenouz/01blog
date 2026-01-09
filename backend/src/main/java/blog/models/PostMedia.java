package blog.models;

import jakarta.persistence.*;
import lombok.Data;
import java.time.Instant;
import java.util.UUID;
@Entity
@Table(name = "post_media")
@Data  // Lombok generates getters/setters
public class PostMedia {

  @Id
  @GeneratedValue
  @Column(name = "id", nullable = false)
  private UUID id;

  @Column(name = "post_id", nullable = false)
  private UUID postId;

  @Column(name = "media_id", nullable = false)
  private UUID mediaId;

  @Column(name = "description")
  private String description;

  @Column(name = "position", nullable = false)
  private int position;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

    // No uniqueConstraints in @Table - handled by DB
}
