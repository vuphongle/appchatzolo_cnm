import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';

const MessageOptionsModal = ({ visible, onClose, onForward, onDelete, message }) => {
  const reactions = [
    { emoji: '❤️', label: 'Heart', onPress: () => onForward('❤️') },
    { emoji: '👍', label: 'Thumbs Up', onPress: () => onForward('👍') },
    { emoji: '😂', label: 'Laugh', onPress: () => onForward('😂') },
    { emoji: '😲', label: 'Surprised', onPress: () => onForward('😲') },
    { emoji: '😭', label: 'Crying', onPress: () => onForward('😭') },
    { emoji: '😡', label: 'Angry', onPress: () => onForward('😡') },
  ];

  const options = [
    { icon: '➡️', text: 'Chuyển tiếp',
          onPress: () => {
            onClose();
            onForward('forward');
          }
    },
    { icon: '☁️', text: 'Lưu Cloud', onPress: () => onForward('saveCloud') },
    { icon: '↩️', text: 'Thu hồi', onPress: () => onForward('revoke') },
    { icon: '📋', text: 'Sao chép', onPress: () => onForward('copy') },
    { icon: '📌', text: 'Ghim', onPress: () => onForward('pin') },
    { icon: '⏰', text: 'Nhắc hẹn', onPress: () => onForward('reminder') },
    { icon: 'ℹ️', text: 'Chi tiết', onPress: () => onForward('details') },
    { icon: '🗑️', text: 'Xóa', onPress: onDelete },
  ];

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.messageBubble}>
            <Text style={styles.messageText}>{message}</Text>
          </View>

          {/* Reaction bar */}
          <View style={styles.reactionBar}>
            {reactions.map(({ emoji, label, onPress }) => (
              <TouchableOpacity
                key={label}
                onPress={onPress}
                style={styles.reactionButton}
                accessibilityLabel={label}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Options grid */}
          <View style={styles.optionsGrid}>
            {options.map(({ icon, text, beta, onPress }, index) => (
              <TouchableOpacity
                key={index}
                onPress={onPress}
                style={styles.optionButton}
                accessibilityLabel={text}
              >
                <View style={styles.optionIconWrapper}>
                  <Text style={[styles.optionIcon, beta && styles.betaIcon]}>{icon}</Text>
                  {beta && <Text style={styles.betaBadge}>BETA</Text>}
                </View>
                <Text style={styles.optionText}>{text}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 20,
    padding: 16,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  messageBubble: {
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    maxWidth: '100%',
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  messageText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '400',
  },
  reactionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    width: '100%',
    marginBottom: 16,
  },
  reactionButton: {
    paddingHorizontal: 6,
  },
  reactionEmoji: {
    fontSize: 24,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  optionButton: {
    width: '22%',
    marginBottom: 20,
    alignItems: 'center',
  },
  optionIconWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  optionIcon: {
    fontSize: 22,
    color: '#D1D5DB', // gray-300
  },
  betaIcon: {
    color: '#22C55E', // green-500
  },
  betaBadge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: '#22C55E',
    color: 'white',
    fontSize: 8,
    fontWeight: '700',
    borderRadius: 4,
    paddingHorizontal: 3,
    paddingVertical: 1,
    overflow: 'hidden',
  },
  optionText: {
    fontSize: 10,
    color: '#D1D5DB',
    textAlign: 'center',
  },
  closeButton: {
    marginTop: 8,
    backgroundColor: '#FF4500',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 40,
    width: '100%',
    alignItems: 'center',
  },
  closeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MessageOptionsModal;