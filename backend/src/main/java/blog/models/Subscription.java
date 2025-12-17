package blog.models;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Data
@Table(name = "subscriptions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Subscription {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "subscriber_id", nullable = false)
    private UUID subscriberId;
    
    @Column(name = "subscribed_to_id", nullable = false)
    private UUID subscribedToId;
    
    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;
}
