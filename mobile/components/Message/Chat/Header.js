import React from "react";
import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from "@react-navigation/native";
import { StackActions } from "@react-navigation/native";
function Header({ name, id, avatar }) {
    const navigation = useNavigation();

    const handlePressBack = () => {
        navigation.goBack();
      };

    const handlePressMenu = () => {
        navigation.navigate("DetailChat");
    };

    return (
        <View style={styles.container}>

            <View style={styles.container_left}>
                <TouchableOpacity onPress={handlePressBack} style={styles.button}>
                    <Ionicons name="chevron-back-outline" size={32} color="white" />
                </TouchableOpacity>

                <View style={styles.container_friend_Name}>
                    <Text style={styles.friend_Name}>{name}</Text>
                </View>
            </View>


            <View style={styles.container_right}>
                <TouchableOpacity style={styles.container_right_icon}>
                    <Feather name="phone" size={23} color="white" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.container_right_icon}>
                    <Feather name="video" size={26} color="white" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.container_right_icon} onPress={handlePressMenu}>
                    <Feather name="menu" size={26} color="white" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

export default Header;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: '#0091ff',
        height: 60,
        paddingHorizontal: 10,
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderColor: '#ccc',
    },
    container_left: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '70%',
    },
    container_friend_Name: {
        paddingLeft: 10,
    },
    friend_Name: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    container_right: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '30%',
        justifyContent: 'space-around',
    },
    container_right_icon: {
        padding: 8,
    },
    button: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 5,
    },
});
