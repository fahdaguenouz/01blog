package blog.models;

import java.util.UUID;
import lombok.*;
import jakarta.persistence.*;

@Entity
@Table(name = "unseen_notifications")
@Getter
@Setter

public class UnseenNotification {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne
    private User user;

    @ManyToOne
    private Notification notification;

    protected UnseenNotification() {
    }

    public UnseenNotification(User user, Notification notification) {
        this.user = user;
        this.notification = notification;
    }
}
