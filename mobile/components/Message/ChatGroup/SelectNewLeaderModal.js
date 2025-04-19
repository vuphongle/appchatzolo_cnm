import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Image, ScrollView, Alert } from 'react-native';
import { UserContext } from '../../../context/UserContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

const SelectNewLeaderModal = ({ visible, onDismiss, onSelectNewLeader }) => {
  const [selectedLeader, setSelectedLeader] = useState(null);
  const { user, infoMemberGroup } = useContext(UserContext);

  useEffect(() => {
    setSelectedLeader(null);
  }, [visible]);

  const handleSelectLeader = () => {
    if (selectedLeader) {
      onSelectNewLeader(selectedLeader);
      onDismiss();
    } else {
        Alert.alert('Thông báo','Vui lòng chọn trưởng nhóm trước khi rời nhóm');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onDismiss}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Chọn trưởng nhóm trước khi rời</Text>

          {/* Wrap the member list inside ScrollView to enable scrolling */}
          <ScrollView style={styles.memberList}>
            {infoMemberGroup && infoMemberGroup
              .filter(member => member.userId !== user?.id)
              .map((member) => (
                <TouchableOpacity
                  key={member.userId}
                  style={styles.memberItem}
                  onPress={() => setSelectedLeader(member)}
                >
                  <View style={styles.memberInfo}>
                    <Image source={{ uri: member.avatar }} style={styles.avatar} />
                    <Text style={styles.memberName}>{member.userName}</Text>
                  </View>
                  {selectedLeader?.userId === member.userId && (
                    <Icon name="check-circle" size={24} color="blue" style={styles.icon} />
                  )}
                </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity onPress={handleSelectLeader} style={styles.button}>
              <Text style={styles.buttonText}>Chọn và tiếp tục</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onDismiss} style={styles.buttonCancel}>
              <Text style={styles.buttonCancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    maxHeight: '80%', // Make sure the modal container doesn't take up too much space
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  memberList: {
    maxHeight: '60%',
  },
  memberItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  memberName: {
    fontSize: 18,
    flexShrink: 1,
  },
  icon: {
    marginLeft: 10,
  },
  actions: {
    flexDirection: 'column',
    marginTop: 15,
  },
  button: {
    padding: 10,
    backgroundColor: '#007BFF',
    borderRadius: 25,
    marginVertical: 5,
  },
  buttonCancel: {
    padding: 10,
    borderRadius: 25,
    marginVertical: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  buttonCancelText: {
    color: 'black',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default SelectNewLeaderModal;