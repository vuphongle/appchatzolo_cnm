package vn.edu.iuh.fit.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.iuh.fit.exception.GroupException;
import vn.edu.iuh.fit.model.DTO.request.GroupPromoteRequest;
import vn.edu.iuh.fit.model.DTO.request.GroupResquest;
import vn.edu.iuh.fit.model.DTO.response.BaseResponse;
import vn.edu.iuh.fit.model.DTO.response.GroupResponse;
import vn.edu.iuh.fit.model.GroupRole;
import vn.edu.iuh.fit.service.GroupService;

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

    // Xóa thành viên
    @DeleteMapping("/removeMember/{groupId}/{targetUserId}/{actorUserId}")
    public ResponseEntity<BaseResponse<String>> removeMember(
            @PathVariable String groupId,
            @PathVariable String targetUserId,
            @PathVariable String actorUserId) throws GroupException {
        // actorUserId là người thực hiện xóa
        GroupRole actorRole = groupService.getUserRole(groupId, actorUserId);
        // targetUserId là người bị xóa
        GroupRole targetRole = groupService.getUserRole(groupId, targetUserId);

        if (actorRole == null) {
            return ResponseEntity.badRequest().body(
                    BaseResponse.<String>builder()
                            .data(actorUserId)
                            .success(false)
                            .message("Người thực hiện không phải thành viên nhóm")
                            .build()
            );
        }

        if (targetRole == null) {
            return ResponseEntity.badRequest().body(
                    BaseResponse.<String>builder()
                            .data(targetUserId)
                            .success(false)
                            .message("Người bị xóa không phải là thành viên nhóm")
                            .build()
            );
        }

        if (actorRole == GroupRole.LEADER || (actorRole == GroupRole.CO_LEADER && targetRole == GroupRole.MEMBER)) {
            groupService.removeMember(groupId, targetUserId, actorUserId);
            return ResponseEntity.ok(
                    BaseResponse.<String>builder()
                            .data(targetUserId)
                            .success(true)
                            .message("Xóa thành viên thành công")
                            .build()
            );
        } else {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                    BaseResponse.<String>builder()
                            .data(targetUserId)
                            .success(false)
                            .message("Bạn không có quyền xóa người dùng này")
                            .build()
            );
        }
    }

}
