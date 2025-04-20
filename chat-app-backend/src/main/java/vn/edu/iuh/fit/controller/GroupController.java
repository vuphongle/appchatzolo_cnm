package vn.edu.iuh.fit.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.iuh.fit.exception.GroupException;
import vn.edu.iuh.fit.model.DTO.request.GroupPromoteRequest;
import vn.edu.iuh.fit.model.DTO.request.GroupRequest;
import vn.edu.iuh.fit.model.DTO.request.MessageRequest;
import vn.edu.iuh.fit.model.DTO.response.BaseResponse;
import vn.edu.iuh.fit.model.DTO.response.GroupResponse;
import vn.edu.iuh.fit.model.Group;
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
    public ResponseEntity<BaseResponse<GroupResponse>> createGroup(@RequestBody GroupRequest request) throws GroupException {
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
    public ResponseEntity<BaseResponse<GroupResponse>> addMember(@RequestBody GroupRequest request) throws GroupException {
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
    public ResponseEntity<BaseResponse<GroupResponse>> updateGroup(@RequestBody GroupRequest request) throws GroupException {
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
            @RequestBody GroupPromoteRequest request) throws GroupException {

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
            @RequestBody GroupPromoteRequest request) throws GroupException {

        groupService.demoteToMember(request.getGroupId(), request.getTargetUserId(), request.getPromoterId());
        return ResponseEntity.ok(BaseResponse.<String>builder()
                .data("User demoted to Member successfully.")
                .success(true)
                .message("Hạ cấp thành công")
                .build());
    }

    @DeleteMapping("/delete/{userId}/{groupId}")
    public ResponseEntity<BaseResponse<String>> deleteGroup(@PathVariable String userId, @PathVariable String groupId) throws GroupException {
        groupService.deleteGroup(userId, groupId);
        return ResponseEntity.ok(
                BaseResponse
                        .<String>builder()
                        .data(groupId)
                        .success(true)
                        .message("Xóa nhóm thành công")
                        .build()
        );
    }

    // Gửi tin nhắn đến tất cả thành viên trong nhóm
    @PostMapping("/send-message")
    public ResponseEntity<BaseResponse<String>> sendMessageToGroup(@RequestBody MessageRequest request) throws GroupException, JsonProcessingException {
        groupService.sendMessageToGroup(request);
        return ResponseEntity.ok(
                BaseResponse
                        .<String>builder()
                        .data("Message sent to group successfully.")
                        .success(true)
                        .message("Gửi tin nhắn thành công")
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

        groupService.removeMember(groupId, targetUserId, actorUserId);
        return ResponseEntity.ok(
                BaseResponse.<String>builder()
                        .data(targetUserId)
                        .success(true)
                        .message("Xóa thành viên thành công")
                        .build()
        );
    }

    @GetMapping("/getGroupMembers")
    public ResponseEntity<BaseResponse<List<GroupResponse>>> getGroupMembers(@RequestParam String groupId) throws GroupException {
        // Lấy danh sách thành viên từ service
        GroupResponse groupResponse = groupService.getGroupMembers(groupId);

        // Kiểm tra nếu không có thành viên nào
        if (groupResponse == null || groupResponse.getUserGroups() == null || groupResponse.getUserGroups().isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(BaseResponse.<List<GroupResponse>>builder()
                            .data(null)
                            .success(false)
                            .message("Nhóm này không có thành viên.")
                            .build());
        }

        // Trả về dữ liệu với BaseResponse
        return ResponseEntity.ok(
                BaseResponse
                        .<List<GroupResponse>>builder()
                        .data(List.of(groupResponse))  // Đảm bảo trả về dạng List
                        .success(true)
                        .message("Lấy danh sách thành viên nhóm thành công")
                        .build()
        );
    }

    //// Lấy danh sách nhóm của 1 người dùng trong UserGroup
    @GetMapping("/getGroupsByUserId")
    public ResponseEntity<BaseResponse<List<GroupResponse>>> getGroupsByUserId(@RequestParam String userId) {
        List<GroupResponse> groups = groupService.getGroupsByUserId(userId);
        return ResponseEntity.ok(
                BaseResponse
                        .<List<GroupResponse>>builder()
                        .data(groups)
                        .success(true)
                        .message("Lấy danh sách nhóm thành công")
                        .build()
        );
    }

    @DeleteMapping("/leaveGroup/{groupId}/{currentLeaderId}/{newLeaderId}")
    public ResponseEntity<BaseResponse<String>> leaveGroup(
            @PathVariable String groupId,
            @PathVariable String currentLeaderId,
            @PathVariable String newLeaderId) throws GroupException {
        System.out.println("Group ID: " + groupId);
        System.out.println("Current Leader ID: " + currentLeaderId);
        System.out.println("New Leader ID: " + newLeaderId);
        groupService.leaveGroup(groupId, currentLeaderId, newLeaderId);
        return ResponseEntity.ok(
                BaseResponse
                        .<String>builder()
                        .data(groupId)
                        .success(true)
                        .message("Rời nhóm thành công")
                        .build()
        );
    }

    //Get group by ID
    @GetMapping("/getGroupById/{groupId}")
    public ResponseEntity<BaseResponse<GroupResponse>> getGroupById(@PathVariable String groupId) throws GroupException {
        GroupResponse group = groupService.getGroupById(groupId);
        return ResponseEntity.ok(
                BaseResponse
                        .<GroupResponse>builder()
                        .data(group)
                        .success(true)
                        .message("Lấy thông tin nhóm thành công")
                        .build()
        );
    }

    // Thăng cấp lên trưởng nhóm
    @PutMapping("/promoteToLeader")
    public ResponseEntity<BaseResponse<GroupResponse>> promoteToLeader(
            @RequestBody GroupPromoteRequest request) throws GroupException {
        GroupResponse groupResponse = groupService.promoteToLeader(request.getGroupId(), request.getTargetUserId(), request.getPromoterId());

        return ResponseEntity.ok(BaseResponse.<GroupResponse>builder()
                .data(groupResponse)
                .success(true)
                .message("Thăng cấp thành công")
                .build());
    }
}
