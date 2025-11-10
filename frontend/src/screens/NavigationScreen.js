import React, {useState, useEffect} from 'react';
import {View, StyleSheet, Dimensions, StatusBar} from 'react-native';
import {Text, Button, Card, FAB} from 'react-native-paper';
import {MapView, Marker, Polyline, Icon} from '../components';

const {width, height} = Dimensions.get('window');

const NavigationScreen = ({route, navigation}) => {
  const {route: optimizedRoute} = route.params;
  const [currentPosition, setCurrentPosition] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isNavigating, setIsNavigating] = useState(true);

  useEffect(() => {
    // Simulate user movement (replace with actual location tracking)
    const interval = setInterval(() => {
      // Mock location updates
      setCurrentPosition({
        latitude: 37.7649 + Math.random() * 0.01,
        longitude: -122.4294 + Math.random() * 0.01,
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getMapRegion = () => {
    if (currentPosition) {
      return {
        latitude: currentPosition.latitude,
        longitude: currentPosition.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }

    // Default to first destination
    const firstDest = optimizedRoute.optimized_sequence[0];
    return {
      latitude: firstDest.destination.coordinates.lat,
      longitude: firstDest.destination.coordinates.lon,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  };

  const getCurrentInstruction = () => {
    const steps = [
      "Head north on Main St",
      "Turn right onto Oak Ave",
      "Continue straight for 0.8 miles",
      "Destination will be on your right"
    ];

    return steps[currentStep] || "Continue straight";
  };

  const getNextDestination = () => {
    return optimizedRoute.optimized_sequence[0]; // For demo, show first destination
  };

  const handleStopNavigation = () => {
    setIsNavigating(false);
    navigation.goBack();
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const nextDestination = getNextDestination();

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />

      <MapView
        style={styles.map}
        region={getMapRegion()}
        showsUserLocation={true}
        followsUserLocation={true}
        showsTraffic={true}>

        {currentPosition && (
          <Marker
            coordinate={currentPosition}
            title="Your Location"
          />
        )}

        {optimizedRoute.optimized_sequence.map((stop, index) => (
          <Marker
            key={stop.destination.id}
            coordinate={{
              latitude: stop.destination.coordinates.lat,
              longitude: stop.destination.coordinates.lon,
            }}
            title={stop.destination.name}
            pinColor={index === 0 ? 'red' : 'orange'}
          />
        ))}
      </MapView>

      {/* Navigation Instructions */}
      <Card style={styles.instructionCard}>
        <Card.Content style={styles.instructionContent}>
          <View style={styles.instructionHeader}>
            <Icon name="navigation" size={24} color="#2196F3" />
            <Text variant="bodyLarge" style={styles.instructionText}>
              {getCurrentInstruction()}
            </Text>
          </View>

          <View style={styles.destinationInfo}>
            <Text variant="titleMedium" style={styles.destinationName}>
              {nextDestination.destination.name}
            </Text>
            <Text variant="bodySmall" style={styles.eta}>
              ETA: {formatTime(nextDestination.arrival_time)}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Route Summary */}
      <Card style={styles.summaryCard}>
        <Card.Content style={styles.summaryContent}>
          <View style={styles.summaryItem}>
            <Icon name="access-time" size={16} color="#666" />
            <Text variant="bodySmall">
              {Math.round(optimizedRoute.summary.total_time_minutes)}m total
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Icon name="directions-car" size={16} color="#666" />
            <Text variant="bodySmall">
              {(optimizedRoute.summary.total_distance_meters / 1000).toFixed(1)}km
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Icon name="traffic" size={16} color="#ff5722" />
            <Text variant="bodySmall">
              +{optimizedRoute.summary.total_traffic_delay_minutes}m delay
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Stop Navigation FAB */}
      <FAB
        icon="stop"
        style={styles.fab}
        onPress={handleStopNavigation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  instructionCard: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    elevation: 5,
  },
  instructionContent: {
    paddingVertical: 15,
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  instructionText: {
    marginLeft: 10,
    flex: 1,
    fontWeight: 'bold',
  },
  destinationInfo: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  destinationName: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  eta: {
    color: '#666',
  },
  summaryCard: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    elevation: 5,
  },
  summaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#f44336',
  },
});

export default NavigationScreen;