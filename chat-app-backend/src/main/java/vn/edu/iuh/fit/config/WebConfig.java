//package vn.edu.iuh.fit.config;
//
//import org.springframework.context.annotation.Bean;
//import org.springframework.context.annotation.Configuration;
//import org.springframework.web.servlet.config.annotation.CorsRegistry;
//import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
//
//@Configuration
//public class WebConfig {
//    @Bean
//    public WebMvcConfigurer corsConfigurer() {
//        return new WebMvcConfigurer() {
//            @Override
//            public void addCorsMappings(CorsRegistry registry) {
//                registry.addMapping("/**") // Áp dụng cho tất cả endpoint
//                        .allowedOrigins("*") // Cho phép tất cả nguồn gốc
//                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS") // Các method được phép
//                        .allowedHeaders("*"); // Tất cả header
//            }
//        };
//    }
//}

package vn.edu.iuh.fit.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig {
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**") // Áp dụng cho tất cả endpoint
                        .allowedOrigins("http://localhost:3000","http://192.168.100.52:8081") // Chỉ định domain frontend
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS") // Các method được phép
                        .allowedHeaders("*") // Cho phép tất cả header
                        .allowCredentials(true); // Cần bật để gửi cookie/session qua domain khác
            }
        };
    }
}
