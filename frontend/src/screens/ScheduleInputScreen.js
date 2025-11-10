import React, {useState} from 'react';
import {View, StyleSheet, Alert, ScrollView} from 'react-native';
import {Button, TextInput, Text, Card, FAB} from 'react-native-paper';
import {Icon} from '../components';
import {scheduleService} from '../services/api';

const ScheduleInputScreen = ({navigation}) => {
  const [scheduleText, setScheduleText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const handleParseSchedule = async () => {
    if (!scheduleText.trim()) {
      Alert.alert('Error', 'Please enter your schedule');
      return;
    }

    setLoading(true);

    try {
      const response = await scheduleService.parseSchedule(scheduleText);
      const {schedule_id, destinations} = response.data;

      navigation.navigate('RoutePlanning', {
        scheduleId: schedule_id,
        destinations,
        originalText: scheduleText,
      });
    } catch (error) {
      Alert.alert(
        'Error',
        error.response?.data?.error?.message || 'Failed to parse schedule'
      );
    }

    setLoading(false);
  };

  const handleVoiceInput = () => {
    // TODO: Implement voice recording with react-native-voice
    setIsRecording(!isRecording);
    Alert.alert('Voice Input', 'Voice recording feature coming soon!');
  };

  const handleCalendarSync = () => {
    // TODO: Implement calendar integration
    Alert.alert('Calendar Sync', 'Calendar integration coming soon!');
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>
            What's your schedule today?
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Tell us where you need to go and when
          </Text>

          <TextInput
            label="Enter your schedule"
            value={scheduleText}
            onChangeText={setScheduleText}
            multiline
            numberOfLines={4}
            placeholder="e.g., dentist at 2pm, grocery store, home by 5pm"
            style={styles.textInput}
          />

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleParseSchedule}
              loading={loading}
              disabled={loading || !scheduleText.trim()}
              style={styles.button}
              icon="route">
              Plan My Route
            </Button>

            <Button
              mode="outlined"
              onPress={handleVoiceInput}
              style={styles.button}
              icon={isRecording ? 'stop' : 'microphone'}>
              {isRecording ? 'Stop Recording' : 'Voice Input'}
            </Button>

            <Button
              mode="outlined"
              onPress={handleCalendarSync}
              style={styles.button}
              icon="calendar">
              Sync Calendar
            </Button>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.exampleCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.exampleTitle}>
            Example schedules:
          </Text>
          <Text variant="bodySmall" style={styles.exampleText}>
            • "Coffee shop at 9am, office at 10am, lunch meeting at 12pm"
          </Text>
          <Text variant="bodySmall" style={styles.exampleText}>
            • "Dentist appointment at 2pm, then grocery shopping, home by 5"
          </Text>
          <Text variant="bodySmall" style={styles.exampleText}>
            • "Pick up dry cleaning, gym workout, dinner with friends at 7pm"
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  card: {
    marginBottom: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
    color: '#2196F3',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  textInput: {
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    gap: 10,
  },
  button: {
    marginBottom: 10,
  },
  exampleCard: {
    backgroundColor: '#e3f2fd',
  },
  exampleTitle: {
    marginBottom: 10,
    color: '#1976d2',
  },
  exampleText: {
    marginBottom: 5,
    color: '#424242',
  },
});

export default ScheduleInputScreen;