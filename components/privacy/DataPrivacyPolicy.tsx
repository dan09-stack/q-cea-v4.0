import React from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

interface DataPrivacyPolicyProps {
  visible: boolean;
  onClose: () => void;
}

export const DataPrivacyPolicy: React.FC<DataPrivacyPolicyProps> = ({ visible, onClose }) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Data Privacy Policy</Text>
            <Text style={styles.modalText}>
              Welcome to <Text style={styles.boldText}>Q-CEA</Text>. Your privacy is important to us. 
              This Privacy Policy explains how we collect, use, disclose, and protect your personal data.{"\n\n"}

              <Text style={styles.sectionTitle}>1. Legal Compliance</Text>{"\n"}
              We comply with the Republic Act No. 10173, also known as the <Text style={styles.boldText}>Data Privacy Act of 2012</Text>, 
              ensuring that your personal data is collected, stored, and processed securely and lawfully.{"\n\n"}

              <Text style={styles.sectionTitle}>2. Information We Collect</Text>{"\n"}
              - Name{"\n"}
              - ID Number{"\n"}
              - Phone Number{"\n"}
              - Program {"\n"}
              - Email Address{"\n"}
              - Password {"\n\n"}

              <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>{"\n"}
              - Register and manage user accounts{"\n"}
              - Facilitate queue management{"\n"}
              - Send queue notifications{"\n"}
              - Improve system functionality{"\n"}
              - Communicate important updates{"\n"}
              - Ensure security and prevent fraud{"\n\n"}

              <Text style={styles.sectionTitle}>4. Data Security</Text>{"\n"}
              We implement security measures like encryption and access controls. However, users must also safeguard their login credentials.{"\n\n"}

              <Text style={styles.sectionTitle}>5. Your Rights</Text>{"\n"}
              - Access, update, or correct your data{"\n"}
              - Request deletion of your account{"\n\n"}

              <Text style={styles.sectionTitle}>6. Data Retention</Text>{"\n"}
              We retain your personal data for as long as necessary to fulfill the purposes outlined in this Privacy Policy. 
              If you request account deletion, we will remove your data within 30 days, except where retention is required by law.{"\n\n"}

              <Text style={styles.sectionTitle}>7. Third-Party Services</Text>{"\n"}
              We may use third-party services, such as cloud storage providers, email notification systems, and SMS services, 
              to enhance Q-CEA. These services are obligated to protect your data and comply with privacy regulations.{"\n\n"}

              <Text style={styles.sectionTitle}>8. Policy Updates</Text>{"\n"}
              We may update this Privacy Policy from time to time. Changes will be posted on our website, and significant 
              updates may be communicated via email or app notifications.{"\n\n"}

              <Text style={styles.sectionTitle}>9. Consent Statement</Text>{"\n"}
              By using Q-CEA, you acknowledge that you have read, understood, and agreed to this Privacy Policy. 
              If you do not agree, please discontinue use of the platform.{"\n\n"}
            </Text>

            <TouchableOpacity style={styles.privacybutton} onPress={onClose}>
              <Text style={styles.privacybuttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flexGrow: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingVertical: 20
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "90%",
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#004000",
  },
  modalText: {
    fontSize: 14,
    textAlign: "left",
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
  },
  boldText: {
    fontWeight: "bold",
  },
  privacybutton: {
    backgroundColor: "#004000",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    width: 100,
    alignSelf: 'center'
  },
  privacybuttonText: {
    color: "#fff",
    fontWeight: "bold",
  }
});
