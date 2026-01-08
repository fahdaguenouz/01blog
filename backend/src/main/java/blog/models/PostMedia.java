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
    @GeneratedValue(strategy = GenerationType.UUID)  // Matches uuid_generate_v4()
    @Column(name = "id", columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "post_id", nullable = false, columnDefinition = "uuid")
    private UUID postId;

    @Column(name = "media_id", nullable = false, columnDefinition = "uuid")
    private UUID mediaId;

    @Column(columnDefinition = "text")
    private String description;

    @Column
    private Integer position;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    // No uniqueConstraints in @Table - handled by DB
}
