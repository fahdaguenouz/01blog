package blog.models;

import java.time.Instant;
import java.util.UUID;
import lombok.*;
import jakarta.persistence.*;

@Entity
@Table(name = "unseen_notifications")
@Getter
@Setter

public class UnseenNotification {

    @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "notification_id", nullable = false)
  private Notification notification;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

   public UnseenNotification(User user, Notification notification) {
    this.user = user;
    this.notification = notification;
    this.createdAt = Instant.now();
  }
  protected UnseenNotification() {}


  @PrePersist
  void prePersist() {
    if (createdAt == null) createdAt = Instant.now();
  }

}
