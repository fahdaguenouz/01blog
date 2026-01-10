package blog.models;

import jakarta.persistence.*;
import lombok.Data;
import java.time.Instant;
import java.util.*;

import blog.enums.NotificationType;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "notifications")
@Data // Lombok generates getters/setters
public class Notification {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User targetUser; // who receives it

    @ManyToOne
    @JoinColumn(name = "post_id")
    private Post post; // nullable (follow has no post)

    @Enumerated(EnumType.STRING)
    private NotificationType type;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> payload;

    private Instant createdAt = Instant.now();
}
