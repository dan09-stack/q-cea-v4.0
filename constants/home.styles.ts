import { StyleSheet } from 'react-native';

export const homeStyles = StyleSheet.create({
  speedText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: 'bold',
    color: '#333'
  },
  connectionIndicator: {
    alignItems: 'center',
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
   boxShadow: '0 2px 3.84px rgba(0, 0, 0, 0.25)',
    elevation: 5,
    zIndex: 1000,
  },
    disabledButton: {
        opacity: 0.5,
        backgroundColor: '#808080'
      },
    notificationContainer: {
        backgroundColor: '#f8d7da',
        borderRadius: 5,
        padding: 10,
        margin: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#f5c6cb'
      },
      notificationText: {
        color: '#721c24',
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center'
      },
details:{
    fontSize: 18,
    },
    ticketBox: {
    textAlign: 'center', 
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 10,
    width: 360,
    alignItems: 'center',
    },
    queueText: {
    fontSize: 16,
    marginBottom: 10,
    },
    boldText: {
    fontWeight: 'bold',
    marginTop: 10,
    },
    ticketCode: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    },
    detailsText: {
    flexDirection: 'column',
    width: '100%',
    textAlign: 'left',
    fontSize: 16,
    },
    button: {
    backgroundColor: '#004000',
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 10,
    alignItems: 'center',
    },
    buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    },
    background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    },
    ticketInfoContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    },
    container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    },
    formGroup: {
    padding: 20,
    borderRadius: 10,
    width: 360,
    marginBottom: 20,
    backgroundColor: '#ffffff',
    },
    pickerButton: {
    backgroundColor: '#005000',
    padding: 15,
    borderRadius: 5,
    marginVertical: 5,
    },
    pickerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    },
    input: {
    backgroundColor: '#005000',
    color: '#ffffff',
    padding: 10,
    marginTop: 5,
    marginBottom: 10,
    borderRadius: 5,
    height: 100,
    textAlignVertical: 'top', 
    },
    buttonContainer: {
    marginTop: 30,
    width: '100%',
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'space-around',
    },
    ticketContainer: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 10,
    width: 360,
    },
    headerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
    },
    subHeaderText: {
    fontSize: 14,
    color: '#555555',
    marginBottom: 10,
    },
    ticketDetails: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 10,
    },
    ticketLabel: {
    fontSize: 14,
    color: '#777777',
    },
    ticketNumber: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#004000',
    },
    ticketInfo: {
    fontSize: 18,
    color: '#333333',
    },
    waitText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#004000',
    },
    modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxHeight: '80%',
    },
    modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#004000',
    },
    modalItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    },
    modalItemText: {
    fontSize: 16,
    },
});
    