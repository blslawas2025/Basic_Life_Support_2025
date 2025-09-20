import React from 'react';
import { View, Text } from 'react-native';

export default function TestApp() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
      <Text style={{ color: '#fff', fontSize: 24, textAlign: 'center' }}>
        Basic Life Support App
      </Text>
      <Text style={{ color: '#fff', fontSize: 16, textAlign: 'center', marginTop: 20 }}>
        Test Version - App is Loading
      </Text>
    </View>
  );
}
