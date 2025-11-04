package blog.dto;

import blog.models.User;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {
  private String token;
  private User user;
}


