package vn.edu.iuh.fit.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.iuh.fit.exception.GroupException;
import vn.edu.iuh.fit.model.DTO.request.GroupResquest;
import vn.edu.iuh.fit.model.DTO.response.BaseResponse;
import vn.edu.iuh.fit.model.DTO.response.GroupResponse;
import vn.edu.iuh.fit.model.GroupRole;
import vn.edu.iuh.fit.model.UserGroup;
import vn.edu.iuh.fit.service.GroupService;

@RestController
@RequestMapping("/groups")
public class GroupController {

    @Autowired
    private GroupService groupService;

    // Tao nhom
    @PostMapping("/create")
    public ResponseEntity<BaseResponse<GroupResponse>> createGroup(@RequestBody GroupResquest request) throws GroupException {

        System.out.println("Create group request: ");
        System.out.println(request);

        GroupResponse group = groupService.createGroup(request);

        System.out.println("Group created: ");
        System.out.println(group);

        return ResponseEntity.ok(
                BaseResponse
                        .<GroupResponse>builder()
                        .data(group)
                        .success(true)
                        .message("Tạo nhóm thành công")
                        .build()
        );
    }

    @DeleteMapping("/delete/{userId}/{groupId}")
    public ResponseEntity<BaseResponse<String>> deleteGroup(@PathVariable String userId,@PathVariable String groupId) {
        GroupRole userGroup = groupService.getUserRole(groupId, userId);
        if (userGroup == null) {
            return ResponseEntity.badRequest().body(
                    BaseResponse
                            .<String>builder()
                            .data(userId)
                            .success(false)
                            .message("Người dùng không phải là thành viên của nhóm")
                            .build()
            );
        }
        if (!userGroup.equals(GroupRole.LEADER)) {
            return ResponseEntity.badRequest().body(
                    BaseResponse
                            .<String>builder()
                            .data(userId)
                            .success(false)
                            .message("Bạn không có quyền xóa nhóm này")
                            .build()
            );
        }
        groupService.deleteGroup(userId,groupId);
        return ResponseEntity.ok(
                BaseResponse
                        .<String>builder()
                        .data(groupId)
                        .success(true)
                        .message("Xóa nhóm thành công")
                        .build()
        );
    }
}
