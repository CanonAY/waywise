import React from 'react';
import {View, StyleSheet, Alert, ScrollView} from 'react-native';
import {List, Divider, Button} from 'react-native-paper';
import {useAuth} from '../services/AuthContext';

const SettingsScreen = () => {
  const {user, logout} = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const showComingSoon = (feature) => {
    Alert.alert('Coming Soon', `${feature} feature will be available in the next update!`);
  };

  return (
    <ScrollView style={styles.container}>
      <List.Section>
        <List.Subheader>Account</List.Subheader>
        <List.Item
          title={user?.name || 'User'}
          description={user?.email}
          left={props => <List.Icon {...props} icon="account" />}
        />
        <Divider />

        <List.Subheader>Preferences</List.Subheader>
        <List.Item
          title="Default Safety Level"
          description="Medium"
          left={props => <List.Icon {...props} icon="shield" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => showComingSoon('Safety preferences')}
        />
        <List.Item
          title="Preferred Transport Mode"
          description="Driving"
          left={props => <List.Icon {...props} icon="car" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => showComingSoon('Transport mode selection')}
        />
        <List.Item
          title="Avoid Tolls"
          description="Enabled"
          left={props => <List.Icon {...props} icon="toll" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => showComingSoon('Route preferences')}
        />
        <Divider />

        <List.Subheader>Saved Places</List.Subheader>
        <List.Item
          title="Home"
          description="Not set"
          left={props => <List.Icon {...props} icon="home" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => showComingSoon('Saved places')}
        />
        <List.Item
          title="Work"
          description="Not set"
          left={props => <List.Icon {...props} icon="office-building" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => showComingSoon('Saved places')}
        />
        <Divider />

        <List.Subheader>Privacy & Data</List.Subheader>
        <List.Item
          title="Location Services"
          description="Enabled"
          left={props => <List.Icon {...props} icon="map-marker" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => showComingSoon('Privacy settings')}
        />
        <List.Item
          title="Data Usage"
          description="View usage statistics"
          left={props => <List.Icon {...props} icon="chart-line" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => showComingSoon('Data usage')}
        />
        <Divider />

        <List.Subheader>Support</List.Subheader>
        <List.Item
          title="Help & FAQ"
          left={props => <List.Icon {...props} icon="help-circle" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => showComingSoon('Help center')}
        />
        <List.Item
          title="Contact Support"
          left={props => <List.Icon {...props} icon="email" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => showComingSoon('Contact support')}
        />
        <List.Item
          title="About"
          left={props => <List.Icon {...props} icon="information" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => showComingSoon('About page')}
        />
      </List.Section>

      <View style={styles.logoutContainer}>
        <Button
          mode="outlined"
          onPress={handleLogout}
          icon="logout"
          style={styles.logoutButton}>
          Logout
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  logoutContainer: {
    padding: 20,
    marginTop: 20,
  },
  logoutButton: {
    borderColor: '#f44336',
  },
});

export default SettingsScreen;