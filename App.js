import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';
import Verifier from './Verifier';

export default function App() {
  const [serverSeed, setServerSeed] = useState('');
  const [clientSeed, setClientSeed] = useState('');
  const [nonce, setNonce] = useState('');
  const [mineCount, setMineCount] = useState(3);
  const [grid, setGrid] = useState(Array(25).fill(false));

  useEffect(() => {
    loadSavedInputs();
  }, []);

  const loadSavedInputs = async () => {
    const s = await AsyncStorage.getItem('serverSeed');
    const c = await AsyncStorage.getItem('clientSeed');
    const n = await AsyncStorage.getItem('nonce');
    const m = await AsyncStorage.getItem('mineCount');
    if (s) setServerSeed(s);
    if (c) setClientSeed(c);
    if (n) setNonce(n);
    if (m) setMineCount(parseInt(m));
  };

  const saveInputs = async () => {
    await AsyncStorage.setItem('serverSeed', serverSeed);
    await AsyncStorage.setItem('clientSeed', clientSeed);
    await AsyncStorage.setItem('nonce', nonce);
    await AsyncStorage.setItem('mineCount', mineCount.toString());
  };

  const generateMines = () => {
    if (!serverSeed || !clientSeed || !nonce) {
      Alert.alert('Error', 'Fill all fields!');
      return;
    }
    saveInputs();
    const hash = CryptoJS.HmacSHA256(`${clientSeed}:${nonce}`, serverSeed).toString();
    let numbers = [];
    for (let i = 0; numbers.length < mineCount && i < hash.length - 5; i += 5) {
      let num = parseInt(hash.substr(i, 5), 16) % 25;
      if (!numbers.includes(num)) numbers.push(num);
    }
    let newGrid = Array(25).fill(false);
    numbers.forEach(i => newGrid[i] = true);
    setGrid(newGrid);
  };

  const loadJSON = () => {
    Verifier({ setServerSeed, setClientSeed, setNonce });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💥 Poppy Mines Verifier</Text>
      <TextInput style={styles.input} placeholder="Server Seed" value={serverSeed} onChangeText={setServerSeed} />
      <TextInput style={styles.input} placeholder="Client Seed" value={clientSeed} onChangeText={setClientSeed} />
      <TextInput style={styles.input} placeholder="Nonce" value={nonce} onChangeText={setNonce} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Mine Count" value={mineCount.toString()} onChangeText={t => setMineCount(parseInt(t) || 0)} keyboardType="numeric" />
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={generateMines}><Text style={styles.buttonText}>Verify</Text></TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={loadJSON}><Text style={styles.buttonText}>Load JSON</Text></TouchableOpacity>
      </View>
      <FlatList
        data={grid}
        numColumns={5}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <View style={[styles.cell, { backgroundColor: item ? '#ff4d4d' : '#4dff88' }]}>
            <Text style={styles.cellText}>{item ? '💣' : ''}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', padding: 20, paddingTop: 50 },
  title: { fontSize: 24, color: '#fff', marginBottom: 20 },
  input: { backgroundColor: '#333', color: '#fff', marginBottom: 10, padding: 10, borderRadius: 8 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between' },
  button: { backgroundColor: '#555', padding: 10, borderRadius: 8, marginTop: 10, flex: 1, marginHorizontal: 5 },
  buttonText: { color: '#fff', textAlign: 'center' },
  cell: { width: 50, height: 50, justifyContent: 'center', alignItems: 'center', margin: 2, borderRadius: 6 },
  cellText: { color: '#fff', fontSize: 18 },
});
