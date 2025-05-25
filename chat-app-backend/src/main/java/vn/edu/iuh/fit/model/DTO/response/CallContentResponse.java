package vn.edu.iuh.fit.model.DTO.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Setter
@Getter
public class CallContentResponse {
    private String type;
    private String offer;
    private String to;
    private String from;
}
