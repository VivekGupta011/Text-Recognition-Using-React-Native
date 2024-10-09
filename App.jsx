import React, {useEffect, useState} from 'react';
import {Picker} from '@react-native-picker/picker';
import {splitter} from 'human-name-splitter';
import CryptoJS from 'crypto-js';
import {
  Button,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import {parsePhoneNumberFromString} from 'libphonenumber-js';
import emailValidator from 'email-validator';
import addressit from 'addressit';
import axios from 'axios';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [image, setImage] = useState('');
  const [text, setText] = useState('');
  const [sessionName, setSessionName] = useState('1c76664067062f3a4205c');
  const [contactInfo, setContactInfo] = useState({
    salutation: null,
    firstName: '',
    lastName: '',
    leadNumber: null,
    company: null,
    designation: '',
    primaryEmail: '',
    secondaryEmail: '',
    primaryPhone: '',
    mobilePhone: '',
    website: '',
    personLinkedIn: null,
    companyLinkedIn: null,
    facebookURL: null,
    twitterURL: null,
    street: null,
    city: null,
    state: null,
    postalCode: null,
    country: null,
    phoneNumbers: [],
    emails: [],
  });

  // // Function to get challenge
  // async function getChallenge(username) {
  //   const challengeUrl = `https://b2bcrm.mydevsystems.co.uk/webservice.php?operation=getchallenge&username=admin`;
  //   const response = await axios.get(challengeUrl);
  //   return response.data.result.token;
  // }

  // // Function to extend session
  // async function extendSession(sessionName) {
  //   const extendSessionUrl = `https://b2bcrm.mydevsystems.co.uk/webservice.php?operation=extendsession&sessionName=${sessionName}`;
  //   await axios.get(extendSessionUrl);
  //   console.log('Session extended successfully');
  // }

  // // Function to login and get sessionName
  // async function login(username, accessKey) {
  //   const token = await getChallenge(username);
  //   console.log('token::', token);
  //   // Generate the correct MD5 hash using CryptoJS
  // // const md5Hash = CryptoJS.MD5(token + accessKey).toString();
  // const md5Hash = CryptoJS.MD5(token + VTuOUDEyXX6AfJH3).toString();

  //   const loginUrl = `https://b2bcrm.mydevsystems.co.uk/webservice.php`;

  //   // Create payload using URLSearchParams
  //   const payload = new URLSearchParams({
  //     operation: 'login',
  //     username: 'admin',
  //     accessKey: md5Hash,
  //     // accessKey: 'dc29452a226666707c27e5113bc6c25d',
  //   }).toString();

  //   try {
  //     const response = await axios.post(loginUrl, payload, {
  //       headers: {
  //         'Content-Type': 'application/x-www-form-urlencoded',
  //       },
  //     });

  //     console.log('response login:', response.data);

  //     // Return sessionName from the response
  //     return response.data.result.sessionName;
  //   } catch (error) {
  //     console.error('Login failed:', error);
  //   }
  // }

  // // useEffect to handle login and session management with auto-refresh
  // useEffect(() => {
  //   const username = 'admin';
  //   const accessKey = 'VTuOUDEyXX6AfJH3';

  //   // Function to initialize the session and set up auto extension
  //   const initializeSession = async () => {
  //     const session = await login(username, accessKey);
  //     console.log('session::::');
  //     console.log(session);
  //     setSessionName(session); // Store sessionName in state

  //     // Extend the session right after login
  //     extendSession(session);

  //     // Refresh the session after 10 minutes (600,000 ms)
  //     setTimeout(initializeSession, 10 * 60 * 1000); // Call itself after 10 minutes
  //   };

  //   initializeSession();
  // }, []);

  // Function to check if a phone number already exists in the database
  let session='1c76664067062f3a4205c';
  const checkPhoneExists = async phone => {
    const url = 'https://b2bcrm.mydevsystems.co.uk/webservice.php';
    const query = `
    SELECT * FROM Leads 
    WHERE mobile='${phone}';
  `;
    const queryPayload = {
      operation: 'query',
      sessionName: session,
      query,
    };

    try {
      const response = await axios.get(url, {params: queryPayload});

      if (response.data.success && response.data.result.length > 0) {
        return true; // Phone exists
      } else {
        return false;
      }
    } catch (error) {
      console.error('Error checking phone number:', error);
      throw new Error('Error checking phone number');
    }
  };

  // Function to check if an email already exists in the database
  const checkEmailExists = async email => {
    const url = 'https://b2bcrm.mydevsystems.co.uk/webservice.php';
    const query = `
    SELECT * FROM Leads 
    WHERE email='${email}';
  `;
    const queryPayload = {
      operation: 'query',
      sessionName: session,
      query,
    };

    try {
      const response = await axios.get(url, {params: queryPayload});

      if (response.data.success && response.data.result.length > 0) {
        return true; // Email exists
      } else {
        return false;
      }
    } catch (error) {
      console.error('Error checking email:', error);
      throw new Error('Error checking email');
    }
  };

  // API call to send extracted contact data
  const sendToCRM = async data => {
    if (!sessionName) {
      console.log('Session not available');
      return;
    }

    const email = data.primaryEmail;
    const phone = data.primaryPhone;

    // Step 1: Check if lead with email or phone already exists
    const phoneExists = await checkPhoneExists(phone);
    const emailExists = await checkEmailExists(email);

    if (phoneExists && emailExists) {
      Alert.alert('Both phone number and email already exist.');
      return;
    } else if (phoneExists) {
      Alert.alert('Phone number already exists.');
      return;
    } else if (emailExists) {
      Alert.alert('Email already exists.');
      return;
    }

    // Step 2: If lead does not exist, proceed with creation
    const url = 'https://b2bcrm.mydevsystems.co.uk/webservice.php';
    const payload = {
      operation: 'create',
      sessionName: session,
      elementType: 'Leads',
      element: JSON.stringify({
        lastname: data.lastName || 'N/A',
        firstname: data.firstName || 'N/A',
        salutationtype: data.salutation || 'N/A',
        company: data.company || 'N/A',
        email: data.primaryEmail || 'N/A',
        assigned_user_id: '19x1',
        leadsource: 'Other',
        memberof: 'Other',
        website: data.website || 'N/A',
        country: data.country || 'N/A',
        state: data.state || 'N/A',
        code: data.postalCode || 'N/A',
        city: data.city || 'N/A',
        mobile: data.primaryPhone || 'N/A',
      }),
    };

    try {
      const response = await axios.post(
        url,
        new URLSearchParams(payload).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      if (response.data.success) {
        Alert.alert('Lead added successfully!');
        setContactInfo({
          salutation: null,
          firstName: '',
          lastName: '',
          leadNumber: null,
          company: null,
          designation: '',
          primaryEmail: '',
          secondaryEmail: '',
          primaryPhone: '',
          mobilePhone: '',
          website: '',
          personLinkedIn: null,
          companyLinkedIn: null,
          facebookURL: null,
          twitterURL: null,
          street: null,
          city: null,
          state: null,
          postalCode: null,
          country: null,
          phoneNumbers: [],
          emails: [],
        });
      } else {
        Alert.alert('Failed to add lead.');
      }
    } catch (error) {
      console.error('Error sending data:', error);
      Alert.alert('Error sending data to CRM');
    }
  };

  const pickImage = async () => {
    let result = await launchImageLibrary({mediaType: 'photo'});
    if (result.didCancel) {
      Alert.alert('Image selection was cancelled');
    } else if (result.errorCode) {
      Alert.alert('Error picking image: ' + result.errorMessage);
    } else {
      setImage(result.assets[0].uri);
    }
  };

  const openCamera = async () => {
    let result = await launchCamera({mediaType: 'photo'});
    if (result.didCancel) {
      Alert.alert('Camera operation was cancelled');
    } else if (result.errorCode) {
      Alert.alert('Error opening camera: ' + result.errorMessage);
    } else {
      setImage(result.assets[0].uri);
    }
  };

  // Extract Name and Designation
  function extractNameAndDesignation(text) {
    const nameRegex = /([A-Z][a-z]+) ([A-Z][a-z]+)/;
    const nameMatch = text.match(nameRegex);
    const name = nameMatch
      ? {firstName: nameMatch[1], lastName: nameMatch[2]}
      : {firstName: '', lastName: ''};

    const designationRegex =
      /(CEO|Manager|General Manager|Director|Executive|Engineer)/i;
    const designationMatch = text.match(designationRegex);
    const designation = designationMatch ? designationMatch[0] : '';

    return {name, designation};
  }

  // Extract Phone Numbers
  function extractPhoneNumbers(text) {
    // const result = splitter('Mr. Mario De Vacelo Parirato IV');
    const result = splitter(text);
    console.log('result vivek:::');
    console.log(result);
    const phoneNumbers = [];
    const phoneMatches = text.match(/\+91\s*\d{5}\s*\d{5}/g);
    if (phoneMatches) {
      phoneMatches.forEach(match => {
        const phoneNumber = parsePhoneNumberFromString(match, 'IN');
        if (phoneNumber && phoneNumber.isValid()) {
          phoneNumbers.push(phoneNumber.formatInternational());
        }
      });
    }
    return phoneNumbers;
  }

  // Extract Emails
  function extractEmails(text) {
    const emailMatches = text.match(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    );
    const validEmails = emailMatches
      ? emailMatches.filter(emailValidator.validate)
      : [];
    return validEmails;
  }

  // Extract Website and Social Media
  function extractWebsiteAndSocial(text) {
    // Website regex to catch URLs with or without "http" and any potential variations
    const websiteRegex = /(https?:\/\/)?(www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]+/gi;
    const websiteMatch = text.match(websiteRegex);

    // LinkedIn regex allowing for variations in the LinkedIn URL
    const linkedinRegex =
      /(https?:\/\/)?(www\.)?linkedin\.com\/[a-zA-Z0-9-_/]*/gi;
    const linkedinMatch = text.match(linkedinRegex);

    // Facebook regex for variations of Facebook URLs
    const facebookRegex =
      /(https?:\/\/)?(www\.)?facebook\.com\/[a-zA-Z0-9-_.]*/gi;
    const facebookMatch = text.match(facebookRegex);

    const twitterRegex =
      /(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9-_.]*/gi;
    const twitterMatch = text.match(twitterRegex);

    // Store matches or null if not present
    const result = {
      website: websiteMatch ? websiteMatch[0] : null,
      linkedin: linkedinMatch ? linkedinMatch[0] : null,
      facebook: facebookMatch ? facebookMatch[0] : null,
      twitter: twitterMatch ? twitterMatch[0] : null,
    };

    // Additional logic: If no website match is found, use the first available social link as a fallback for the website
    if (!result.website) {
      if (linkedinMatch) {
        result.website = linkedinMatch[0];
      } else if (facebookMatch) {
        result.website = facebookMatch[0];
      } else if (twitterMatch) {
        result.website = twitterMatch[0];
      }
    }

    return result;
  }

  // Extract Address
  function extractAddress(text) {
    const address = addressit(text);
    return {
      street: address.parts.road || '',
      city: address.parts.city || '',
      postalCode: address.parts.postcode || '',
      country: address.parts.country || '',
      state: address.parts.state || '',
    };
  }

  const extractContactInfo = text => {
    console.log(text);
    const nameAndDesignation = extractNameAndDesignation(text);
    const phoneNumbers = extractPhoneNumbers(text);
    const emails = extractEmails(text);
    const websiteAndSocial = extractWebsiteAndSocial(text);
    console.log('extractWebsiteAndSocial:');
    console.log(websiteAndSocial);
    const address = extractAddress(text);

    return {
      ...nameAndDesignation,
      phoneNumbers,
      emails,
      primaryPhone: phoneNumbers[0] || '',
      primaryEmail: emails[0] || '',
      personLinkedIn: websiteAndSocial.linkedin || '',
      facebookURL: websiteAndSocial.facebook || '',
      twitterURL: websiteAndSocial.twitter || '',
      ...address,
    };
  };

  const recognizeText = async () => {
    if (image) {
      const result = await TextRecognition.recognize(image);
      if (result) {
        setText(result.text);
        const extractedData = extractContactInfo(result.text);
        console.log('extractedData:');
        console.log(extractedData);
        // setContactInfo(prev => ({...prev, ...extractedData}));
        setContactInfo(prev => ({
          ...prev,
          ...extractedData,
          phoneNumbers: extractedData.phoneNumbers,
          emails: extractedData.emails,
        }));

        console.log('contactInfo::');
        console.log(contactInfo);
      }
    }
  };
  // Extract Website and Social Media
  function extractWebsiteAndSocial(text) {
    const websiteRegex = /(www\.[a-zA-Z0-9.-]+\.[a-zA-Z]+)/gi;
    const websiteMatch = text.match(websiteRegex);

    const linkedinRegex = /(linkedin\.com\/[a-zA-Z0-9-_/]+)/gi;
    const linkedinMatch = text.match(linkedinRegex);

    return {
      website: websiteMatch ? websiteMatch[0] : null,
      linkedin: linkedinMatch ? linkedinMatch[0] : null,
    };
  }

  useEffect(() => {
    if (image) {
      recognizeText();
    }
  }, [image]);

  const handleSaveChanges = () => {
    // Implement logic to save changes or handle them as needed
    sendToCRM(contactInfo);
    // Alert.alert('Changes Saved!', 'Your edits have been saved successfully.');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#ffffff',
    },
    profileHeader: {
      alignItems: 'center',
      paddingVertical: 40,
      backgroundColor: '#f2f2f2',
    },
    profileTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 10,
    },
    profileImageContainer: {
      width: '100%',
      height: 100,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#e0e0e0',
    },
    name: {
      fontSize: 18,
      fontWeight: '600',
    },
    designation: {
      fontSize: 16,
      color: '#888888',
    },
    section: {
      width: '100%',
      paddingHorizontal: 10,
      marginBottom: 20,
    },
    sectionHeader: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 5,
    },
    sectionText: {
      fontSize: 16,
      // fontWeight: 'bold',
      marginBottom: 5,
    },
    input: {
      width: '100%',
      height: 40,
      borderColor: '#cccccc',
      borderWidth: 1,
      borderRadius: 5,
      paddingHorizontal: 10,
      marginBottom: 10,
    },
    button: {
      paddingLeft: 30,
      paddingRight: 35,
      marginTop: 10,
      marginBottom: 10,
      marginLeft: 20,
      marginRight: 20,
      backgroundColor: '#007BFF',
      color: '#FFFFFF',
      borderRadius: 5,
      width: '90%',
      alignSelf: 'center',
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    containerButton: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonText: {
      color: '#FFFFFF',
      textAlign: 'center',
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      paddingHorizontal: 20,
      marginTop: 10,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* <View style={styles.profileHeader}>
          <Text style={styles.profileTitle}>Profile Details</Text>
        </View> */}

        <View style={styles.profileHeader}>
          <Text style={{fontSize: 24, fontWeight: 'bold'}}>
            Business Card Recognizer
          </Text>
          <View style={styles.buttonRow}>
            <Button onPress={pickImage} title="Pick Image" />
            <Button onPress={openCamera} title="Open Camera" />
          </View>
          <Text style={styles.text}>{text}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Personal Information</Text>
          <TextInput
            style={styles.input}
            value={contactInfo.firstName}
            onChangeText={value =>
              setContactInfo(prev => ({...prev, firstName: value}))
            }
            placeholder="First Name"
          />
          <Text style={styles.sectionText}>Salutation</Text>
          <Picker
            selectedValue={contactInfo.Salutation}
            onValueChange={value =>
              setContactInfo(prev => ({...prev, Salutation: value}))
            }
            style={styles.input}>
            <Picker.Item label="None" value="None" />
            <Picker.Item label="Mr." value="Mr." />
            <Picker.Item label="Mrs." value="Mrs." />
            <Picker.Item label="Mr" value="Mr" />
            <Picker.Item label="Ms." value="Ms." />
            <Picker.Item label="Ms" value="Ms" />
            <Picker.Item label="Mrs" value="Mrs" />
            <Picker.Item label="Dr." value="Dr." />
            <Picker.Item label="Prof." value="Prof." />
            <Picker.Item label="B2B Merseyside" value="B2B Merseyside" />
          </Picker>
          <TextInput
            style={styles.input}
            value={contactInfo.lastName}
            onChangeText={value =>
              setContactInfo(prev => ({...prev, lastName: value}))
            }
            placeholder="Last Name"
          />
          <TextInput
            style={styles.input}
            value={contactInfo.leadNumber}
            onChangeText={value =>
              setContactInfo(prev => ({...prev, leadNumber: value}))
            }
            placeholder="Lead Number"
          />
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Professional Details</Text>
          <TextInput
            style={styles.input}
            value={contactInfo.company}
            onChangeText={value =>
              setContactInfo(prev => ({...prev, company: value}))
            }
            placeholder="Company Name"
          />
          <TextInput
            style={styles.input}
            value={contactInfo.designation}
            onChangeText={value =>
              setContactInfo(prev => ({...prev, designation: value}))
            }
            placeholder="Designation"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Contact Information</Text>
          <TextInput
            style={styles.input}
            value={contactInfo.primaryPhone}
            onChangeText={value =>
              setContactInfo(prev => ({...prev, primaryPhone: value}))
            }
            placeholder="Primary Phone"
          />
          <TextInput
            style={styles.input}
            value={contactInfo.mobilePhone}
            onChangeText={value =>
              setContactInfo(prev => ({...prev, mobilePhone: value}))
            }
            placeholder="Mobile Phone"
          />
          <TextInput
            style={styles.input}
            value={contactInfo.primaryEmail}
            onChangeText={value =>
              setContactInfo(prev => ({...prev, primaryEmail: value}))
            }
            placeholder="Email"
          />
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Social Media Links</Text>
          <TextInput
            style={styles.input}
            value={contactInfo.personLinkedIn}
            onChangeText={value =>
              setContactInfo(prev => ({...prev, personLinkedIn: value}))
            }
            placeholder="Person LinkedIn URL (Optional)"
          />
          <TextInput
            style={styles.input}
            value={contactInfo.companyLinkedIn}
            onChangeText={value =>
              setContactInfo(prev => ({...prev, companyLinkedIn: value}))
            }
            placeholder="Company LinkedIn URL (Optional)"
          />
          <TextInput
            style={styles.input}
            value={contactInfo.facebookURL}
            onChangeText={value =>
              setContactInfo(prev => ({...prev, facebookURL: value}))
            }
            placeholder="Facebook URL (Optional)"
          />
          <TextInput
            style={styles.input}
            value={contactInfo.twitterURL}
            onChangeText={value =>
              setContactInfo(prev => ({...prev, twitterURL: value}))
            }
            placeholder="Twitter URL (Optional)"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Address Details</Text>
          <TextInput
            style={styles.input}
            value={contactInfo.street}
            onChangeText={value =>
              setContactInfo(prev => ({...prev, street: value}))
            }
            placeholder="Street"
          />
          <TextInput
            style={styles.input}
            value={contactInfo.city}
            onChangeText={value =>
              setContactInfo(prev => ({...prev, city: value}))
            }
            placeholder="City"
          />
          <TextInput
            style={styles.input}
            value={contactInfo.state}
            onChangeText={value =>
              setContactInfo(prev => ({...prev, state: value}))
            }
            placeholder="State"
          />
          <TextInput
            style={styles.input}
            value={contactInfo.postalCode}
            onChangeText={value =>
              setContactInfo(prev => ({...prev, postalCode: value}))
            }
            placeholder="Postal Code"
          />
          <TextInput
            style={styles.input}
            value={contactInfo.country}
            onChangeText={value =>
              setContactInfo(prev => ({...prev, country: value}))
            }
            placeholder="Country"
          />
        </View>

        <View style={styles.containerButton}>
          <TouchableOpacity style={styles.button} onPress={handleSaveChanges}>
            <Text style={styles.buttonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default App;
