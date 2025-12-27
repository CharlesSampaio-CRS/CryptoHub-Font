import React from 'react';
import { View, ScrollView, SafeAreaView, StyleSheet } from 'react-native';
import { AlertsManager } from '../components/alerts-manager';
import { Header } from '../components/Header';

export function AlertsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <AlertsManager />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 24,
    paddingBottom: 24,
  },
});
