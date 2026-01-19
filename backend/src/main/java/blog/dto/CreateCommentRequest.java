package blog.dto;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCommentRequest(
    @NotBlank(message = "Comment cannot be empty")
    @Size(max = 2000, message = "Comment too long (max 2000)")
    String content
) {}
