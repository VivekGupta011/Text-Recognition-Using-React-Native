import React, { useEffect, useState } from 'react';
import {
  Button,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import TextRecognition from '@react-native-ml-kit/text-recognition';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [image, setImage] = useState("");
  const [text, setText] = useState("");
  const [contactInfo, setContactInfo] = useState({ email: '', phone: '' });

  const pickImage = async () => {
    console.log("working");
    let result = await launchImageLibrary({ mediaType: 'photo' });
    if (result && result.assets) {
      setImage(result.assets[0].uri);
    }
  };

  const openCamera = async () => {
    let result = await launchCamera({ mediaType: 'photo' });
    if (result && result.assets) {
      setImage(result.assets[0].uri);
    }
  };

  const extractContactInfo = (value) => {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    let email = '';
    let phone = '';

    // Split the text into lines or words
    const lines = value.split(/\r?\n/);
    for (const line of lines) {
      if (emailRegex.test(line)) {
        email = line.match(emailRegex)[0];
      }
      if (line.includes('+91') || line.includes('91')) {
        phone = line;
      }
    }

    return { email, phone };
  };

  const recognizeText = async () => {
    if (image) {
      const result = await TextRecognition.recognize(image);
      if (result) {
        setText(result.text);
        const { email, phone } = extractContactInfo(result.text);
        setContactInfo({ email, phone });
      }
    }
  };

  useEffect(() => {
    recognizeText();
  }, [image]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#333' : '#fff',
    },
    centerView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 64,
      padding: 16,
    },
    buttonRow: {
      flexDirection: 'row',
      marginVertical: 16,
      justifyContent: 'space-between',
      width: '80%',
    },
    button: {
      flex: 1,
      marginHorizontal: 8,
    },
    text: {
      textAlign: 'justify',
      fontSize: 24,
      marginTop: 16,
      paddingHorizontal: 16,
      color: isDarkMode ? '#fff' : '#000',
    },
    contactInfo: {
      marginTop: 16,
      paddingHorizontal: 16,
      fontSize: 18,
      color: isDarkMode ? '#fff' : '#000',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View style={styles.centerView}>
          <Text>Business Card Recognizer</Text>
          <View style={styles.buttonRow}>
            <Button style={styles.button} onPress={pickImage} title='Pick Image' />
            <Button style={styles.button} onPress={openCamera} title='Open Camera' />
          </View>
          <Text style={styles.text}>{text}</Text>
          {contactInfo.email || contactInfo.phone ? (
            <View style={styles.contactInfo}>
              <Text>Email: {contactInfo.email}</Text>
              <Text>Phone: {contactInfo.phone}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default App;
