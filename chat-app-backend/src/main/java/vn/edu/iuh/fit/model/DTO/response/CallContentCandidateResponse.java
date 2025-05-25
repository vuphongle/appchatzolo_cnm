package vn.edu.iuh.fit.model.DTO.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vn.edu.iuh.fit.model.IceCandidate;

import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Setter
@Getter
public class CallContentCandidateResponse {
    private String type;
    private List<String> candidate;
    private String to;
    private String from;
}
