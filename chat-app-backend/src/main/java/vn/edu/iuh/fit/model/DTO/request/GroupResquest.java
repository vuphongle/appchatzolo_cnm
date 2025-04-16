package vn.edu.iuh.fit.model.DTO.request;

import lombok.*;

import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Setter
@Getter
@Builder
public class GroupResquest {
    private String groupName;
    private String image;
    private String creatorId;
    private List<String> memberIds;
}
