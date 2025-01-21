import React, { useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Entypo from 'react-native-vector-icons/Entypo';
import { useNavigation } from '@react-navigation/native';

function ImageChat({ route }) {
  const { avatar, name, image } = route.params;
  const navigation = useNavigation();

  const [selectedReaction, setSelectedReaction] = useState(null);

  const handlePressClose = () => {
    navigation.goBack();
  };

  const handleReactionPress = (reaction) => {
    setSelectedReaction(reaction);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={handlePressClose}>
            <Ionicons name="chevron-back-outline" size={32} color="white" />
          </TouchableOpacity>
          <Image
            source={{ uri: avatar }}
            style={styles.avatar}
          />
          <Text style={styles.name}>{name}</Text>
        </View>
      </View>


      <View style={styles.imageContainer}>
        <Image
          source={{ uri: image }}
          style={styles.image}
        />
      </View>

      <View style={styles.reactionContainer}>
        <Text style={styles.reactionTitle}>Thả cảm xúc:</Text>
        <View style={styles.reactionIcons}>
          <TouchableOpacity onPress={() => handleReactionPress('like')}>
            <AntDesign
              name="like1"
              size={32}
              color={selectedReaction === 'like' ? '#1E90FF' : '#ccc'}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleReactionPress('heart')}>
            <AntDesign
              name="heart"
              size={32}
              color={selectedReaction === 'heart' ? 'red' : '#ccc'}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleReactionPress('wow')}>
            <Entypo
              name="emoji-flirt"
              size={32}
              color={selectedReaction === 'wow' ? '#FFD700' : '#ccc'}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleReactionPress('sad')}>
            <Entypo
              name="emoji-sad"
              size={32}
              color={selectedReaction === 'sad' ? '#6495ED' : '#ccc'}
            />
          </TouchableOpacity>
        </View>
        {selectedReaction && (
          <Text style={styles.selectedReactionText}>
            Cảm xúc của bạn: {selectedReaction.toUpperCase()}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flex: 0.1,
    backgroundColor: '#1C1C1C',
    justifyContent: 'flex-end',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    height: 40,
    width: 40,
    borderRadius: 100,
    marginHorizontal: 10,
  },
  name: {
    fontSize: 22,
    color: 'white',
  },
  imageContainer: {
    flex: 0.7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    height: '60%',
    width: '100%',
  },
  reactionContainer: {
    flex: 0.2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionTitle: {
    fontSize: 18,
    color: 'white',
    marginBottom: 10,
  },
  reactionIcons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '60%',
  },
  selectedReactionText: {
    marginTop: 10,
    fontSize: 16,
    color: '#FFD700',
  },
});

export default ImageChat;
