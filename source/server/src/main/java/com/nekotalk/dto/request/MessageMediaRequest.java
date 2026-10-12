package com.nekotalk.dto.request;

public record MessageMediaRequest(
        String fileName,
        String fileType,
        String thumbnailUrl // URL của file đã upload
) {

}
