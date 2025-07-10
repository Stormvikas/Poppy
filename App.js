import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, FlatList, Alert, Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';

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
      Alert.alert('Error', 'Please fill all fields.');
      return;
    }

    saveInputs();

    const tiles = Array.from({ length: 25 }, (_, i) => i);
    const mineTiles = [];
    let round = 0;

    while (mineTiles.length < mineCount) {
      const input = `${clientSeed}:${nonce}:${round}`;
      const hmac = CryptoJS.HmacSHA256(input, serverSeed).toString();

      for (let i = 0; i < hmac.length && mineTiles.length < mineCount; i += 8) {
        const segment = hmac.substring(i, i + 8);
        if (segment.length < 8) break;

        const int = parseInt(segment, 16);
        const float = int / 0xffffffff;

        const availableTiles = tiles.filter(t => !mineTiles.includes(t));
        const selected = Math.floor(float * availableTiles.length);

        if (availableTiles.length > 0) {
          mineTiles.push(availableTiles[selected]);
        }
      }

      round++;
      if (round > 1000) break; // avoid infinite loop
    }

    let newGrid = Array(25).fill(false);
    mineTiles.forEach(i => newGrid[i] = true);
    setGrid(newGrid);
  };

  const exportToJson = async () => {
    const data = {
      serverSeed,
      clientSeed,
      nonce,
      mineCount,
      mines: grid.map((val, i) => val ? i : null).filter(v => v !== null),
    };

    const json = JSON.stringify(data, null, 2);
    await Share.share({ title: 'Mines Result', message: json });
  };

  const prevRound = () => {
    const prev = parseInt(nonce) - 1;
    if (prev >= 0) {
      setNonce(prev.toString());
      setTimeout(generateMines, 100);
    }
  };

  const nextRound = () => {
    const next = parseInt(nonce) + 1;
    setNonce(next.toString());
    setTimeout(generateMines, 100);
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
        <TouchableOpacity style={styles.button} onPress={exportToJson}><Text style={styles.buttonText}>Export JSON</Text></TouchableOpacity>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={prevRound}><Text style={styles.buttonText}>← Prev</Text></TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={nextRound}><Text style={styles.buttonText}>Next →</Text></TouchableOpacity>
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

      <Text style={styles.debug}>
        Mines: {grid.map((x, i) => x ? i : null).filter(Boolean).join(', ')}
      </Text>
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
  debug: { color: '#aaa', marginTop: 10, fontSize: 12 }
});
