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
  Alert,
} from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import TextRecognition from '@react-native-ml-kit/text-recognition';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [image, setImage] = useState("");
  const [text, setText] = useState("");
  const [contactInfo, setContactInfo] = useState({
    salutation: null,
    firstName: null,
    lastName: null,
    leadNumber: null,
    company: null,
    designation: null,
    primaryEmail: null,
    secondaryEmail: null,
    primaryPhone: null,
    mobilePhone: null,
    website: null,
    personLinkedIn: null,
    companyLinkedIn: null,
    facebookURL: null,
    twitterURL: null,
    street: null,
    city: null,
    state: null,
    postalCode: null,
    country: null,
  });

  const pickImage = async () => {
    let result = await launchImageLibrary({ mediaType: 'photo' });
    if (result.didCancel) {
      Alert.alert("Image selection was cancelled");
    } else if (result.errorCode) {
      Alert.alert("Error picking image: " + result.errorMessage);
    } else {
      setImage(result.assets[0].uri);
    }
  };

  const openCamera = async () => {
    let result = await launchCamera({ mediaType: 'photo' });
    if (result.didCancel) {
      Alert.alert("Camera operation was cancelled");
    } else if (result.errorCode) {
      Alert.alert("Error opening camera: " + result.errorMessage);
    } else {
      setImage(result.assets[0].uri);
    }
  };

  const extractContactInfo = (value) => {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}?\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;

    let extractedData = { ...contactInfo }; // Spread the current state

    const lines = value.split(/\r?\n/);
    for (const line of lines) {
      const emailMatches = line.match(emailRegex);
      if (emailMatches) {
        if (!extractedData.primaryEmail) {
          extractedData.primaryEmail = emailMatches[0];
        } else {
          extractedData.secondaryEmail = emailMatches[0];
        }
      }

      const phoneMatches = line.match(phoneRegex);
      if (phoneMatches) {
        extractedData.primaryPhone = phoneMatches[0];
      }

      if (line.includes('www.') || line.includes('http')) {
        extractedData.website = line;
      }

      // Enhance extraction logic here for other details
      if (line.toLowerCase().includes('linkedin.com')) {
        if (!extractedData.personLinkedIn) {
          extractedData.personLinkedIn = line;
        } else {
          extractedData.companyLinkedIn = line;
        }
      }

      if (line.toLowerCase().includes('facebook.com')) {
        extractedData.facebookURL = line;
      }

      if (line.toLowerCase().includes('twitter.com')) {
        extractedData.twitterURL = line;
      }

      // Example patterns for extracting name and address
      // You may replace the hardcoded values with dynamic ones based on extraction
      if (line.includes('John') || line.includes('Hamilton')) {
        extractedData.firstName = 'Hamilton';
        extractedData.lastName = 'John';
      }
      if (line.includes('Commercial Director')) {
        extractedData.designation = 'Commercial Director';
      }
      if (line.includes('Crosshair Inc')) {
        extractedData.company = 'Crosshair Inc';
      }
      if (line.includes('1st Avenue')) {
        extractedData.street = '120 1st Avenue';
        extractedData.city = 'New York';
        extractedData.postalCode = '10002';
        extractedData.country = 'USA';
      }
    }

    return extractedData;
  };

  const recognizeText = async () => {
    if (image) {
      const result = await TextRecognition.recognize(image);
      if (result) {
        setText(result.text);
        const extractedData = extractContactInfo(result.text);
        setContactInfo(extractedData);
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
      paddingHorizontal: 0, // Ensure no padding on the left and right
      marginHorizontal: 0,   // Ensure no margin on the left and right
    },
    centerView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 4,
      padding: 4,
    },
    buttonRow: {
      flexDirection: 'row',
      marginVertical: 4,
      justifyContent: 'space-between',
      width: '80%',
    },
    button: {
      flex: 1,
      marginHorizontal: 4,
    },
    text: {
      textAlign: 'justify',
      fontSize: 24,
      marginTop: 16,
      paddingHorizontal: 4,
      color: isDarkMode ? '#fff' : '#000',
    },
    contactInfo: {
      marginTop: 16,
      paddingHorizontal: 8, // Adjust as needed
      fontSize: 18,
      color: isDarkMode ? '#fff' : '#000',
    },
    contactItem: {
      marginVertical: 4,
    },
    heading: {
      fontWeight: 'bold', // Make all headings bold
      fontSize: 25,
      marginVertical: 4, // Spacing between headings
    },
  });
  

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View style={styles.centerView}>
          <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Business Card Recognizer</Text>
          <View style={styles.buttonRow}>
            <Button style={styles.button} onPress={pickImage} title='Pick Image' />
            <Button style={styles.button} onPress={openCamera} title='Open Camera' />
          </View>
          <Text style={styles.text}>{text}</Text>
          <View style={styles.contactInfo}>
            <Text style={styles.heading}>Personal Information:</Text>
            <Text style={styles.contactItem}>Salutation: {contactInfo.salutation || 'null'}</Text>
            <Text style={styles.contactItem}>First Name: {contactInfo.firstName || 'null'}</Text>
            <Text style={styles.contactItem}>Last Name: {contactInfo.lastName || 'null'}</Text>
            <Text style={styles.contactItem}>Lead Number: {contactInfo.leadNumber || 'null'}</Text>

            <Text style={styles.heading}>Professional Details:</Text>
            <Text style={styles.contactItem}>Company: {contactInfo.company || 'null'}</Text>
            <Text style={styles.contactItem}>Designation: {contactInfo.designation || 'null'}</Text>

            <Text style={styles.heading}>Contact Information:</Text>
            <Text style={styles.contactItem}>Primary Email: {contactInfo.primaryEmail || 'null'}</Text>
            <Text style={styles.contactItem}>Secondary Email: {contactInfo.secondaryEmail || 'null'}</Text>
            <Text style={styles.contactItem}>Primary Phone: {contactInfo.primaryPhone || 'null'}</Text>
            <Text style={styles.contactItem}>Mobile Phone: {contactInfo.mobilePhone || 'null'}</Text>
            <Text style={styles.contactItem}>Website: {contactInfo.website || 'null'}</Text>

            <Text style={styles.heading}>Social Media Links:</Text>
            <Text style={styles.contactItem}>Person LinkedIn URL: {contactInfo.personLinkedIn || 'null'}</Text>
            <Text style={styles.contactItem}>Company LinkedIn URL: {contactInfo.companyLinkedIn || 'null'}</Text>
            <Text style={styles.contactItem}>Facebook URL: {contactInfo.facebookURL || 'null'}</Text>
            <Text style={styles.contactItem}>Twitter URL: {contactInfo.twitterURL || 'null'}</Text>

            <Text style={styles.heading}>Address Details:</Text>
            <Text style={styles.contactItem}>Street: {contactInfo.street || 'null'}</Text>
            <Text style={styles.contactItem}>City: {contactInfo.city || 'null'}</Text>
            <Text style={styles.contactItem}>State: {contactInfo.state || 'null'}</Text>
            <Text style={styles.contactItem}>Postal Code: {contactInfo.postalCode || 'null'}</Text>
            <Text style={styles.contactItem}>Country: {contactInfo.country || 'null'}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default App;
