import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { UserContext } from '../../../context/UserContext';

const HeaderMemberGroupScreen = ({infoMemberGroup}) => {
  const { user } = React.useContext(UserContext);
  const navigation = useNavigation();

  // Lọc leader trong group
  const leader = infoMemberGroup.find(member => member.role === 'LEADER');

  // Kiểm tra nếu user là leader thì hiển thị "Quản lý thành viên", ngược lại hiển thị "Thành viên"
  const headerText = leader && user.id === leader.userId ? "Quản lý thành viên" : "Thành viên";

  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerContent}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back-outline" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerText}>{headerText}</Text>
      </View>
      <TouchableOpacity onPress={() => navigation.navigate('AddMemberGroupScreen', { infoMemberGroup })}>
        <Ionicons name="person-add-outline" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    padding: 15,
    backgroundColor: '#0b9cf9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 10,
  },
});

export default HeaderMemberGroupScreen;