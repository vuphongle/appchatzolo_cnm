package vn.edu.iuh.fit.model.DTO.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.web.bind.annotation.RequestParam;

@AllArgsConstructor
@NoArgsConstructor
@Setter
@Getter
public class GroupPromoteRequest {

   private String groupId;
   private  String targetUserId;
   private String promoterId;
}
