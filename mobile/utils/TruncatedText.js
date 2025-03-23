import React from 'react';
import { Text,StyleSheet } from 'react-native';

const TruncatedText = ({ text, maxLength = 30 }) => {
  const shouldTruncate = text.length > maxLength;
  const displayText = shouldTruncate ? `${text.substring(0, maxLength)}...` :text;

  return <Text style={styles.message}>{displayText}</Text>;
};

export default TruncatedText;
const styles = StyleSheet.create({
    message: {
        fontSize: 14,
        color: "#888",
    },
});
