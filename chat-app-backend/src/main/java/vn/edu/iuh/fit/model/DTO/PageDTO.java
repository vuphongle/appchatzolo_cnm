package vn.edu.iuh.fit.model.DTO;

import lombok.*;

import java.util.List;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class PageDTO <T>{
    private int page;
    private int size;
//    private int totalPage;
    private String sortBy;
    private String sortName;
//    private List<T> data;
}
