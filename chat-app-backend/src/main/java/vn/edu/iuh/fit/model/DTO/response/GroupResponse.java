package vn.edu.iuh.fit.model.DTO.response;

import lombok.*;
import vn.edu.iuh.fit.model.UserGroup;

import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Setter
@Getter
@Builder
public class GroupResponse {
    private String id;
    private String groupName;
    private String image;
    private String creatorId;
    private String createdAt;
    private List<UserGroupResponse> userGroups;
}
