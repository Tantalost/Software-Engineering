import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Button, Text, Card, ActivityIndicator } from 'react-native-paper';
import API_URL from '../../src/config'; // Double-check this path

export default function TestConnectionScreen() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ status: string; data: any; url: string } | null>(null);

  const runDiagnostic = async () => {
    setLoading(true);
    const testUrl = `${API_URL}/test-connection`;
    
    try {
      const response = await fetch(testUrl);
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("text/html")) {
        const htmlBody = await response.text();
        setResult({
          status: "FAIL: Received HTML (404/500 Error)",
          url: testUrl,
          data: htmlBody.substring(0, 200) + "..."
        });
      } else {
        const data = await response.json();
        setResult({
          status: "SUCCESS: Connected to API",
          url: testUrl,
          data: data
        });
      }
    } catch (err: any) {
      setResult({
        status: "CONNECTION REFUSED / NETWORK ERROR",
        url: testUrl,
        data: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>API Diagnostic</Text>
      <Text style={styles.subtitle}>Testing: {API_URL}</Text>

      <Button mode="contained" onPress={runDiagnostic} loading={loading} style={styles.button}>
        Test Backend Connection
      </Button>

      {result && (
        <Card style={[styles.card, result.status.includes("SUCCESS") ? styles.success : styles.error]}>
          <Card.Content>
            <Text style={styles.label}>Endpoint:</Text>
            <Text style={styles.value}>{result.url}</Text>
            
            <Text style={[styles.label, { marginTop: 10 }]}>Status:</Text>
            <Text style={styles.value}>{result.status}</Text>
            
            <Text style={[styles.label, { marginTop: 10 }]}>Raw Data/Error:</Text>
            <View style={styles.codeBlock}>
              <Text style={styles.codeText}>{JSON.stringify(result.data, null, 2)}</Text>
            </View>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: 'center', backgroundColor: '#f5f5f5', flexGrow: 1 },
  title: { fontWeight: 'bold', color: '#1B5E20', marginBottom: 5 },
  subtitle: { color: '#666', marginBottom: 20, fontSize: 12 },
  button: { width: '100%', marginBottom: 20, backgroundColor: '#1B5E20' },
  card: { width: '100%', elevation: 4 },
  success: { borderLeftWidth: 5, borderLeftColor: '#4CAF50' },
  error: { borderLeftWidth: 5, borderLeftColor: '#F44336' },
  label: { fontWeight: 'bold', fontSize: 12, color: '#333' },
  value: { fontSize: 14, color: '#555' },
  codeBlock: { backgroundColor: '#eee', padding: 10, borderRadius: 5, marginTop: 5 },
  codeText: { fontFamily: 'monospace', fontSize: 11 }
});