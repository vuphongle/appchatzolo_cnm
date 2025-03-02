import React from "react";
import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView } from "react-native";

import Header from "./Header";
import BodyChat from "./body/BodyChat";

function Chat({ route }) {
    const { name, receiverid, avatar } = route.params||[];



    return (
        <SafeAreaView style={styles.container}>

            <Header name={name} id={receiverid} image={avatar} />

            <View style={styles.chatContainer}>


            <BodyChat receiverID={receiverid} name={name} avatar={avatar} />
            </View>


        </SafeAreaView>
    );
}

export default Chat;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    chatContainer: {
        flex: 1,
        // justifyContent: 'flex-start',
        // padding: 10,
        // backgroundColor: '#f2f2f2', // Background color for chat section
    },
    chatText: {
        fontSize: 18,
        color: '#333',
    },
    // footerContainer: {
    //     // This keeps the Footer at the bottom of the screen
    //     position: 'absolute',
    //     bottom: 0,
    //     width: '100%',
    //     paddingBottom: 10,
    // }
});
