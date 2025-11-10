import React, {useState, useEffect} from 'react';
import {View, StyleSheet, Alert, ScrollView, Dimensions} from 'react-native';
import {Button, Text, Card, Chip} from 'react-native-paper';
import {MapView, Marker, Polyline} from '../components';
import {routeService} from '../services/api';

const {width, height} = Dimensions.get('window');

const RoutePlanningScreen = ({route, navigation}) => {
  const {scheduleId, destinations, originalText} = route.params;
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    // Get user's current location
    // TODO: Implement location services
    setUserLocation({
      lat: 37.7649,
      lon: -122.4294,
    });
  }, []);

  const optimizeRoute = async () => {
    if (!userLocation) {
      Alert.alert('Error', 'Unable to get your current location');
      return;
    }

    setLoading(true);

    try {
      const response = await routeService.optimizeRoute({
        schedule_id: scheduleId,
        origin: userLocation,
        departure_time: new Date().toISOString(),
        preferences: {
          avoid_tolls: false,
          avoid_highways: false,
        },
      });

      setOptimizedRoute(response.data);
    } catch (error) {
      Alert.alert(
        'Error',
        error.response?.data?.error?.message || 'Route optimization failed'
      );
    }

    setLoading(false);
  };

  const startNavigation = () => {
    if (!optimizedRoute) return;

    navigation.navigate('Navigation', {
      route: optimizedRoute,
    });
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getMapRegion = () => {
    if (!destinations || destinations.length === 0) {
      return {
        latitude: 37.7749,
        longitude: -122.4194,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
    }

    // Calculate region to fit all destinations
    const latitudes = destinations.map(dest => dest.coordinates.lat);
    const longitudes = destinations.map(dest => dest.coordinates.lon);

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLon = Math.min(...longitudes);
    const maxLon = Math.max(...longitudes);

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLon + maxLon) / 2,
      latitudeDelta: (maxLat - minLat) * 1.3,
      longitudeDelta: (maxLon - minLon) * 1.3,
    };
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.scheduleCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Your Schedule
          </Text>
          <Text variant="bodyMedium">{originalText}</Text>
        </Card.Content>
      </Card>

      <Card style={styles.mapCard}>
        <Card.Content style={styles.mapContainer}>
          <MapView
            style={styles.map}
            region={getMapRegion()}
            showsUserLocation={true}>
            {destinations?.map((dest, index) => (
              <Marker
                key={dest.id}
                coordinate={{
                  latitude: dest.coordinates.lat,
                  longitude: dest.coordinates.lon,
                }}
                title={dest.name}
                description={dest.address}
              />
            ))}
          </MapView>
        </Card.Content>
      </Card>

      {!optimizedRoute ? (
        <Card style={styles.actionCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Ready to optimize your route?
            </Text>
            <Text variant="bodyMedium" style={styles.description}>
              We'll find the best order to visit your destinations, considering current traffic conditions.
            </Text>
            <Button
              mode="contained"
              onPress={optimizeRoute}
              loading={loading}
              disabled={loading}
              style={styles.optimizeButton}
              icon="route">
              Optimize Route
            </Button>
          </Card.Content>
        </Card>
      ) : (
        <Card style={styles.resultCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Optimized Route
            </Text>

            <View style={styles.summaryContainer}>
              <Chip icon="clock-outline" style={styles.chip}>
                {formatTime(optimizedRoute.summary.total_time_minutes)}
              </Chip>
              <Chip icon="car" style={styles.chip}>
                {(optimizedRoute.summary.total_distance_meters / 1000).toFixed(1)} km
              </Chip>
              <Chip icon="traffic-light" style={styles.chip}>
                +{formatTime(optimizedRoute.summary.total_traffic_delay_minutes)} traffic
              </Chip>
            </View>

            <View style={styles.sequenceContainer}>
              {optimizedRoute.optimized_sequence.map((stop, index) => (
                <View key={stop.destination.id} style={styles.stopItem}>
                  <Text variant="bodyMedium" style={styles.stopOrder}>
                    {index + 1}.
                  </Text>
                  <View style={styles.stopDetails}>
                    <Text variant="bodyLarge" style={styles.stopName}>
                      {stop.destination.name}
                    </Text>
                    <Text variant="bodySmall" style={styles.stopTime}>
                      Arrive: {new Date(stop.arrival_time).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <Button
              mode="contained"
              onPress={startNavigation}
              style={styles.navigateButton}
              icon="navigation">
              Start Navigation
            </Button>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  scheduleCard: {
    marginBottom: 15,
  },
  mapCard: {
    marginBottom: 15,
  },
  mapContainer: {
    height: 200,
    borderRadius: 10,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  actionCard: {
    marginBottom: 15,
  },
  resultCard: {
    marginBottom: 15,
  },
  cardTitle: {
    marginBottom: 10,
    color: '#2196F3',
  },
  description: {
    marginBottom: 15,
    color: '#666',
  },
  optimizeButton: {
    marginTop: 10,
  },
  navigateButton: {
    marginTop: 15,
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 15,
  },
  chip: {
    backgroundColor: '#e3f2fd',
  },
  sequenceContainer: {
    marginBottom: 15,
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  stopOrder: {
    marginRight: 15,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  stopDetails: {
    flex: 1,
  },
  stopName: {
    fontWeight: 'bold',
  },
  stopTime: {
    color: '#666',
    marginTop: 2,
  },
});

export default RoutePlanningScreen;