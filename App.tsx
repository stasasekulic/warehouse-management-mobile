import React, { useEffect, useState } from 'react';
import { TextInput } from 'react-native';

import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Button,
  Alert,
  Pressable
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { CameraView, Camera } from 'expo-camera';

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  createdAt: string;
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  _endpoint?: string;
}

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [screen, setScreen] = useState<'userSelect' | 'scanButton'>('userSelect');
  const [showScanner, setShowScanner] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [newQuantity, setNewQuantity] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    fetch('http://192.168.0.16:8080/api/users')
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

  const handleConfirmUser = () => {
    const user = users.find((u) => u.id === selectedUserId);
    if (user) {
      setSelectedUser(user);
      setScreen('scanButton');
    } else {
      Alert.alert('Greška', 'Niste izabrali korisnika.');
    }
  };

  const openScanner = () => {
    if (hasPermission === null) {
      Alert.alert('Greška', 'Zahtevam dozvolu za kameru...');
      return;
    }
    if (hasPermission === false) {
      Alert.alert('Greška', 'Nema dozvole za pristup kameri');
      return;
    }
    setScanned(false);
    setShowScanner(true);
  };

  const closeScanner = () => {
    setShowScanner(false);
    setScanned(false);
  };

  const handleBarCodeScanned = async ({ data }: { type: string; data: string }) => {
    setScanned(true);
    setShowScanner(false);

    try {
      const normalizedUrl = data.replace('https://', 'http://');
      const response = await fetch(normalizedUrl);
      if (!response.ok) throw new Error('Proizvod nije pronađen');

      const product: Product = await response.json();
      setScannedProduct({ ...product, _endpoint: normalizedUrl });
      setNewQuantity(product.stockQuantity);
      setShowConfirmModal(true);
    } catch (error) {
      Alert.alert('Greška', 'QR kod nije validan ili proizvod nije pronađen.');
    }
  };

  const handleUpdateProduct = async () => {
    if (scannedProduct && newQuantity !== null && newQuantity >= 0) {
      const updatedProduct = { ...scannedProduct, stockQuantity: newQuantity };

      try {
        const response = await fetch(scannedProduct._endpoint!, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'User-Id': selectedUser?.id.toString() ?? '1'
          },
          body: JSON.stringify(updatedProduct)
        });

        if (!response.ok) throw new Error('Neuspešno ažuriranje');

        Alert.alert('Uspeh', 'Količina uspešno ažurirana');
      } catch (err) {
        Alert.alert('Greška', 'Došlo je do greške prilikom ažuriranja');
      } finally {
        setConfirming(false);
        setShowConfirmModal(false);
        setScannedProduct(null);
      }
    } else {
      Alert.alert('Greška', 'Količina mora biti 0 ili veća');
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
        </View>
      </View>
    );
  }

  if (screen === 'userSelect') {
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
            {users.map((user) =>
              user ? <Picker.Item key={user.id} label={user.username} value={user.id} /> : null
            )}
          </Picker>
        </View>
        <Button title="Potvrdi" onPress={handleConfirmUser} />
      </View>
    );
  }

  if (screen === 'scanButton' && selectedUser) {
    return (
      <View style={styles.centered}>
        <Text style={styles.hello}>Zdravo, {selectedUser.username}!</Text>

        {!showConfirmModal ? (
          <Button title="SCAN" onPress={openScanner} />
        ) : null}

        {showConfirmModal && scannedProduct ? (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainerLarge}>
              <Text style={styles.modalTitle}>Ažuriraj proizvod</Text>
              <Text style={styles.modalText}>Ime: {scannedProduct.name}</Text>
              <Text style={styles.modalText}>Opis: {scannedProduct.description}</Text>
              <Text style={styles.modalText}>Cena: {scannedProduct.price} RSD</Text>
              <Text style={styles.modalText}>Trenutna količina: {scannedProduct.stockQuantity}</Text>

              <Text style={[styles.modalText, { marginTop: 20 }]}>Nova količina:</Text>
              <View style={styles.quantityRow}>
                <Pressable
                  style={styles.bigButton}
                  onPress={() => newQuantity !== null && setNewQuantity(Math.max(0, newQuantity - 1))}
                >
                  <Text style={styles.bigButtonText}>−</Text>
                </Pressable>
                <TextInput
                  style={styles.quantityInput}
                  keyboardType="number-pad"
                  value={newQuantity !== null && newQuantity !== undefined ? newQuantity.toString() : ''}
                  onChangeText={(text) => {
                    const parsed = parseInt(text, 10);
                    if (!isNaN(parsed) && parsed >= 0) {
                      setNewQuantity(parsed);
                    } else if (text === '') {
                      setNewQuantity(0);
                    }
                  }}
                />
                <Pressable
                  style={styles.bigButton}
                  onPress={() => newQuantity !== null && setNewQuantity(newQuantity + 1)}
                >
                  <Text style={styles.bigButtonText}>+</Text>
                </Pressable>
              </View>

              {!confirming ? (
                <View style={{ marginTop: 30 }}>
                  <Button title="Potvrdi" onPress={() => setConfirming(true)} />
                  <View style={{ height: 10 }} />
                  <Button title="Otkaži" onPress={() => setShowConfirmModal(false)} color="gray" />
                </View>
              ) : null}

              {confirming ? (
                <View style={{ marginTop: 30, alignItems: 'center' }}>
                  <Text style={[styles.confirmText, { textAlign: 'center' }]}>DA LI STE SIGURNI?</Text>
                  <Text style={[styles.modalText, { textAlign: 'center' }]}>Nova količina: {newQuantity}</Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      marginTop: 15,
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: '60%',
                    }}
                  >
                    <Pressable
                      style={[styles.confirmButton, { backgroundColor: '#4CAF50', flex: 1, marginRight: 5 }]}
                      onPress={handleUpdateProduct}
                    >
                      <Text style={styles.confirmButtonText}>DA</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.confirmButton, { backgroundColor: '#f44336', flex: 1, marginLeft: 5 }]}
                      onPress={() => setConfirming(false)}
                    >
                      <Text style={styles.confirmButtonText}>NE</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}
      </View>
    );
  }

  return null;
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
  },
  hello: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
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
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainerLarge: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 16,
    width: '90%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 5,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  bigButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 30,
    paddingVertical: 20,
    borderRadius: 12,
  },
  bigButtonText: {
    color: 'white',
    fontSize: 40,
    fontWeight: 'bold',
  },
  newQuantityText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginHorizontal: 30,
  },
  confirmText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#444',
  },
  confirmButton: {
    paddingHorizontal: 10,
    paddingVertical: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
    height: 70,
  },
  confirmButtonText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
  quantityInput: {
    fontSize: 32,
    fontWeight: 'bold',
    marginHorizontal: 20,
    borderBottomWidth: 2,
    borderColor: '#2196F3',
    textAlign: 'center',
    minWidth: 70,
    paddingVertical: 5,
  },
});
