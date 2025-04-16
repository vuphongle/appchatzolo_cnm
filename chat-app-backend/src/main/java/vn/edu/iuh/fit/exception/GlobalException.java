package vn.edu.iuh.fit.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.time.LocalDateTime;

@RestControllerAdvice
public class GlobalException extends ResponseEntityExceptionHandler {


    @ExceptionHandler(GroupException.class)
    public ResponseEntity<ErrorDetail> handlerJwtException(GroupException ex, WebRequest req) {
        ErrorDetail errorDetail = ErrorDetail.builder()
                .error(ex.getMessage())
                .message(req.getDescription(false))
                .timeStamp(LocalDateTime.now())
                .build();
        return new ResponseEntity<>(errorDetail, HttpStatus.BAD_REQUEST);
    }
}
