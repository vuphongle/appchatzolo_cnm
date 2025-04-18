import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
} from 'react-native';

import HeaderGroup from './HeaderGroup';
import ChatScreenGroup from './bodyGroup/ChatScreenGroup';

function ChatGroup({ route }) {
  const { name, receiverid, avatar } = route.params || [];

  return (
    <SafeAreaView style={styles.container}>
      <HeaderGroup name={name} id={receiverid} image={avatar} />

      <View style={styles.chatContainer}>
        <ChatScreenGroup receiverID={receiverid} name={name} avatar={avatar} />
      </View>
    </SafeAreaView>
  );
}

export default ChatGroup;

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
