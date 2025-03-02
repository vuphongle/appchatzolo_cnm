import React, { useEffect, useState, useContext } from "react";
import { StyleSheet, Text, View, Image, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import MessageService from "../../../services/MessageService"; // Import API service
import { UserContext } from "../../../context/UserContext"; // Import UserContext
import UserService from "../../../services/UserService";
import axios from "axios";
import { formatDate } from "../../../utils/formatDate";
import { IPV4 } from "@env";
const ItemFriend = ({ receiverID,name,avatar }) => {
    const navigation = useNavigation();
    const { user } = useContext(UserContext); // Lấy user hiện tại
    const senderID = user?.id; // ID của người dùng hiện tại
    const [lastMessage, setLastMessage] = useState("");
    const [time, setTime] = useState("");
    const [Messagedata, setMessageData] = useState(null);
    // const senderID="1";

    // Fetch tin nhắn mới nhất
    useEffect(() => {
        const fetchLatestMessage = async () => {
            try {
                // const message = await MessageService.getLatestMessage(senderID, receiverID);
                const message = await  axios.get(`${IPV4}/messages/latest-message`, {
                    params: { senderID, receiverID }
                });
                // setMessageData(message.data);
                if (message.data) {
                    setLastMessage(message.data.content);
                    setTime(formatDate(message.data.sendDate));
                     // Chuyển đổi thời gian
                     console.log("time",new Date(message.sendDate).toLocaleTimeString());
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
        navigation.navigate('Chat', {  receiverid: receiverID,name: name,avatar: avatar });
    };

    return (
        <TouchableOpacity style={styles.itemContainer} onPress={handleNavigateChat}>
            <View style={styles.avatarContainer}>
                <Image source={{ uri: avatar }} style={styles.avatar} />
            </View>
            <View style={styles.infoContainer}>
                <Text style={styles.name}>{name}</Text>

                <Text style={styles.message}>{lastMessage}</Text>
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
