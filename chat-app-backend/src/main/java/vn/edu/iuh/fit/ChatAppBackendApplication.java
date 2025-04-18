package vn.edu.iuh.fit;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import vn.edu.iuh.fit.config.AwsConfig;
@EnableCaching
@SpringBootApplication
public class ChatAppBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(ChatAppBackendApplication.class, args);
    }

}
