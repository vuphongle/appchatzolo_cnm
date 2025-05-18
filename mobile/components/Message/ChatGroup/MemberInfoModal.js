import React from 'react';
import { Modal, View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import GroupService from '../../../services/GroupService';
import { WebSocketContext } from '../../../context/Websocket';
import UserService from '../../../services/UserService';
const MemberInfoModal = ({ visible, onClose, member, filteredMembers, infoGroup, refreshMemberGroupData }) => {
 
  const { sendMessage } = React.useContext(WebSocketContext);
  const handlePromoteToCoLeader = async () => {
      const isConfirmed = await new Promise((resolve) => {
          Alert.alert(
              'Xác nhận thăng cấp',
              'Bạn có chắc chắn muốn thăng cấp thành viên này lên phó nhóm không?',
              [
                  {
                      text: 'Hủy',
                      onPress: () => resolve(false),
                      style: 'cancel',
                  },
                  {
                      text: 'Đồng ý',
                      onPress: () => resolve(true),
                  },
              ],
              { cancelable: false }
          );
      });

      if (isConfirmed) {
          try {
              const response = await GroupService.promoteToCoLeader({
                  groupId: infoGroup.id,
                  targetUserId: member.userId,
                  promoterId: filteredMembers.userId,
              });
              Alert.alert('Thăng cấp thành công', 'Thăng cấp thành viên lên phó nhóm thành công');
               const user = await UserService.getUserById(member.userId);
            
              handleNotifiMessageGroup(`${user.name} đã được thăng cấp lên phó nhóm`);
              refreshMemberGroupData();
              onClose();
          } catch (error) {
              console.error('Lỗi khi thăng cấp:', error);
          }
      } else {
          console.log('Người dùng không đồng ý thăng cấp');
      }
  };

          

  const handleDemoteToMember = async () => {
      const isConfirmed = await new Promise((resolve) => {
          Alert.alert(
              'Xác nhận hạ cấp',
              'Bạn có chắc chắn muốn hạ cấp thành viên này?',
              [
                  {
                      text: 'Hủy',
                      onPress: () => resolve(false),
                      style: 'cancel',
                  },
                  {
                      text: 'Đồng ý',
                      onPress: () => resolve(true),
                  },
              ],
              { cancelable: false }
          );
      });

      if (isConfirmed) {
          try {
              const response = await GroupService.demoteToMember({
                  groupId: infoGroup.id,
                  targetUserId: member.userId,
                  promoterId: filteredMembers.userId,
              });
              Alert.alert('Hạ cấp thành công', 'Hạ cấp thành viên thành công');
                const user = await UserService.getUserById(member.userId);
                console.log('user', user);
              handleNotifiMessageGroup(`${user.name} đã bị hạ cấp thành viên`);
              refreshMemberGroupData();
              onClose();
          } catch (error) {
              console.error('Lỗi khi hạ cấp:', error);
          }
      } else {
          console.log('Người dùng không đồng ý hạ cấp');
      }
  }

  const handleDeleteMember = async () => {
      const isConfirmed = await new Promise((resolve) => {
          Alert.alert(
              'Xác nhận xóa thành viên',
              'Bạn có chắc chắn muốn xóa thành viên này?',
              [
                  {
                      text: 'Hủy',
                      onPress: () => resolve(false),
                      style: 'cancel',
                  },
                  {
                      text: 'Đồng ý',
                      onPress: () => resolve(true),
                  },
              ],
              { cancelable: false }
          );
      });

      if (isConfirmed) {
          try {
              const response = await GroupService.removeMember(infoGroup.id, member.userId, filteredMembers.userId);
              Alert.alert('Xoa thành công', 'Xóa thành viên thành công');
              refreshMemberGroupData();
              const user = await UserService.getUserById(member.userId);
              handleNotifiMessageGroup(`${user.name} đã bị xóa khỏi nhóm`);
              onClose();
          } catch (error) {
              console.error('Lỗi khi xóa:', error);
          }
      } else {
          console.log('Người dùng không đồng ý xóa');
      }
  }
    const handleNotifiMessageGroup = (mess) => {
      
       const ContentMessage = {
                id: `file_${new Date().getTime()}_${Math.random().toString(36).substr(2, 9)}`,
                senderID: infoGroup.id,
                receiverID: infoGroup.id,
                content: mess,
                sendDate: new Date().toISOString(),
                isRead: false,
                type: 'GROUP_CHAT',
                
                status:'Notification',
              };
      sendMessage(ContentMessage);
      console.log('sendMessage', ContentMessage);
    }

  const handlePromoteToLeader = async () => {
    const isConfirmed = await new Promise((resolve) => {
          Alert.alert(
              'Xác nhận thăng cấp',
              'Bạn có chắc chắn muốn thăng cấp thành viên này lên trưởng nhóm không?',
              [
                  {
                      text: 'Hủy',
                      onPress: () => resolve(false),
                      style: 'cancel',
                  },
                  {
                      text: 'Đồng ý',
                      onPress: () => resolve(true),
                  },
              ],
              { cancelable: false }
          );
      });

      if (isConfirmed) {
          try {
              const response = await GroupService.promoteToLeader({
                  groupId: infoGroup.id,
                  targetUserId: member.userId,
                  promoterId: filteredMembers.userId,
              });
              Alert.alert('Thăng cấp thành công', 'Thăng cấp thành viên lên trưởng nhóm thành công');
              refreshMemberGroupData();
               const user = await UserService.getUserById(member.userId);
             
              handleNotifiMessageGroup(`${user.name} đã được thăng cấp lên trưởng nhóm`);
              onClose();
          } catch (error) {
              console.error('Lỗi khi thăng cấp:', error);
          }
      } else {
          console.log('Người dùng không đồng ý thăng cấp');
      }
  }

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

            {(filteredMembers.role === 'LEADER' && filteredMembers.userId !== member.userId && member.role !== 'CO_LEADER') && (
              <TouchableOpacity style={styles.actionButton} onPress={handlePromoteToCoLeader}>
                <Text style={styles.actionButtonText}>Bổ nhiệm làm phó nhóm</Text>
              </TouchableOpacity>
            )}

            {(filteredMembers.role === 'LEADER' && filteredMembers.userId !== member.userId && member.role === 'CO_LEADER') && (
                <TouchableOpacity style={styles.actionButton} onPress={handleDemoteToMember}>
                    <Text style={styles.actionButtonText}>Hạ cấp thành viên</Text>
                </TouchableOpacity>
            )}

            {(filteredMembers.role === 'LEADER' && filteredMembers.userId !== member.userId && member.role !== 'LEADER') && (
                <TouchableOpacity style={styles.actionButton} onPress={handlePromoteToLeader}>
                    <Text style={styles.actionButtonText}>Thăng cấp lên làm trưởng nhóm</Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Chặn thành viên</Text>
            </TouchableOpacity>

            {((filteredMembers.role === 'LEADER' || filteredMembers.role === 'CO_LEADER') && filteredMembers.userId !== member.userId) && (
              <TouchableOpacity style={styles.actionButton} onPress={handleDeleteMember}>
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
