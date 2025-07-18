package com.websocket.controller;

import com.websocket.model.ChatMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Controller
public class ChatController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @GetMapping("/chat")
    public String chatPage(Model model) {
        return "chat"; // loads chat.html
    }


@MessageMapping("/chat.send")
public void sendMessage(@Payload ChatMessage chatMessage) {
    String topic = generateTopic(chatMessage.getSenderId(), chatMessage.getReceiverId());
    messagingTemplate.convertAndSend(topic, chatMessage);
}

    @MessageMapping("/chat.typing")
    public void userTyping(@Payload ChatMessage typingStatus) {
        String topic = generateTopic(typingStatus.getSenderId(), typingStatus.getReceiverId());
        messagingTemplate.convertAndSend(topic + "/typing", typingStatus);
    }


    private String generateTopic(String senderId, String receiverId) {
        List<String> ids = Arrays.asList(senderId, receiverId);
        Collections.sort(ids); // Ensure consistent order
        return "/topic/conversation/" + ids.get(0) + "_" + ids.get(1);
    }

}

