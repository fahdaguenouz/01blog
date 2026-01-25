package blog.models;

import jakarta.persistence.*;
import java.util.UUID;
import lombok.*;
@Entity
@Table(name = "post_categories",
       uniqueConstraints = @UniqueConstraint(columnNames = {"post_id", "category_id"}))
public class PostCategory {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  @Column(columnDefinition = "uuid")
  private UUID id;

  @Column(name = "post_id", nullable = false, columnDefinition = "uuid")
  private UUID postId;

  @Column(name = "category_id", nullable = false, columnDefinition = "uuid")
  private UUID categoryId;


  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
  }

  public UUID getPostId() {
    return postId;
  }

  public void setPostId(UUID postId) {
    this.postId = postId;
  }

  public UUID getCategoryId() {
    return categoryId;
  }

  public void setCategoryId(UUID categoryId) {
    this.categoryId = categoryId;
  }
}
