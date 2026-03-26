package com.example.StyleStore.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserUpdateCommentRequest {

    @NotBlank(message = "Nội dung comment không được để trống")
    @Size(min = 5, max = 1000, message = "Nội dung comment phải từ 10 đến 1000 ký tự")
    private String content;
}
