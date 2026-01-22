package blog.dto;

import java.util.UUID;

public record PostMediaDto(
    UUID id,          
    UUID mediaId,     
    String url,       
    String mediaType,  
    String description,
    Integer position
) {}