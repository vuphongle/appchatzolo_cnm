import React from "react";
import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView } from "react-native";
import Footer from "./Footer";
import Header from "./Header";
import BodyChat from "./body/BodyChat";

function Chat({ route }) {
    const { name, id, avatar } = route.params;



    return (
        <SafeAreaView style={styles.container}>

            <Header name={name} id={id} image={avatar} />

            <View style={styles.chatContainer}>


                <BodyChat />
            </View>


            <KeyboardAvoidingView behavior="padding" >
                <Footer />
            </KeyboardAvoidingView>
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
