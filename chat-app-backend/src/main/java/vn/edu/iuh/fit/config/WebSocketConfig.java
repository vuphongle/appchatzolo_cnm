package vn.edu.iuh.fit.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import vn.edu.iuh.fit.handler.MyWebSocketHandler;
import vn.edu.iuh.fit.service.MessageService;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {
    private final MessageService messageService;

    public WebSocketConfig(MessageService messageService) {
        this.messageService = messageService;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(myWebSocketHandler(), "/socket.io").setAllowedOrigins("*");
    }

    @Bean
    public WebSocketHandler myWebSocketHandler() {
        return new MyWebSocketHandler(messageService);
    }
}


