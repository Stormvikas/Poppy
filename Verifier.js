import { Alert } from 'react-native';

export default function Verifier({ setServerSeed, setClientSeed, setNonce }) {
  Alert.prompt(
    'Load JSON',
    'Paste your JSON: {"serverSeed":"...","clientSeed":"...","nonce":123}',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'OK',
        onPress: jsonInput => {
          try {
            const data = JSON.parse(jsonInput);
            if (data.serverSeed) setServerSeed(data.serverSeed);
            if (data.clientSeed) setClientSeed(data.clientSeed);
            if (data.nonce !== undefined) setNonce(data.nonce.toString());
          } catch (e) {
            Alert.alert('Invalid JSON', 'Check your input.');
          }
        },
      },
    ],
    'plain-text'
  );
}
