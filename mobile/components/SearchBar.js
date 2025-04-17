import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Modal, Text, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

const SearchBar = ({
  placeholder,
  leftIcon,
  rightIcon,
  onLeftIconPress,
  onRightIconPress,
  searchText,
  setSearchText,
  onFocus,
  inputRef,
  mainTabName,
}) => {
  const navigation = useNavigation();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [pressedButton, setPressedButton] = useState(null); // Track which button is pressed

  const onRightIconPressCheck = () => {
    if(mainTabName === 'Chat' || mainTabName === 'Contacts') {
        setIsModalVisible(true);
    } else {
        onRightIconPress();
    }
  };

  const closeModal = () => {
    setIsModalVisible(false);
  };

  const functionCall = () => {
    Alert.alert('Thông báo', 'Chức năng này chưa được phát triển.');
  };

  // Function to handle press and set state to change color on press
  const handlePress = (buttonName) => {
    setPressedButton(buttonName);
    setTimeout(() => {
      setPressedButton(null); // Reset after 200ms to remove the blue effect
    }, 200); // Timeout duration for effect (200ms is a good time for the effect)
  };

  const navigateToCreateGroup = () => {
      navigation.navigate('CreateGroupScreen'); // Navigate to CreateGroupScreen
  };

  return (
    <View style={styles.searchBar}>
      {leftIcon && (
        <TouchableOpacity onPress={onLeftIconPress}>
          <Icon
            name={leftIcon}
            size={24}
            color="#888"
            style={styles.searchIcon}
          />
        </TouchableOpacity>
      )}
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder || 'Tìm kiếm'}
        value={searchText}
        onChangeText={setSearchText}
        onFocus={onFocus}
        ref={inputRef}
      />
      {rightIcon && (
        <TouchableOpacity onPress={onRightIconPressCheck}>
          <Icon
            name={rightIcon}
            size={24}
            color="#0056B3"
            style={styles.rightIcon}
          />
        </TouchableOpacity>
      )}

      <Modal
        visible={isModalVisible}
        animationType="none"
        transparent={true}
        onRequestClose={closeModal}
      >
        <TouchableOpacity style={styles.modalOverlay} onPress={closeModal}>
          <View style={styles.modalContainer} onStartShouldSetResponder={() => true}>
            <TouchableOpacity
              style={[styles.modalButton, pressedButton === 'createGroup' && styles.pressedButton]}
              onPress={() => { handlePress('createGroup'); navigateToCreateGroup();}}
              activeOpacity={1}
            >
              <Icon name="group-add" size={24} color={pressedButton === 'createGroup' ? 'white' : 'black'} />
              <Text style={[styles.modalButtonText, pressedButton === 'createGroup' && styles.pressedButtonText]}>Tạo nhóm</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, pressedButton === 'cloud' && styles.pressedButton]}
              onPress={() => { handlePress('cloud'); functionCall(); }}
              activeOpacity={1}
            >
              <Icon name="cloud" size={24} color={pressedButton === 'cloud' ? 'white' : 'black'} />
              <Text style={[styles.modalButtonText, pressedButton === 'cloud' && styles.pressedButtonText]}>Cloud của tôi</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, pressedButton === 'calendar' && styles.pressedButton]}
              onPress={() => { handlePress('calendar'); functionCall(); }}
              activeOpacity={1}
            >
              <Icon name="calendar-today" size={24} color={pressedButton === 'calendar' ? 'white' : 'black'} />
              <Text style={[styles.modalButtonText, pressedButton === 'calendar' && styles.pressedButtonText]}>Lịch Zalo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, pressedButton === 'call' && styles.pressedButton]}
              onPress={() => { handlePress('call'); functionCall(); }}
              activeOpacity={1}
            >
              <Icon name="call" size={24} color={pressedButton === 'call' ? 'white' : 'black'} />
              <Text style={[styles.modalButtonText, pressedButton === 'call' && styles.pressedButtonText]}>Tạo cuộc gọi nhóm</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, pressedButton === 'device' && styles.pressedButton]}
              onPress={() => { handlePress('device'); functionCall(); }}
              activeOpacity={1}
            >
              <Icon name="computer" size={24} color={pressedButton === 'device' ? 'white' : 'black'} />
              <Text style={[styles.modalButtonText, pressedButton === 'device' && styles.pressedButtonText]}>Thiết bị đăng nhập</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 8,
    margin: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  rightIcon: {
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: 220,
    marginTop: 75,
    marginRight: 10,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingBottom: 18,
    paddingLeft: 20,
    paddingTop: 18,
  },
  modalButtonText: {
    color: 'black',
    textAlign: 'center',
    fontSize: 16,
    marginLeft: 10,
  },
  pressedButton: {
    backgroundColor: '#A3D4FF',
  },
  pressedButtonText: {
    color: 'white',
  },
});

export default SearchBar;
