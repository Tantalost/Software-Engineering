import { StyleSheet } from 'react-native';

const styles = StyleSheet.create ({

    container: { 
    flex: 1, 
    backgroundColor: '#F7F9FC'
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#F7F9FC'
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchBar: {
    backgroundColor: '#F0F4F8',
    elevation: 0,
    borderRadius: 12,
    height: 48,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  searchInput: {
    fontSize: 14,
    alignSelf: 'center',
    color: 'black',
  },
  filterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4EDDA',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    gap: 8,
  },
  filterText: {
    flex: 1,
    color: '#155724',
    fontSize: 12,
    fontWeight: '600',
  },
  clearFilterText: {
    color: '#1B5E20',
    fontWeight: 'bold',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  scrollContent: { 
    paddingHorizontal: 16, 
    paddingBottom: 32 
  },
  resultsText: { 
    color: '#1B5E20', 
    margin: 12,
    marginBottom: 12, 
    marginLeft: 4, 
    fontWeight: '600',
    letterSpacing: 0.5
  },

})
export default styles;