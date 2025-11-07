package blog.models;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "media")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Media {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "user_id", nullable = false, columnDefinition = "uuid")
  private UUID userId;

  @Column(name = "media_type", nullable = false)
  private String mediaType; // image/png, image/jpeg...

  @Column(name = "size", nullable = false)
  private Integer size;

  @Column(name = "url", nullable = false, columnDefinition = "text")
  private String url;

  @Column(name = "uploaded_at", nullable = false)
  private OffsetDateTime uploadedAt;
}
