import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  keyboardView: { flex: 1, justifyContent: 'center', padding: 20 },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  icon: { alignSelf: 'center', marginBottom: 20 },
  title: { textAlign: 'center', fontWeight: 'bold', color: '#1B5E20', marginBottom: 30 },
  card: { padding: 20, backgroundColor: 'white', elevation: 4 },
  cardTitle: { marginBottom: 20, textAlign: 'center', color: '#333' },
  input: { marginBottom: 10, backgroundColor: 'white'},
  button: { marginTop: 10, backgroundColor: '#1B5E20' },
  switchButton: { marginTop: 10 },
  desc: { marginBottom: 15, color: '#555', textAlign: 'center' },
  
  phoneRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  prefixContainer: {
    width: 60,
    height: 50, 
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0E0E0', 
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#79747E', 
    marginTop: 6 
  },
  prefixText: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold'
  },
  phoneInput: { 
    flex: 1, 
    marginLeft: -1, 
    marginBottom: 0
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 10,
    marginLeft: 5
  }
});

export default styles;