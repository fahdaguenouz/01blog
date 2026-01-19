package blog.service.posts;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.regex.Pattern;

@Component
public class PostValidator {

  private static final Pattern HTML_TAG_PATTERN = Pattern.compile("<[^>]*>");

  public String requireCleanText(String value, String field, int maxLen) {
    if (value == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " is required");

    String v = value.trim();
    if (v.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " cannot be blank");
    if (maxLen > 0 && v.length() > maxLen) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " is too long");
    if (HTML_TAG_PATTERN.matcher(v).find()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " cannot contain HTML");
    return v;
  }
}
