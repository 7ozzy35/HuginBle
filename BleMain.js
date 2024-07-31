import React, { useState, createContext, useCallback,useEffect } from 'react';
import { BleManager } from 'react-native-ble-plx';
import { Buffer } from 'buffer';
import { View, Text, StyleSheet, TouchableNativeFeedback ,Linking, BackHandler} from 'react-native';
import { PermissionsAndroid, Platform } from 'react-native';
import Intent from 'react-native-intent';
import { myId } from './Component/DevicesId';


export const DeviceContext = createContext();
let bleManager = new BleManager();

export const DeviceProvider = ({ }) => {

// İzinleri kontrol etmek ve istemek için bir fonksiyon
const requestBluetoothPermissions = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      ]);

      if (
        granted['android.permission.BLUETOOTH_CONNECT'] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.BLUETOOTH_SCAN'] ===
          PermissionsAndroid.RESULTS.GRANTED
      ) {
        console.log('Bluetooth permissions granted');
      } else {
        console.log('Bluetooth permissions denied');
      }
    } catch (err) {
      console.warn(err);
    }
  }
};

// İzinleri uygulama başlatıldığında veya cihaz bağlantısı yapmadan önce çağırın

useEffect(() => {
  const firstFunc = async()=>{
    
    await requestBluetoothPermissions();
    await handleDoorOpen();
    
  }
  firstFunc();
  
  
}, [])

  const [message,setMessage] =  useState(null)
  const [connectedDevice, setConnectedDevice] = useState(false);
  const [disconnectMessage, setDisconnectMessage] = useState('');
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [disconnectButtonVisible, setDisconnectButtonVisible] = useState(false);
//   const myId = "12:6C:14:38:F5:40";
   // Replace with your device ID

  const resetBleManager = () => {
    bleManager.destroy();
    setTimeout(() => {
      bleManager = new BleManager();
      console.log('BleManager reset');
    }, 1000);
  };

  const disconnectDevice = async (manual = true) => {
    if (connectedDevice) {
      try {
        if (bleManager.state !== 'destroyed') {
          await bleManager.cancelDeviceConnection(connectedDevice.id);
          console.log('Disconnected from device');
          setConnectedDevice(null);
          if (manual) {
            setDisconnectMessage('Kapı bağlantısı manuel olarak kesildi');
          }
          setDisconnectButtonVisible(false);
        } else {
          console.error('BleManager is destroyed and cannot disconnect');
        }
      } catch (error) {
        console.error('Failed to disconnect:', error);
      }
    }
  };

  const handleDoorOpen = useCallback(async () => {
    setIsButtonDisabled(true);
    console.log("handleopen door")
    try {
      console.log("nerdesin1")
      
      const device = await bleManager.connectToDevice(myId);
      console.log("nerdesin2")
      await device.discoverAllServicesAndCharacteristics();
      console.log("Device connected:", device);
      setConnectedDevice(device);
      setDisconnectMessage('');
      setDisconnectButtonVisible(true);

      const data = '<1:4:1>';
      await sendDataToDevice(device, '0000ffe0-0000-1000-8000-00805f9b34fb', '0000ffe1-0000-1000-8000-00805f9b34fb', data);
      console.log('Door open command sent');
      setMessage(true);
      const disconnectDevice2 = async () => {
        if (device) {
          try {
            // Geçici olarak erişilebilirlik kontrolü
            if (bleManager.state !== 'destroyed') {
              await bleManager.cancelDeviceConnection(myId);
              console.log('Disconnected from device');
              
              
              setConnectedDevice(null);
            } else {
              console.error('BleManager is destroyed and cannot disconnect');
            }
          } catch (count) {
            console.log('bağlantı koptu', count);
          }
        }
      };

      const autoDisconnectTimeout = setTimeout(async () => {
        await disconnectDevice2();
        await exitApp();
      }, 5000);

      device.autoDisconnectTimeout = autoDisconnectTimeout;
    } catch (error) {
      console.log('Failed to open door2:', error);
      if (error.message.includes('BleManager was destroyed')) {
        console.log("BLE Manager destroyed, resetting...");
        resetBleManager();
      }
    }
    setTimeout(() => {
      setIsButtonDisabled(false);
    }, 3000);
  }, [myId]);

  const handleDeviceConnection = async () => {
    try {
      console.log('Connecting to device with ID:', myId);
      const device = await bleManager.connectToDevice(myId);
      console.log('Connected to device:', device);
      // Devam eden işlemler...
    } catch (error) {
      console.error('Connection failed:', error);
      // Hata ile ilgili daha fazla bilgi
      if (error.reason) {
        console.error('Error reason:', error.reason);
      }
      // Gerekirse BLE Manager'ı sıfırlayın
      if (error.message.includes('BleManager was destroyed')) {
        console.log("BLE Manager destroyed, resetting...");
        resetBleManager();
      }
    }
  };
  
  const sendDataToDevice = async (device, serviceUUID, characteristicUUID, data) => {
    try {
      const characteristic = await device.writeCharacteristicWithResponseForService(
        serviceUUID,
        characteristicUUID,
        Buffer.from(data).toString('base64')
      );
      console.log('Data sent:', characteristic);
    } catch (error) {
      console.error('Failed to send data:', error);
    }
  };
  

  const exitApp = () => {
    if (Platform.OS === 'android') {
      BackHandler.exitApp();
    }
  };
  


  return (
    <View style={styles.container}>
      
      {message && (
        <View >
        <Text style={styles.successMessage}>İşlemleriniz başarıyla tamamlanmıştır</Text>
      <Text style={styles.instruction}>Lütfen Kapıdan Geçiniz</Text>
      </View>)}

    </View>
  );
};




const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#F8F4E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    // Header stilleri
  },
  successMessage: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
    color:"black",
    
  },
  instruction: {
    fontSize: 20,
    textAlign: 'center',
    marginVertical: 5,
    color:"black"
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 50,
    margin: 20,
  },
  button: {
    position: "absolute",
    bottom: 185,
    width: 150,
    height: 150,
    borderRadius: 80,
    backgroundColor: '#DC5F00',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
    margin: 10,
  },
  text: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  doorOpenButton: {
    backgroundColor: '#ff9800',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DeviceProvider;