import React, { useState, createContext, useCallback } from 'react';
import { BleManager } from 'react-native-ble-plx';
import { Buffer } from 'buffer';
import { View, Text, TouchableOpacity, StyleSheet, Image, TouchableNativeFeedback } from 'react-native';

export const  DeviceContext = createContext();
let bleManager = new BleManager();

export const DeviceProvider = ({}) =>{

    
    const [connectedDevice,setConnectedDevice] = useState(false);
    const [disconnectMessage,setDisconnectMessage] = useState('');
    const [isButtonDisabled, setIsButtonDisabled] = useState(false);
    const [disconnectButtonVisible, setDisconnectButtonVisible] = useState(false);
    const myId = "12:6C:14:38:F5:40"; // Replace with your device ID

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
        try {
          const device = await bleManager.connectToDevice(myId);
          await device.discoverAllServicesAndCharacteristics();
          console.log("Device connected:", device);
          setConnectedDevice(device);
          setDisconnectMessage('');
          setDisconnectButtonVisible(true);
    
          const data = '<1:4:1>';
          await sendDataToDevice(device, '0000ffe0-0000-1000-8000-00805f9b34fb', '0000ffe1-0000-1000-8000-00805f9b34fb', data);
          console.log('Door open command sent');
          const disconnectDevice2= async () => {
            if (device) {
              try {
               // Geçici olarak erişilebilirlik kontrolü
               if (bleManager.state !== 'destroyed') {
                await bleManager.cancelDeviceConnection("12:6C:14:38:F5:40");
                console.log('Disconnected from device');
                setConnectedDevice(null);
              } else {
                console.error('BleManager is destroyed and cannot disconnect');
              }
            } catch (count) {
              console.log('bağlantı koptu',count);
              }
            }
          };
    
          const autoDisconnectTimeout = setTimeout(async () => {
            await disconnectDevice2();
          }, 10000);
    
          device.autoDisconnectTimeout = autoDisconnectTimeout;
        } catch (error) {
          console.log('Failed to open door:', error);
          if (error.message.includes('BleManager was destroyed')) {
            console.log("BLE Manager destroyed, resetting...");
            resetBleManager();
          }
        }
        setTimeout(() => {
          setIsButtonDisabled(false);
        }, 3000);
      }, [myId]);
    
      const CardControl = useCallback(async (data) => {
        setIsButtonDisabled(true);
        try {
          const device = await bleManager.connectToDevice(myId);
          await device.discoverAllServicesAndCharacteristics();
          console.log("Device connected:", device);
          setConnectedDevice(device);
          setDisconnectMessage('');
          setDisconnectButtonVisible(true);
      
          await sendDataToDevice(device, '0000ffe0-0000-1000-8000-00805f9b34fb', '0000ffe1-0000-1000-8000-00805f9b34fb', data);
          console.log('Command sent');
      
          // Veriyi okuyacağımız karakteristik UUID'yi belirleyin
          const serviceUUID = '0000ffe0-0000-1000-8000-00805f9b34fb';
          const characteristicUUID = '0000ffe1-0000-1000-8000-00805f9b34fb';
      
          // Cihazdan veri okuma
          const readData = await device.readCharacteristicForService(serviceUUID, characteristicUUID);
          const decodedData = Buffer.from(readData.value, 'base64').toString('utf-8');
          console.log('Received data:', decodedData);
      
          const disconnectDevice2 = async () => {
            if (device) {
              try {
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
          }, 2500);
      
          device.autoDisconnectTimeout = autoDisconnectTimeout;
        } catch (error) {
          console.log('Failed to open door:', error);
          if (error.message.includes('BleManager was destroyed')) {
            console.log("BLE Manager destroyed, resetting...");
            resetBleManager();
          }
        }
        setTimeout(() => {
          setIsButtonDisabled(false);
        }, 3000);
      }, [myId]);
      
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
      
    
      return (<View style={styles.container}>
        <View style={styles.headerContainer}>
        </View>
        <TouchableNativeFeedback
          onPress={handleDoorOpen}
          background={TouchableNativeFeedback.Ripple('#FFBF78', true,-20)}
          disabled={isButtonDisabled}
        >
          <View style={[styles.button, isButtonDisabled && styles.disabledButton]}>
            <Text style={styles.buttonText}>KAPI AÇ</Text>
          </View>
        </TouchableNativeFeedback>
      </View>
    );
  };
  
  const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 25,
        backgroundColor: '#F8F4E1',
        justifyContent: 'flex-start',
        alignItems: 'center',
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
       