import React from "react";
import { StyleSheet, Text, View, Image, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
const ItemFriend = ({ avatar, name, lastMessage, time, id }) => {
    const navigation = useNavigation();
    const handleNavigateChat = ({ name, id, avatar }) => {
        navigation.navigate('Chat', { name, id, avatar });
    }

    return (
        <TouchableOpacity style={styles.itemContainer}

            onPress={() => handleNavigateChat({ name, id, avatar })}>
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
