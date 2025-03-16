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
       
    },
    chatText: {
        fontSize: 18,
        color: '#333',
    },
    
});
