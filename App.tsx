import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Button, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { CameraView, Camera } from 'expo-camera';

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
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

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

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();
  }, []);

  const handleConfirm = () => {
    const user = users.find((u) => u.id === selectedUserId);
    if (user) {
      setSelectedUser(user);
    } else {
      Alert.alert("Greška", "Niste izabrali korisnika.");
    }
  };

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    setShowScanner(false);

    // Try to find user by QR code data (assuming QR contains user ID or username)
    const userById = users.find((u) => u.id.toString() === data);
    const userByUsername = users.find((u) => u.username === data);

    const foundUser = userById || userByUsername;

    if (foundUser) {
      setSelectedUser(foundUser);
      Alert.alert("Uspeh", `QR kod skeniran! Korisnik: ${foundUser.username}`);
    } else {
      Alert.alert("Greška", `QR kod skeniran ali korisnik nije pronađen.\nSkenirani podatak: ${data}`);
    }
  };

  const openScanner = () => {
    if (hasPermission === null) {
      Alert.alert("Greška", "Zahtevam dozvolu za kameru...");
      return;
    }
    if (hasPermission === false) {
      Alert.alert("Greška", "Nema dozvole za pristup kameri");
      return;
    }

    setScanned(false);
    setShowScanner(true);
  };

  const closeScanner = () => {
    setShowScanner(false);
    setScanned(false);
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

  if (showScanner) {
    return (
      <View style={styles.scannerContainer}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
        <View style={styles.scannerOverlay}>
          <Text style={styles.scannerText}>Skeniraj QR kod</Text>
          <Button title="Otkaži" onPress={closeScanner} />
          {scanned && (
            <Button title="Skeniraj ponovo" onPress={() => setScanned(false)} />
          )}
        </View>
      </View>
    );
  }

  if (selectedUser) {
    return (
      <View style={styles.centered}>
        <Text style={styles.hello}>ZDRAVO, {selectedUser.username}!</Text>
        <Button
          title="Nazad"
          onPress={() => setSelectedUser(null)}
          style={styles.backButton}
        />
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
      <View style={styles.buttonContainer}>
        <Button title="Potvrdi" onPress={handleConfirm} />
        <View style={styles.buttonSpacer} />
        <Button title="SCAN" onPress={openScanner} />
      </View>
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
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonSpacer: {
    width: 20,
  },
  backButton: {
    marginTop: 20,
  },
  scannerContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  scannerOverlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 20,
    borderRadius: 10,
  },
  scannerText: {
    fontSize: 18,
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
});