import { View, Text, ImageBackground, StyleSheet, FlatList, TouchableOpacity, Image, TextInput } from 'react-native'
import React, { useState, useEffect } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

export default function List() {
  const [facultyData, setFacultyData] = useState<FacultyItem[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [activeSearch, setActiveSearch] = useState(false);

  interface FacultyItem {
    id: string;
    name: string;
    status: 'ONLINE' | 'OFFLINE';
  }

  const handleSearch = () => {
    setActiveSearch(true);
  };
  const NoResults = () => (
    <View style={styles.noResultsContainer}>
      <Text style={styles.noResultsText}>No faculty members found</Text>
    </View>
  );
  const filteredFacultyData = !activeSearch 
    ? facultyData 
    : facultyData.filter(faculty =>
        faculty.name.toLowerCase().includes(inputValue.toLowerCase())
      );

  const renderFaculty = ({ item }: { item: FacultyItem }) => (
    <View style={styles.row}>
      <Text style={styles.name}>{item.name}</Text>
      <Text
        style={[
          styles.status,
          { color: item.status === 'ONLINE' ? '#00FF00' : '#FF0000' },
        ]}
      >
        {item.status}
      </Text>
    </View>
  );

  useEffect(() => {
    const facultyCollectionRef = collection(db, 'student');
    const unsubscribe = onSnapshot(facultyCollectionRef, (snapshot) => {
      const faculty: FacultyItem[] = snapshot.docs
        .map(doc => ({
          id: doc.id,
          name: doc.data().fullName || '',
          status: doc.data().status || 'OFFLINE',
          userType: doc.data().userType || ''
        }))
        .filter(user => user.userType === 'FACULTY')
        .sort((a, b) => a.name.localeCompare(b.name));
      
      setFacultyData(faculty);
    });
  
    return () => unsubscribe();
  }, []);

  return (
    <ImageBackground
      source={require('../../assets/green p2.jpg')}
      style={styles.background}
    >
      <View style={styles.listContainer}>
        <Text style={styles.title}>LIST OF FACULTY</Text>
        <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search faculty..."
              placeholderTextColor="#999"
              value={inputValue}
              onChangeText={(text) => {
                setInputValue(text);
                if (text === '') {
                  setActiveSearch(false);
                }
              }}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          <TouchableOpacity onPress={handleSearch}>
            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          </TouchableOpacity>
        </View>
        <View style={styles.header}>
          <Text style={[styles.headerText, { flex: 1 }]}>NAME</Text>
          <Text style={[styles.headerText, { flex: 1 }]}>STATUS</Text>
        </View>
        <FlatList
          data={filteredFacultyData}
          keyExtractor={(item) => item.id}
          renderItem={renderFaculty}
          style={styles.list}
          ListEmptyComponent={NoResults}
        />
      </View>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
  },
  noResultsText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 5,
    marginBottom: 10,
    width: '100%',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    padding: 10,
    color: '#000',
  },
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '5%',
    paddingVertical: '5%',
  },
  listContainer: {
    maxWidth: 800,
    backgroundColor: '#1f4e21',
    borderRadius: 10,
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 20,
    width: '90%',
    height: '80%',
    alignSelf: 'center',
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'white',
    paddingBottom: 5,
    marginBottom: 10,
  },
  headerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  name: {
    flex: 1,
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
  },
  status: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 20,
    width: '100%',
    paddingHorizontal: 20,
  },
  iconImage: {
    width: 50,
    height: 35,
    resizeMode: 'contain',
  },
  icon: {
    marginHorizontal: 50,
    marginVertical: 10,
  },
});
