package vn.edu.iuh.fit.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.iuh.fit.exception.GroupException;
import vn.edu.iuh.fit.model.DTO.request.GroupResquest;
import vn.edu.iuh.fit.model.DTO.response.BaseResponse;
import vn.edu.iuh.fit.model.DTO.response.GroupResponse;
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
}
