import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ImageCropPicker from 'react-native-image-crop-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { UserContext } from '../context/UserContext';
import { IPV4, AVATAR_URL_DEFAULT } from '@env';
import { formatDOB } from '../utils/dateDobUtils';

const EditPersonalInfoScreen = ({ navigation }) => {
  const { user, setUser } = useContext(UserContext);
  const initialDob = user.dob ? new Date(user.dob) : new Date();
  const [name, setName] = useState(user.name || '');
  const [dob, setDob] = useState(initialDob);
  // Khởi tạo giới tính với giá trị hiện tại (Nam hoặc Nữ)
  const [gender, setGender] = useState(user.gender || '');
  const [avatarUri, setAvatarUri] = useState(user.avatar || '');
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Mở thư viện ảnh và cho phép cắt ảnh
  const pickImage = async () => {
    try {
      const image = await ImageCropPicker.openPicker({
        width: 300,
        height: 300,
        cropping: true,
        compressImageQuality: 0.7,
      });
      if (image) {
        setAvatarUri(image.path);
      }
    } catch (error) {
      if (error.code !== 'E_PICKER_CANCELLED') {
        Alert.alert('Lỗi', 'Không thể chọn ảnh');
        console.error(error);
      }
    }
  };

  // Upload avatar lên S3 và trả về URL của ảnh
  const uploadAvatar = async () => {
    // Nếu không có avatar được chọn (avatarUri rỗng), trả về URL mặc định
    if (!avatarUri) {
      return '';
    }
    // Nếu avatarUri đã là URL (đã upload) thì trả về luôn
    if (avatarUri.startsWith('http')) {
      return avatarUri;
    }

    // Nếu avatarUri là đường dẫn từ thư viện ảnh, thực hiện upload
    const formData = new FormData();
    formData.append('file', {
      uri: avatarUri,
      name: 'avatar.jpg',
      type: 'image/jpeg',
    });
    formData.append('userId', user.id);

    try {
      const response = await fetch(`${IPV4}/s3/avatar`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const data = await response.json();
      if (data.url) {
        return data.url;
      } else {
        Alert.alert('Lỗi', data.error || 'Upload avatar thất bại');
        return null;
      }
    } catch (error) {
      console.error('mUpload avatar error:', error);
      Alert.alert('Lỗi', 'Upload avatar thất bại');
      return null;
    }
  };

  // Lưu thay đổi thông tin cá nhân
  const handleSave = async () => {
    setLoading(true);
    const avatarUrl = await uploadAvatar();
    if (avatarUrl === null) {
      setLoading(false);
      return;
    }
    const payload = {
      name,
      // Gửi ngày sinh dưới dạng ISO string để đảm bảo parse đúng
      dob: dob.toISOString(),
      gender,
      avatar: avatarUrl,
    };

    try {
      const response = await fetch(`${IPV4}/user/update/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        Alert.alert('Thành công', 'Thông tin cá nhân đã được cập nhật!');
        navigation.goBack();
      } else {
        const errorText = await response.text();
        Alert.alert('Lỗi', errorText || 'Cập nhật thông tin thất bại');
      }
    } catch (error) {
      console.error('Update user error:', error);
      Alert.alert('Lỗi', 'Cập nhật thông tin thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Chỉnh sửa thông tin cá nhân</Text>

      <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}   >
        <Image
          source={{ uri: avatarUri || AVATAR_URL_DEFAULT }}
          style={styles.avatar}
        />
        <View style={styles.editIconContainer}>
          <Ionicons name="camera-outline" size={20} color="#FFF" />
        </View>
      </TouchableOpacity>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Tên Zolo</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Nhập tên"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Ngày sinh</Text>
        <TouchableOpacity
          style={[styles.input, { justifyContent: 'center' }]}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateText}>{formatDOB(dob)}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={dob}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                setDob(selectedDate);
              }
            }}
          />
        )}
      </View>

      {/* Chỉnh sửa phần chọn giới tính chỉ với 2 lựa chọn: Nam và Nữ */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Giới tính</Text>
        <View style={styles.genderContainer}>
          <TouchableOpacity
            style={[
              styles.genderOption,
              gender === 'Nam' && styles.genderOptionSelected,
            ]}
            onPress={() => setGender('Nam')}
          >
            <Text
              style={[
                styles.genderText,
                gender === 'Nam' && styles.genderTextSelected,
              ]}
            >
              Nam
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.genderOption,
              gender === 'Nữ' && styles.genderOptionSelected,
            ]}
            onPress={() => setGender('Nữ')}
          >
            <Text
              style={[
                styles.genderText,
                gender === 'Nữ' && styles.genderTextSelected,
              ]}
            >
              Nữ
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

export default EditPersonalInfoScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F0F8FF',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    color: '#333',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0084FF',
    borderRadius: 15,
    padding: 5,
  },
  inputGroup: {
    width: '100%',
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  genderOption: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#FFF',
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  genderOptionSelected: {
    borderColor: '#0084FF',
    backgroundColor: '#0084FF',
  },
  genderText: {
    fontSize: 16,
    color: '#333',
  },
  genderTextSelected: {
    color: '#FFF',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#0084FF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
