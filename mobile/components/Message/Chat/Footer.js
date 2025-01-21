import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';

function FooterChat() {
  const [text, setText] = useState('');

  const handleSendMessage = () => {

    console.log('Gửi tin nhắn:', text);
    setText('');
  };
  // const handleImagePicker = async () => {
  //   const result = await ImagePicker.launchImageLibraryAsync({
  //     mediaTypes: ImagePicker.MediaTypeOptions.Images,
  //     allowsEditing: true,
  //     quality: 1,
  //   });

  // if (!result.cancelled) {
  //   setChatData(prev => ({ ...prev, image: result.uri }));
  //   Alert.alert("Thành công", "tải ảnh thành công");
  // }
  // } <-- Remove this closing curly brace
  return (
    <KeyboardAvoidingView style={styles.container}>
      <View style={styles.footerleft}>
        <MaterialIcons name="insert-emoticon" size={24} color="#0091ff" />
        <TextInput
          value={text}
          onChangeText={setText}
          style={styles.inputMessage}
          placeholder="Nhập tin nhắn..."
          placeholderTextColor="#999"
        />
      </View>
      <View style={styles.footerRight}>
        <TouchableOpacity>
          <MaterialIcons name="keyboard-voice" size={24} color="#0091ff" />
        </TouchableOpacity>
        <TouchableOpacity >
          <SimpleLineIcons name="picture" size={24} color="#0091ff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSendMessage}>
          <Ionicons name="send-outline" size={24} color="#0091ff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

export default FooterChat;
const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'row',
    padding: 10,
  },
  footerleft: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerRight: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around',
    flex: 1,
  },
  inputMessage: {
    width: 210,
    marginLeft: 10,
    height: 26,
  },
});
