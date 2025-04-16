package vn.edu.iuh.fit.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.iuh.fit.exception.GroupException;
import vn.edu.iuh.fit.model.DTO.request.GroupPromoteRequest;
import vn.edu.iuh.fit.model.DTO.request.GroupResquest;
import vn.edu.iuh.fit.model.DTO.response.BaseResponse;
import vn.edu.iuh.fit.model.DTO.response.GroupResponse;
import vn.edu.iuh.fit.model.GroupRole;
import vn.edu.iuh.fit.model.User;
import vn.edu.iuh.fit.model.UserGroup;
import vn.edu.iuh.fit.service.GroupService;

import java.util.List;

@RestController
@RequestMapping("/groups")
public class GroupController {

    @Autowired
    private GroupService groupService;

    // Tao nhom
    @PostMapping("/create")
    public ResponseEntity<BaseResponse<GroupResponse>> createGroup(@RequestBody GroupResquest request) throws GroupException {
        GroupResponse group = groupService.createGroup(request);
        return ResponseEntity.ok(
                BaseResponse
                        .<GroupResponse>builder()
                        .data(group)
                        .success(true)
                        .message("Tạo nhóm thành công")
                        .build()
        );
    }

    // Add member
    @PostMapping("/addMember")
    public ResponseEntity<BaseResponse<GroupResponse>> addMember(@RequestBody GroupResquest request) throws GroupException {
        GroupResponse group = groupService.addMember(request);
        return ResponseEntity.ok(
                BaseResponse
                        .<GroupResponse>builder()
                        .data(group)
                        .success(true)
                        .message("Thêm thành viên thành công")
                        .build()
        );
    }

    // Update group info
    @PutMapping("/update")
    public ResponseEntity<BaseResponse<GroupResponse>> updateGroup(@RequestBody GroupResquest request) throws GroupException {
        GroupResponse group = groupService.updateGroup(request);
        return ResponseEntity.ok(
                BaseResponse
                        .<GroupResponse>builder()
                        .data(group)
                        .success(true)
                        .message("Cập nhật nhóm thành công")
                        .build()
        );
    }

    // chỉnh sửa quyền Role thăng cấp phó nhóm
    @PutMapping("/promoteToCoLeader")
    public ResponseEntity<BaseResponse<String>> promoteToCoLeader(
            @RequestBody GroupPromoteRequest  request) throws GroupException  {

            groupService.promoteToCoLeader(request.getGroupId(), request.getTargetUserId(), request.getPromoterId());
            return ResponseEntity.ok(BaseResponse.<String>builder()
                    .data("User promoted to Co-Leader successfully.")
                    .success(true)
                    .message("Thăng cấp thành công")
                    .build());

    }
    //chỉnh sửa quyền role hạ cấp thành viên
    @PutMapping("/demoteToMember")
    public ResponseEntity<BaseResponse<String>> demoteToMember(
            @RequestBody GroupPromoteRequest request)  throws GroupException {

            groupService.demoteToMember(request.getGroupId(), request.getTargetUserId(), request.getPromoterId());
            return ResponseEntity.ok(BaseResponse.<String>builder()
                    .data("User demoted to Member successfully.")
                    .success(true)
                    .message("Hạ cấp thành công")
                    .build());
    }

    @DeleteMapping("/delete/{userId}/{groupId}")
    public ResponseEntity<BaseResponse<String>> deleteGroup(@PathVariable String userId,@PathVariable String groupId) throws GroupException {
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
    @GetMapping("/getGroupMembers")
    public ResponseEntity<BaseResponse<List<UserGroup>>> getGroupMembers(@RequestParam String groupId) throws GroupException {
        // Lấy danh sách thành viên từ service
        List<UserGroup> members = groupService.getGroupMembers(groupId);

        // Trả về dữ liệu với BaseResponse
        return ResponseEntity.ok(
                BaseResponse
                        .<List<UserGroup>>builder()
                        .data(members)
                        .success(true)
                        .message("Lấy danh sách thành viên nhóm thành công")
                        .build()
        );
    }
}
