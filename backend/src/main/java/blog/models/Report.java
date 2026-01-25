package blog.models;

import java.time.LocalDateTime;
import java.util.UUID;
import lombok.*;
import jakarta.persistence.*;
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
  private LocalDateTime createdAt;

  @PrePersist
  void prePersist() {
    if (createdAt == null)
      createdAt = LocalDateTime.now();
  }

}
