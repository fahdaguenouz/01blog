package blog.config;

import org.springframework.web.multipart.MaxUploadSizeExceededException;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import java.time.Instant;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

  private Map<String, Object> body(HttpStatus status, String message, HttpServletRequest req) {
    Map<String, Object> b = new HashMap<>();
    b.put("timestamp", Instant.now().toString());
    b.put("status", status.value());
    b.put("error", status.getReasonPhrase());
    b.put("message", message);
    b.put("path", req.getRequestURI());
    return b;
  }

  // ✅ Your special case (order conflict, unique constraint, etc.)
  @ExceptionHandler(DataIntegrityViolationException.class)
  public ResponseEntity<?> handleDataIntegrity(DataIntegrityViolationException ex, HttpServletRequest req) {
    log.warn("Data integrity violation at {}: {}", req.getRequestURI(), ex.getMessage());
    return ResponseEntity.status(HttpStatus.CONFLICT).body(
        body(HttpStatus.CONFLICT, "Media order conflict. Please refresh and try again.", req));
  }

  // ✅ When you throw new ResponseStatusException(...)
  @ExceptionHandler(ResponseStatusException.class)
  public ResponseEntity<?> handleResponseStatus(ResponseStatusException ex, HttpServletRequest req) {
    HttpStatus status = HttpStatus.valueOf(ex.getStatusCode().value());
    return ResponseEntity.status(status).body(
        body(status, ex.getReason() != null ? ex.getReason() : status.getReasonPhrase(), req));
  }

  // ✅ Validation errors (if you use @Valid)
  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<?> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest req) {
    String msg = ex.getBindingResult().getFieldErrors().stream()
        .findFirst()
        .map(e -> e.getField() + ": " + e.getDefaultMessage())
        .orElse("Validation failed");

    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
        body(HttpStatus.BAD_REQUEST, msg, req));
  }

  // ✅ Forbidden (not admin, no permission)
  @ExceptionHandler(AccessDeniedException.class)
  public ResponseEntity<?> handleAccessDenied(AccessDeniedException ex, HttpServletRequest req) {
    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
        body(HttpStatus.FORBIDDEN, "Access denied", req));
  }

  // ✅ JWT parsing problems if they bubble up
  @ExceptionHandler(JwtException.class)
  public ResponseEntity<?> handleJwt(JwtException ex, HttpServletRequest req) {
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
        body(HttpStatus.UNAUTHORIZED, "Invalid or expired token", req));
  }

  // ✅ Fallback: unexpected errors
  @ExceptionHandler(Exception.class)
  public ResponseEntity<?> handleGeneric(Exception ex, HttpServletRequest req) {
    log.error("Unhandled error at {}: {}", req.getRequestURI(), ex.getMessage(), ex);
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
        body(HttpStatus.INTERNAL_SERVER_ERROR, "We hit a problem on our side. Please try again.", req));
  }

  @ExceptionHandler({
      MethodArgumentTypeMismatchException.class,
      HttpMessageNotReadableException.class,
      MissingServletRequestPartException.class,
      MissingServletRequestParameterException.class
  })
  public ResponseEntity<?> handleBadRequest(Exception ex, HttpServletRequest req) {
    String msg;

    if (ex instanceof MethodArgumentTypeMismatchException e) {
      msg = "Invalid value for '" + e.getName() + "': " + e.getValue();
    } else if (ex instanceof MissingServletRequestPartException e) {
      msg = "Missing multipart part: " + e.getRequestPartName();
    } else if (ex instanceof MissingServletRequestParameterException e) {
      msg = "Missing parameter: " + e.getParameterName();
    } else {
      msg = "Bad request: " + ex.getMessage();
    }

    log.warn("Bad request at {}: {}", req.getRequestURI(), ex.getMessage());
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body(HttpStatus.BAD_REQUEST, msg, req));
  }

  @ExceptionHandler(MaxUploadSizeExceededException.class)
  public ResponseEntity<?> handleMaxUpload(MaxUploadSizeExceededException ex, HttpServletRequest req) {
    return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(
        body(HttpStatus.PAYLOAD_TOO_LARGE, "That file is too large. Please upload a smaller one.", req));
  }

  @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
  public ResponseEntity<?> handleUnsupported(HttpMediaTypeNotSupportedException ex, HttpServletRequest req) {
    return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE).body(
        body(HttpStatus.UNSUPPORTED_MEDIA_TYPE,
            "Unsupported Content-Type. This endpoint requires multipart/form-data.",
            req));
  }

}
