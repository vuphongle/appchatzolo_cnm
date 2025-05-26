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
        <View style={styles.headerWrapper}>
      <HeaderGroup name={name} id={receiverid} image={avatar} />
</View>
<KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
      <View style={styles.chatContainer}>
        <ChatScreenGroup receiverID={receiverid} name={name} avatar={avatar} typechat={"GROUP"} />
      </View>
      </KeyboardAvoidingView>
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
   keyboardContainer: {
    flex: 1,
  },
  headerWrapper: {

    zIndex: 1,
    backgroundColor: '#fff',
    elevation: 2, 
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 2,
    height: 60, 
   
  },
});
