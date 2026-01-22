package blog.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "reports")
@Getter 
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Report {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "reporter_id", nullable = false, columnDefinition = "uuid")
  private UUID reporterId;

  @Column(name = "reported_user_id", nullable = false, columnDefinition = "uuid")
  private UUID reportedUserId;

  @Column(name = "reported_post_id", columnDefinition = "uuid")
  private UUID reportedPostId;

  @Column(name = "reported_comment_id", columnDefinition = "uuid")
  private UUID reportedCommentId;

  @Column(nullable = false)
  private String category;

  @Column(nullable = false)
  private String reason;

  @Column(nullable = false)
  private String status;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;
}
