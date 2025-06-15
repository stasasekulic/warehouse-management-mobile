import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Button, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  createdAt: string;
}

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://192.168.0.16:8080/api/users') // promeni u localhost ako nisi na emulatoru
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Greška pri povezivanju sa serverom');
        setLoading(false);
      });
  }, []);

  const handleConfirm = () => {
    const user = users.find((u) => u.id === selectedUserId);
    if (user) {
      setSelectedUser(user);
    } else {
      Alert.alert("Greška", "Niste izabrali korisnika.");
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text>{error}</Text>
      </View>
    );
  }

  if (selectedUser) {
    return (
      <View style={styles.centered}>
        <Text style={styles.hello}>ZDRAVO, {selectedUser.username}!</Text>
      </View>
    );
  }

  return (
    <View style={styles.centered}>
      <Text style={styles.title}>Izaberi korisnika</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedUserId}
          onValueChange={(itemValue) => setSelectedUserId(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="-- Odaberi --" value={null} />
          {users.map((user) => (
            <Picker.Item key={user.id} label={user.username} value={user.id} />
          ))}
        </Picker>
      </View>
      <Button title="Potvrdi" onPress={handleConfirm} />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    marginBottom: 20,
    fontWeight: '600',
  },
  pickerContainer: {
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  picker: {
    width: '100%',
    height: 60,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  hello: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
