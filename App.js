import React, { useEffect, useState } from 'react';
import { View, Text, Button, TextInput } from 'react-native';
import SQLite from 'react-native-sqlite-storage';

const db = SQLite.openDatabase(
  {
    name: 'MyDatabase.db',
    location: 'default',
  },
  () => { console.log('Database opened'); },
  error => { console.log(error); }
);

const App = () => {
  const [id, setId] = useState('');
  const [data, setData] = useState('');

  const fetchData = (id) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT value FROM DataEntity WHERE id = ?',
        [id],
        (tx, results) => {
          if (results.rows.length > 0) {
            setData(results.rows.item(0).value.toString());
          } else {
            setData('No data found');
          }
        },
        error => { console.log(error); }
      );
    });
  };

  return (
    <View>
      <TextInput
        placeholder="Enter ID"
        value={id}
        onChangeText={setId}
      />
      <Button title="Fetch Data" onPress={() => fetchData(id)} />
      <Text>Data: {data}</Text>
    </View>
  );
};

export default App;