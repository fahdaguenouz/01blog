package blog.models;

import java.util.UUID;
import lombok.Data;
import jakarta.persistence.*;


@Entity
@Table(name = "unseen_notifications")
@Data
public class UnseenNotification {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne
    private User user;

    @ManyToOne
    private Notification notification;

    public UnseenNotification(User user, Notification notification) {
        this.user = user;
        this.notification = notification;
    }
}
