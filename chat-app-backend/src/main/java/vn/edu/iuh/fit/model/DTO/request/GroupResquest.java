package vn.edu.iuh.fit.model.DTO.request;

import lombok.*;

import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Setter
@Getter
@Builder
@ToString
public class GroupResquest {
    private String id;
    private String groupName;
    private String image;
    private String creatorId;
    private List<String> memberIds;
}
