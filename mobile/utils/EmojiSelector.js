import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
} from 'react-native';

const emojiData = {
  smileys: [
    '😀',
    '😁',
    '😂',
    '🤣',
    '😃',
    '😄',
    '😅',
    '😆',
    '😉',
    '😊',
    '😋',
    '😎',
    '😍',
    '😘',
    '🥰',
    '😗',
    '😙',
    '😚',
    '🙂',
    '🤗',
    '🤩',
    '🤔',
    '🤨',
    '😐',
    '😑',
    '😶',
    '🙄',
    '😏',
    '😣',
    '😥',
    '😮',
    '🤐',
    '😯',
    '😪',
    '😫',
    '🥱',
    '😴',
    '😌',
    '😛',
    '😜',
    '😝',
    '🤤',
    '😒',
    '😓',
    '😔',
    '😕',
    '🙃',
    '🤑',
    '😲',
    '☹️',
  ],
  animals: [
    '🐶',
    '🐱',
    '🐭',
    '🐹',
    '🐰',
    '🦊',
    '🐻',
    '🐼',
    '🐨',
    '🐯',
    '🦁',
    '🐮',
    '🐷',
    '🐸',
    '🐵',
    '🙈',
    '🙉',
    '🙊',
    '🐒',
    '🐔',
    '🐧',
    '🐦',
    '🐤',
    '🐣',
    '🐥',
    '🦆',
    '🦅',
    '🦉',
    '🦇',
    '🐺',
    '🐗',
    '🐴',
    '🦄',
    '🐝',
    '🐛',
    '🦋',
    '🐌',
    '🐞',
    '🐜',
    '🦗',
  ],
  foods: [
    '🍏',
    '🍎',
    '🍐',
    '🍊',
    '🍋',
    '🍌',
    '🍉',
    '🍇',
    '🍓',
    '🍈',
    '🍒',
    '🍑',
    '🥭',
    '🍍',
    '🥥',
    '🥝',
    '🍅',
    '🍆',
    '🥑',
    '🥦',
    '🥬',
    '🥒',
    '🌶',
    '🌽',
    '🥕',
    '🧄',
    '🧅',
    '🥔',
    '🍠',
    '🥐',
    '🥯',
    '🍞',
    '🥖',
    '🥨',
    '🧀',
    '🥚',
    '🍳',
    '🧈',
    '🥞',
    '🧇',
  ],
  activities: [
    '⚽️',
    '🏀',
    '🏈',
    '⚾️',
    '🥎',
    '🎾',
    '🏐',
    '🏉',
    '🥏',
    '🎱',
    '🪀',
    '🏓',
    '🏸',
    '🏒',
    '🏑',
    '🥍',
    '🏏',
    '🥅',
    '⛳️',
    '🪁',
    '🏹',
    '🎣',
    '🤿',
    '🥊',
    '🥋',
    '🎽',
    '🛹',
    '🛷',
    '⛸',
    '🥌',
    '🎿',
    '⛷',
    '🏂',
    '🪂',
    '🏋️',
    '🤼',
    '🤸',
    '🤺',
    '⛹️',
    '🤾',
  ],
  places: [
    '🏠',
    '🏡',
    '🏢',
    '🏣',
    '🏤',
    '🏥',
    '🏦',
    '🏨',
    '🏩',
    '🏪',
    '🏫',
    '🏬',
    '🏭',
    '🏯',
    '🏰',
    '💒',
    '🗼',
    '🗽',
    '⛪️',
    '🕌',
    '🛕',
    '🕍',
    '⛩',
    '🕋',
    '⛲️',
    '⛺️',
    '🌁',
    '🌃',
    '🏙',
    '🌄',
    '🌅',
    '🌆',
    '🌇',
    '🌉',
    '🌌',
    '🎠',
    '🎡',
    '🎢',
    '💈',
    '🎪',
  ],
  objects: [
    '⌚️',
    '📱',
    '📲',
    '💻',
    '⌨️',
    '🖥',
    '🖨',
    '🖱',
    '🖲',
    '🕹',
    '🗜',
    '💽',
    '💾',
    '💿',
    '📀',
    '📼',
    '📷',
    '📸',
    '📹',
    '🎥',
    '📽',
    '🎞',
    '📞',
    '☎️',
    '📟',
    '📠',
    '📺',
    '📻',
    '🧭',
    '⏱',
    '⏲',
    '⏰',
    '🕰',
    '⌛️',
    '⏳',
    '📡',
    '🔋',
    '🔌',
    '💡',
    '🔦',
  ],
  symbols: [
    '❤️',
    '🧡',
    '💛',
    '💚',
    '💙',
    '💜',
    '🖤',
    '🤍',
    '🤎',
    '💔',
    '❣️',
    '💕',
    '💞',
    '💓',
    '💗',
    '💖',
    '💘',
    '💝',
    '💟',
    '☮️',
    '✝️',
    '☪️',
    '🕉',
    '☸️',
    '✡️',
    '🔯',
    '🕎',
    '☯️',
    '☦️',
    '🛐',
    '⛎',
    '♈️',
    '♉️',
    '♊️',
    '♋️',
    '♌️',
    '♍️',
    '♎️',
    '♏️',
    '♐️',
  ],
  flags: [
    '🏳️',
    '🏴',
    '🏴‍☠️',
    '🏁',
    '🚩',
    '🏳️‍🌈',
    '🇦🇫',
    '🇦🇽',
    '🇦🇱',
    '🇩🇿',
    '🇦🇸',
    '🇦🇩',
    '🇦🇴',
    '🇦🇮',
    '🇦🇶',
    '🇦🇬',
    '🇦🇷',
    '🇦🇲',
    '🇦🇼',
    '🇦🇺',
    '🇦🇹',
    '🇦🇿',
    '🇧🇸',
    '🇧🇭',
    '🇧🇩',
    '🇧🇧',
    '🇧🇾',
    '🇧🇪',
    '🇧🇿',
    '🇧🇯',
    '🇧🇲',
    '🇧🇹',
    '🇧🇴',
    '🇧🇦',
    '🇧🇼',
    '🇧🇷',
    '🇻🇳',
    '🇮🇩',
    '🇯🇵',
    '🇰🇷',
  ],
};

const categories = [
  { key: 'smileys', title: 'Cảm xúc' },
  { key: 'animals', title: 'Động vật' },
  { key: 'foods', title: 'Thức ăn' },
  { key: 'activities', title: 'Hoạt động' },
  { key: 'places', title: 'Địa điểm' },
  { key: 'objects', title: 'Đồ vật' },
  { key: 'symbols', title: 'Biểu tượng' },
  { key: 'flags', title: 'Cờ' },
];

const EmojiSelector = ({
  onEmojiSelected,
  columns = 6,
  showSearchBar = true,
  showTabs = true,
  showHistory = true,
  placeholder = 'Tìm kiếm emoji...',
}) => {
  const [selectedCategory, setSelectedCategory] = useState('smileys');
  const [searchQuery, setSearchQuery] = useState('');
  const [emojiHistory, setEmojiHistory] = useState([]);
  const [filteredEmojis, setFilteredEmojis] = useState([]);

  const { width } = Dimensions.get('window');

  const itemSize = width / columns;

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredEmojis(emojiData[selectedCategory]);
    } else {
      const results = [];
      Object.values(emojiData).forEach((categoryEmojis) => {
        categoryEmojis.forEach((emoji) => {
          if (emoji.includes(searchQuery)) {
            results.push(emoji);
          }
        });
      });
      setFilteredEmojis(results);
    }
  }, [searchQuery, selectedCategory]);

  const handleEmojiPress = (emoji) => {
    onEmojiSelected(emoji);

    if (showHistory) {
      const updatedHistory = [
        emoji,
        ...emojiHistory.filter((e) => e !== emoji),
      ].slice(0, 20);
      setEmojiHistory(updatedHistory);
    }
  };

  const renderEmojiItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.emojiButton, { width: itemSize, height: itemSize }]}
      onPress={() => handleEmojiPress(item)}
    >
      <Text style={styles.emoji}>{item}</Text>
    </TouchableOpacity>
  );

  const renderCategoryTab = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryTab,
        selectedCategory === item.key && styles.selectedCategoryTab,
      ]}
      onPress={() => {
        setSelectedCategory(item.key);
        setSearchQuery('');
      }}
    >
      <Text style={styles.categoryTabText}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {showSearchBar && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}

      {showHistory && emojiHistory.length > 0 && (
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>Đã dùng gần đây</Text>
          <FlatList
            data={emojiHistory}
            renderItem={renderEmojiItem}
            keyExtractor={(item, index) => `history-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
          />
        </View>
      )}

      {showTabs && (
        <FlatList
          data={categories}
          renderItem={renderCategoryTab}
          keyExtractor={(item) => item.key}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
        />
      )}

      <FlatList
        data={filteredEmojis}
        renderItem={renderEmojiItem}
        keyExtractor={(item, index) => `emoji-${index}`}
        numColumns={columns}
        showsVerticalScrollIndicator={true}
        style={styles.emojiContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC',
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ECECEC',
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: '#F5F5F5',
  },
  historyContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC',
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#666',
  },
  categoriesContainer: {
    maxHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC',
  },
  categoryTab: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCategoryTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  categoryTabText: {
    color: '#333',
    fontSize: 14,
  },
  emojiContainer: {
    flex: 1,
  },
  emojiButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 24,
  },
});

export default EmojiSelector;
