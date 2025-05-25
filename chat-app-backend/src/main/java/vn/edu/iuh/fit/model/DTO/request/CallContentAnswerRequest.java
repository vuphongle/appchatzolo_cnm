package vn.edu.iuh.fit.model.DTO.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Setter
@Getter
public class CallContentAnswerRequest {
    private String type;
    private String answer;
    private String to;
    private String from;
}
