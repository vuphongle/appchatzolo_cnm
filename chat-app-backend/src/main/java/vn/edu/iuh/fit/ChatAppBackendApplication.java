package vn.edu.iuh.fit;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import vn.edu.iuh.fit.config.AwsConfig;

@SpringBootApplication
public class ChatAppBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(ChatAppBackendApplication.class, args);
    }

}
