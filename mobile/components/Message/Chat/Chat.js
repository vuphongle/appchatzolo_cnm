import React from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import Header from './Header';
import BodyChat from './body/BodyChat';

function Chat({ route }) {
  const { name, receiverid, avatar } = route.params || [];

  return (
    <SafeAreaView style={styles.container}>
   
     <View style={styles.headerWrapper}>
        <Header name={name} id={receiverid} image={avatar} />
      </View>
      {/* KeyboardAvoidingView chỉ bao bọc phần chat */}
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <View style={styles.chatContainer}>
          <BodyChat receiverID={receiverid} name={name} avatar={avatar} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default Chat;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  keyboardContainer: {
    flex: 1,
  },
  chatContainer: {
    flex: 1,
  },
});