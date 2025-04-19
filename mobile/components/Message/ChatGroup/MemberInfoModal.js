import React from 'react';
import { Modal, View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const MemberInfoModal = ({ visible, onClose, member, filteredMembers }) => {
  if (!member) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalWrapper}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Thông tin thành viên</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            {/* Avatar và tên - Căn trái */}
            <View style={styles.avatarNameSection}>
                <Image source={{ uri: member.avatar }} style={styles.avatarImage} />
                <Text style={styles.memberName}>{member.userName}</Text>
            </View>

            {/* Icon liên lạc - Căn phải */}
            {filteredMembers.userId !== member.userId && (
                <View style={styles.contactIconsSection}>
                    <TouchableOpacity style={styles.iconButton}>
                        <Ionicons name="call" size={24} color="#0b9cf9" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton}>
                        <Ionicons name="chatbubble" size={24} color="#0b9cf9" />
                    </TouchableOpacity>
                </View>
            )}
          </View>

          {/* Hành động */}
          <View style={styles.actionSection}>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Xem trang cá nhân</Text>
            </TouchableOpacity>

            {(filteredMembers.role === 'LEADER' && filteredMembers.userId !== member.userId) && (
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Bổ nhiệm làm phó nhóm</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Chặn thành viên</Text>
            </TouchableOpacity>

            {((filteredMembers.role === 'LEADER' || filteredMembers.role === 'CO_LEADER') && filteredMembers.userId !== member.userId) && (
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.deleteButtonText}>Xóa khỏi nhóm</Text>
              </TouchableOpacity>
            )}
          </View>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalWrapper: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 5,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
  },
  avatarNameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
  },
  actionSection: {
    width: '100%',
    paddingTop: 10,
  },
  actionButton: {
    padding: 5,
    borderRadius: 5,
    marginBottom: 10,
  },
  actionButtonText: {
    fontSize: 16,
  },
  deleteButtonText: {
    color: 'red',
    fontSize: 16,
  },
  contactIconsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '20%',
    marginTop: 10,
    alignItems: 'center',
  },
  iconButton: {
    padding: 10,
  },
  modalBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 10,
  },
});

export default MemberInfoModal;
