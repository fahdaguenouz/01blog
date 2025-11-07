// src/main/java/blog/config/WebStaticConfig.java
package blog.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
public class WebStaticConfig implements WebMvcConfigurer {

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    // Map URL /uploads/** to the local uploads directory
    registry
      .addResourceHandler("/uploads/**")
      .addResourceLocations("file:uploads/")  // relative to project root; or use an absolute path, e.g., "file:/home/you/app/uploads/"
      .setCachePeriod(3600);
  }
}
