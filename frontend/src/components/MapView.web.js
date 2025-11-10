import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Text, Card} from 'react-native-paper';

// Web fallback for MapView since react-native-maps doesn't work on web
const MapView = ({style, region, children, showsUserLocation, followsUserLocation, showsTraffic, ...props}) => {
  return (
    <Card style={[styles.mapContainer, style]} {...props}>
      <Card.Content style={styles.mapContent}>
        <Text variant="titleMedium" style={styles.mapPlaceholder}>
          🗺️ Interactive Map
        </Text>
        <Text variant="bodySmall" style={styles.mapSubtext}>
          Map functionality available on mobile app
        </Text>

        {/* Show basic location info */}
        {region && (
          <View style={styles.locationInfo}>
            <Text variant="bodySmall">
              Location: {region.latitude?.toFixed(4)}, {region.longitude?.toFixed(4)}
            </Text>
          </View>
        )}

        {/* Render markers as a simple list */}
        {children && (
          <View style={styles.markersContainer}>
            <Text variant="bodySmall" style={styles.markersTitle}>
              Destinations:
            </Text>
            {React.Children.map(children, (child, index) => (
              <Text key={index} variant="bodySmall" style={styles.markerItem}>
                📍 {child.props.title || `Location ${index + 1}`}
              </Text>
            ))}
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

// Marker component fallback
const Marker = ({coordinate, title, description}) => null;

// Polyline component fallback
const Polyline = ({coordinates}) => null;

const styles = StyleSheet.create({
  mapContainer: {
    backgroundColor: '#e3f2fd',
    borderWidth: 2,
    borderColor: '#2196F3',
    borderStyle: 'dashed',
  },
  mapContent: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  mapPlaceholder: {
    color: '#1976d2',
    textAlign: 'center',
    marginBottom: 5,
  },
  mapSubtext: {
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 15,
  },
  locationInfo: {
    marginBottom: 10,
    padding: 8,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: 4,
  },
  markersContainer: {
    alignSelf: 'stretch',
  },
  markersTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#1976d2',
  },
  markerItem: {
    marginLeft: 10,
    marginBottom: 2,
    color: '#424242',
  },
});

export default MapView;
export {Marker, Polyline};