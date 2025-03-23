import React, { useEffect, useState, useContext } from "react";
import { StyleSheet, Text, View, Image, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import MessageService from "../../../services/MessageService"; // Import API service
import { UserContext } from "../../../context/UserContext"; // Import UserContext
import UserService from "../../../services/UserService";
import axios from "axios";
import { formatDate } from "../../../utils/formatDate";
import { IPV4 } from "@env";
import TruncatedText from "../../../utils/TruncatedText";

const ItemFriend = ({ receiverID, name, avatar }) => {
    const navigation = useNavigation();
    const { user } = useContext(UserContext); // Lấy user hiện tại
    const senderID = user?.id; // ID của người dùng hiện tại
    const [lastMessage, setLastMessage] = useState("");
    const [time, setTime] = useState("");

    // Functions to determine message type
    const isImageMessage = (url) => url.match(/\.(jpeg|jpg|gif|png)$/) != null;
    const isFileMessage = (url) => url.match(/\.(pdf|docx|xlsx|txt|zip|rar|mp3|mp4|pptx|csv|json|html|xml)$/) != null;

    useEffect(() => {
        const fetchLatestMessage = async () => {
            try {
                const message = await MessageService.getLatestMessage(senderID, receiverID);
                if (message) {
                    // Determine message type and display appropriate text
                    if (isImageMessage(message.content)) {
                        setLastMessage("Bạn đã được gửi một bức ảnh");
                    } else if (isFileMessage(message.content)) {
                        setLastMessage("Bạn đã được gửi một file");
                    } else {
                        setLastMessage(message.content);
                    }
                    
                    setTime(formatDate(message.sendDate));
                    console.log("time", new Date(message.sendDate).toLocaleTimeString());
                } else {
                    setLastMessage("Chưa có tin nhắn");
                    setTime("");
                }
            } catch (error) {
                console.error("Lỗi khi lấy tin nhắn mới nhất:", error);
            }
        };

        if (senderID && receiverID) {
            fetchLatestMessage();
        }
    }, [senderID, receiverID]);

    const handleNavigateChat = () => {
        navigation.navigate('Chat', { receiverid: receiverID, name: name, avatar: avatar });
    };

    return (
        <TouchableOpacity style={styles.itemContainer} onPress={handleNavigateChat}>
            <View style={styles.avatarContainer}>
                <Image source={{ uri: avatar }} style={styles.avatar} />
            </View>
            <View style={styles.infoContainer}>
                <Text style={styles.name}>{name}</Text>
                <TruncatedText text={lastMessage} maxLength={30} />
            </View>
            <Text style={styles.time}>{time}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    itemContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        padding: 5,
        borderBottomWidth: 1,
        borderBottomColor: "#ddd",
    },
    avatarContainer: {
        marginRight: 10,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    infoContainer: {
        flex: 1,
        justifyContent: "center",
    },
    name: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
    },
    message: {
        fontSize: 14,
        color: "#888",
    },
    time: {
        fontSize: 12,
        color: "#aaa",
    },
});

export default ItemFriend;